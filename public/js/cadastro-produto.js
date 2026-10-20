    const form = document.getElementById('formItem');
    const lista = document.getElementById('listaItens');

    async function carregarItens() {
      const resposta = await fetch('http://localhost:3000/itens');
      const itens = await resposta.json();

      lista.innerHTML = '';
      itens.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${item.nome} - R$ ${item.preco} (${item.status})`;
        lista.appendChild(li);
      });
    }

    form.addEventListener('submit', async (evento) => {
      evento.preventDefault();

      const novoItem = {
        nome: document.getElementById('nome').value,
        descricao: document.getElementById('descricao').value,
        preco: document.getElementById('preco').value,
      };

      await fetch('http://localhost:3000/itens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem),
      });

      form.reset();
      carregarItens();
    });

carregarItens();
  