const express = require('express');
const router = express.Router();
const pool = require('../db');

//POST /itens - Para cadastrar novo item
router.post('/', async (req, res) => {
    try {
        const { nome, descricao, preco } = req.body;
        if (!nome || !preco) {
            return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
        }

        const resultado = await pool.query(
            'INSERT INTO item (nome, descricao, preco) VALUES ($1, $2, $3) RETURNING *',
            [nome, descricao, preco]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar item' });
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