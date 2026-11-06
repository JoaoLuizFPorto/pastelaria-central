// Consulta os produtos e prepara seus dados para as páginas.

const money = (cents) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const decorate = (product) =>
  product && {
    ...product,
    priceDisplay: money(product.price),
    ingredients: product.description.split('\n').filter(Boolean)
  };
async function findProduct(id) {
  if (typeof id !== 'string') return null;
  const { db } = require('../config/database');
  return decorate(await db.prepare('SELECT * FROM products WHERE id = ?').get(id));
}

async function listProducts() {
  const { db } = require('../config/database');
  return (
    await db
      .prepare(
        'SELECT * FROM products WHERE active=1 AND deleted=0 ORDER BY category, subcategory, name'
      )
      .all()
  ).map(decorate);
}
module.exports = { money, findProduct, listProducts };
