// ========================================
// SISTEMA DE COMPRAS COLABORATIVO
// ========================================

class ListaComprasColaborativa {
  constructor() {
<<<<<<< HEAD
    this.produtosKey = "lista_compras_produtos";
=======
    this.produtosKey = 'lista_compras_produtos';
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
    this.init();
  }

  init() {
    this.carregarProdutos();
    this.renderizarCards();
    this.adicionarEventListeners();
<<<<<<< HEAD

    // Sincronizar com abas abertas
    window.addEventListener("storage", () => {
=======
    
    // Sincronizar com abas abertas
    window.addEventListener('storage', () => {
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
      this.carregarProdutos();
      this.renderizarCards();
    });

    // Sincronizar a cada 500ms localmente
    setInterval(() => {
      this.renderizarCards();
    }, 500);
  }

  carregarProdutos() {
    const dados = localStorage.getItem(this.produtosKey);
    if (!dados) {
      this.inicializarProdutos();
    }
  }

  inicializarProdutos() {
<<<<<<< HEAD
    const cards = document.querySelectorAll(".card-produto");
    const produtos = {};

    cards.forEach((card, index) => {
      const numero = card.querySelector(".numero").textContent;
      const nome = card.querySelector("h2").textContent;
      const quantidadeTexto =
        card.querySelector(".quantidade strong").textContent;
=======
    const cards = document.querySelectorAll('.card-produto');
    const produtos = {};

    cards.forEach((card, index) => {
      const numero = card.querySelector('.numero').textContent;
      const nome = card.querySelector('h2').textContent;
      const quantidadeTexto = card.querySelector('.quantidade strong').textContent;
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
      const quantidadeOriginal = parseInt(quantidadeTexto);

      produtos[numero] = {
        numero,
        nome,
        quantidadeOriginal,
        quantidade: quantidadeOriginal,
        pegou: false,
<<<<<<< HEAD
        usuario: null,
=======
        usuario: null
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
      };
    });

    localStorage.setItem(this.produtosKey, JSON.stringify(produtos));
  }

  getProdutos() {
    const dados = localStorage.getItem(this.produtosKey);
    return dados ? JSON.parse(dados) : {};
  }

  salvarProdutos(produtos) {
    localStorage.setItem(this.produtosKey, JSON.stringify(produtos));
  }

  adicionarEventListeners() {
<<<<<<< HEAD
    const cards = document.querySelectorAll(".card-produto");

    cards.forEach((card) => {
      const numero = card.querySelector(".numero").textContent;

      // Botão de adicionar
      let btnAdicionar = card.querySelector(".btn-adicionar");
      if (!btnAdicionar) {
        btnAdicionar = document.createElement("button");
        btnAdicionar.className = "btn-adicionar";
        btnAdicionar.textContent = "+";
        card.appendChild(btnAdicionar);
      }

      btnAdicionar.addEventListener("click", () => {
=======
    const cards = document.querySelectorAll('.card-produto');

    cards.forEach((card) => {
      const numero = card.querySelector('.numero').textContent;

      // Botão de adicionar
      let btnAdicionar = card.querySelector('.btn-adicionar');
      if (!btnAdicionar) {
        btnAdicionar = document.createElement('button');
        btnAdicionar.className = 'btn-adicionar';
        btnAdicionar.textContent = '+';
        card.appendChild(btnAdicionar);
      }

      btnAdicionar.addEventListener('click', () => {
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
        this.adicionarProduto(numero);
      });

      // Botão de remover
<<<<<<< HEAD
      let btnRemover = card.querySelector(".btn-remover");
      if (!btnRemover) {
        btnRemover = document.createElement("button");
        btnRemover.className = "btn-remover";
        btnRemover.textContent = "−";
        card.appendChild(btnRemover);
      }

      btnRemover.addEventListener("click", () => {
=======
      let btnRemover = card.querySelector('.btn-remover');
      if (!btnRemover) {
        btnRemover = document.createElement('button');
        btnRemover.className = 'btn-remover';
        btnRemover.textContent = '−';
        card.appendChild(btnRemover);
      }

      btnRemover.addEventListener('click', () => {
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
        this.removerProduto(numero);
      });
    });
  }

  adicionarProduto(numero) {
    const produtos = this.getProdutos();
    const produto = produtos[numero];

    if (!produto) return;

    // Se o produto foi zerado, não permite adicionar
    if (produto.quantidade === 0 && produto.pegou) {
      console.log(`Produto ${numero} já foi completamente pego!`);
      return;
    }

    if (produto.quantidade > 0) {
      produto.quantidade--;
      produto.pegou = true;
      produto.usuario = this.gerarIDUsuario();

      this.salvarProdutos(produtos);
      this.renderizarCards();
    }
  }

  removerProduto(numero) {
    const produtos = this.getProdutos();
    const produto = produtos[numero];

    if (!produto) return;

    if (produto.quantidade < produto.quantidadeOriginal) {
      produto.quantidade++;

      this.salvarProdutos(produtos);
      this.renderizarCards();
    }
  }

  renderizarCards() {
    const produtos = this.getProdutos();
<<<<<<< HEAD
    const cards = document.querySelectorAll(".card-produto");

    cards.forEach((card) => {
      const numero = card.querySelector(".numero").textContent;
=======
    const cards = document.querySelectorAll('.card-produto');

    cards.forEach((card) => {
      const numero = card.querySelector('.numero').textContent;
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
      const produto = produtos[numero];

      if (!produto) return;

      // Remover classe anterior
<<<<<<< HEAD
      card.classList.remove("pegando", "completo");

      const btnAdicionar = card.querySelector(".btn-adicionar");
      const btnRemover = card.querySelector(".btn-remover");
      const quantidadeSpan = card.querySelector(".quantidade strong");
=======
      card.classList.remove('pegando', 'completo');

      const btnAdicionar = card.querySelector('.btn-adicionar');
      const btnRemover = card.querySelector('.btn-remover');
      const quantidadeSpan = card.querySelector('.quantidade strong');
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2

      // Atualizar quantidade exibida
      quantidadeSpan.textContent = `${produto.quantidade} un`;

      if (produto.quantidade === 0 && produto.pegou) {
        // Produto completamente pego
<<<<<<< HEAD
        card.classList.add("completo");
=======
        card.classList.add('completo');
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
        btnAdicionar.disabled = true;
        btnRemover.disabled = false;
      } else if (produto.quantidade < produto.quantidadeOriginal) {
        // Produto sendo pegado
<<<<<<< HEAD
        card.classList.add("pegando");
=======
        card.classList.add('pegando');
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
        btnAdicionar.disabled = false;
        btnRemover.disabled = false;
      } else {
        // Produto intacto
        btnAdicionar.disabled = false;
        btnRemover.disabled = true;
      }
    });
  }

  gerarIDUsuario() {
<<<<<<< HEAD
    let usuarioID = sessionStorage.getItem("usuario_id");
    if (!usuarioID) {
      usuarioID = "user_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("usuario_id", usuarioID);
=======
    let usuarioID = sessionStorage.getItem('usuario_id');
    if (!usuarioID) {
      usuarioID = 'user_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('usuario_id', usuarioID);
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
    }
    return usuarioID;
  }

  limparTudo() {
<<<<<<< HEAD
    if (confirm("Deseja resetar a lista de compras?")) {
=======
    if (confirm('Deseja resetar a lista de compras?')) {
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
      localStorage.removeItem(this.produtosKey);
      this.inicializarProdutos();
      this.renderizarCards();
    }
  }
}

// Inicializar quando o DOM estiver pronto
<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", () => {
  const lista = new ListaComprasColaborativa();

  // Adicionar botão de reset no rodapé (opcional)
  const rodape = document.querySelector(".rodape");
  if (rodape) {
    const btnReset = document.createElement("button");
    btnReset.textContent = "Resetar Lista";
    btnReset.className = "btn-reset-lista";
    btnReset.addEventListener("click", () => lista.limparTudo());
=======
document.addEventListener('DOMContentLoaded', () => {
  const lista = new ListaComprasColaborativa();

  // Adicionar botão de reset no rodapé (opcional)
  const rodape = document.querySelector('.rodape');
  if (rodape) {
    const btnReset = document.createElement('button');
    btnReset.textContent = 'Resetar Lista';
    btnReset.className = 'btn-reset-lista';
    btnReset.addEventListener('click', () => lista.limparTudo());
>>>>>>> 37632bbbdc88612f3a1fe8757e57c0f231884af2
    rodape.appendChild(btnReset);
  }
});
