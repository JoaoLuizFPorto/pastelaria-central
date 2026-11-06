// Exibe a home, o cardápio, a busca e os detalhes dos produtos.

const express = require('express');
const router = express.Router();
const { findProduct, listProducts } = require('../../models/product');
const { categories: catalogCategories } = require('../../catalog/categories');
const { featured } = require('../../catalog/menu');


router.get('/busca', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const normalize = (text) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = query
    ? (await listProducts()).filter((product) =>
        terms.every((term) => normalize(product.name + ' ' + product.description).includes(term))
      )
    : [];
  const groups = catalogCategories
    .flatMap((category) =>
      category.subcategories.map((sub) => ({
        title: sub.label,
        products: matches.filter(
          (product) => product.category === category.value && product.subcategory === sub.value
        )
      }))
    )
    .filter((group) => group.products.length);
  res.render('pages/catalog/search', {
    headPartial: 'head/search',
    query,
    resultCount: matches.length,
    groups
  });
});


router.get('/singleProductTab', async (req, res) => {
  const product = await findProduct(req.query.produto || 'pastel-queijo');
  if (!product || !product.active || product.deleted) return res.renderError(404);
  res.render('pages/catalog/product', { headPartial: 'head/product', product });
});


router.get(['/', '/cardapio'], async (req, res) => {
  const products = await listProducts();
  const selection = (key) =>
    (Array.isArray(req.query[key])
      ? req.query[key]
      : req.query[key]
        ? [req.query[key]]
        : []
    ).filter((value) => typeof value === 'string');
  const selectedCategories = selection('category');
  const selectedSubcategories = selection('subcategory');
  const effectiveSubcategories = new Set();
  for (const category of catalogCategories) {
    const chosen = category.subcategories.filter((sub) =>
      selectedSubcategories.includes(sub.value)
    );
    const included = chosen.length
      ? chosen
      : selectedCategories.includes(category.value)
        ? category.subcategories
        : [];
    for (const sub of included) effectiveSubcategories.add(sub.value);
  }
  const hasFilters = effectiveSubcategories.size > 0;
  const filterCategories = catalogCategories
    .filter((category) => products.some((product) => product.category === category.value))
    .map((category) => {
      const subcategories = category.subcategories
        .filter((sub) => products.some((product) => product.subcategory === sub.value))
        .map((sub) => ({ ...sub, selected: effectiveSubcategories.has(sub.value) }));
      const checked = subcategories.filter((sub) => sub.selected).length;
      return {
        ...category,
        selected: checked === subcategories.length,
        partial: checked > 0 && checked < subcategories.length,
        subcategories
      };
    });
  const groups =
    req.path === '/'
      ? ['pastel', 'bebida']
          .map((category) => ({
            category,
            title: category === 'pastel' ? 'Pastéis mais vendidos' : 'Bebidas mais vendidas',
            products: (featured[category] || [])
              .map((id) => products.find((product) => product.id === id))
              .filter(Boolean)
              .slice(0, 5)
          }))
          .filter((group) => group.products.length)
      : catalogCategories
          .flatMap((category) =>
            category.subcategories.map((sub) => ({
              category: category.value,
              subcategory: sub.value,
              title: sub.label,
              products: products.filter(
                (product) =>
                  product.category === category.value &&
                  product.subcategory === sub.value &&
                  (!hasFilters || effectiveSubcategories.has(product.subcategory))
              )
            }))
          )
          .filter((group) => group.products.length);
  const view = req.path === '/' ? 'pages/home' : 'pages/catalog/menu';
  res.render(view, {
    headPartial: req.path === '/' ? 'head/home' : 'head/menu',
    groups,
    filterCategories,
    highlight:
      products.find((product) => product.id === 'pastel-da-casa') ||
      products.find((product) => product.id === 'pastel-queijo')
  });
});

module.exports = router;
