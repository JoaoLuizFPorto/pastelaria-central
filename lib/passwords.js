const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, options);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [, salt, hex] = stored.split(':');
  const hash = await derive(password, salt, 64, options);
  const expected = Buffer.from(hex, 'hex');
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}

function validateUser(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const surname = typeof body.surname === 'string' ? body.surname.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (name.length < 2 || name.length > 100)
    return { error: 'Informe um nome de 2 a 100 caracteres.' };
  if ((body.surname !== undefined && typeof body.surname !== 'string') || surname.length > 100)
    return { error: 'O sobrenome deve ter no máximo 100 caracteres.' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: 'Informe um email válido.' };
  if (password.length < 8 || password.length > 128)
    return { error: 'A senha deve ter entre 8 e 128 caracteres.' };
  return { name, surname, email, password };
}

function validatePhone(value) {
  if (typeof value !== 'string' || !/^[\d\s()+-]{10,20}$/.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  return /^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(digits) ? digits : null;
}
module.exports = { hashPassword, verifyPassword, validateUser, validatePhone };
