/* Mercado Checklist — outubro de 2026. Dados locais, sem bibliotecas externas. */
(() => {
  'use strict';
  const produtos = Array.isArray(window.PRODUTOS_OUTUBRO_2026) ? window.PRODUTOS_OUTUBRO_2026 : [];
  const CHAVE_COMPRAS = 'mercado:compras:2026-10:v1';
  const CHAVE_TEMA = 'mercado:tema';
  const ids = new Set(produtos.map(p => Number(p.id)));
  const totalUnidades = produtos.reduce((n, p) => n + p.quantidade, 0);
  const el = id => document.getElementById(id);
  const cards = new Map();
  let filtro = 'todos';
  let categoria = 'Todas';
  let busca = '';
  let timerMensagem;
  let compras = lerCompras();

  function guardar(chave, valor) {
    try { localStorage.setItem(chave, valor); return true; }
    catch (_) { return false; }
  }
  function obter(chave) {
    try { return localStorage.getItem(chave); }
    catch (_) { return null; }
  }
  function normalizarImportacao(valor) {
    const resultado = {};
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return resultado;
    for (const produto of produtos) {
      const n = Number(valor[String(produto.id)]);
      resultado[produto.id] = Number.isFinite(n) ? Math.min(produto.quantidade, Math.max(0, Math.trunc(n))) : 0;
    }
    return resultado;
  }
  function lerCompras() {
    try {
      const dado = JSON.parse(obter(CHAVE_COMPRAS) || '{}');
      return normalizarImportacao(dado.compras || {});
    } catch (_) { return normalizarImportacao({}); }
  }
  function salvarCompras() {
    return guardar(CHAVE_COMPRAS, JSON.stringify({versao:1, mes:'2026-10', compras}));
  }
  function normalizarTexto(str) {
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  }
  function escapar(valor) {
    return String(valor).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  }
  function aviso(mensagem) {
    const toast = el('mensagem');
    toast.textContent = mensagem;
    toast.hidden = false;
    clearTimeout(timerMensagem);
    timerMensagem = setTimeout(() => { toast.hidden = true; }, 3200);
  }
  function criarCartoes() {
    const fragmento = document.createDocumentFragment();
    produtos.forEach((produto, indice) => {
      const card = document.createElement('article');
      card.className = 'cartao-produto';
      card.dataset.id = String(produto.id);
      const nome = escapar(produto.nome);
      const foto = produto.imagem
        ? `<img src="${escapar(produto.imagem)}" alt="${nome}" loading="lazy" decoding="async" width="240" height="180">`
        : `<div class="foto-emoji" role="img" aria-label="Ícone ilustrativo"><span aria-hidden="true">${escapar(produto.icone)}</span><small>SEM FOTO</small></div>`;
      card.innerHTML = `
        <div class="cartao-imagem">
          ${foto}
          <span class="etiqueta-numero">${String(indice + 1).padStart(2, '0')}</span>
          <span class="etiqueta-ok" hidden>✓ Completo</span>
        </div>
        <div class="cartao-corpo">
          <div class="tipo-produto">${escapar(produto.categoria)}</div>
          <h3>${nome}</h3>
          <p class="observacao${produto.observacao ? '' : ' vazia'}">${escapar(produto.observacao)}</p>
          <div class="cartao-inferior">
            <div class="comprados-linha"><span>No carrinho: <strong data-contador-comprado>0</strong>/${produto.quantidade}</span><span data-restante>Faltam ${produto.quantidade}</span></div>
            <div class="barra-card" aria-hidden="true"><div class="barra-card-preenchimento"></div></div>
            <div class="acoes-card">
              <button class="botao-menos" type="button" data-acao="menos" aria-label="Devolver uma unidade de ${nome}" title="Devolver 1" disabled>−</button>
              <span class="contador-card" aria-live="polite" aria-atomic="true"><strong data-compradas>0</strong><small>de ${produto.quantidade}</small></span>
              <button class="botao-mais" type="button" data-acao="mais" aria-label="Adicionar uma unidade de ${nome}" title="Adicionar 1">+</button>
            </div>
          </div>
          <button class="marcar-tudo" type="button" data-acao="alternar" aria-label="Marcar todas as unidades de ${nome} como compradas">Marcar tudo como comprado</button>
        </div>`;
      const img = card.querySelector('img');
      if (img) {
        img.addEventListener('error', () => {
          const holder = img.closest('.cartao-imagem');
          if (!holder) return;
          const placeholder = document.createElement('div');
          placeholder.className = 'foto-emoji';
          placeholder.setAttribute('role', 'img');
          placeholder.setAttribute('aria-label', 'Ícone ilustrativo');
          const emoji = document.createElement('span');
          emoji.setAttribute('aria-hidden', 'true');
          emoji.textContent = produto.icone;
          const avisoFoto = document.createElement('small');
          avisoFoto.textContent = 'SEM FOTO';
          placeholder.append(emoji, avisoFoto);
          img.replaceWith(placeholder);
        }, {once:true});
      }
      cards.set(produto.id, card);
      fragmento.append(card);
    });
    el('produtos').replaceChildren(fragmento);
  }
  function criarCategorias() {
    const lista = ['Todas', ...new Set(produtos.map(p => p.categoria))];
    const pai = el('categorias');
    lista.forEach(nome => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = `categoria${nome === 'Todas' ? ' ativo' : ''}`;
      botao.dataset.categoria = nome;
      botao.setAttribute('aria-pressed', nome === 'Todas' ? 'true' : 'false');
      botao.textContent = nome === 'Todas' ? 'Todas as categorias' : nome;
      pai.appendChild(botao);
    });
  }
  function renderizar() {
    let concluidos = 0;
    let compradas = 0;
    let visiveis = 0;
    for (const produto of produtos) {
      const n = compras[produto.id] || 0;
      const finalizado = n === produto.quantidade;
      if (finalizado) concluidos++;
      compradas += n;
      const card = cards.get(produto.id);
      card.classList.toggle('concluido', finalizado);
      card.querySelector('.etiqueta-ok').hidden = !finalizado;
      card.querySelector('[data-compradas]').textContent = String(n);
      card.querySelector('[data-contador-comprado]').textContent = String(n);
      const restante = produto.quantidade - n;
      const status = card.querySelector('[data-restante]');
      status.textContent = restante ? `Faltam ${restante}` : 'Tudo comprado';
      status.classList.toggle('falta-zero', !restante);
      card.querySelector('.barra-card-preenchimento').style.width = `${n / produto.quantidade * 100}%`;
      card.querySelector('[data-acao="menos"]').disabled = n === 0;
      card.querySelector('[data-acao="mais"]').disabled = finalizado;
      const alternar = card.querySelector('[data-acao="alternar"]');
      alternar.textContent = finalizado ? 'Desmarcar todas' : 'Marcar tudo como comprado';
      alternar.setAttribute('aria-label', `${finalizado ? 'Desmarcar' : 'Marcar'} todas as unidades de ${produto.nome}`);
      const correspondeSituacao = filtro === 'todos' || (filtro === 'concluidos' ? finalizado : !finalizado);
      const correspondeCategoria = categoria === 'Todas' || categoria === produto.categoria;
      const correspondeBusca = !busca || normalizarTexto(`${produto.nome} ${produto.categoria} ${produto.observacao}`).includes(busca);
      card.hidden = !(correspondeSituacao && correspondeCategoria && correspondeBusca);
      if (!card.hidden) visiveis++;
    }
    const perc = totalUnidades ? Math.round(compradas * 100 / totalUnidades) : 0;
    el('produtos-finalizados').textContent = concluidos;
    el('unidades-compradas').textContent = compradas;
    el('unidades-total').textContent = totalUnidades;
    el('percentual-compras').textContent = `${perc}%`;
    el('barra-geral-preenchimento').style.width = `${perc}%`;
    el('barra-geral').setAttribute('aria-valuenow', String(perc));
    el('produtos-pendentes').textContent = `${produtos.length - concluidos} produtos pendentes`;
    el('filtro-todos').textContent = produtos.length;
    el('filtro-pendentes').textContent = produtos.length - concluidos;
    el('filtro-concluidos').textContent = concluidos;
    el('quantidade-exibida').textContent = `Exibindo ${visiveis} ${visiveis === 1 ? 'produto' : 'produtos'}`;
    el('sem-resultados').hidden = visiveis !== 0;
  }
  function atualizarQuantidade(id, acao) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    const atual = compras[id] || 0;
    const proximo = acao === 'mais' ? Math.min(produto.quantidade, atual + 1)
      : acao === 'menos' ? Math.max(0, atual - 1)
      : atual === produto.quantidade ? 0 : produto.quantidade;
    if (proximo === atual) return;
    compras[id] = proximo;
    if (!salvarCompras()) aviso('Não foi possível salvar no navegador.');
    renderizar();
  }
  function configurarTema() {
    const claro = document.documentElement.dataset.tema === 'claro';
    el('alternar-tema').querySelector('.tema-grafico').textContent = claro ? '☾' : '☀';
    el('alternar-tema').querySelector('.tema-label').textContent = claro ? 'Modo escuro' : 'Modo claro';
    el('alternar-tema').setAttribute('aria-label', claro ? 'Ativar modo escuro' : 'Ativar modo claro');
    document.querySelector('meta[name="theme-color"]').content = claro ? '#eff4ff' : '#1242a5';
  }
  function pendentesTexto() {
    const lista = produtos.map(p => ({...p, falta:p.quantidade - (compras[p.id] || 0)})).filter(p => p.falta > 0);
    return lista.length ? 'LISTA DE COMPRAS — OUTUBRO/2026\n\n' + lista.map(p => `${p.falta} × ${p.nome}`).join('\n')
      : 'Lista de compras de outubro de 2026 concluída!';
  }
  async function compartilhar() {
    const texto = pendentesTexto();
    if (navigator.share) {
      try { await navigator.share({title:'Lista de compras de outubro',text:texto}); return; }
      catch (err) { if (err && err.name === 'AbortError') return; }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(texto);
      else {
        const area = document.createElement('textarea');
        area.value = texto;
        area.style.position = 'fixed'; area.style.opacity = '0';
        document.body.appendChild(area);area.select();
        if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
        area.remove();
      }
      aviso('Itens pendentes copiados!');
    } catch (_) { aviso('Não foi possível copiar; tente abrir em um navegador atualizado.'); }
  }
  function exportar() {
    const dados = JSON.stringify({aplicativo:'Mercado Checklist',mes:'2026-10',versao:1,compras},null,2);
    const url = URL.createObjectURL(new Blob([dados],{type:'application/json;charset=utf-8'}));
    const ancora = document.createElement('a');
    ancora.href = url;
    ancora.download = 'compras-outubro-2026-progresso.json';
    document.body.appendChild(ancora);
    ancora.click();ancora.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    aviso('Arquivo de progresso preparado.');
  }
  async function importarArquivo(arquivo) {
    if (!arquivo) return;
    try {
      if (arquivo.size > 1024 * 1024) throw new Error('Arquivo muito grande.');
      const dados = JSON.parse(await arquivo.text());
      if (dados.mes !== '2026-10' || dados.versao !== 1 || !dados.compras || typeof dados.compras !== 'object' || Array.isArray(dados.compras)) {
        throw new Error('Esse arquivo não corresponde à lista de outubro de 2026.');
      }
      if (!Object.keys(dados.compras).some(id => ids.has(Number(id)))) throw new Error('O arquivo não tem itens reconhecidos.');
      if (!confirm('Substituir o progresso atual pelos dados desse arquivo?')) return;
      compras = normalizarImportacao(dados.compras);
      salvarCompras(); renderizar();
      aviso('Progresso importado com sucesso.');
    } catch (err) { aviso(err.message || 'Não foi possível abrir esse arquivo.'); }
    finally { el('arquivo-progresso').value = ''; }
  }
  function configurarEventos() {
    el('produtos').addEventListener('click', evento => {
      const botao = evento.target.closest('button[data-acao]');
      if (!botao) return;
      const card = botao.closest('[data-id]');
      if (card) atualizarQuantidade(Number(card.dataset.id), botao.dataset.acao);
    });
    el('busca-produto').addEventListener('input', evento => { busca = normalizarTexto(evento.target.value.trim()); renderizar(); });
    document.querySelector('.grupo-filtros').addEventListener('click', evento => {
      const botao = evento.target.closest('button[data-situacao]');
      if (!botao) return;
      filtro = botao.dataset.situacao;
      document.querySelectorAll('button[data-situacao]').forEach(b => {
        const ativo = b === botao;b.classList.toggle('ativo',ativo);b.setAttribute('aria-pressed',String(ativo));
      });
      renderizar();
    });
    el('categorias').addEventListener('click', evento => {
      const botao = evento.target.closest('button[data-categoria]');
      if (!botao) return;
      categoria = botao.dataset.categoria;
      document.querySelectorAll('button[data-categoria]').forEach(b => {
        const ativo = b === botao;b.classList.toggle('ativo',ativo);b.setAttribute('aria-pressed',String(ativo));
      });
      renderizar();
    });
    el('limpar-busca').addEventListener('click', () => {
      busca = '';filtro = 'todos';categoria = 'Todas';el('busca-produto').value = '';
      document.querySelectorAll('button[data-situacao]').forEach(b=>{const on=b.dataset.situacao==='todos';b.classList.toggle('ativo',on);b.setAttribute('aria-pressed',String(on));});
      document.querySelectorAll('button[data-categoria]').forEach(b=>{const on=b.dataset.categoria==='Todas';b.classList.toggle('ativo',on);b.setAttribute('aria-pressed',String(on));});
      renderizar();
    });
    el('alternar-tema').addEventListener('click', () => {
      const proximo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
      document.documentElement.dataset.tema = proximo;
      guardar(CHAVE_TEMA,proximo);
      configurarTema();
    });
    el('compartilhar-pendentes').addEventListener('click', compartilhar);
    el('exportar-progresso').addEventListener('click', () => { el('menu-opcoes').open = false;exportar(); });
    el('importar-progresso').addEventListener('click', () => {el('menu-opcoes').open = false;el('arquivo-progresso').click();});
    el('arquivo-progresso').addEventListener('change', evento => importarArquivo(evento.target.files[0]));
    el('imprimir-lista').addEventListener('click', () => {el('menu-opcoes').open=false;window.print();});
    el('zerar-progresso').addEventListener('click', () => {
      el('menu-opcoes').open = false;
      if (!confirm('Reiniciar a lista de outubro? Isso desmarcará todas as unidades compradas.')) return;
      compras = normalizarImportacao({});salvarCompras();renderizar();aviso('Lista reiniciada.');
    });
    document.addEventListener('click', evento => {const menu=el('menu-opcoes');if(menu.open && !menu.contains(evento.target)) menu.open=false;});
    document.addEventListener('keydown', evento=>{if(evento.key==='Escape')el('menu-opcoes').open=false;});
    const botaoTopo=el('voltar-topo');
    const checarScroll=()=>{botaoTopo.hidden=window.scrollY<500;};
    window.addEventListener('scroll',checarScroll,{passive:true});checarScroll();
    botaoTopo.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
    window.addEventListener('storage',evento=>{
      if(evento.key===CHAVE_COMPRAS){compras=lerCompras();renderizar();}
      if(evento.key===CHAVE_TEMA){document.documentElement.dataset.tema=obter(CHAVE_TEMA)==='claro'?'claro':'escuro';configurarTema();}
    });
  }
  if (!produtos.length || new Set(produtos.map(p => p.id)).size !== produtos.length) {
    console.error('Catálogo de compras vazio ou com IDs duplicados.');
    el('produtos').textContent = 'Não foi possível carregar a lista. Verifique o arquivo catalogo.js.';
    return;
  }
  criarCartoes();criarCategorias();configurarEventos();configurarTema();renderizar();
})();
