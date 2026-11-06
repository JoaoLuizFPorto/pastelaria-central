// Consulta os pedidos e registra mudanças de status.

const express = require('express');
const router = express.Router();
const { db, transaction } = require('../../config/database');
const { money } = require('../../models/product');
const { nextStatuses, formatDate, statusLabel, allowsMessage } = require('../../lib/order-status');
const { queueOrderStatusEmail } = require('../../lib/order-email');


router.post('/admin/pedidos/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.renderError(404);
  const { status, expectedStatus } = req.body;
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
  if (
    typeof status !== 'string' ||
    typeof expectedStatus !== 'string' ||
    (req.body.note !== undefined && typeof req.body.note !== 'string') ||
    note.length > 255
  )
    return res.renderError(400);
  if (note && !allowsMessage(status))
    return res.renderError(
      400,
      'Mensagens são permitidas somente ao marcar o pedido como Entregue ou Cancelado.'
    );
  const result = await transaction(async () => {
    const order = await db.prepare('SELECT status FROM orders WHERE id=? FOR UPDATE').get(id);
    if (!order) return 404;
    if (order.status !== expectedStatus) return 409;
    if (!nextStatuses(order.status).includes(status)) return 400;
    await db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, id);
    await db
      .prepare('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)')
      .run(id, status, note || null);
    await queueOrderStatusEmail(id, status, note);
    return 200;
  });
  if (result !== 200) return res.renderError(result);
  res.redirect(303, '/admin/pedidos?atualizado=1');
});


router.get('/admin/pedidos', async (req, res) => {
  const rows = await db
    .prepare(
      "SELECT o.*, TRIM(CONCAT_WS(' ',u.name,NULLIF(u.surname,''))) AS customer FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC"
    )
    .all();
  const orders = await Promise.all(
    rows.map(async (order) => ({
      ...order,
      status: statusLabel(order.status),
      storedStatus: order.status,
      totalDisplay: money(order.total),
      date: new Date(order.created_at.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      }),
      items: (
        await db
          .prepare('SELECT name, quantity, price FROM order_items WHERE order_id=?')
          .all(order.id)
      ).map((item) => ({ ...item, subtotal: money(item.price * item.quantity) })),
      statusOptions: nextStatuses(order.status).map((value) => ({ value })),
      history: (
        await db
          .prepare(
            'SELECT status, note, created_at FROM order_status_history WHERE order_id=? ORDER BY created_at DESC, id DESC'
          )
          .all(order.id)
      ).map((event) => ({
        ...event,
        status: statusLabel(event.status),
        date: formatDate(event.created_at)
      }))
    }))
  );
  res.render('admin/section', {
    headPartial: 'head/admin',
    title: 'Gerenciar Pedidos',
    orderSection: true,
    orders,
    updated: req.query.atualizado === '1'
  });
});

module.exports = router;
