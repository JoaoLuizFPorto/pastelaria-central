const express = require('express');
const pages = require('../config/pages.json');
const router = express.Router();

for (const page of pages) {
  // Catálogo e detalhes recebem dados exclusivamente das rotas da loja.
  if (page.view === 'pages/error') router.get(page.path, (req, res) => res.renderError(404));
  else if (!['pages/home', 'pages/catalog/menu', 'pages/catalog/product'].includes(page.view)) {
    router.get(page.path, (req, res) => res.render(page.view, { headPartial: page.headPartial }));
  }
  // Mantém links antigos e favoritos funcionando após a migração.
  router.get(`/${page.legacyView || page.view}.html`, (req, res) =>
    res.redirect(301, page.path + req.url.slice(req.path.length))
  );
}


router.get('/index', (req, res) => res.redirect(301, '/'));

module.exports = router;
