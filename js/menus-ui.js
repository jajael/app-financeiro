/**
 * UI DE CONFIGURAÇÃO
 * Categorias, Métodos de pagamento (inclui cartões) e Tipos de recorrência.
 */

// Tipos de recorrência: fixos, não editáveis. Só descrição.
const RECORRENCIAS_INFO = [
  ['Pontual', 'Acontece uma única vez, sem repetição.'],
  ['Mensal', 'Repete todo mês no dia informado, ajustado para o dia útil mais próximo. Nas despesas aparece como "Conta".'],
  ['Parcelada', 'Divide o valor em parcelas mensais — uma transação por mês, cada uma na sua competência.'],
  ['Primeiro dia útil do mês', 'Vence sempre no primeiro dia útil de cada mês (data calculada automaticamente).'],
  ['Até o 5º dia útil do mês', 'Fica pendente de OK; se você não confirmar, é confirmado automaticamente no 5º dia útil do mês.'],
  ['Último dia útil do mês', 'Vence sempre no último dia útil de cada mês (data calculada automaticamente).'],
  ['Semanal', 'Repete a cada 7 dias. Pode fixar um dia da semana ou deixar sem dia fixo.']
];

let menusAtual = null; // cache dos itens carregados (para edição inline)

/** Recarrega a aba de configuração e, em seguida, os dropdowns do formulário */
async function recarregarMenus() {
  await carregarAbaMenus();
  if (typeof carregarMenus === 'function') await carregarMenus(); // atualiza form na hora
}

