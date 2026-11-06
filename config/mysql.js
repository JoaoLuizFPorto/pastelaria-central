const fs = require('node:fs');
const path = require('node:path');
const envFile = path.join(__dirname, '../.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
const database = process.env.DB_NAME || 'pastelaria_central_v7';
if (!/^[a-zA-Z0-9_]+$/.test(database))
  throw new Error('DB_NAME deve conter apenas letras, números e underscore.');
module.exports = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: true,
  decimalNumbers: true,
  waitForConnections: true,
  connectionLimit: 5
};
