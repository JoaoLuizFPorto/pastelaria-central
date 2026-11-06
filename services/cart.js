// Calcula as quantidades e os valores exibidos no carrinho.

const { db } = require('../config/database');
const { findProduct, money } = require('../models/product');
const { owner } = require('../lib/session');
const { validateAddress } = require('../lib/address');
async function cart(session, lock = false) {
  const rows = await db
    .prepare(
      `SELECT product_id, quantity FROM cart_items WHERE owner = ? ORDER BY product_id${lock ? ' FOR UPDATE' : ''}`
    )
    .all(owner(session));
  const items = (
    await Promise.all(
      rows.map(async (item) => {
        const product = await findProduct(item.product_id);
        return (
          product?.active &&
          !product.deleted && {
            ...product,
            quantity: item.quantity,
            unitPrice: money(product.price),
            subtotal: money(product.price * item.quantity)
          }
        );
      })
    )
  ).filter(Boolean);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    items,
    total,
    totalDisplay: money(total),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}

async function cartView(req, res, status = 200, error, showAddressNotice = false) {
  res.status(status).render('pages/store/cart', {
    headPartial: 'head/cart',
    ...(await cart(req.session)),
    error,
    showAddressNotice,
    needsAddress: Boolean(req.user && (showAddressNotice || validateAddress({}, req.user).error))
  });
}

module.exports = { cart, cartView };