async function carregarAbaMenus() {
  const menus = await carregarMenusCompleto();
  menusAtual = menus;

  if (!menus) {
    document.querySelector(SELECTORS.menusContainer).innerHTML =
      '<p class="empty-state">Erro ao carregar configuração</p>';
    return;
  }

  document.querySelector(SELECTORS.menusContainer).innerHTML = `
    <div class="menus-gerenciamento">

      <div class="menu-section">
        <h3>📂 Categorias</h3>
        <div class="menu-list" id="categoriasList"></div>
        <div class="add-item-form">
          <div class="campo">
            <label for="novaCategoriaInput">Nome</label>
            <input type="text" id="novaCategoriaInput" placeholder="Ex: Mercado">
          </div>
          <div class="campo">
            <label for="novaCategoriDescInput">Descrição <span class="opt">(opcional)</span></label>
            <input type="text" id="novaCategoriDescInput" placeholder="">
          </div>
          <button onclick="adicionarNovaCategoria()" class="btn-add">+ Adicionar</button>
        </div>
      </div>

      <div class="menu-section">
        <h3>💳 Métodos de pagamento</h3>
        <div class="menu-list" id="metodosList"></div>
        <div class="add-item-form">
          <div class="campo">
            <label for="novoMetodoKind">Tipo</label>
            <select id="novoMetodoKind">
              <option value="">Selecione...</option>
              <option value="PIX/Débito">PIX/Débito</option>
              <option value="Crédito">Crédito</option>
            </select>
          </div>
          <div class="campo" id="metodoBancoCampo" hidden>
            <label for="metodoBanco">Banco</label>
            <input type="text" id="metodoBanco" placeholder="Ex: Nubank">
          </div>
          <div class="campo" id="metodoFechCampo" hidden>
            <label for="metodoFech">Fechamento (dia)</label>
            <input type="text" id="metodoFech" inputmode="numeric" maxlength="2" placeholder="">
          </div>
          <div class="campo" id="metodoVencCampo" hidden>
            <label for="metodoVenc">Vencimento (dia)</label>
            <input type="text" id="metodoVenc" inputmode="numeric" maxlength="2" placeholder="">
          </div>
          <div class="campo" id="metodoMelhorCampo" hidden>
            <label for="metodoMelhor">Melhor dia <span class="opt">(auto)</span></label>
            <input type="text" id="metodoMelhor" inputmode="numeric" maxlength="2" placeholder="">
          </div>
          <button onclick="adicionarNovoMetodo()" class="btn-add">+ Adicionar</button>
        </div>
      </div>

      <div class="menu-section">
        <h3>🔁 Tipos de recorrência</h3>
        <p class="menu-hint">Tipos fixos do sistema. Você escolhe um deles ao lançar uma transação.</p>
        <div class="menu-list menu-list--livre" id="recorrenciasList">
          ${RECORRENCIAS_INFO.map(([nome, desc]) => `
            <div class="menu-item ativo">
              <div class="item-info">
                <div class="item-nome">${nome}</div>
                <div class="item-descricao item-descricao--full">${desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;

  configurarFormMetodo();

  renderizarItemsMenu('Categoria', 'categoriasList', menus.categorias);
  renderizarItemsMenu('Método', 'metodosList', menus.metodos);
}

/** Liga os campos condicionais do formulário de método */
function configurarFormMetodo() {
  const kind = document.getElementById('novoMetodoKind');
  const bancoCampo = document.getElementById('metodoBancoCampo');
  const fechCampo = document.getElementById('metodoFechCampo');
  const vencCampo = document.getElementById('metodoVencCampo');
  const melhorCampo = document.getElementById('metodoMelhorCampo');
  const fech = document.getElementById('metodoFech');
  const melhor = document.getElementById('metodoMelhor');

  kind.addEventListener('change', () => {
    const v = kind.value;
    bancoCampo.hidden = !v;                 // PIX/Débito e Crédito pedem banco
    const cred = v === 'Crédito';
    fechCampo.hidden = !cred;
    vencCampo.hidden = !cred;
    melhorCampo.hidden = !cred;
  });

  fech.addEventListener('input', () => {
    soNumeros(fech, 2);
    if (!melhor.dataset.editado) melhor.value = sugerirMelhorDiaCompra(fech.value) || '';
  });
  document.getElementById('metodoVenc').addEventListener('input', e => soNumeros(e.target, 2));
  melhor.addEventListener('input', () => { melhor.dataset.editado = '1'; soNumeros(melhor, 2); });
}

/* ---------- Render ---------- */

function renderizarItemsMenu(tipo, containerId, itens) {
  const container = document.getElementById(containerId);
  if (!itens || !itens.length) {
    container.innerHTML = `<p class="empty-text">Nada cadastrado</p>`;
    container.onclick = null;
    return;
  }

  container.innerHTML = itens.map(item => {
    const statusClass = item.status === 'Ativo' ? 'ativo' : 'inativo';
    const statusLabel = item.status === 'Ativo' ? '✓ Ativo' : '✗ Inativo';

    let titulo = item.nome;
    let sub = '';
    if (tipo === 'Categoria') {
      sub = item.descricao || '';
    } else if (tipo === 'Método') {
      titulo = rotuloMetodo(item);
      if (item.metodoKind === 'Crédito') {
        sub = `fecha dia ${item.diaFechamento || '?'} · vence dia ${item.diaVencimento || '?'}`
            + (item.melhorDiaCompra ? ` · melhor compra dia ${item.melhorDiaCompra}` : '');
      } else if (item.metodoKind === 'PIX/Débito') {
        sub = item.banco ? `banco: ${item.banco}` : 'PIX/Débito';
      } else {
        sub = 'dinheiro';
      }
    }

    // Dinheiro é método fixo: sem ações
    const fixo = tipo === 'Método' && (item.metodoKind === 'Dinheiro' || item.nome === 'Dinheiro');

    const acoes = fixo ? '' : `
      <div class="item-actions">
        <button class="btn-icon" data-act="editar" data-tipo="${tipo}" data-id="${item.linha}" title="Editar">✏️</button>
        <button class="btn-icon ${item.status === 'Ativo' ? 'btn-warning' : 'btn-success'}"
                data-act="${item.status === 'Ativo' ? 'desativar' : 'ativar'}" data-id="${item.linha}"
                title="${item.status === 'Ativo' ? 'Desativar' : 'Ativar'}">${item.status === 'Ativo' ? '⊘' : '↻'}</button>
        <button class="btn-icon btn-danger" data-act="remover" data-id="${item.linha}" title="Remover">🗑️</button>
      </div>`;

    return `
      <div class="menu-item ${statusClass}" data-id="${item.linha}" data-tipo="${tipo}">
        <div class="item-info">
          <div class="item-nome">${titulo}</div>
          ${sub ? `<div class="item-descricao">${sub}</div>` : ''}
        </div>
        <div class="item-status">${fixo ? 'fixo' : statusLabel}</div>
        ${acoes}
      </div>
    `;
  }).join('');

  container.onclick = onMenuListClick;
}

/* ---------- Ações (sem prompt/confirm nativos) ---------- */

function onMenuListClick(e) {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  const id = Number(btn.dataset.id);
  const tipo = btn.dataset.tipo;
  const row = btn.closest('.menu-item');

  if (act === 'ativar')    return acaoMenu(() => ativarItemMenuAPI(id));
  if (act === 'desativar') return acaoMenu(() => desativarItemMenuAPI(id));
  if (act === 'remover')   return confirmarRemocao(btn, id);
  if (act === 'editar')    return abrirEdicaoInline(row, id, tipo);
}

async function acaoMenu(fn) {
  if (await fn()) recarregarMenus();
}

/** Remoção em 2 cliques (sem confirm nativo) */
function confirmarRemocao(btn, id) {
  if (btn.dataset.armed) {
    acaoMenu(() => removerItemMenuAPI(id));
    return;
  }
  const original = btn.textContent;
  btn.dataset.armed = '1';
  btn.textContent = 'remover?';
  btn.classList.add('armed');
  setTimeout(() => {
    delete btn.dataset.armed;
    btn.textContent = original;
    btn.classList.remove('armed');
  }, 3000);
}

/** Edição inline: troca a linha por campos + Salvar/Cancelar */
function abrirEdicaoInline(row, id, tipo) {
  const lista = tipo === 'Categoria' ? menusAtual?.categorias : menusAtual?.metodos;
  const item = (lista || []).find(i => i.linha === id);
  if (!item) return;
  const esc = s => String(s || '').replace(/"/g, '&quot;');

  if (tipo === 'Categoria') {
    row.innerHTML = `
      <div class="item-edit">
        <div class="campo"><label>Nome</label>
          <input type="text" class="edt-nome" value="${esc(item.nome)}"></div>
        <div class="campo"><label>Descrição</label>
          <input type="text" class="edt-desc" value="${esc(item.descricao)}"></div>
        <div class="item-edit-acoes">
          <button class="btn-add edt-salvar">Salvar</button>
          <button class="btn-icon edt-cancelar" title="Cancelar">✕</button>
        </div>
      </div>`;
    row.querySelector('.edt-cancelar').onclick = recarregarMenus;
    row.querySelector('.edt-salvar').onclick = async () => {
      const nome = row.querySelector('.edt-nome').value.trim();
      if (!nome) return mostrarNotificacao('Informe o nome', 'info');
      if (await editarItemMenuAPI(id, { nome, descricao: row.querySelector('.edt-desc').value.trim() }))
        recarregarMenus();
    };
    return;
  }

  // Método (PIX/Débito ou Crédito)
  const ehCredito = item.metodoKind === 'Crédito';
  row.innerHTML = `
    <div class="item-edit">
      <div class="campo"><label>Banco</label>
        <input type="text" class="edt-banco" value="${esc(item.banco)}"></div>
      ${ehCredito ? `
        <div class="campo"><label>Fechamento (dia)</label>
          <input type="text" class="edt-fech" inputmode="numeric" maxlength="2" value="${item.diaFechamento || ''}"></div>
        <div class="campo"><label>Vencimento (dia)</label>
          <input type="text" class="edt-venc" inputmode="numeric" maxlength="2" value="${item.diaVencimento || ''}"></div>
        <div class="campo"><label>Melhor dia</label>
          <input type="text" class="edt-melhor" inputmode="numeric" maxlength="2" value="${item.melhorDiaCompra || ''}"></div>
      ` : ''}
      <div class="item-edit-acoes">
        <button class="btn-add edt-salvar">Salvar</button>
        <button class="btn-icon edt-cancelar" title="Cancelar">✕</button>
      </div>
    </div>`;
  row.querySelector('.edt-cancelar').onclick = recarregarMenus;
  row.querySelectorAll('input[inputmode="numeric"]').forEach(inp =>
    inp.addEventListener('input', () => soNumeros(inp, 2)));
  row.querySelector('.edt-salvar').onclick = async () => {
    const banco = row.querySelector('.edt-banco').value.trim();
    if (!banco) return mostrarNotificacao('Informe o banco', 'info');
    const campos = { banco, nome: `${item.metodoKind} — ${banco}` };
    if (ehCredito) {
      const fech = parseInt(row.querySelector('.edt-fech').value, 10);
      const venc = parseInt(row.querySelector('.edt-venc').value, 10);
      const melhorIn = parseInt(row.querySelector('.edt-melhor').value, 10);
      if (!(fech >= 1 && fech <= 31)) return mostrarNotificacao('Fechamento inválido', 'erro');
      if (!(venc >= 1 && venc <= 31)) return mostrarNotificacao('Vencimento inválido', 'erro');
      campos.dia_fechamento = fech;
      campos.dia_vencimento = venc;
      campos.melhor_dia_compra = melhorIn || sugerirMelhorDiaCompra(fech) || null;
    }
    if (await editarItemMenuAPI(id, campos)) recarregarMenus();
  };
}

/* ---------- Adicionar ---------- */

async function adicionarNovaCategoria() {
  const nomeEl = document.getElementById('novaCategoriaInput');
  const descEl = document.getElementById('novaCategoriDescInput');
  const nome = nomeEl.value.trim();
  if (!nome) return mostrarNotificacao('Digite o nome da categoria', 'info');

  if (await adicionarItemMenuAPI('Categoria', nome, { descricao: descEl.value.trim() })) {
    nomeEl.value = ''; descEl.value = '';
    recarregarMenus();
  }
}

async function adicionarNovoMetodo() {
  const kind = document.getElementById('novoMetodoKind').value;
  if (!kind) return mostrarNotificacao('Escolha o tipo de método', 'info');

  const banco = document.getElementById('metodoBanco').value.trim();
  if (!banco) return mostrarNotificacao('Informe o banco', 'info');

  const extra = { metodo_kind: kind, banco };
  const nome = `${kind} — ${banco}`;

  if (kind === 'Crédito') {
    const fech = parseInt(document.getElementById('metodoFech').value, 10);
    const venc = parseInt(document.getElementById('metodoVenc').value, 10);
    const melhor = parseInt(document.getElementById('metodoMelhor').value, 10)
      || sugerirMelhorDiaCompra(fech) || null;
    if (!(fech >= 1 && fech <= 31)) return mostrarNotificacao('Dia de fechamento inválido', 'erro');
    if (!(venc >= 1 && venc <= 31)) return mostrarNotificacao('Dia de vencimento inválido', 'erro');
    extra.dia_fechamento = fech;
    extra.dia_vencimento = venc;
    extra.melhor_dia_compra = melhor;
  }

  if (await adicionarItemMenuAPI('Método', nome, extra)) recarregarMenus();
}
