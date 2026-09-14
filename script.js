// ========================================
// SISTEMA DE COMPRAS COLABORATIVO
// ========================================

class ListaComprasColaborativa {
  constructor() {
    this.produtosKey = "lista_compras_produtos";
    this.init();
  }

  init() {
    this.carregarProdutos();
    this.renderizarCards();
    this.adicionarEventListeners();

    // Sincronizar com abas abertas
    window.addEventListener("storage", () => {
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
    const cards = document.querySelectorAll(".card-produto");
    const produtos = {};

    cards.forEach((card, index) => {
      const numero = card.querySelector(".numero").textContent;
      const nome = card.querySelector("h2").textContent;
      const quantidadeTexto =
        card.querySelector(".quantidade strong").textContent;
      const quantidadeOriginal = parseInt(quantidadeTexto);

      produtos[numero] = {
        numero,
        nome,
        quantidadeOriginal,
        quantidade: quantidadeOriginal,
        pegou: false,
        usuario: null,
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
        this.adicionarProduto(numero);
      });

      // Botão de remover
      let btnRemover = card.querySelector(".btn-remover");
      if (!btnRemover) {
        btnRemover = document.createElement("button");
        btnRemover.className = "btn-remover";
        btnRemover.textContent = "−";
        card.appendChild(btnRemover);
      }

      btnRemover.addEventListener("click", () => {
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
    const cards = document.querySelectorAll(".card-produto");

    cards.forEach((card) => {
      const numero = card.querySelector(".numero").textContent;
      const produto = produtos[numero];

      if (!produto) return;

      // Remover classe anterior
      card.classList.remove("pegando", "completo");

      const btnAdicionar = card.querySelector(".btn-adicionar");
      const btnRemover = card.querySelector(".btn-remover");
      const quantidadeSpan = card.querySelector(".quantidade strong");

      // Atualizar quantidade exibida
      quantidadeSpan.textContent = `${produto.quantidade} un`;

      if (produto.quantidade === 0 && produto.pegou) {
        // Produto completamente pego
        card.classList.add("completo");
        btnAdicionar.disabled = true;
        btnRemover.disabled = false;
      } else if (produto.quantidade < produto.quantidadeOriginal) {
        // Produto sendo pegado
        card.classList.add("pegando");
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
    let usuarioID = sessionStorage.getItem("usuario_id");
    if (!usuarioID) {
      usuarioID = "user_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("usuario_id", usuarioID);
    }
    return usuarioID;
  }

  limparTudo() {
    if (confirm("Deseja resetar a lista de compras?")) {
      localStorage.removeItem(this.produtosKey);
      this.inicializarProdutos();
      this.renderizarCards();
    }
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  const lista = new ListaComprasColaborativa();

  // Adicionar botão de reset no rodapé (opcional)
  const rodape = document.querySelector(".rodape");
  if (rodape) {
    const btnReset = document.createElement("button");
    btnReset.textContent = "Resetar Lista";
    btnReset.className = "btn-reset-lista";
    btnReset.addEventListener("click", () => lista.limparTudo());
    rodape.appendChild(btnReset);
  }
});
