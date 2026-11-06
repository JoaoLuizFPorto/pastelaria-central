const { randomBytes, createHash, timingSafeEqual } = require('node:crypto');
const { db, transaction } = require('../config/database');
const ttl = 7 * 24 * 60 * 60 * 1000;
const digest = (token) => createHash('sha256').update(token).digest('hex');
const owner = (session) => (session.user_id ? `user:${session.user_id}` : `guest:${session.id}`);
let requests = 0;

async function removeExpiredSessions() {
  await transaction(async () => {
    await db
      .prepare(
        "DELETE FROM cart_items WHERE owner IN (SELECT CONCAT('guest:', id) FROM sessions WHERE expires <= ?)"
      )
      .run(Date.now());
    await db
      .prepare(
        "DELETE FROM favorites WHERE owner IN (SELECT CONCAT('guest:', id) FROM sessions WHERE expires <= ?)"
      )
      .run(Date.now());
    await db.prepare('DELETE FROM sessions WHERE expires <= ?').run(Date.now());
  });
}

async function createSession(res, userId = null, remember = false) {
  const token = randomBytes(32).toString('hex');
  const session = {
    id: digest(token),
    user_id: userId,
    csrf: randomBytes(32).toString('hex'),
    expires: Date.now() + ttl
  };
  await db
    .prepare('INSERT INTO sessions (id, user_id, csrf, expires) VALUES (?, ?, ?, ?)')
    .run(session.id, userId, session.csrf, session.expires);
  res.cookie('pc_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(remember ? { maxAge: ttl } : {})
  });
  return session;
}

async function sessionMiddleware(req, res, next) {
  if (requests++ % 100 === 0) await removeExpiredSessions();
  const token = (req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('pc_session='))
    ?.slice(11);
  let session = /^[a-f0-9]{64}$/.test(token || '')
    ? await db
        .prepare('SELECT * FROM sessions WHERE id = ? AND expires > ?')
        .get(digest(token), Date.now())
    : null;
  if (!session) session = await createSession(res);
  req.session = session;
  req.user = session.user_id
    ? await db
        .prepare(
          'SELECT id, name, surname, email, role, phone, address_postal_code, address_street, address_number, address_complement, address_district, address_city, address_state, address_reference FROM users WHERE id = ?'
        )
        .get(session.user_id)
    : null;
  if (req.user) {
    req.user.fullName = [req.user.name, req.user.surname].filter(Boolean).join(' ');
  }
  res.locals.user = req.user;
  res.locals.cookieNoticeSeen = (req.headers.cookie || '')
    .split(';')
    .some((part) => part.trim() === 'pc_cookie_notice=1');
  res.locals.isAdmin = req.user?.role === 'admin';
  res.locals.csrf = session.csrf;
  res.locals.cartCount = (
    await db
      .prepare(
        'SELECT COALESCE(SUM(c.quantity), 0) AS count FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.owner = ? AND p.active=1 AND p.deleted=0'
      )
      .get(owner(session))
  ).count;
  res.set('Cache-Control', 'no-store');
  next();
}

function csrfProtection(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const submitted = req.body?._csrf || req.get('x-csrf-token');
  if (
    typeof submitted !== 'string' ||
    !/^[a-f0-9]{64}$/.test(submitted) ||
    !timingSafeEqual(Buffer.from(submitted), Buffer.from(req.session.csrf))
  ) {
    return res.renderError(
      403,
      'Sua sessão mudou ou expirou. Atualize a página e tente novamente.'
    );
  }
  next();
}
// Ao entrar, os itens da sessão de visitante passam para a conta.
async function signIn(req, res, userId, remember) {
  const previous = req.session;
  const fresh = await transaction(async () => {
    const session = await createSession(res, userId, remember);
    if (!previous.user_id) {
      const items = await db
        .prepare('SELECT * FROM cart_items WHERE owner = ?')
        .all(owner(previous));
      for (const item of items)
        await db
          .prepare(
            `INSERT INTO cart_items VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = LEAST(99, quantity + VALUES(quantity))`
          )
          .run(owner(session), item.product_id, item.quantity);
      await db.prepare('DELETE FROM cart_items WHERE owner = ?').run(owner(previous));
      await db
        .prepare(
          'INSERT IGNORE INTO favorites (owner,product_id) SELECT ?,product_id FROM favorites WHERE owner=?'
        )
        .run(owner(session), owner(previous));
      await db.prepare('DELETE FROM favorites WHERE owner=?').run(owner(previous));
    }
    await db.prepare('DELETE FROM sessions WHERE id = ?').run(previous.id);
    return session;
  });
  req.session = fresh;
}

function requireUser(req, res, next) {
  if (!req.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (req.user.role !== 'admin')
    return res.renderError(403, 'Esta página é exclusiva para administradores.');
  next();
}
module.exports = {
  sessionMiddleware,
  csrfProtection,
  signIn,
  createSession,
  requireUser,
  requireAdmin,
  owner
};
