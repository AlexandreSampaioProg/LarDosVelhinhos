const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const { salvarImagem, removerPastaDoItem } = require('../services/imagens');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (permitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('TIPO_INVALIDO'));
    }
  },
});

function receberFotos(req, res, next) {
  upload.array('fotos', 4)(req, res, (erro) => {
    if (!erro) return next();

    if (erro instanceof multer.MulterError) {
      const mensagens = {
        LIMIT_FILE_SIZE: 'Cada foto pode ter no máximo 10 MB',
        LIMIT_UNEXPECTED_FILE: 'Envie no máximo 4 fotos',
      };
      return res
        .status(400)
        .json({ erro: mensagens[erro.code] || 'Erro no envio das fotos' });
    }

    if (erro.message === 'TIPO_INVALIDO') {
      return res.status(400).json({ erro: 'Use apenas fotos JPG, PNG ou WebP' });
    }

    next(erro);
  });
}



//POST /itens - Para cadastrar novo item
// POST /itens - cadastrar um item, com até 4 fotos
router.post('/', receberFotos, async (req, res) => {
  const { nome, preco } = req.body;
  const descricao = req.body.descricao || '';
  const fotos = req.files || [];

  if (!nome || !preco) {
    return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
  }
  if (nome.length > 30) {
    return res.status(400).json({ erro: 'O nome pode ter no máximo 30 caracteres' });
  }
  if (!Number.isFinite(Number(preco)) || Number(preco) < 0) {
    return res.status(400).json({ erro: 'Preço inválido' });
  }

  const client = await pool.connect();
  let itemId = null;

  try {
    await client.query('BEGIN');

    const itemResultado = await client.query(
      'INSERT INTO item (nome, descricao, preco) VALUES ($1, $2, $3) RETURNING *',
      [nome, descricao, preco]
    );
    const item = itemResultado.rows[0];
    itemId = item.id;

    const imagens = [];
    for (let i = 0; i < fotos.length; i++) {
      const arquivo = await salvarImagem(fotos[i].buffer, fotos[i].mimetype, itemId);

      const imagemResultado = await client.query(
        `INSERT INTO item_imagem (item_id, arquivo, ordem, principal)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [itemId, arquivo, i, i === 0]
      );
      imagens.push(imagemResultado.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...item, imagens });
  } catch (erro) {
    await client.query('ROLLBACK').catch(() => {});
    if (itemId) await removerPastaDoItem(itemId);
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar item' });
  } finally {
    client.release();
  }
});

// GET /itens - Para listar todos os itens
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM item ORDER BY id DESC');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar itens' });
  }
});

module.exports = router;