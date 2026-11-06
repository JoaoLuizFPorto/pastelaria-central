// Salva e remove os produtos favoritos.

const express = require('express');
const router = express.Router();
const { db } = require('../../config/database');
const { findProduct } = require('../../models/product');
const { owner } = require('../../lib/session');


router.get('/favoritos', async (req, res) => {
  const rows = await db
    .prepare('SELECT product_id FROM favorites WHERE owner=? ORDER BY product_id')
    .all(owner(req.session));
  const items = (await Promise.all(rows.map((row) => findProduct(row.product_id)))).filter(
    (product) => product && !product.deleted
  );
  res.render('pages/store/favorites', { headPartial: 'head/favorites', items });
});


router.post('/favoritos/adicionar', async (req, res) => {
  const product = await findProduct(req.body.productId);
  if (!product || !product.active || product.deleted)
    return res.renderError(400, 'Este produto está indisponível.');
  await db
    .prepare('INSERT IGNORE INTO favorites (owner,product_id) VALUES (?,?)')
    .run(owner(req.session), product.id);
  res.redirect(303, '/favoritos');
});


router.post('/favoritos/remover', async (req, res) => {
  if (typeof req.body.productId !== 'string') return res.renderError(400, 'Produto inválido.');
  await db
    .prepare('DELETE FROM favorites WHERE owner=? AND product_id=?')
    .run(owner(req.session), req.body.productId);
  res.redirect(303, '/favoritos');
});

module.exports = router;
