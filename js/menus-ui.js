/**
 * UI DE MENUS
 * Categorias, Métodos de pagamento (inclui cartões) e Tipos de recorrência.
 */

/** Recarrega a aba de menus e, em seguida, os dropdowns do formulário */
async function recarregarMenus() {
  await carregarAbaMenus();
  if (typeof carregarMenus === 'function') await carregarMenus(); // atualiza form na hora
}

async function carregarAbaMenus() {
  const menus = await carregarMenusCompleto();

  if (!menus) {
    document.querySelector(SELECTORS.menusContainer).innerHTML =
      '<p class="empty-state">Erro ao carregar menus</p>';
    return;
  }

  document.querySelector(SELECTORS.menusContainer).innerHTML = `
    <div class="menus-gerenciamento">

      <div class="menu-section">
        <h3>📂 Categorias</h3>
        <div class="menu-list" id="categoriasList"></div>
        <div class="add-item-form">
          <input type="text" id="novaCategoriaInput" placeholder="Nova categoria...">
          <input type="text" id="novaCategoriDescInput" placeholder="Descrição (opcional)...">
          <button onclick="adicionarNovaCategoria()" class="btn-add">+ Adicionar</button>
        </div>
      </div>

      <div class="menu-section">
        <h3>💳 Métodos de pagamento</h3>
        <div class="menu-list" id="metodosList"></div>
        <div class="add-item-form metodo-form">
          <select id="novoMetodoKind">
            <option value="">Adicionar método...</option>
            <option value="PIX/Débito">PIX/Débito</option>
            <option value="Crédito">Crédito</option>
          </select>
          <div id="metodoDetalhes" hidden>
            <input type="text" id="metodoBanco" placeholder="Banco">
            <div id="metodoCartaoCampos" hidden>
              <input type="text" id="metodoFech" inputmode="numeric" maxlength="2" placeholder="Fechamento (dia)">
              <input type="text" id="metodoVenc" inputmode="numeric" maxlength="2" placeholder="Vencimento (dia)">
              <input type="text" id="metodoMelhor" inputmode="numeric" maxlength="2" placeholder="Melhor dia (auto)">
            </div>
          </div>
          <button onclick="adicionarNovoMetodo()" class="btn-add">+ Adicionar</button>
        </div>
      </div>

      <div class="menu-section">
        <h3>🔁 Tipos de recorrência</h3>
        <div class="menu-list" id="recorrenciasList"></div>
        <div class="add-item-form">
          <select id="novaRecorrenciaKind">
            <option value="">Adicionar tipo...</option>
            ${RECORRENCIAS_KINDS
              .filter(k => k !== 'Pontual' && !menus.recorrencias.some(r => r.nome === k))
              .map(k => `<option value="${k}">${k}</option>`).join('')}
          </select>
          <button onclick="adicionarNovaRecorrencia()" class="btn-add">+ Adicionar</button>
        </div>
      </div>

    </div>
  `;

  configurarFormMetodo();

  renderizarItemsMenu('Categoria', 'categoriasList', menus.categorias);
  renderizarItemsMenu('Método', 'metodosList', menus.metodos);
  renderizarItemsMenu('Recorrência', 'recorrenciasList', menus.recorrencias);
}

/** Liga os campos condicionais do formulário de método */
function configurarFormMetodo() {
  const kind = document.getElementById('novoMetodoKind');
  const det = document.getElementById('metodoDetalhes');
  const cartao = document.getElementById('metodoCartaoCampos');
  const fech = document.getElementById('metodoFech');
  const melhor = document.getElementById('metodoMelhor');

  kind.addEventListener('change', () => {
    const v = kind.value;
    det.hidden = !v || v === 'Dinheiro';
    cartao.hidden = v !== 'Crédito';
  });

  fech.addEventListener('input', () => {
    soNumeros(fech, 2);
    if (!melhor.dataset.editado) melhor.value = sugerirMelhorDiaCompra(fech.value) || '';
  });
  document.getElementById('metodoVenc').addEventListener('input', e => soNumeros(e.target, 2));
  melhor.addEventListener('input', () => { melhor.dataset.editado = '1'; soNumeros(melhor, 2); });
}

