const SERVIDOR = `http://${window.location.hostname}:3000`;
const API = `${SERVIDOR}/itens`;
const form = document.getElementById('formItem');
const inputFotos = document.getElementById('fotos');
const previa = document.getElementById('previa');
const mensagem = document.getElementById('mensagem');
const lista = document.getElementById('listaItens');
const infoLista = document.getElementById('infoLista');
const botaoMais = document.getElementById('maisItens'); 
const POR_PAGINA = 20; 

let todosItens = [];   // todos os itens que o servidor devolveu
let exibidos = 0;      // quantos já aparecem na grade
let carregando = false; // evita cliques repetidos enquanto busca as fotos



function criarCarrossel(fotos, nome) {
  const caixa = document.createElement('div');
  caixa.className = 'carrossel';

  // sem foto: só uma caixa com o aviso
  if (fotos.length === 0) {
    caixa.classList.add('sem-foto');
    caixa.textContent = 'Sem foto';
    return caixa;
  }

  let atual = 0; // índice da foto que está aparecendo

  const img = document.createElement('img');
  img.className = 'carrossel-foto';
  img.loading = 'lazy';
  caixa.appendChild(img);

  const contador = document.createElement('span');
  contador.className = 'carrossel-contador';

  function mostrar() {
    img.src = fotos[atual];
    img.alt = `Foto ${atual + 1} de ${fotos.length} - ${nome}`;
    contador.textContent = `${atual + 1}/${fotos.length}`;
  }

  // com uma foto só não há o que navegar: sem setas
  if (fotos.length > 1) {
    const anterior = document.createElement('button');
    anterior.type = 'button';
    anterior.className = 'seta anterior';
    anterior.textContent = '‹';
    anterior.setAttribute('aria-label', 'Foto anterior');
    anterior.addEventListener('click', () => {
      atual = (atual - 1 + fotos.length) % fotos.length;
      mostrar();
    });

    const proxima = document.createElement('button');
    proxima.type = 'button';
    proxima.className = 'seta proxima';
    proxima.textContent = '›';
    proxima.setAttribute('aria-label', 'Próxima foto');
    proxima.addEventListener('click', () => {
      atual = (atual + 1) % fotos.length;
      mostrar();
    });

    caixa.append(anterior, proxima, contador);
  }

  mostrar();
  return caixa;
}


// Monta o cartão de um produto (por enquanto mostra só a primeira foto)
function criarCartao(item, fotos) {
  const cartao = document.createElement('li');
  cartao.className = 'cartao';

cartao.appendChild(criarCarrossel(fotos, item.nome));

  const nome = document.createElement('strong');
  nome.textContent = item.nome;

  const preco = document.createElement('div');
  preco.textContent = Number(item.preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const descricao = document.createElement('div');
  descricao.textContent = item.descricao || '';

  cartao.append(nome, preco, descricao);
  return cartao;
}

// Busca todas as fotos de um item (GET /itens/:id) e devolve um array de endereços
async function buscarFotos(item) {
  try {
    const resposta = await fetch(`${API}/${item.id}`);
    if (!resposta.ok) throw new Error('Servidor respondeu ' + resposta.status);
    const completo = await resposta.json();
    return completo.imagens.map((img) => SERVIDOR + img.medio);
  } catch (erro) {
    console.error(erro);
    return item.capa ? [SERVIDOR + item.capa.medio] : [];
  }
}

function atualizarRodape() {
  const faltam = todosItens.length - exibidos;
  infoLista.textContent = `Mostrando ${exibidos} de ${todosItens.length} produtos`;
  botaoMais.hidden = faltam <= 0;
  botaoMais.disabled = false;
  botaoMais.textContent = `Mais produtos (+${Math.min(POR_PAGINA, faltam)})`;
}

async function mostrarMais() {
  if (carregando) return;
  carregando = true;
  botaoMais.disabled = true;
  botaoMais.textContent = 'Carregando...';

  // só os próximos 20, a partir de onde parou
  const lote = todosItens.slice(exibidos, exibidos + POR_PAGINA);

  // busca as fotos só desses itens, ao mesmo tempo
  const fotosDoLote = await Promise.all(lote.map(buscarFotos));

  lote.forEach((item, i) => {
    lista.appendChild(criarCartao(item, fotosDoLote[i]));
  });

  exibidos += lote.length;
  carregando = false;
  atualizarRodape();
}

async function carregarItens() {
  try {
    const resposta = await fetch(API);
    if (!resposta.ok) throw new Error('Servidor respondeu ' + resposta.status);
    todosItens = await resposta.json();

    exibidos = 0;
    carregando = false;
    lista.replaceChildren();
    infoLista.textContent = '';

    if (todosItens.length === 0) {
      infoLista.textContent = 'Nenhum item cadastrado ainda.';
      botaoMais.hidden = true;
      return;
    }

    await mostrarMais(); // desenha só os 20 primeiros
  } catch (erro) {
    console.error(erro);
    lista.replaceChildren();
    botaoMais.hidden = true;
    infoLista.textContent = 'Não foi possível carregar a lista.';
  }
}

inputFotos.addEventListener('change', () => {
  previa.innerHTML = '';
  mensagem.textContent = '';

  if (inputFotos.files.length > 4) {
    mensagem.textContent = 'Escolha no máximo 4 fotos.';
    inputFotos.value = '';
    return;
  }

  for (const arquivo of inputFotos.files) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(arquivo);
    img.alt = 'Prévia da foto';
    img.style.width = '100px';
    previa.appendChild(img);
  }
});

// Envio do formulário
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensagem.textContent = '';

  const dados = new FormData();
  dados.append('nome', document.getElementById('nome').value);
  dados.append('descricao', document.getElementById('descricao').value);
  dados.append('preco', document.getElementById('preco').value);
  for (const arquivo of inputFotos.files) {
    dados.append('fotos', arquivo); // mesmo nome do upload.array('fotos', 4)
  }

  try {
    // Sem header Content-Type: o navegador monta o multipart sozinho
    const resposta = await fetch(API, { method: 'POST', body: dados });
    const corpo = await resposta.json();

    if (!resposta.ok) {
      mensagem.textContent = corpo.erro || 'Não foi possível cadastrar.';
      return;
    }

    form.reset();
    previa.innerHTML = '';
    mensagem.textContent = 'Item cadastrado!';
    carregarItens(); // recarrega a lista: o item novo aparece primeiro
  } catch (erro) {
    mensagem.textContent = 'Servidor fora do ar. Tente de novo.';
  }
});

botaoMais.addEventListener('click', mostrarMais);
carregarItens();