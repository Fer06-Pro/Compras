/* Mercado Checklist — lista compartilhada entre contas com convites de uso único.
 * Requer Firestore + Authentication e as regras em firestore.rules.
 * Progresso continua local quando não há conexão.
 */
const SDK_VERSION = '11.10.0';
const carregarSdk = nome => import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/${nome}.js`);
const el = id => document.getElementById(id);

const painel = document.createElement('div');
painel.id = 'mercado-sincronizacao';
painel.innerHTML = `
  <button id="mercado-sync-botao" type="button" aria-haspopup="dialog" aria-controls="mercado-sync-dialog">☁ Sincronização</button>
  <dialog id="mercado-sync-dialog" aria-labelledby="mercado-sync-titulo">
    <div class="mercado-sync-cabecalho">
      <h2 id="mercado-sync-titulo">Compras compartilhadas</h2>
      <button type="button" id="mercado-sync-fechar" aria-label="Fechar">×</button>
    </div>
    <p id="mercado-sync-status" role="status" aria-live="polite">Conectando…</p>
    <form id="mercado-sync-form">
      <label>E-mail <input id="mercado-sync-email" type="email" autocomplete="email" maxlength="254" required></label>
      <label>Senha <input id="mercado-sync-senha" type="password" autocomplete="current-password" minlength="6" required></label>
      <div class="mercado-sync-acoes">
        <button type="submit">Entrar</button>
        <button type="button" id="mercado-sync-criar">Criar conta</button>
      </div>
    </form>
    <section id="mercado-sync-conectado" hidden>
      <p>Conta: <strong id="mercado-sync-usuario"></strong></p>
      <p id="mercado-sync-lista-info"></p>
      <div id="mercado-sync-dono" hidden>
        <button type="button" id="mercado-sync-convidar">🔗 Criar link de convite (48 h, uso único)</button>
        <p id="mercado-sync-link-area" hidden>
          <label>Link de convite
            <input type="text" id="mercado-sync-link" readonly aria-label="Link de convite">
          </label>
          <button type="button" id="mercado-sync-copiar">Copiar link</button>
        </p>
        <h3>Participantes</h3>
        <div id="mercado-sync-participantes"></div>
      </div>
      <button type="button" id="mercado-sync-sair">Sair da conta</button>
    </section>
    <small>Convites são individuais. Somente quem for autorizado pode acessar a lista.\n      Na primeira conexão, as compras locais podem iniciar uma lista nova.</small>
  </dialog>`;
const estilo = document.createElement('style');
estilo.textContent = `
#mercado-sincronizacao {display:inline-flex;align-items:center}
#mercado-sync-botao {background:transparent;color:inherit;border:1px solid currentColor;border-radius:10px;padding:9px 12px;cursor:pointer;font:inherit;font-size:13px}
#mercado-sync-dialog {box-sizing:border-box;width:min(94vw,480px);max-height:90dvh;overflow:auto;padding:20px;background:#133577;color:#fff;border:1px solid #7196dc;border-radius:16px;box-shadow:0 24px 70px #0008}
#mercado-sync-dialog::backdrop {background:#0009}
.mercado-sync-cabecalho {display:flex;align-items:start;justify-content:space-between;gap:12px}
.mercado-sync-cabecalho h2 {font-size:20px;margin:0}
#mercado-sync-fechar {background:transparent;color:inherit;border:0;font-size:28px;cursor:pointer}
#mercado-sync-dialog p {line-height:1.5}
#mercado-sync-dialog label {display:grid;gap:6px;margin:12px 0;font-weight:600}
#mercado-sync-dialog input {box-sizing:border-box;width:100%;padding:11px 12px;font:inherit;border:1px solid #bac9e8;border-radius:9px;background:white;color:#142139}
.mercado-sync-acoes {display:flex;flex-wrap:wrap;gap:8px}
#mercado-sync-dialog button:not(#mercado-sync-fechar) {cursor:pointer;border-radius:9px;padding:10px 13px;border:1px solid #9bb9ec;background:#e8f0ff;color:#102650;font:inherit;font-weight:700}
#mercado-sync-dialog button:disabled {opacity:.55;cursor:wait}
#mercado-sync-dialog #mercado-sync-sair {margin-top:12px}
#mercado-sync-status {min-height:1.5em;font-size:13px;color:#d8e8ff}
#mercado-sync-dialog small {display:block;line-height:1.5;margin-top:12px;color:#dae7ff}
.mercado-sync-pessoa {display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #ffffff33}
.mercado-sync-pessoa span {overflow-wrap:anywhere;font-size:13px}
#mercado-sync-link-area {overflow-wrap:anywhere}
@media(max-width:640px) {#mercado-sync-botao {width:43px;min-width:43px;height:43px;padding:0;font-size:0} #mercado-sync-botao::before {content:'☁';font-size:20px}}
`;
document.head.append(estilo);
(document.querySelector('.acoes-cabecalho') || document.body).prepend(painel);

const modal = el('mercado-sync-dialog');
const status = el('mercado-sync-status');
const botao = el('mercado-sync-botao');
const formulario = el('mercado-sync-form');
let entrar = null;
let registrar = null;
let sair = null;
let criarConvite = null;
let removerPessoa = null;
let cancelarLista = null;
let cancelarPessoas = null;
let listaRef = null;
let pronto = false;
let fila = {};
let sessao = 0;

function informar(mensagem, resumo='☁ Sincronização') {
  status.textContent = mensagem;
  botao.textContent = resumo;
  botao.setAttribute('aria-label', `Sincronização: ${mensagem}`);
}
function mensagemErro(e) {
  const codigos = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Essa conta já existe: use Entrar.',
    'auth/weak-password': 'Escolha uma senha mais forte.',
    'auth/operation-not-allowed': 'Ative E-mail/Senha no Firebase Authentication.',
    'permission-denied': 'Acesso negado. Confira as regras do Firestore ou peça um convite válido.',
    'unavailable': 'Sem conexão. Tente novamente quando a internet voltar.',
    'failed-precondition': 'Operação indisponível no momento. Verifique o Firestore.',
    'not-found': 'Esta lista não existe mais.'
  };
  return codigos[e?.code] || e?.message || 'Erro desconhecido.';
}

el('mercado-sync-fechar').onclick = () => modal.close();
botao.onclick = () => modal.showModal();
formulario.onsubmit = async event => {
  event.preventDefault();
  if (!entrar) return;
  informar('Entrando…');
  try {
    await entrar(el('mercado-sync-email').value.trim(), el('mercado-sync-senha').value);
    el('mercado-sync-senha').value = '';
  } catch(e) { informar(mensagemErro(e), '☁ Entrar'); }
};
el('mercado-sync-criar').onclick = async () => {
  if (!registrar || !formulario.reportValidity()) return;
  informar('Criando conta…');
  try {
    await registrar(el('mercado-sync-email').value.trim(), el('mercado-sync-senha').value);
    el('mercado-sync-senha').value = '';
  } catch(e) { informar(mensagemErro(e), '☁ Entrar'); }
};
el('mercado-sync-sair').onclick = async () => {
  if (!sair) return;
  try { await sair(); } catch(e) { informar(mensagemErro(e)); }
};
el('mercado-sync-convidar').onclick = async () => {
  if (!criarConvite) return;
  el('mercado-sync-convidar').disabled = true;
  try {
    const url = await criarConvite();
    el('mercado-sync-link').value = url;
    el('mercado-sync-link-area').hidden = false;
    informar('Convite gerado. Ele vence em 48 horas e pode ser aceito uma única vez.', '☁ Convidar');
  } catch(e) { informar(mensagemErro(e), '☁ Convite'); }
  finally { el('mercado-sync-convidar').disabled = false; }
};
el('mercado-sync-copiar').onclick = async () => {
  const url = el('mercado-sync-link').value;
  try {
    await navigator.clipboard.writeText(url);
    informar('Link copiado. Envie apenas à pessoa que deseja convidar.', '☁ Link copiado');
  } catch {
    el('mercado-sync-link').focus();
    el('mercado-sync-link').select();
    informar('Selecione e copie o link manualmente.', '☁ Link pronto');
  }
};
el('mercado-sync-participantes').onclick = async event => {
  const alvo = event.target.closest('button[data-uid]');
  if (!alvo || !removerPessoa) return;
  const uid = alvo.dataset.uid;
  if (!confirm('Revogar o acesso desta pessoa à lista?')) return;
  alvo.disabled = true;
  try { await removerPessoa(uid); informar('Acesso revogado.', '☁ Sincronizado'); }
  catch(e) { informar(mensagemErro(e)); alvo.disabled = false; }
};

async function iniciar() {
  try {
    const { firebaseConfig } = await import('./firebase-config.js');
    if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId) {
      informar('Configure firebase-config.js antes de continuar.', '☁ Configurar');
      formulario.hidden = true;
      return;
    }
    const [appSdk, authSdk, fs] = await Promise.all([
      carregarSdk('firebase-app'), carregarSdk('firebase-auth'), carregarSdk('firebase-firestore')
    ]);
    const { initializeApp } = appSdk;
    const { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
      createUserWithEmailAndPassword, signOut } = authSdk;
    const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
      memoryLocalCache, doc, collection, getDoc, runTransaction, setDoc,
      updateDoc, deleteDoc, onSnapshot, serverTimestamp, Timestamp } = fs;

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    let db;
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch {
      db = initializeFirestore(app, { localCache: memoryLocalCache() });
    }
    entrar = (email, senha) => signInWithEmailAndPassword(auth, email, senha);
    registrar = (email, senha) => createUserWithEmailAndPassword(auth, email, senha);
    sair = () => signOut(auth);

    // O link é um token aleatório em URL. Não expõe a lista até haver login e aceite.
    const urlAtual = new URL(location.href);
    let convitePendente = urlAtual.searchParams.get('convite');
    let conviteValido = !!(convitePendente && /^[0-9a-f]{64}$/.test(convitePendente));
    if (convitePendente) {
      modal.showModal();
      informar(conviteValido
        ? 'Você recebeu um convite. Entre ou crie sua própria conta para aceitar.'
        : 'O link de convite é inválido.', '☁ Convite');
    }
    function limparConviteURL() {
      const url = new URL(location.href);
      url.searchParams.delete('convite');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }

    function pararEscutas() {
      sessao++;
      cancelarLista?.();
      cancelarPessoas?.();
      cancelarLista = null;
      cancelarPessoas = null;
      listaRef = null;
      pronto = false;
      fila = {};
      criarConvite = null;
      removerPessoa = null;
      el('mercado-sync-dono').hidden = true;
      el('mercado-sync-participantes').replaceChildren();
      el('mercado-sync-link-area').hidden = true;
    }

    async function publicar(mudancas) {
      if (!listaRef || !pronto) {
        Object.assign(fila, mudancas);
        return;
      }
      const campos = {};
      for (const [id, valor] of Object.entries(mudancas || {})) {
        const n = Number(valor);
        if (/^\d{1,5}$/.test(id) && Number.isInteger(n) && n >= 0 && n <= 10000) {
          campos[`compras.${id}`] = n;
        }
      }
      if (Object.keys(campos).length === 0) return;
      campos.atualizadoEm = serverTimestamp();
      try {
        await updateDoc(listaRef, campos);
      } catch(e) {
        Object.assign(fila, mudancas);
        informar(mensagemErro(e), '☁ Não sincronizado');
      }
    }
    window.addEventListener('mercado:alteracao', event => {
      if (auth.currentUser) publicar(event.detail?.mudancas || {});
    });

    async function escolherLista(user) {
      const referencia = doc(db, 'users', user.uid, 'settings', 'current');
      // Resolução atômica: duas abas não criam duas listas próprias ao mesmo tempo.
      return runTransaction(db, async tx => {
        const atual = await tx.get(referencia);
        if (atual.exists()) return atual.data().listId;
        const nova = doc(collection(db, 'sharedLists'));
        tx.set(nova, {
          ownerId: user.uid,
          compras: window.mercadoObterCompras?.() || {},
          versao: 1,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp()
        });
        tx.set(referencia, { listId: nova.id });
        return nova.id;
      });
    }

    async function aceitarConvite(user, token) {
      const conviteRef = doc(db, 'invites', token);
      const inviteSnap = await getDoc(conviteRef);
      if (!inviteSnap.exists()) throw new Error('Convite inexistente. Solicite um novo link.');
      const dados = inviteSnap.data();
      if (dados.usedBy) throw new Error('Esse convite já foi utilizado. Solicite outro link.');
      if (!dados.expiresAt || dados.expiresAt.toMillis() <= Date.now()) {
        throw new Error('Esse convite expirou. Solicite outro link.');
      }
      const refMembro = doc(db, 'sharedLists', dados.listId, 'members', user.uid);
      const refUsuario = doc(db, 'users', user.uid, 'settings', 'current');
      await runTransaction(db, async tx => {
        const [conviteSnap, membroSnap] = await Promise.all([
          tx.get(conviteRef), tx.get(refMembro)
        ]);
        if (!conviteSnap.exists()) throw new Error('Convite inexistente.');
        const convite = conviteSnap.data();
        if (convite.usedBy || convite.expiresAt.toMillis() <= Date.now()) {
          throw new Error('Convite já usado ou expirado.');
        }
        if (membroSnap.exists()) {
          throw new Error('Essa conta já participa desta lista.');
        }
        // O aceite é indivisível: convite usado + membro autorizado + lista selecionada.
        tx.update(conviteRef, { usedBy: user.uid, usedAt: serverTimestamp() });
        tx.set(refMembro, {
          inviteId: token,
          email: user.email || '',
          joinedAt: serverTimestamp()
        });
        tx.set(refUsuario, { listId: dados.listId });
      });
      limparConviteURL();
      convitePendente = null;
      conviteValido = false;
      return dados.listId;
    }

    async function iniciarLista(user, id, momento) {
      const ref = doc(db, 'sharedLists', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('A lista não existe.');
      if (momento !== sessao) return;
      const dono = snap.data().ownerId === user.uid;
      listaRef = ref;
      el('mercado-sync-lista-info').textContent = dono
        ? 'Você é o administrador desta lista.'
        : 'Você está participando de uma lista compartilhada.';
      el('mercado-sync-dono').hidden = !dono;

      if (dono) {
        criarConvite = async () => {
          // 256 bits de aleatoriedade gerados pelo navegador, sem IDs previsíveis.
          if (location.protocol !== 'https:' || ['localhost','127.0.0.1'].includes(location.hostname)) {
            throw new Error('Publique o site em HTTPS antes de gerar um convite para outro aparelho.');
          }
          const bytes = new Uint8Array(32);
          crypto.getRandomValues(bytes);
          const token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
          await setDoc(doc(db, 'invites', token), {
            listId: id,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000),
            usedBy: null,
            usedAt: null
          });
          const link = new URL(location.href);
          link.search = '';
          link.hash = '';
          link.searchParams.set('convite', token);
          return link.href;
        };
        removerPessoa = async uid => {
          if (uid === user.uid) return;
          await deleteDoc(doc(db, 'sharedLists', id, 'members', uid));
        };
        cancelarPessoas = onSnapshot(collection(db, 'sharedLists', id, 'members'), snapshot => {
          if (momento !== sessao) return;
          const fragmento = document.createDocumentFragment();
          snapshot.docs.forEach(docMembro => {
            const linha = document.createElement('div');
            linha.className = 'mercado-sync-pessoa';
            const nome = document.createElement('span');
            nome.textContent = docMembro.data().email || 'Participante';
            const excluir = document.createElement('button');
            excluir.type = 'button';
            excluir.dataset.uid = docMembro.id;
            excluir.textContent = 'Revogar acesso';
            linha.append(nome, excluir);
            fragmento.append(linha);
          });
          el('mercado-sync-participantes').replaceChildren(fragmento);
        }, e => informar(mensagemErro(e), '☁ Erro'));
      }
      cancelarLista = onSnapshot(ref, {includeMetadataChanges: true}, snapshotLista => {
        if (momento !== sessao || !snapshotLista.exists()) return;
        const dados = snapshotLista.data();
        if (dados.compras && !Object.keys(fila).length) {
          window.dispatchEvent(new CustomEvent('mercado:remoto', {
            detail: {compras: dados.compras}
          }));
        }
        pronto = true;
        if (Object.keys(fila).length) {
          const pendentes = {...fila};
          fila = {};
          publicar(pendentes);
        }
        if (snapshotLista.metadata.hasPendingWrites) informar('Enviando alterações…', '☁ Enviando');
        else if (snapshotLista.metadata.fromCache || !navigator.onLine) informar('Offline: aguardando conexão.', '☁ Offline');
        else informar('PC e celular sincronizados na mesma lista!', '☁ Sincronizado');
      }, erro => {
        pronto = false;
        informar(mensagemErro(erro), '☁ Sem acesso');
      });
    }

    async function entrarNaLista(user, momento) {
      try {
        informar('Abrindo a lista…', '☁ Conectando');
        let id;
        if (conviteValido) {
          id = await aceitarConvite(user, convitePendente);
          informar('Convite aceito! A lista já está compartilhada.', '☁ Conectando');
        } else {
          id = await escolherLista(user);
        }
        if (momento !== sessao || auth.currentUser?.uid !== user.uid) return;
        await iniciarLista(user, id, momento);
      } catch(e) {
        informar(mensagemErro(e), '☁ Atenção');
      }
    }
    onAuthStateChanged(auth, user => {
      pararEscutas();
      const momento = sessao;
      formulario.hidden = !!user;
      el('mercado-sync-conectado').hidden = !user;
      if (user) {
        el('mercado-sync-usuario').textContent = user.email || 'Usuário conectado';
        entrarNaLista(user, momento);
      } else {
        informar(conviteValido
          ? 'Entre ou crie uma conta para aceitar o link de convite.'
          : 'Entre ou crie uma conta para sincronizar entre aparelhos.', '☁ Entrar');
      }
    });
    window.addEventListener('online', () => {
      if (auth.currentUser && !pronto) entrarNaLista(auth.currentUser, sessao);
      else if (pronto && Object.keys(fila).length) {
        const pendentes = {...fila}; fila = {}; publicar(pendentes);
      }
    });
  } catch(e) {
    informar('Falha ao carregar Firebase: ' + mensagemErro(e), '☁ Indisponível');
    console.error('Firebase', e);
  }
}
iniciar();
