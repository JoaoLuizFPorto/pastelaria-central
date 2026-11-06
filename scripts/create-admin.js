const readline = require('node:readline/promises');
const { Writable } = require('node:stream');
const { db, initialize } = require('../config/database');
const { validateUser, hashPassword, validatePhone } = require('../lib/passwords');

async function main() {
  await initialize();
  if (!process.stdin.isTTY) throw new Error('Execute este comando em um terminal interativo.');
  let muted = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    }
  });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  try {
    const name = await rl.question('Nome do administrador: ');
    const surname = await rl.question('Sobrenome (opcional): ');
    const email = await rl.question('Email: ');
    const phone = validatePhone(await rl.question('Telefone com DDD: '));
    if (!phone) throw new Error('Informe um telefone válido com DDD.');
    process.stdout.write('Senha (mínimo 8 caracteres; entrada oculta): ');
    muted = true;
    const password = await rl.question('');
    muted = false;
    process.stdout.write('\nConfirme a senha: ');
    muted = true;
    const confirmation = await rl.question('');
    muted = false;
    process.stdout.write('\n');
    const input = validateUser({ name, surname, email, password });
    if (input.error) throw new Error(input.error);
    if (password !== confirmation) throw new Error('As senhas não coincidem.');
    if (await db.prepare('SELECT id FROM users WHERE email = ?').get(input.email))
      throw new Error('Este email já está em uso. Escolha um email exclusivo para o ADM.');
    const hash = await hashPassword(password);
    await db
      .prepare(
        "INSERT INTO users (name, surname, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, 'admin')"
      )
      .run(input.name, input.surname, input.email, hash, phone);
    console.log('Administrador criado. Entre pela tela de login com o email e a senha informados.');
  } finally {
    muted = false;
    rl.close();
  }
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
