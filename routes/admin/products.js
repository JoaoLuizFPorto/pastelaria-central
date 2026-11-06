// Cadastro e gerenciamento dos produtos pelo administrador.

const express = require('express');
const router = express.Router();
const { db, transaction } = require('../../config/database');
const { money, findProduct } = require('../../models/product');
const {
  categories: catalogCategories,
  categories,
  validSubcategory
} = require('../../catalog/categories');
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { requireAdmin } = require('../../lib/session');
const { uploadProductImage } = require('../../lib/product-images');
const { localImages, resolveLocalImage, isLocalImage } = require('../../lib/assets');


router.post('/admin/imagens', uploadProductImage);


router.post('/admin/produtos/:id/excluir', async (req, res) => {
  const changed = await transaction(async () => {
    const product = await db
      .prepare('SELECT id, deleted FROM products WHERE id=? FOR UPDATE')
      .get(req.params.id);
    if (!product || product.deleted) return false;
    await db
      .prepare('UPDATE products SET active=0, deleted=1, home_rank=NULL WHERE id=?')
      .run(product.id);
    await db.prepare('DELETE FROM cart_items WHERE product_id=?').run(product.id);
    await db.prepare('DELETE FROM favorites WHERE product_id=?').run(product.id);
    return true;
  });
  if (!changed) return res.renderError(404);
  res.redirect(303, '/admin/produtos/registrados?excluido=1');
});


router.post('/admin/produtos/:id/restaurar', async (req, res) => {
  const changed = await transaction(async () => {
    const product = await db
      .prepare('SELECT id, deleted FROM products WHERE id=? FOR UPDATE')
      .get(req.params.id);
    if (!product || !product.deleted) return false;
    await db
      .prepare('UPDATE products SET deleted=0, active=0, home_rank=NULL WHERE id=?')
      .run(product.id);
    return true;
  });
  if (!changed) return res.renderError(404);
  res.redirect(303, '/admin/produtos/excluidos?restaurado=1');
});


router.get('/admin/produtos', (req, res) =>
  res.render('admin/products/index', { headPartial: 'head/admin' })
);
function productInfo(product) {
  const category = categories.find((entry) => entry.value === product.category);
  return {
    ...product,
    categoryLabel: category?.label || product.category,
    subcategoryLabel:
      category?.subcategories.find((entry) => entry.value === product.subcategory)?.label ||
      product.subcategory,
    priceDisplay: money(product.price),
    statusLabel: product.deleted ? 'Excluído' : product.active ? 'Ativo' : 'Inativo',
    statusKey: product.deleted ? 'deleted' : product.active ? 'active' : 'inactive'
  };
}


router.get(['/admin/produtos/registrados', '/admin/produtos/excluidos'], async (req, res) => {
  const excluded = req.path.endsWith('/excluidos');
  const products = (
    await db
      .prepare('SELECT * FROM products WHERE deleted=? ORDER BY category, name, id')
      .all(excluded ? 1 : 0)
  ).map(productInfo);
  res.render('admin/section', {
    headPartial: 'head/admin',
    title: excluded ? 'Produtos Excluídos' : 'Produtos registrados',
    products,
    productSection: true,
    excluded,
    deleted: req.query.excluido === '1',
    restored: req.query.restaurado === '1',
    statusChanged: req.query.salvo === '1'
  });
});


router.get('/admin/produtos/:id/detalhes', async (req, res) => {
  const product = await findProduct(req.params.id);
  if (!product) return res.renderError(404);
  res.render('admin/products/details', {
    headPartial: 'head/admin',
    product: productInfo(product)
  });
});