function renderizarItemsMenu(tipo, containerId, itens) {
  const container = document.getElementById(containerId);
  if (!itens || !itens.length) {
    container.innerHTML = `<p class="empty-text">Nada cadastrado</p>`;
    return;
  }

  container.innerHTML = itens.map(item => {
    const statusClass = item.status === 'Ativo' ? 'ativo' : 'inativo';
    const statusLabel = item.status === 'Ativo' ? '✓ Ativo' : '✗ Inativo';

    let titulo = item.nome;
    let sub = '';
    if (tipo === 'Categoria') {
      sub = item.descricao || '-';
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

    // Itens fixos: Dinheiro (método) e Pontual (recorrência) não podem ser removidos
    const fixo = (tipo === 'Método' && (item.metodoKind === 'Dinheiro' || item.nome === 'Dinheiro'))
              || (tipo === 'Recorrência' && item.nome === 'Pontual');
    const editavel = tipo === 'Categoria' || (tipo === 'Método' && item.metodoKind !== 'Dinheiro');

    return `
      <div class="menu-item ${statusClass}">
        <div class="item-info">
          <div class="item-nome">${titulo}</div>
          ${sub ? `<div class="item-descricao">${sub}</div>` : ''}
        </div>
        <div class="item-status">${fixo ? 'fixo' : statusLabel}</div>
        <div class="item-actions">
          ${editavel ? `<button class="btn-icon" onclick="editarItemMenuUI(${item.linha}, '${tipo}')" title="Editar">✏️</button>` : ''}
          ${fixo ? '' : (item.status === 'Ativo'
            ? `<button class="btn-icon btn-warning" onclick="desativarItemMenuUI(${item.linha})" title="Desativar">⊘</button>`
            : `<button class="btn-icon btn-success" onclick="ativarItemMenuUI(${item.linha})" title="Ativar">↻</button>`)}
          ${fixo ? '' : `<button class="btn-icon btn-danger" onclick="removerItemMenuUI(${item.linha})" title="Remover">🗑️</button>`}
        </div>
      </div>
    `;
  }).join('');
}

/* ---------- Adicionar ---------- */

async function adicionarNovaCategoria() {
  const nome = document.getElementById('novaCategoriaInput').value.trim();
  const descricao = document.getElementById('novaCategoriDescInput').value.trim();
  if (!nome) return mostrarNotificacao('Digite o nome da categoria', 'info');

  if (await adicionarItemMenuAPI('Categoria', nome, { descricao })) recarregarMenus();
}

async function adicionarNovaRecorrencia() {
  const nome = document.getElementById('novaRecorrenciaKind').value;
  if (!nome) return mostrarNotificacao('Escolha o tipo de recorrência', 'info');

  if (await adicionarItemMenuAPI('Recorrência', nome)) recarregarMenus();
}

async function adicionarNovoMetodo() {
  const kind = document.getElementById('novoMetodoKind').value;
  if (!kind) return mostrarNotificacao('Escolha o tipo de método', 'info');

  if (kind === 'Dinheiro') {
    if (await adicionarItemMenuAPI('Método', 'Dinheiro', { metodo_kind: 'Dinheiro' })) recarregarMenus();
    return;
  }

  const banco = document.getElementById('metodoBanco').value.trim();
  if (!banco) return mostrarNotificacao('Informe o banco', 'info');

  const extra = { metodo_kind: kind, banco };
  let nome = `${kind} — ${banco}`;

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

/* ---------- Editar / status / remover ---------- */

async function editarItemMenuUI(linha, tipo) {
  if (tipo === 'Método') return editarMetodoUI(linha);

  const novoNome = prompt(`Editar ${tipo.toLowerCase()}:`, '');
  if (novoNome === null || !novoNome.trim()) return;

  const campos = { nome: novoNome.trim() };
  if (tipo === 'Categoria') campos.descricao = prompt('Descrição (opcional):', '') || '';

  if (await editarItemMenuAPI(linha, campos)) recarregarMenus();
}

async function editarMetodoUI(linha) {
  const menus = await carregarMenusCompleto();
  const item = menus && menus.metodos.find(m => m.linha === linha);
  if (!item) return;

  if (item.metodoKind === 'Dinheiro') {
    return mostrarNotificacao('Dinheiro não tem detalhes para editar', 'info');
  }

  const banco = prompt('Banco:', item.banco || '');
  if (banco === null) return;
  const campos = { banco: banco.trim(), nome: `${item.metodoKind} — ${banco.trim()}` };

  if (item.metodoKind === 'Crédito') {
    const fech = parseInt(prompt('Dia de fechamento:', item.diaFechamento || ''), 10);
    const venc = parseInt(prompt('Dia de vencimento:', item.diaVencimento || ''), 10);
    const melhorIn = prompt('Melhor dia de compra (vazio = calcular):', item.melhorDiaCompra || '');
    campos.dia_fechamento = fech;
    campos.dia_vencimento = venc;
    campos.melhor_dia_compra = (melhorIn && melhorIn.trim())
      ? parseInt(melhorIn, 10)
      : sugerirMelhorDiaCompra(fech) || null;
  }

  if (await editarItemMenuAPI(linha, campos)) recarregarMenus();
}

async function desativarItemMenuUI(linha) {
  if (!confirm('Desativar este item?')) return;
  if (await desativarItemMenuAPI(linha)) recarregarMenus();
}

async function ativarItemMenuUI(linha) {
  if (await ativarItemMenuAPI(linha)) recarregarMenus();
}

async function removerItemMenuUI(linha) {
  if (!confirm('Remover este item? Esta ação não pode ser desfeita.')) return;
  if (await removerItemMenuAPI(linha)) recarregarMenus();
}
