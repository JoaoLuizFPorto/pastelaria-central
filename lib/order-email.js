const nodemailer = require('nodemailer');
const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const { db } = require('../config/database');
const { money } = require('../models/product');
const maxAttempts = 5;
let transporter;
let transportKey;
let running = false;
function emailSettings() {
  const envFile = path.join(__dirname, '../.env');
  const local = fs.existsSync(envFile) ? parseEnv(fs.readFileSync(envFile, 'utf8')) : {};
  const setting = (key) => local[key] ?? process.env[key];
  const port = Number(setting('SMTP_PORT') || 465);
  const configured = Boolean(
    setting('SMTP_HOST') && setting('SMTP_USER') && setting('SMTP_PASSWORD')
  );
  return {
    configured,
    from: setting('MAIL_FROM') || `Pastelaria Central <${setting('SMTP_USER')}>`,
    transport: {
      host: setting('SMTP_HOST'),
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: setting('SMTP_USER'), pass: setting('SMTP_PASSWORD') },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      disableFileAccess: true,
      disableUrlAccess: true
    }
  };
}

function getTransport() {
  const settings = emailSettings();
  if (!settings.configured)
    throw new Error('Preencha SMTP_HOST, SMTP_USER e SMTP_PASSWORD no .env.');
  const key = JSON.stringify(settings.transport);
  if (!transporter || transportKey !== key) {
    transporter?.close();
    transporter = nodemailer.createTransport(settings.transport);
    transportKey = key;
  }
  return transporter;
}
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
function buildMessage(orderId, payload, from, event = 'registered') {
  if (event !== 'registered') return buildStatusMessage(orderId, payload, from, event);
  const lines = payload.items.map(
    (item) => `${item.quantity} × ${item.name} — ${money(item.price * item.quantity)}`
  );
  const text = `Olá, ${payload.name}!\n\nSeu pedido #${orderId} foi registrado na Pastelaria Central.\n\n${lines.join('\n')}\n\nTotal: ${money(payload.total)}\nStatus: Registrado\n\nEste email confirma o registro do pedido. Não representa confirmação de pagamento ou de preparo.\n\nPastelaria Central`;
  const rows = payload.items
    .map(
      (item) =>
        `<tr><td style="padding:12px;border-bottom:1px solid #eadac5">${item.quantity} × ${escapeHtml(item.name)}</td><td style="padding:12px;border-bottom:1px solid #eadac5;text-align:right">${money(item.price * item.quantity)}</td></tr>`
    )
    .join('');
  return {
    from,
    to: { address: payload.email, name: payload.name },
    subject: `Pedido #${orderId} registrado — Pastelaria Central`,
    messageId: `<pedido-${orderId}@pastelaria-central.local>`,
    text,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#561f15;border:1px solid #eadac5;border-top:6px solid #ffc72c;border-radius:10px;padding:28px"><h1 style="color:#ae1616;font-size:26px">Pastelaria Central</h1><h2>Pedido #${orderId} registrado!</h2><p>Olá, ${escapeHtml(payload.name)}! Recebemos o registro do seu pedido.</p><table style="width:100%;border-collapse:collapse">${rows}</table><p style="font-size:22px;color:#ae1616"><strong>Total: ${money(payload.total)}</strong></p><p>Status: Registrado</p><p style="font-size:13px;line-height:1.6">Este email confirma o registro do pedido. Não representa confirmação de pagamento ou de preparo.</p></div>`
  };
}

function buildStatusMessage(orderId, payload, from, event) {
  const delivered = event === 'delivered';
  const status = delivered ? 'Entregue' : 'Cancelado';
  const action = delivered ? 'entregue' : 'cancelado';
  const description = delivered
    ? 'Seu pedido foi marcado como entregue pela equipe da Pastelaria Central. Agradecemos pela preferência!'
    : 'Seu pedido foi cancelado pela equipe da Pastelaria Central. Se precisar de esclarecimentos, entre em contato com a pastelaria.';
  const note = payload.observation || '';
  const lines = payload.items.map(
    (item) => `${item.quantity} × ${item.name} — ${money(item.price * item.quantity)}`
  );
  const rows = payload.items
    .map(
      (item) =>
        `<tr><td style="padding:12px;border-bottom:1px solid #eadac5">${item.quantity} × ${escapeHtml(item.name)}</td><td style="padding:12px;border-bottom:1px solid #eadac5;text-align:right">${money(item.price * item.quantity)}</td></tr>`
    )
    .join('');
  const text = `Olá, ${payload.name}!\n\nPedido #${orderId} ${action}.\n${description}\n\nStatus: ${status}${note ? `\n\nObservação:\n${note}` : ''}\n\n${lines.join('\n')}\n\nTotal do pedido: ${money(payload.total)}\n\nPastelaria Central`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#561f15;border:1px solid #eadac5;border-top:6px solid #ffc72c;border-radius:10px;padding:28px"><h1 style="color:#ae1616;font-size:26px">Pastelaria Central</h1><h2 style="color:${delivered ? '#225b26' : '#a51d1d'}">Pedido #${orderId} ${action}</h2><p>Olá, ${escapeHtml(payload.name)}!</p><p>${description}</p><p><strong>Status: ${status}</strong></p>${note ? `<div style="background:#fff5d5;padding:16px;border-radius:8px"><strong>Observação:</strong><p style="white-space:pre-wrap">${escapeHtml(note)}</p></div>` : ''}<table style="width:100%;border-collapse:collapse">${rows}</table><p><strong>Total do pedido: ${money(payload.total)}</strong></p></div>`;
  return {
    from,
    to: { address: payload.email, name: payload.name },
    subject: `Pedido #${orderId} ${action} — Pastelaria Central`,
    messageId: `<pedido-${orderId}-${event}@pastelaria-central.local>`,
    text,
    html
  };
}

