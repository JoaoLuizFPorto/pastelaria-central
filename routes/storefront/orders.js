// Registra os pedidos e mostra o acompanhamento do cliente.

const express = require('express');
const router = express.Router();
const { db, transaction } = require('../../config/database');
const { cart, cartView } = require('../../services/cart');
const { money } = require('../../models/product');
const { owner, requireUser } = require('../../lib/session');
const { validateAddress } = require('../../lib/address');
const { statusLabel } = require('../../lib/order-status');
const { queueOrderEmail } = require('../../lib/order-email');


router.post('/pedidos', requireUser, async (req, res) => {
  if (!(await cart(req.session)).items.length)
    return cartView(req, res, 400, 'Adicione um produto antes de registrar o pedido.');
  if (validateAddress({}, req.user).error) return cartView(req, res, 200, undefined, true);
  const orderId = await transaction(async () => {
    const addressOwner = await db
      .prepare('SELECT * FROM users WHERE id=? FOR UPDATE')
      .get(req.user.id);
    if (validateAddress({}, addressOwner).error) return 'address-required';
    const summary = await cart(req.session, true);
    if (!summary.items.length) return null;
    const result = await db
      .prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)')
      .run(req.user.id, summary.total);
    const id = Number(result.lastInsertRowid);
    for (const item of summary.items)
      await db
        .prepare('INSERT INTO order_items VALUES (?, ?, ?, ?, ?)')
        .run(id, item.id, item.name, item.price, item.quantity);
    await db
      .prepare('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)')
      .run(id, 'Registrado', 'Seu pedido foi recebido pela Pastelaria Central.');
    await queueOrderEmail(id, req.user, summary);
    await db.prepare('DELETE FROM cart_items WHERE owner = ?').run(owner(req.session));
    return id;
  });
  if (orderId === 'address-required') return res.redirect(303, '/cadastrar-endereco?compra=1');
  if (!orderId) return cartView(req, res, 400, 'Adicione um produto antes de registrar o pedido.');
  res.redirect(303, '/meus-pedidos?registrado=1');
});


router.get('/meus-pedidos', requireUser, async (req, res) => {
  const rows = await db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  const orders = await Promise.all(
    rows.map(async (order) => ({
      ...order,
      status: statusLabel(order.status),
      totalDisplay: money(order.total),
      date: new Date(order.created_at.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      }),
      items: (await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)).map(
        (item) => ({ ...item, subtotal: money(item.price * item.quantity) })
      )
    }))
  );
  res.render('pages/store/orders', {
    headPartial: 'head/orders',
    orders,
    registered: req.query.registrado === '1'
  });
});


router.get('/meus-pedidos/:id', requireUser, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.renderError(404);
  const order = await db
    .prepare('SELECT * FROM orders WHERE id=? AND user_id=?')
    .get(id, req.user.id);
  if (!order) return res.renderError(404);
  const items = (await db.prepare('SELECT * FROM order_items WHERE order_id=?').all(id)).map(
    (item) => ({ ...item, subtotal: money(item.price * item.quantity) })
  );
  const history = await db
    .prepare(
      'SELECT id, status, note, created_at FROM order_status_history WHERE order_id=? ORDER BY created_at ASC, id ASC'
    )
    .all(id);
  const timeline = history.map((item, index) => ({
    ...item,
    status: statusLabel(item.status),
    cancelled: statusLabel(item.status) === 'Cancelado',
    first: index === 0,
    last: index === history.length - 1,
    date: new Date(item.created_at.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    })
  }));
  res.render('pages/store/order-tracking', {
    headPartial: 'head/orders',
    order: {
      ...order,
      status: statusLabel(order.status),
      totalDisplay: money(order.total),
      date: new Date(order.created_at.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      })
    },
    items,
    timeline
  });
});

module.exports = router;
