// Adiciona, altera e remove os itens do carrinho.

const express = require('express');
const router = express.Router();
const { db, transaction } = require('../../config/database');
const { findProduct } = require('../../models/product');
const { owner } = require('../../lib/session');
const { cartView } = require('../../services/cart');


router.get('/carrinho', (req, res) => cartView(req, res));


router.post('/carrinho/adicionar', async (req, res) => {
  const product = await findProduct(req.body.productId);
  const quantity = Number(req.body.quantity ?? 1);
  if (
    !product ||
    !product.active ||
    product.deleted ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 99
  )
    return cartView(req, res, 400, 'Produto ou quantidade inválidos.');
  // Confere a disponibilidade e o limite dentro da mesma transação.
  const added = await transaction(async () => {
    const available = await db
      .prepare('SELECT active, deleted FROM products WHERE id = ? FOR UPDATE')
      .get(product.id);
    if (!available?.active || available.deleted) return false;
    const current = await db
      .prepare('SELECT quantity FROM cart_items WHERE owner = ? AND product_id = ? FOR UPDATE')
      .get(owner(req.session), product.id);
    if ((current?.quantity || 0) + quantity > 99) return false;
    await db
      .prepare(
        'INSERT INTO cart_items VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)'
      )
      .run(owner(req.session), product.id, quantity);
    return true;
  });
  if (!added)
    return cartView(
      req,
      res,
      400,
      'O produto está indisponível ou o limite de 99 unidades foi atingido.'
    );
  res.redirect(303, '/carrinho');
});


router.post('/carrinho/quantidade', async (req, res) => {
  const quantity = Number(req.body.quantity);
  const product = await findProduct(req.body.productId);
  if (
    !product?.active ||
    product.deleted ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 99
  )
    return cartView(req, res, 400, 'Escolha um produto disponível e uma quantidade entre 1 e 99.');
  await db
    .prepare('UPDATE cart_items SET quantity = ? WHERE owner = ? AND product_id = ?')
    .run(quantity, owner(req.session), req.body.productId);
  res.redirect(303, '/carrinho');
});


router.post('/carrinho/remover', async (req, res) => {
  if (!(await findProduct(req.body.productId))) return cartView(req, res, 400, 'Produto inválido.');
  await db
    .prepare('DELETE FROM cart_items WHERE owner = ? AND product_id = ?')
    .run(owner(req.session), req.body.productId);
  res.redirect(303, '/carrinho');
});

module.exports = router;
