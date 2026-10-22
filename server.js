const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());


const itensRoutes = require('./routes/itens');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/itens', itensRoutes);

const PORT = 3000;

app.get('/', (req, res) => {
    res.send('servidor rodando');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});