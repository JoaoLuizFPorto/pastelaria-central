// Consulta os dados usados nos relatórios administrativos.

const express = require('express');
const { db } = require('../../config/database');
const { money } = require('../../models/product');
const { categories } = require('../../catalog/categories');
const { requireAdmin } = require('../../lib/session');
const { formatDate, statusLabel } = require('../../lib/order-status');
const router = express.Router();


router.use(requireAdmin);


router.get('/', (req, res) =>
  res.render('admin/reports/index', { headPartial: 'head/admin', titulo: 'Central de Relatórios' })
);


router.get('/produtos', async (req, res) => {
  const tipo = req.query.tipo || 'geral';
  if (!['geral', 'ativos', 'inativos'].includes(tipo))
    return res.renderError(400, 'Selecione um tipo de relatório válido.');
  const onlyActive = tipo === 'ativos';
  const onlyInactive = tipo === 'inativos';
  const products = await db
    .prepare(
      `SELECT id, name, category, subcategory, price, active FROM products WHERE deleted=0 ${onlyActive ? 'AND active=1' : onlyInactive ? 'AND active=0' : ''} ORDER BY category, name, id`
    )
    .all();
  const dados = products.map((product) => {
    const category = categories.find((entry) => entry.value === product.category);
    return {
      ...product,
      precoFormatado: money(product.price),
      categoria: category?.label || product.category,
      subcategoria:
        category?.subcategories.find((entry) => entry.value === product.subcategory)?.label ||
        product.subcategory
    };
  });
  res.render('admin/reports/products', {
    headPartial: 'head/admin',
    titulo: onlyActive
      ? 'Relatório de Produtos (Somente Ativos)'
      : onlyInactive
        ? 'Relatório de Produtos (Somente Inativos)'
        : 'Relatório de Produtos',
    onlyActive,
    onlyInactive,
    allProducts: tipo === 'geral',
    dados,
    count: dados.length
  });
});


router.get('/clientes', async (req, res) => {
  const clients = await db
    .prepare(
      "SELECT id, TRIM(CONCAT_WS(' ',name,NULLIF(surname,''))) AS name, email, phone, created_at FROM users WHERE role='client' ORDER BY created_at DESC, id DESC"
    )
    .all();
  const dados = clients.map((client) => ({
    ...client,
    dataCadastro: formatDate(client.created_at)
  }));
  res.render('admin/reports/customers', {
    headPartial: 'head/admin',
    titulo: 'Relatório de Clientes Cadastrados',
    dados,
    count: dados.length
  });
});


router.get('/vendas', async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT o.id, o.total, o.status, o.created_at, TRIM(CONCAT_WS(' ',u.name,NULLIF(u.surname,''))) AS cliente_nome, u.email AS cliente_email,
    (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id=o.id) AS total_itens
    FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC, o.id DESC`
    )
    .all();
  const total = rows.reduce(
    (sum, order) => sum + (order.status === 'Cancelado' ? 0 : order.total),
    0
  );
  const dados = rows.map((order) => ({
    ...order,
    status: statusLabel(order.status),
    totalFormatado: money(order.total),
    dataVenda: formatDate(order.created_at)
  }));
  res.render('admin/reports/sales', {
    headPartial: 'head/admin',
    titulo: 'Relatório de Vendas',
    dados,
    count: dados.length,
    totalDisplay: money(total)
  });
});
module.exports = router;
