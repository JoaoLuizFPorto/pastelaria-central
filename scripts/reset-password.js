const readline = require('node:readline/promises');
const { Writable } = require('node:stream');
const { db, transaction } = require('../config/database');
const { validateUser, hashPassword } = require('../lib/passwords');

async function resetAccountPassword(email, password) {
  const input = validateUser({ name: 'Conta local', email, password });
  if (input.error) throw new Error(input.error);
  const hash = await hashPassword(input.password);
  await transaction(async () => {
    const account = await db
      .prepare('SELECT id FROM users WHERE email=? FOR UPDATE')
      .get(input.email);
    if (!account) throw new Error('Não existe uma conta com esse email neste banco.');
    await db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, account.id);
    await db.prepare('DELETE FROM sessions WHERE user_id=?').run(account.id);
  });
}

async function main() {
  if (!process.stdin.isTTY)
    throw new Error('Execute este comando no terminal interativo do VS Code.');
  let muted = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    }
  });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  try {
    const email = await rl.question('Email da conta do site: ');
    process.stdout.write('Nova senha (8 a 128 caracteres; entrada oculta): ');
    muted = true;
    const password = await rl.question('');
    muted = false;
    process.stdout.write('\nConfirme a nova senha (entrada oculta): ');
    muted = true;
    const confirmation = await rl.question('');
    muted = false;
    process.stdout.write('\n');
    if (password !== confirmation)
      throw new Error('As senhas não coincidem. Nenhuma alteração foi feita.');
    await resetAccountPassword(email, password);
    console.log(
      'Senha redefinida. Entre novamente no site; as sessões anteriores dessa conta foram encerradas.'
    );
  } finally {
    muted = false;
    rl.close();
  }
}
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(
        error.code
          ? `Não foi possível redefinir a senha. Confira o MySQL e o .env. Código: ${error.code}`
          : error.message
      );
      process.exitCode = 1;
    })
    .finally(() => db.close());
}
module.exports = { resetAccountPassword };
