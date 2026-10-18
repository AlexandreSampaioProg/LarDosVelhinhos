const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const itensRoutes = require('./routes/itens');
app.use('/itens', itensRoutes);

const PORT = 3000;

app.get('/', (req, res) => {
    res.send('servidor rodando');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});