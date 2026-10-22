const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const RAIZ_UPLOADS = path.join(__dirname, '..', 'uploads', 'itens');

const EXTENSOES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

async function salvarImagem(buffer, mimetype, itemId) {
  const pasta = path.join(RAIZ_UPLOADS, String(itemId));
  await fs.mkdir(pasta, { recursive: true });

  const nomeArquivo = crypto.randomUUID() + EXTENSOES[mimetype];
  await fs.writeFile(path.join(pasta, nomeArquivo), buffer);

  return nomeArquivo;
}

async function removerPastaDoItem(itemId) {
  await fs.rm(path.join(RAIZ_UPLOADS, String(itemId)), {
    recursive: true,
    force: true,
  });
}

module.exports = { salvarImagem, removerPastaDoItem };