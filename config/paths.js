const path = require('node:path');
const root = path.resolve(__dirname, '..');
module.exports = {
  root,
  publicDir: path.join(root, 'public'),
  imagesDir: path.join(root, 'public/images'),
  uploadsDir: path.join(root, 'public/uploads'),
  viewsDir: path.join(root, 'views'),
  schemaFile: path.join(root, 'database/schema.sql'),
  catalogFile: path.join(root, 'database/pastelaria-central.sql')
};