router.post('/admin/produtos/:id/situacao', async (req, res) => {
  if (!['active', 'inactive'].includes(req.body.situation)) return res.renderError(400);
  const changed = await transaction(async () => {
    const product = await db
      .prepare('SELECT id, deleted FROM products WHERE id=? FOR UPDATE')
      .get(req.params.id);
    if (!product || product.deleted) return false;
    const active = req.body.situation === 'active';
    await db.prepare('UPDATE products SET active=? WHERE id=?').run(active ? 1 : 0, product.id);
    if (!active) {
      await db.prepare('DELETE FROM cart_items WHERE product_id=?').run(product.id);
      await db.prepare('DELETE FROM favorites WHERE product_id=?').run(product.id);
    }
    return true;
  });
  if (!changed) return res.renderError(404);
  res.redirect(303, '/admin/produtos/registrados?salvo=1');
});
function productForm(res, status = 200, error, values = {}) {
  const categories = catalogCategories.map((entry) => ({
    ...entry,
    selected: entry.value === values.category
  }));
  const subcategories = catalogCategories.flatMap((entry) =>
    entry.subcategories.map((sub) => ({
      ...sub,
      category: entry.value,
      selected: sub.value === values.subcategory
    }))
  );
  const situations = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' }
  ].map((entry) => ({ ...entry, selected: entry.value === (values.situation || 'active') }));
  res.status(status).render('admin/products/form', {
    headPartial: 'head/product-form',
    error,
    values,
    categories,
    subcategories,
    situations,
    localImages: localImages.map((name) => ({ name, selected: name === values.localImage }))
  });
}


router.get('/admin/produtos/novo', requireAdmin, (req, res) => productForm(res));


router.post('/admin/produtos/novo', requireAdmin, async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const category = req.body.category;
  const subcategory = req.body.subcategory;
  const situation = req.body.situation;
  const rawPrice = typeof req.body.price === 'string' ? req.body.price.replace(',', '.') : '';
  const price = Math.round(Number(rawPrice) * 100);
  const uploadedImage = typeof req.body.uploadedImage === 'string' ? req.body.uploadedImage : '';
  const image =
    typeof req.body.imageUrl === 'string' && req.body.imageUrl.trim()
      ? req.body.imageUrl.trim()
      : uploadedImage ||
        (req.body.localImage
          ? resolveLocalImage(req.body.localImage) || ''
          : '/images/placeholders/product-unavailable.svg');
  const values = {
    name,
    description,
    price: req.body.price,
    category,
    subcategory,
    situation,
    localImage: req.body.localImage,
    imageUrl: req.body.imageUrl,
    uploadedImage
  };
  const fail = (error) => productForm(res, 400, error, values);
  if (name.length < 2 || name.length > 120)
    return fail('Informe um nome entre 2 e 120 caracteres.');
  if (!validSubcategory(category, subcategory))
    return fail('Selecione uma categoria e uma subcategoria compatíveis.');
  if (!['active', 'inactive'].includes(situation))
    return fail('Selecione uma situação válida: Ativo ou Inativo.');
  if (
    !/^\d{1,5}(\.\d{1,2})?$/.test(rawPrice) ||
    !Number.isSafeInteger(price) ||
    price < 1 ||
    price > 9999999
  )
    return fail('Informe um preço positivo com até duas casas decimais.');
  if (description.length < 2 || description.length > 2000)
    return fail('Informe uma descrição entre 2 e 2000 caracteres.');
  let validImage = image === '/images/placeholders/product-unavailable.svg' || isLocalImage(image);
  if (
    /^\/uploads\/[a-f0-9-]{36}\.webp$/.test(image) &&
    fs.existsSync(path.join(__dirname, '../../public', image.slice(1)))
  )
    validImage = true;
  try {
    if (new URL(image).protocol === 'https:') validImage = true;
  } catch {}
  if (!validImage || image.length > 1000)
    return fail('Escolha uma imagem disponível ou informe uma URL HTTPS válida.');
  const id = 'produto-' + randomUUID();
  await db
    .prepare(
      'INSERT INTO products (id, name, price, image, category, subcategory, description, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      id,
      name,
      price,
      image,
      category,
      subcategory,
      description,
      situation === 'active' ? 1 : 0
    );
  res.redirect(
    303,
    situation === 'active' ? '/singleProductTab?produto=' + id : `/admin/produtos/${id}/detalhes`
  );
});

module.exports = router;
