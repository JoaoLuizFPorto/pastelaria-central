const fs = require('node:fs');
const path = require('node:path');
const paths = require('../config/paths');
const aliases = require('../config/asset-aliases.json');
const frontend = require('../config/frontend.json');
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
    );
const localPaths = new Set(
  walk(paths.imagesDir)
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .map((file) => '/images/' + path.relative(paths.imagesDir, file).split(path.sep).join('/'))
);
const localImages = [...localPaths].map((file) => file.slice('/images/'.length));
function canonicalImagePath(value) {
  try {
    return aliases[decodeURI(value)] || value;
  } catch {
    return value;
  }
}

function resolveLocalImage(value) {
  if (typeof value !== 'string') return null;
  const candidate = canonicalImagePath(value.startsWith('/') ? value : '/img/' + value);
  if (localPaths.has(candidate)) return candidate;
  const current = '/images/' + value;
  return localPaths.has(current) ? current : null;
}

function legacyAssets(req, res, next) {
  let pathname;
  try {
    pathname = decodeURIComponent(req.path);
  } catch {
    return next();
  }
  if (pathname === '/js/shop.js') {
    const source = frontend
      .map((file) => fs.readFileSync(path.join(paths.publicDir, file.slice(1)), 'utf8'))
      .join('\n');
    return res.type('application/javascript').send(source);
  }
  const target = aliases[pathname];
  if (target) return res.redirect(301, target + req.url.slice(req.path.length));
  next();
}

async function migrateProductImages(db) {
  for (const [from, to] of Object.entries(aliases)) {
    if (from.startsWith('/img/'))
      await db.prepare('UPDATE products SET image=? WHERE image=?').run(to, from);
  }
}
module.exports = {
  aliases,
  localImages,
  isLocalImage: (image) => localPaths.has(image),
  resolveLocalImage,
  canonicalImagePath,
  legacyAssets,
  migrateProductImages
};
