const SERVIDOR = `http://${window.location.hostname}:3000`;
const API = `${SERVIDOR}/itens`;
const POR_PAGINA = 20;

const vitrine = document.getElementById('vitrine');
const aviso = document.getElementById('aviso');
const botaoMais = document.getElementById('maisProdutos');

let todosItens = [];
let itensOriginais = [];
let exibidos = 0;

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function resumir(texto, limite = 80) {
  const limpo = (texto || '').trim();
  if (limpo.length <= limite) return limpo;
  return limpo.slice(0, limite).trimEnd() + '…';
}

function criarCard(item) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = 'produto.html?id=' + item.id;

  const moldura = document.createElement('div');
  moldura.className = 'card-foto';

  if (item.capa) {
    const img = document.createElement('img');
    img.src = SERVIDOR + item.capa.thumb;
    img.alt = 'Foto de ' + item.nome;
    img.width = 400;
    img.height = 400;
    img.loading = 'lazy';
    img.decoding = 'async';
    moldura.appendChild(img);
  } else {
    moldura.classList.add('sem-foto');
    moldura.textContent = 'Sem foto';
  }

  const corpo = document.createElement('div');
  corpo.className = 'card-corpo';

  const nome = document.createElement('h3');
  nome.className = 'card-nome';
  nome.textContent = item.nome;

  const descricao = document.createElement('p');
  descricao.className = 'card-descricao';
  descricao.textContent = resumir(item.descricao);

  const preco = document.createElement('strong');
  preco.className = 'card-preco';
  preco.textContent = formatarPreco(item.preco);

  corpo.append(nome, descricao, preco);
  card.append(moldura, corpo);
  return card;
}

function atualizarRodape() {
  const faltam = todosItens.length - exibidos;
  botaoMais.hidden = faltam <= 0;
  botaoMais.textContent = `Mais produtos (+${Math.min(POR_PAGINA, faltam)})`;
}

function mostrarMais() {
  const lote = todosItens.slice(exibidos, exibidos + POR_PAGINA);
  for (const item of lote) {
    vitrine.appendChild(criarCard(item));
  }
  exibidos += lote.length;
  atualizarRodape();
}

async function carregarVitrine() {
  aviso.textContent = 'Carregando produtos...';
  try {
    const resposta = await fetch(API);
    if (!resposta.ok) throw new Error('Servidor respondeu ' + resposta.status);
    todosItens = await resposta.json();
    itensOriginais = [...todosItens];

    aviso.textContent = '';
    if (todosItens.length === 0) {
      aviso.textContent = 'Nenhum produto disponível no momento.';
      return;
    }
    mostrarMais();
  } catch (erro) {
    console.error(erro);
    aviso.textContent = 'Não foi possível carregar os produtos. Tente de novo mais tarde.';
  }
}

botaoMais.addEventListener('click', mostrarMais);
carregarVitrine();

const inputBusca = document.querySelector('input');
if (inputBusca) {
  inputBusca.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase().trim();
    todosItens = itensOriginais.filter(item => 
      item.nome.toLowerCase().includes(termo) || 
      (item.descricao && item.descricao.toLowerCase().includes(termo))
    );
    vitrine.innerHTML = '';
    exibidos = 0;
    if (todosItens.length === 0) {
      aviso.textContent = 'Nenhum produto encontrado.';
      botaoMais.hidden = true;
    } else {
      aviso.textContent = '';
      mostrarMais();
    }
  });
}