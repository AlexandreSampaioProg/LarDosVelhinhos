const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const RAIZ_UPLOADS = path.join(__dirname, '..', 'uploads', 'itens');

const VERSOES = [
  { sufixo: 'thumb', largura: 400, qualidade: 75 }, // listagem
  { sufixo: 'medio', largura: 900, qualidade: 80 }, // página do produto
];

async function salvarImagem(buffer, mimetype, itemId) {
  const pasta = path.join(RAIZ_UPLOADS, String(itemId));
  await fs.mkdir(pasta, { recursive: true });
  const base = crypto.randomUUID();
  
  let versoes;
  try {
    versoes = await Promise.all(
      VERSOES.map(async (v) => ({
        arquivo: `${base}-${v.sufixo}.webp`,
        dados: await sharp(buffer, { limitInputPixels: 40_000_000 })
          .rotate() // corrige a orientação do celular (EXIF)
          .resize({ width: v.largura, withoutEnlargement: true })
          .webp({ quality: v.qualidade }) // o sharp já remove os metadados (GPS)
          .toBuffer(),
      }))
    );
  } catch (erro) {
    const e = new Error('Uma das fotos não é uma imagem válida.');
    e.code = 'IMAGEM_INVALIDA';
    throw e;
  }
  for (const v of versoes) {
    await fs.writeFile(path.join(pasta, v.arquivo), v.dados);
  }

  return base; // vai para a coluna "arquivo"
}    

async function removerPastaDoItem(itemId) {
  await fs.rm(path.join(RAIZ_UPLOADS, String(itemId)), { recursive: true, force: true });
}

module.exports = { salvarImagem, removerPastaDoItem };