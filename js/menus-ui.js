/**
 * UI DE CONFIGURAÇÃO
 * Categorias, Métodos de pagamento (inclui cartões) e Tipos de recorrência.
 */

// Tipos de recorrência: fixos, não editáveis. Só descrição.
const RECORRENCIAS_INFO = [
  ['Pontual', 'Acontece uma única vez, sem repetição.'],
  ['Mensal / Contas', 'Repete todo mês no dia informado, ajustado para o dia útil mais próximo.'],
  ['Parcelada', 'Divide o valor em parcelas mensais — uma transação por mês, cada uma na sua competência. Na receita, cada parcela cai no próximo dia útil.'],
  ['Primeiro dia útil do mês', 'Apenas receitas. Informe a competência (mm/aaaa); a data sai no primeiro dia útil desse mês. Marque "mês anterior" para antecipar.'],
  ['Até o 5º dia útil do mês', 'Apenas receitas. Data no 5º dia útil da competência; fica pendente de OK e se confirma sozinho nessa data. Pode antecipar para o mês anterior.'],
  ['Último dia útil do mês', 'Apenas receitas. Informe a competência; a data sai no último dia útil. Marque "mês anterior" para casos como salário de setembro pago no fim de agosto.'],
  ['Semanal', 'Repete a cada 7 dias. Pode fixar um dia da semana ou deixar sem dia fixo.']
];

let menusAtual = null; // cache dos itens carregados (para edição inline)
let subConfigAtiva = 'cat'; // sub-aba selecionada na Configuração

