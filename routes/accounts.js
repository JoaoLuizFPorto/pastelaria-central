// Cuida do cadastro, login e alterações da conta.

const express = require('express');
const { db } = require('../config/database');
const { hashPassword, verifyPassword, validateUser, validatePhone } = require('../lib/passwords');
const { signIn, createSession, requireUser } = require('../lib/session');
const router = express.Router();
const { fields: addressFields, validateAddress } = require('../lib/address');
const attempts = new Map();
const dummyHash = hashPassword('dummy-password-for-timing');
function limit(req, res, next) {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until < now) attempts.delete(key);
  const key = req.ip;
  const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 30)
    return res.renderError(429, 'Muitas tentativas. Aguarde 15 minutos e tente novamente.');
  next();
}

function authView(res, view, status, data) {
  return res
    .status(status)
    .render(view, { headPartial: 'head/' + view.split('/').at(-1), ...data });
}


router.get(['/login', '/signin'], (req, res, next) => (req.user ? res.redirect('/') : next()));


router.post('/signin', limit, async (req, res) => {
  const input = validateUser(req.body);
  const values = {
    name: typeof req.body.name === 'string' ? req.body.name.slice(0, 100) : '',
    surname: typeof req.body.surname === 'string' ? req.body.surname.slice(0, 100) : '',
    email: typeof req.body.email === 'string' ? req.body.email.slice(0, 254) : '',
    phone: typeof req.body.phone === 'string' ? req.body.phone.slice(0, 20) : ''
  };
  const fail = (message) => authView(res, 'pages/auth/register', 400, { error: message, values });
  if (input.error) return fail(input.error);
  const phone = validatePhone(req.body.phone);
  if (!phone) return fail('Informe um telefone válido com DDD e número (10 ou 11 dígitos).');
  if (input.password !== req.body.confirmPassword) return fail('As senhas não coincidem.');
  if (await db.prepare('SELECT id FROM users WHERE email = ?').get(input.email))
    return fail('Este email já está cadastrado.');
  const hash = await hashPassword(input.password);
  // A regra no servidor ignora qualquer papel enviado pelo formulário.
  let result;
  try {
    result = await db
      .prepare(
        "INSERT INTO users (name, surname, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, 'client')"
      )
      .run(input.name, input.surname, input.email, hash, phone);
  } catch (error) {
    if (await db.prepare('SELECT id FROM users WHERE email = ?').get(input.email))
      return fail('Este email já está cadastrado.');
    throw error;
  }
  await signIn(req, res, Number(result.lastInsertRowid), false);
  res.redirect(303, '/cadastrar-endereco');
});


router.post('/login', limit, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const valid =
    password.length <= 128 &&
    (await verifyPassword(password, user?.password_hash || (await dummyHash)));
  if (!user || !valid)
    return authView(res, 'pages/auth/login', 401, {
      error: 'Email ou senha incorretos.',
      values: { email: email.slice(0, 254) }
    });
  await signIn(req, res, user.id, req.body.remember === 'on');
  res.redirect(303, '/');
});


router.post('/logout', async (req, res) => {
  await db.prepare('DELETE FROM sessions WHERE id = ?').run(req.session.id);
  await createSession(res);
  res.redirect(303, '/');
});
function addressView(req, res, status = 200, data = {}) {
  return res.status(status).render('pages/account/address', {
    headPartial: 'head/address',
    checkout: req.query.compra === '1' || req.body?.checkout === '1',
    ...data
  });
}


router.get('/cadastrar-endereco', requireUser, (req, res) => addressView(req, res));


router.post('/cadastrar-endereco', requireUser, async (req, res) => {
  const address = validateAddress(req.body);
  const values = Object.fromEntries(
    Object.entries(addressFields).map(([key, field]) => [
      key,
      typeof req.body[key] === 'string' ? req.body[key].slice(0, field.max) : ''
    ])
  );
  if (address.error) return addressView(req, res, 400, { error: address.error, values });
  await db
    .prepare(
      'UPDATE users SET ' +
        Object.keys(addressFields)
          .map((key) => key + '=?')
          .join(',') +
        ' WHERE id=?'
    )
    .run(...Object.keys(addressFields).map((key) => address.values[key]), req.user.id);
  res.redirect(303, req.body.checkout === '1' ? '/carrinho' : '/');
});


router.get('/minha-conta', requireUser, (req, res) =>
  res.render('pages/account/profile', { headPartial: 'head/profile' })
);


router.post('/minha-conta', requireUser, limit, async (req, res) => {
  const surname = req.body.surname === undefined ? req.user.surname : req.body.surname;
  const values = { name: req.body.name, surname, email: req.body.email, phone: req.body.phone };
  for (const key of Object.keys(addressFields))
    values[key] =
      typeof req.body[key] === 'string'
        ? req.body[key].slice(0, addressFields[key].max)
        : req.user[key] || '';
  const fail = (error) =>
    res.status(400).render('pages/account/profile', { headPartial: 'head/profile', error, values });
  const input = validateUser({
    ...req.body,
    surname,
    password: req.body.newPassword || 'placeholder-valid'
  });
  if (input.error) return fail(input.error);
  const current = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const phone = req.body.phone === undefined ? current.phone : validatePhone(req.body.phone);
  if (req.body.phone !== undefined && !phone) return fail('Informe um telefone válido com DDD.');
  if (
    typeof req.body.currentPassword !== 'string' ||
    req.body.currentPassword.length > 128 ||
    !(await verifyPassword(req.body.currentPassword, current.password_hash))
  )
    return fail('Informe sua senha atual para salvar as alterações.');
  if (
    await db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .get(input.email, req.user.id)
  )
    return fail('Este email já pertence a outra conta.');
  if (req.body.newPassword && req.body.newPassword !== req.body.confirmPassword)
    return fail('As novas senhas não coincidem.');
  const address = validateAddress(req.body, current);
  if (address.error) return fail(address.error);
  const hash = req.body.newPassword ? await hashPassword(input.password) : current.password_hash;
  try {
    await db
      .prepare(
        'UPDATE users SET name = ?, surname = ?, email = ?, password_hash = ?, phone = ?, address_postal_code = ?, address_street = ?, address_number = ?, address_complement = ?, address_district = ?, address_city = ?, address_state = ?, address_reference = ? WHERE id = ?'
      )
      .run(
        input.name,
        input.surname,
        input.email,
        hash,
        phone,
        ...Object.keys(addressFields).map((key) => address.values[key]),
        req.user.id
      );
  } catch (error) {
    if (
      await db
        .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
        .get(input.email, req.user.id)
    )
      return fail('Este email já pertence a outra conta.');
    throw error;
  }
  if (req.body.newPassword) {
    await db
      .prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?')
      .run(req.user.id, req.session.id);
    await signIn(req, res, req.user.id, false);
  }
  res.redirect(303, '/minha-conta?salvo=1');
});
module.exports = router;
