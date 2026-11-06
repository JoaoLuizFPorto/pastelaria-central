const fs = require('node:fs');
const mysql = require('mysql2/promise');
const { AsyncLocalStorage } = require('node:async_hooks');
const config = require('./mysql');
const context = new AsyncLocalStorage();
const pool = mysql.createPool(config);
pool.on('connection', (connection) => connection.query("SET time_zone = '+00:00'"));
// Pequena camada preparada para consultas parametrizadas e transações.
const db = {
  prepare(sql) {
    async function execute(args) {
      const [result] = await (context.getStore() || pool).execute(sql, args);
      return result;
    }
    return {
      all: (...args) => execute(args),
      get: async (...args) => (await execute(args))[0],
      run: async (...args) => {
        const result = await execute(args);
        return { lastInsertRowid: result.insertId, changes: result.affectedRows };
      }
    };
  },
  close: () => pool.end()
};
async function transaction(work) {
  if (context.getStore()) return work();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await context.run(connection, work);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


// Na primeira execução, lê somente os produtos do SQL, sem executar DROP ou USE.
async function importInitialCatalog() {
  await transaction(async () => {
    const marker = await db.prepare('INSERT IGNORE INTO migrations (name) VALUES (?)')
      .run('catalogo-inicial-entrega');
    if (!marker.changes) return;
    const current = await db.prepare('SELECT COUNT(*) AS total FROM products').get();
    if (current.total) return;

    const sql = fs.readFileSync(require('./paths').catalogFile, 'utf8');
    const definition = sql.match(/CREATE TABLE `products` \(([\s\S]*?)\) ENGINE=/);
    if (!definition) throw new Error('Estrutura dos produtos não encontrada no SQL.');
    const columns = [...definition[1].matchAll(/^\s*`([^`]+)`/gm)]
      .map(match => '`' + match[1] + '`').join(',');
    const inserts = sql.split(/\r?\n/)
      .filter(line => line.startsWith('INSERT INTO `products` VALUES'));
    if (!columns || !inserts.length) throw new Error('Catálogo inicial não encontrado no SQL.');
    // As colunas explícitas permitem importar mesmo com outra ordem na tabela.
    for (const statement of inserts) {
      await db.prepare(statement.replace('INSERT INTO `products` VALUES',
        'INSERT INTO `products` (' + columns + ') VALUES')).run();
    }
  });
}

async function initialize() {
  const { database, connectionLimit, waitForConnections, ...serverConfig } = config;
  const connection = await mysql.createConnection(serverConfig);
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
  const schema = fs.readFileSync(require('./paths').schemaFile, 'utf8');
  for (const sql of schema.split(';').filter((sql) => sql.trim())) await pool.query(sql);
  const [emailColumns] = await pool.query('SHOW COLUMNS FROM order_emails');
  if (!emailColumns.some((column) => column.Field === 'event')) {
    await pool.query(
      "ALTER TABLE order_emails ADD event VARCHAR(16) NOT NULL DEFAULT 'registered', DROP PRIMARY KEY, ADD PRIMARY KEY (order_id,event)"
    );
  }
  // Pedidos antigos mantêm a situação atual; não inventamos eventos anteriores.
  await pool.query(`INSERT INTO order_status_history (order_id, status, note)
    SELECT o.id, o.status, 'Situação existente ao iniciar o acompanhamento. Alterações anteriores não foram registradas.'
    FROM orders o WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id=o.id)`);
  const [userColumns] = await pool.query('SHOW COLUMNS FROM users');
  if (!userColumns.some((column) => column.Field === 'surname'))
    await pool.query("ALTER TABLE users ADD surname VARCHAR(100) NOT NULL DEFAULT ''");
  if (!userColumns.some((column) => column.Field === 'phone'))
    await pool.query('ALTER TABLE users ADD phone VARCHAR(11) NULL');
  for (const [field, definition] of Object.entries(require('../lib/address').fields)) {
    if (!userColumns.some((column) => column.Field === field))
      await pool.query(
        'ALTER TABLE users ADD ' + field + ' VARCHAR(' + definition.max + ") NOT NULL DEFAULT ''"
      );
  }
  const [columns] = await pool.query('SHOW COLUMNS FROM products');
  if (columns.find((column) => column.Field === 'category').Type !== 'varchar(32)')
    await pool.query('ALTER TABLE products MODIFY category VARCHAR(32) NOT NULL');
  const names = columns.map((column) => column.Field);
  if (!names.includes('subcategory'))
    await pool.query("ALTER TABLE products ADD subcategory VARCHAR(50) NOT NULL DEFAULT ''");
  if (!names.includes('active'))
    await pool.query('ALTER TABLE products ADD active BOOLEAN NOT NULL DEFAULT TRUE');
  if (!names.includes('deleted'))
    await pool.query('ALTER TABLE products ADD deleted BOOLEAN NOT NULL DEFAULT FALSE');
  if (!names.includes('home_rank')) await pool.query('ALTER TABLE products ADD home_rank INT NULL');
  // Adicionais deixam de ser produtos; pedidos mantêm seus itens históricos.
  await transaction(async () => {
    await db
      .prepare(
        "DELETE c FROM cart_items c JOIN products p ON p.id=c.product_id WHERE p.category='adicional'"
      )
      .run();
    await db
      .prepare(
        "DELETE f FROM favorites f JOIN products p ON p.id=f.product_id WHERE p.category='adicional'"
      )
      .run();
    await db.prepare("DELETE FROM products WHERE category='adicional'").run();
  });
  // Substitui a antiga bebida genérica pelas apresentações de 200 ml.
  await transaction(async () => {
    const old = await db.prepare("SELECT id FROM products WHERE id='caculinha' FOR UPDATE").get();
    if (!old) return;
    const replacements = require('../catalog/menu').products.filter((product) =>
      product.id.endsWith('-200ml')
    );
    for (const product of replacements)
      await db
        .prepare(
          'INSERT IGNORE INTO products (id,name,price,image,category,subcategory,description,active) VALUES (?,?,?,?,?,?,?,1)'
        )
        .run(
          product.id,
          product.name,
          product.price,
          product.image,
          product.category,
          product.subcategory,
          product.description
        );
    await db.prepare("DELETE FROM cart_items WHERE product_id='caculinha'").run();
    await db.prepare("DELETE FROM favorites WHERE product_id='caculinha'").run();
    await db.prepare("DELETE FROM products WHERE id='caculinha'").run();
  });
  await transaction(async () => require('../lib/assets').migrateProductImages(db));
  await pool.query(
    "UPDATE products SET subcategory=CASE category WHEN 'pastel' THEN 'pastel-salgado' WHEN 'bebida' THEN 'refrigerante' WHEN 'combo' THEN 'combo' ELSE subcategory END WHERE subcategory=''"
  );
  await importInitialCatalog();
}
module.exports = { db, pool, transaction, initialize };