async function queueOrderEmail(orderId, user, summary) {
  const payload = {
    name: user.fullName || user.name,
    email: user.email,
    total: summary.total,
    items: summary.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  };
  await db
    .prepare('INSERT INTO order_emails (order_id, payload) VALUES (?,?)')
    .run(orderId, JSON.stringify(payload));
}

async function queueOrderStatusEmail(orderId, status, observation) {
  const event = status === 'Entregue' ? 'delivered' : status === 'Cancelado' ? 'cancelled' : null;
  if (!event) return;
  const order = await db
    .prepare(
      "SELECT o.total, TRIM(CONCAT_WS(' ',u.name,NULLIF(u.surname,''))) AS name, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?"
    )
    .get(orderId);
  const items = await db
    .prepare('SELECT name, price, quantity FROM order_items WHERE order_id=?')
    .all(orderId);
  const payload = { ...order, items, status, observation: observation || '' };
  await db
    .prepare('INSERT INTO order_emails (order_id,event,payload) VALUES (?,?,?)')
    .run(orderId, event, JSON.stringify(payload));
}

async function processOrderEmails(options = {}) {
  if (running || (!options.transport && !emailSettings().configured)) return;
  running = true;
  try {
    const rows = await db
      .prepare(
        `SELECT order_id,event,payload FROM order_emails WHERE attempts < ? AND
      ((status IN ('pending','failed') AND next_attempt <= UTC_TIMESTAMP()) OR (status='processing' AND locked_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)))
      ORDER BY order_id, CASE event WHEN 'registered' THEN 0 ELSE 1 END LIMIT 5`
      )
      .all(maxAttempts);
    for (const row of rows) {
      const claim = await db
        .prepare(
          `UPDATE order_emails SET status='processing', attempts=attempts+1, locked_at=UTC_TIMESTAMP()
        WHERE order_id=? AND event=? AND attempts < ? AND ((status IN ('pending','failed') AND next_attempt <= UTC_TIMESTAMP()) OR (status='processing' AND locked_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)))`
        )
        .run(row.order_id, row.event, maxAttempts);
      if (!claim.changes) continue;
      try {
        const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
        const transport = options.transport || getTransport();
        const info = await transport.sendMail(
          buildMessage(row.order_id, payload, options.from || emailSettings().from, row.event)
        );
        if (!info.accepted?.length)
          throw Object.assign(new Error('Destinatário recusado'), { code: 'ERECIPIENT' });
      } catch (error) {
        const code = String(error.code || 'SEND_FAILED')
          .replace(/[^a-z0-9_]/gi, '')
          .slice(0, 40);
        await db
          .prepare(
            "UPDATE order_emails SET status='failed', last_error=?, next_attempt=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 5 MINUTE), locked_at=NULL WHERE order_id=? AND event=?"
          )
          .run(code, row.order_id, row.event);
        continue;
      }
      await db
        .prepare(
          "UPDATE order_emails SET status='sent',sent_at=UTC_TIMESTAMP(),last_error=NULL,locked_at=NULL WHERE order_id=? AND event=?"
        )
        .run(row.order_id, row.event);
    }
  } finally {
    running = false;
  }
}

function startEmailWorker() {
  if (!emailSettings().configured) console.log('Email: aguardando configuração SMTP no .env.');
  const run = () =>
    processOrderEmails().catch(() =>
      console.error('Email: não foi possível processar as notificações pendentes.')
    );
  run();
  const timer = setInterval(run, 30000);
  timer.unref();
  return timer;
}
module.exports = {
  queueOrderEmail,
  queueOrderStatusEmail,
  processOrderEmails,
  startEmailWorker,
  getTransport,
  emailSettings,
  buildMessage
};