/** Recarrega a aba de configuração e, em seguida, os dropdowns do formulário */
async function recarregarMenus() {
  await carregarAbaMenus();
  if (typeof carregarMenus === 'function') await carregarMenus(); // atualiza form na hora
  if (typeof atualizarUI === 'function') atualizarUI();           // reaplica cores nas listas
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

      <div class="subtabs" role="tablist">
        <button class="subtab active" data-sub="cat">📂 Categorias</button>
        <button class="subtab" data-sub="met">💳 Métodos</button>
        <button class="subtab" data-sub="rec">🔁 Recorrências</button>
      </div>

      <div class="menu-section" data-sub="cat">
        <details class="cat-subgrupo">
          <summary>
            <span class="cat-subgrupo-titulo">📤 Categorias de despesa</span>
            <button type="button" class="h3-add" onclick="event.preventDefault();event.stopPropagation();abrirNovaCategoria('saidas')" title="Nova categoria de despesa">+</button>
          </summary>
          <div class="menu-list" id="categoriasDespesaList"></div>
        </details>
        <details class="cat-subgrupo">
          <summary>
            <span class="cat-subgrupo-titulo">📥 Categorias de receita</span>
            <button type="button" class="h3-add" onclick="event.preventDefault();event.stopPropagation();abrirNovaCategoria('entradas')" title="Nova categoria de receita">+</button>
          </summary>
          <div class="menu-list" id="categoriasReceitaList"></div>
        </details>
      </div>

      <div class="menu-section" data-sub="met" hidden>
        <h3>💳 Métodos de pagamento
          <button type="button" class="h3-add" onclick="abrirNovoMetodo()" title="Novo método">+</button>
        </h3>
        <div class="menu-list" id="metodosList"></div>
      </div>

      <div class="menu-section" data-sub="rec" hidden>
        <h3>🔁 Tipos de recorrência</h3>
        <p class="menu-hint">Tipos fixos do sistema. O único campo editável é a cor do chip.</p>
        <div class="menu-list menu-list--livre" id="recorrenciasList">
          ${RECORRENCIAS_INFO.map(([rotulo, desc]) => {
            // rótulo exibido x nome real do tipo ("Mensal / Contas" -> "Mensal")
            const kind = rotulo === 'Mensal / Contas' ? 'Mensal' : rotulo;
            const linha = (menus.recorrencias || []).find(r => r.nome === kind);
            const c = linha ? corDoItemMenu(linha) : corPadraoChip(kind);
            const id = linha ? linha.linha : '';
            return `
            <div class="menu-item ativo">
              <div class="item-info">
                <div class="item-nome">${rotulo}</div>
                <div class="item-descricao item-descricao--full">${desc}</div>
              </div>
              <div class="item-actions">
                <button class="cor-swatch" style="background:${c}" data-act="cor" data-tipo="Recorrência"
                        data-id="${id}" data-nome="${kind}" title="Cor do chip"></button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  configurarSubtabsConfig();
  mostrarSubConfig(subConfigAtiva);

  renderizarItemsMenu('Categoria', 'categoriasDespesaList', menus.categoriasDespesa);
  renderizarItemsMenu('Categoria', 'categoriasReceitaList', menus.categoriasReceita);
  renderizarItemsMenu('Método', 'metodosList', menus.metodos);

  const recList = document.getElementById('recorrenciasList');
  if (recList) recList.onclick = onMenuListClick;
}

function mostrarSubConfig(sub) {
  subConfigAtiva = sub;
  document.querySelectorAll('.menus-gerenciamento .subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.sub === sub));
  document.querySelectorAll('.menus-gerenciamento .menu-section').forEach(sec => {
    sec.hidden = sec.dataset.sub !== sub;
  });
}

/** Sub-abas da Configuração: Categorias / Métodos / Recorrências */
function configurarSubtabsConfig() {
  const barra = document.querySelector('.menus-gerenciamento .subtabs');
  if (!barra) return;
  barra.addEventListener('click', e => {
    const btn = e.target.closest('.subtab');
    if (btn) mostrarSubConfig(btn.dataset.sub);
  });
}

/* ---------- Render ---------- */

function renderizarItemsMenu(tipo, containerId, itens) {
  const container = document.getElementById(containerId);
  if (!itens || !itens.length) {
    container.innerHTML = `<p class="empty-text">Nada cadastrado</p>`;
    container.onclick = null;
    return;
  }

  // Métodos: ordem fixa Dinheiro -> PIX/Débito -> Crédito (depois por nome)
  if (tipo === 'Método') {
    const rank = m => (m.metodoKind === 'Dinheiro' || m.nome === 'Dinheiro') ? 0
      : m.metodoKind === 'PIX/Débito' ? 1
      : m.metodoKind === 'Crédito' ? 2 : 3;
    itens = [...itens].sort((a, b) =>
      rank(a) - rank(b) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  }

  container.innerHTML = itens.map(item => {
    const statusClass = item.status === 'Ativo' ? 'ativo' : 'inativo';
    const statusLabel = item.status === 'Ativo' ? '✓ Ativo' : '✗ Inativo';

    let titulo = item.nome;
    let sub = '';
    if (tipo === 'Categoria') {
      sub = item.descricao || '';
    } else if (tipo === 'Método') {
      if (item.metodoKind === 'Crédito') {
        titulo = `Crédito - ${item.banco || '?'}`;
        const linha2 = [`Vira ${item.diaFechamento || '?'}`];
        if (item.melhorDiaCompra) linha2.push(`Melhor dia ${item.melhorDiaCompra}`);
        sub = `Vcto ${item.diaVencimento || '?'}<br>${linha2.join(' · ')}`;
      } else if (item.metodoKind === 'PIX/Débito') {
        titulo = item.banco || 'PIX/Débito';
        sub = item.banco ? 'PIX/Débito' : '';
      } else {
        titulo = 'Dinheiro';
        sub = '';
      }
    }

    // Dinheiro é método fixo: sem edição/remoção (mas ainda escolhe cor)
    const fixo = tipo === 'Método' && (item.metodoKind === 'Dinheiro' || item.nome === 'Dinheiro');

    const swatch = `<button class="cor-swatch" style="background:${corDoItemMenu(item)}"
        data-act="cor" data-tipo="${tipo}" data-id="${item.linha}" data-nome="${item.nome}" title="Cor do chip"></button>`;

    const acoes = `
      <div class="item-actions">
        ${swatch}
        ${fixo ? '' : `
        <button class="btn-icon" data-act="editar" data-tipo="${tipo}" data-id="${item.linha}" title="Editar">✏️</button>
        <button class="btn-icon ${item.status === 'Ativo' ? 'btn-warning' : 'btn-success'}"
                data-act="${item.status === 'Ativo' ? 'desativar' : 'ativar'}" data-id="${item.linha}"
                title="${item.status === 'Ativo' ? 'Desativar' : 'Ativar'}">${item.status === 'Ativo' ? '⊘' : '↻'}</button>
        <button class="btn-icon btn-danger" data-act="remover" data-id="${item.linha}" title="Remover">🗑️</button>`}
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

  if (act === 'cor')       return abrirSeletorCor(btn);
  if (act === 'ativar')    return acaoMenu(() => ativarItemMenuAPI(id));
  if (act === 'desativar') return acaoMenu(() => desativarItemMenuAPI(id));
  if (act === 'remover')   return confirmarRemocao(btn, id);
  if (act === 'editar')    return abrirEdicaoInline(row, id, tipo);
}

/** Seletor de cor do "chip" (paleta + cor livre). Único campo editável em Recorrências. */
function abrirSeletorCor(btn) {
  const tipo = btn.dataset.tipo;
  const nome = btn.dataset.nome || '';
  let id = Number(btn.dataset.id) || null;
  const corAtual = (btn.style.background || '').trim() || corPadraoChip(nome);

  const swatches = PALETA_CHIPS.map(c =>
    `<button type="button" class="cor-opcao" data-cor="${c}" style="background:${c}"></button>`).join('');

  mostrarDialogo({
    titulo: `Cor · ${nome}`,
    corpoHTML: `
      <div class="cor-grade">${swatches}</div>
      <div class="campo"><label for="dlgCorLivre">Cor personalizada</label>
        <input type="color" id="dlgCorLivre" value="${paraHex(corAtual)}"></div>`,
    acoes: [
      { label: 'Cancelar' },
      { label: 'Salvar', primario: true, onClick: async (ov) => {
          const sel = ov.querySelector('.cor-opcao.sel');
          const cor = sel ? sel.dataset.cor : ov.querySelector('#dlgCorLivre').value;
          // Recorrência sem linha ainda: cria antes
          if (!id && tipo === 'Recorrência') {
            const { data } = await sb.from('menu_itens')
              .insert({ tipo: 'Recorrência', nome, cor }).select('id').single();
            id = data && data.id;
          } else if (id) {
            await editarItemMenuAPI(id, { cor });
          }
          await recarregarMenus();
      } }
    ]
  });

  // seleção visual na grade
  const ov = document.querySelector('.dialogo-overlay');
  ov?.querySelectorAll('.cor-opcao').forEach(b => {
    b.addEventListener('click', () => {
      ov.querySelectorAll('.cor-opcao').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      const livre = ov.querySelector('#dlgCorLivre');
      if (livre) livre.value = paraHex(b.dataset.cor);
    });
  });
}

/** rgb()/hex -> "#rrggbb" (input type=color exige hex) */
function paraHex(c) {
  if (!c) return '#888888';
  if (c[0] === '#') return c.length === 4
    ? '#' + [...c.slice(1)].map(x => x + x).join('') : c.slice(0, 7);
  const m = c.match(/\d+/g);
  if (!m || m.length < 3) return '#888888';
  return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
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
      <div class="campo"><label>Banco ${ehCredito ? '' : '<span class="opt">(opcional)</span>'}</label>
        <input type="text" class="edt-banco" value="${esc(item.banco)}"></div>
      ${ehCredito ? `
        <div class="campo"><label>Vencimento (dia)</label>
          <input type="text" class="edt-venc" inputmode="numeric" maxlength="2" value="${item.diaVencimento || ''}"></div>
        <div class="campo"><label>Fechamento (dia) <span class="opt">(opcional)</span></label>
          <input type="text" class="edt-fech" inputmode="numeric" maxlength="2" value="${item.diaFechamento || ''}"></div>
        <div class="campo"><label>Melhor dia <span class="opt">(opcional)</span></label>
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
    if (ehCredito && !banco) return mostrarNotificacao('Informe o banco', 'info');
    const campos = { banco, nome: banco ? `${item.metodoKind} — ${banco}` : item.metodoKind };
    if (ehCredito) {
      const fechRaw = row.querySelector('.edt-fech').value.trim();
      const fech = parseInt(fechRaw, 10);
      const venc = parseInt(row.querySelector('.edt-venc').value, 10);
      const melhorIn = parseInt(row.querySelector('.edt-melhor').value, 10);
      if (!(venc >= 1 && venc <= 31)) return mostrarNotificacao('Vencimento inválido', 'erro');
      const temFech = fech >= 1 && fech <= 31;
      if (fechRaw && !temFech) return mostrarNotificacao('Fechamento inválido', 'erro');
      campos.dia_vencimento = venc;
      campos.dia_fechamento = temFech ? fech : null;
      campos.melhor_dia_compra = melhorIn || (temFech ? sugerirMelhorDiaCompra(fech) : null) || null;
    }
    if (await editarItemMenuAPI(id, campos)) recarregarMenus();
  };
}

