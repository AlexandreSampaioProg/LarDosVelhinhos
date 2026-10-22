const express = require('express');
const multer = require('multer');
const pool = require('../db');
const { salvarImagem, removerPastaDoItem } = require('../services/imagens');

const router = express.Router();

// ---------- Recebimento das fotos ----------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB por foto
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (tiposPermitidos.includes(file.mimetype)) return cb(null, true);
    cb(new Error('TIPO_INVALIDO'));
  },
});

// Transforma os erros do multer em respostas JSON legíveis
function receberFotos(req, res, next) {
  upload.array('fotos', 4)(req, res, (erro) => {
    if (!erro) return next();

    if (erro.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ erro: 'Cada foto pode ter no máximo 10 MB.' });
    }
    if (erro.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ erro: 'Envie no máximo 4 fotos.' });
    }
    if (erro.message === 'TIPO_INVALIDO') {
      return res.status(400).json({ erro: 'Use apenas fotos JPG, PNG ou WebP.' });
    }

    console.error(erro);
    res.status(500).json({ erro: 'Erro ao receber as fotos.' });
  });
}

// ---------- Apoio ----------

// Monta os endereços das duas versões de uma foto
function urlsDaImagem(itemId, arquivo) {
  const base = `/uploads/itens/${itemId}/${arquivo}`;
  return { thumb: `${base}-thumb.webp`, medio: `${base}-medio.webp` };
}

// ---------- Rotas ----------

// Lista: cada item vem com a capa (ou null, se não tiver foto)
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT i.*, ic.arquivo AS capa
      FROM item i
      LEFT JOIN item_imagem ic ON ic.item_id = i.id AND ic.principal = true
      ORDER BY i.id DESC
    `);

    const itens = resultado.rows.map(({ capa, ...item }) => ({
      ...item,
      capa: capa ? urlsDaImagem(item.id, capa) : null,
    }));

    res.json(itens);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar os itens.' });
  }
});

// Um item com todas as fotos
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'Id inválido.' });
  }

  try {
    const item = await pool.query('SELECT * FROM item WHERE id = $1', [id]);
    if (item.rows.length === 0) {
      return res.status(404).json({ erro: 'Item não encontrado.' });
    }

    const imagens = await pool.query(
      'SELECT arquivo, principal FROM item_imagem WHERE item_id = $1 ORDER BY ordem',
      [id]
    );

    res.json({
      ...item.rows[0],
      imagens: imagens.rows.map((img) => ({
        ...urlsDaImagem(id, img.arquivo),
        principal: img.principal,
      })),
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar o item.' });
  }
});

// Cadastro: item + fotos, tudo ou nada
router.post('/', receberFotos, async (req, res) => {
  const { nome, descricao } = req.body;
  const preco = Number(req.body.preco);

  if (!nome || !nome.trim() || nome.length > 30 || !Number.isFinite(preco) || preco < 0) {
    return res.status(400).json({ erro: 'Nome (até 30 caracteres) e preço são obrigatórios.' });
  }

  const fotos = req.files || [];
  const client = await pool.connect();
  let itemId = null;

  try {
    await client.query('BEGIN');

    const novoItem = await client.query(
      'INSERT INTO item (nome, descricao, preco) VALUES ($1, $2, $3) RETURNING *',
      [nome.trim(), descricao || '', preco]
    );
    const item = novoItem.rows[0];
    itemId = item.id;

    const imagens = [];
    for (let i = 0; i < fotos.length; i++) {
      const arquivo = await salvarImagem(fotos[i].buffer, fotos[i].mimetype, itemId);
      const nova = await client.query(
        `INSERT INTO item_imagem (item_id, arquivo, ordem, principal)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [itemId, arquivo, i, i === 0] // a primeira foto é a capa
      );
      imagens.push(nova.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...item, imagens });
  } catch (erro) {
    await client.query('ROLLBACK').catch(() => {});
    if (itemId) await removerPastaDoItem(itemId); // não deixa fotos órfãs no disco

    if (erro.code === 'IMAGEM_INVALIDA') {
      return res.status(400).json({ erro: erro.message });
    }

    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar o item.' });
  } finally {
    client.release();
  }
});

module.exports = router;