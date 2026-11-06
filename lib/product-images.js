const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const sharp = require('sharp');
const directory = require('../config/paths').uploadsDir;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 }
}).single('image');
function uploadProductImage(req, res) {
  upload(req, res, async (error) => {
    if (error)
      return res
        .status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
        .json({ message: 'Envie uma única imagem de até 5 MB.' });
    if (!req.file) return res.status(400).json({ message: 'Selecione uma imagem.' });
    let result;
    try {
      const input = sharp(req.file.buffer, { limitInputPixels: 16000000 });
      const metadata = await input.metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format))
        throw new Error('Formato não permitido');
      result = await input
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      return res
        .status(400)
        .json({ message: 'Imagem inválida. Use JPG, PNG ou WebP de até 16 megapixels.' });
    }
    try {
      await fs.mkdir(directory, { recursive: true });
      const filename = randomUUID() + '.webp';
      await fs.writeFile(path.join(directory, filename), result, { flag: 'wx' });
      res.status(201).json({ image: '/uploads/' + filename });
    } catch {
      res.status(500).json({ message: 'Não foi possível salvar a imagem. Tente novamente.' });
    }
  });
}
module.exports = { uploadProductImage };
