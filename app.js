// Configura o servidor, as páginas e os arquivos públicos.

const paths = require('./config/paths');
const { legacyAssets } = require('./lib/assets');
const express = require('express');
const { engine } = require('express-handlebars');
const pagesRouter = require('./routes/static-pages');
const { sessionMiddleware, csrfProtection } = require('./lib/session');
const accountsRouter = require('./routes/accounts');
const storefrontRouter = require('./routes/storefront');
const adminRouter = require('./routes/admin');
const reportsRouter = require('./routes/admin/reports');
const { initialize, db } = require('./config/database');
const { errorPages } = require('./lib/http-errors');
const { startEmailWorker } = require('./lib/order-email');

const app = express();
app.disable('x-powered-by');

// Configuração dos templates e recursos compartilhados.
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', paths.viewsDir);
app.locals.frontendScripts = require('./config/frontend.json');

// Arquivos públicos, leitura dos formulários e proteção das sessões.
app.use(errorPages);
app.use(legacyAssets);
app.use(express.static(paths.publicDir));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(express.json({ limit: '16kb' }));
app.use(sessionMiddleware);
app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.saved = req.query.salvo === '1';
  next();
});
// Rotas de clientes, administração e páginas institucionais.
app.use(accountsRouter);
app.use('/admin/relatorios', reportsRouter);
app.use(adminRouter);
app.use(storefrontRouter);
app.use(pagesRouter);

// A função legada é preservada, mas depende de um banco ainda não integrado.
app.post('/.netlify/functions/signin', (req, res) => {
  res.status(503).json({ message: 'O cadastro ainda não está disponível nesta versão local.' });
});
// Respostas para páginas inexistentes e erros de execução.
app.use((req, res) => {
  if (/^\/(img|images|css|js)\//.test(req.path))
    return res.status(404).send('Recurso não encontrado.');
  res.renderError(404);
});
app.use((error, req, res, next) => {
  console.error('Erro no servidor:', error);
  if (res.headersSent) return next(error);
  const status = [400, 401, 403, 404, 413, 429, 503].includes(error.status) ? error.status : 500;
  res.renderError(status);
});

// O servidor só começa a receber acessos depois de conectar ao banco.
if (require.main === module) {
  initialize()
    .then(() => {
      const port = process.env.PORT || 3000;
      const server = app.listen(port);
      server.on('listening', () => {
        console.log(`Pastelaria Central v9.0: http://localhost:${port}`);
        startEmailWorker();
      });
      server.on('error', (error) => {
        console.error('Não foi possível iniciar o servidor:', error.message);
        if (error.code === 'EADDRINUSE')
          console.error(
            'A porta já está em uso. Encerre o servidor anterior com Ctrl+C ou configure outra PORT.'
          );
        process.exitCode = 1;
        db.close();
      });
    })
    .catch(async (error) => {
      console.error(
        'Não foi possível conectar ao MySQL. Confira o serviço MySQL e o arquivo .env. Código:',
        error.code || error.message
      );
      await db.close();
      process.exitCode = 1;
    });
}

module.exports = app;
