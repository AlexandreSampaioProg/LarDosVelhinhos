const SERVIDOR = `http://${window.location.hostname}:3000`;
const API = `${SERVIDOR}/itens`;
const form = document.getElementById('formItem');
const inputFotos = document.getElementById('fotos');
const previa = document.getElementById('previa');
const mensagem = document.getElementById('mensagem');

const lista = document.getElementById('listaItens');

async function carregarItens() {
  try {
    const resposta = await fetch(API);
    const itens = await resposta.json();

    lista.innerHTML = '';
    for (const item of itens) {
      const elemento = document.createElement(lista.tagName === 'UL' ? 'li' : 'div');

      if (item.capa) {
        const img = document.createElement('img');
        img.src = SERVIDOR + item.capa.thumb;
        img.alt = `Foto de ${item.nome}`;
        img.loading = 'lazy'; // só baixa quando a foto chega perto da tela
        img.width = 100;
        elemento.appendChild(img);
      }

      const preco = Number(item.preco).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
      const texto = document.createElement('span');
      texto.textContent = `${item.nome} - ${preco} - ${item.descricao}`;
      elemento.appendChild(texto);

      lista.appendChild(elemento);
    }
  } catch (erro) {
    lista.textContent = 'Não foi possível carregar a lista.';
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
    // chame aqui a função que recarrega a lista de itens, se você tiver uma
  } catch (erro) {
    mensagem.textContent = 'Servidor fora do ar. Tente de novo.';
  }
});

carregarItens(); // chama aqui a função que recarrega a lista de itens, se você tiver uma
