const SERVIDOR = `http://${window.location.hostname}:3000`;

// Pega o id da URL: produto.html?id=5  ->  "5"
const id = new URLSearchParams(window.location.search).get('id');

const aviso = document.getElementById('aviso');
const produto = document.getElementById('produto');
const fotoPrincipal = document.getElementById('foto-principal');
const miniaturas = document.getElementById('miniaturas');

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Troca a foto grande pela foto escolhida
function mostrarFoto(imagem, nome) {
  fotoPrincipal.src = SERVIDOR + imagem.medio;
  fotoPrincipal.alt = 'Foto de ' + nome;
}

async function carregarProduto() {
  if (!id) {
    aviso.textContent = 'Produto não informado.';
    return;
  }
  try {
    const resposta = await fetch(`${SERVIDOR}/itens/${id}`);
    if (resposta.status === 404) {
      aviso.textContent = 'Produto não encontrado.';
      return;
    }
    if (!resposta.ok) throw new Error('Servidor respondeu ' + resposta.status);

    const item = await resposta.json();

    document.title = item.nome + ' - Brechó Lar dos Velhinhos';
    document.getElementById('nome').textContent = item.nome;
    document.getElementById('preco').textContent = formatarPreco(item.preco);
    document.getElementById('descricao').textContent = item.descricao;

    if (item.imagens.length > 0) {
      // Começa pela capa (principal); se não tiver, usa a primeira
      const capa = item.imagens.find((img) => img.principal) || item.imagens[0];
      mostrarFoto(capa, item.nome);

      // Miniaturas clicáveis (só aparecem se houver mais de 1 foto)
      if (item.imagens.length > 1) {
        for (const imagem of item.imagens) {
          const mini = document.createElement('img');
          mini.src = SERVIDOR + imagem.thumb;
          mini.alt = 'Miniatura de ' + item.nome;
          mini.width = 80;
          mini.addEventListener('click', () => mostrarFoto(imagem, item.nome));
          miniaturas.appendChild(mini);
        }
      }
    } else {
      fotoPrincipal.remove();
      miniaturas.textContent = 'Sem foto';
    }

    aviso.textContent = '';
    produto.hidden = false;
  } catch (erro) {
    console.error(erro);
    aviso.textContent = 'Não foi possível carregar o produto. Tente de novo mais tarde.';
  }
}

// Botão Comprar: por enquanto não faz nada
// TODO: implementar a compra (carrinho / contato / pagamento)
document.getElementById('botao-comprar').addEventListener('click', () => {});

carregarProduto();
