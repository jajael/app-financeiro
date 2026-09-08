/**
 * INTERFACE DO USUÁRIO
 * Renderização e atualização do DOM
 */

/**
 * Atualiza toda a interface
 */
function atualizarUI() {
    // Atualizar cabeçalho com mês
    const mesEl = document.querySelector(SELECTORS.currentMonth);
    if (mesEl) {
        const full = mesEl.querySelector('.mes-full');
        const curto = mesEl.querySelector('.mes-curto');
        const mini = mesEl.querySelector('.mes-mini');
        if (full && curto) {
            full.textContent = obterMesAnoFormatado(estadoApp.mesAtual);
            curto.textContent = obterMesAnoCurto(estadoApp.mesAtual);
            if (mini) mini.textContent = obterMesAnoMini(estadoApp.mesAtual);
        } else {
            mesEl.textContent = obterMesAnoFormatado(estadoApp.mesAtual);
        }
    }
    
    // Atualizar resumo
    atualizarResumo();
    
    // Atualizar listas
    atualizarEntradasLista();
    atualizarSaidasLista();
}

/**
 * Atualiza card de resumo
 */
function atualizarResumo() {
    const resumo = obterResumoFormatado();
    
    const totalEntradasEl = document.querySelector(SELECTORS.totalEntradas);
    const totalSaidasEl = document.querySelector(SELECTORS.totalSaidas);
    const balancoEl = document.querySelector(SELECTORS.balanco);
    
    if (totalEntradasEl) totalEntradasEl.textContent = resumo.entradas;
    if (totalSaidasEl) totalSaidasEl.textContent = resumo.saidas;

    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = formatarMoeda(v || 0); };
    setTxt('entradasAtual', estadoApp.resumo.entradasAtual);
    setTxt('entradasAReceber', estadoApp.resumo.entradasAReceber);
    setTxt('saidasAtual', estadoApp.resumo.saidasAtual);
    setTxt('saidasAPagar', estadoApp.resumo.saidasAPagar);

    if (balancoEl) {
        balancoEl.textContent = resumo.balanco;
        // Balanço sempre com a cor "balanço" (amarelo) — sem tema por saldo.
        const card = balancoEl.closest('.summary-card');
        if (card) card.style.cssText = '';
    }

    // Gasto diário = balanço / dias restantes do mês vigente
    const gd = document.getElementById('gastoDiario');
    const gdSub = document.getElementById('gastoDiarioSub');
    const gastoDiarioValor = (estadoApp.resumo.balanco || 0) / diasRestantesMesVigente();
    if (gd) {
        const dias = diasRestantesMesVigente();
        gd.textContent = formatarMoeda(gastoDiarioValor);
        if (gdSub) gdSub.textContent = `${dias} dia${dias === 1 ? '' : 's'} restante${dias === 1 ? '' : 's'}`;
    }

    // Espelha os totais no resumo compacto (barra fixa) — com "R$", sem centavos ",00"
    const setMini = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = formatarMoeda(v || 0); };
    setMini('miniEntradas', estadoApp.resumo.entradas);
    setMini('miniSaidas', estadoApp.resumo.saidas);
    setMini('miniBalanco', estadoApp.resumo.balanco);
    setMini('miniGasto', gastoDiarioValor);
}

/** Dias restantes do mês corrente, incluindo hoje (mínimo 1) */
function diasRestantesMesVigente() {
    const hoje = new Date();
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    return Math.max(1, ultimoDia - hoje.getDate() + 1);
}

function atualizarEntradasLista() {
    renderListaAgrupada(document.querySelector(SELECTORS.entradasLista),
        estadoApp.transacoes.entradas, 'entrada', 'Nenhuma receita neste mês');
}

function atualizarSaidasLista() {
    renderListaAgrupada(document.querySelector(SELECTORS.saidasLista),
        estadoApp.transacoes.saidas, 'saida', 'Nenhuma despesa neste mês');
}

const _porDataDesc = (a, b) => new Date(b.data) - new Date(a.data);

/**
 * Renderiza a lista de um tipo em subgrupos recolhíveis por tipo de recorrência.
 * Cada subgrupo mostra o total; começa recolhido (como as categorias na Config).
 */
function renderListaAgrupada(container, transacoes, tipoUI, msgVazia) {
    if (!container) return;
    if (!transacoes || !transacoes.length) {
        container.innerHTML = `<p class="empty-message">${msgVazia}</p>`;
        container.onclick = null;
        return;
    }

    const ehDespesa = tipoUI === 'saida';
    const cores = (estadoApp.menus && estadoApp.menus.cores && estadoApp.menus.cores.recorrencia) || {};
    const totalGrupo = arr => arr.reduce((s, t) => s + ((t.valorMes != null ? t.valorMes : t.valor) || 0), 0);
    const chaveDe = t => t.tipoRecorrencia || 'Pontual';

    // Ordem: Pontual primeiro, depois os fixos na ordem padrão
    const ordem = ['Pontual', ...ORDEM_RECORRENCIA.filter(t => t !== 'Pontual')];
    const conhecidos = new Set(ordem);
    const grupos = [];
    ordem.forEach(tipoRec => {
        const itens = transacoes.filter(t => chaveDe(t) === tipoRec).sort(_porDataDesc);
        if (itens.length) grupos.push([tipoRec, itens]);
    });
    const resto = transacoes.filter(t => !conhecidos.has(chaveDe(t))).sort(_porDataDesc);
    if (resto.length) grupos.push(['Outros', resto]);

    container.innerHTML = grupos.map(([tipoRec, itens]) => {
        const rotulo = (tipoRec === 'Mensal' && ehDespesa) ? 'Contas' : tipoRec;
        const c = cores[tipoRec] || corPadraoChip(tipoRec);
        return `
        <details class="rec-grupo">
          <summary style="--cor-rec:${c}">
            <span class="rec-grupo-nome">${rotulo}</span>
            <span class="rec-grupo-contagem">${itens.length}</span>
            <span class="rec-grupo-total">${formatarMoeda(totalGrupo(itens))}</span>
          </summary>
          <div class="rec-grupo-itens">
            ${itens.map(t => gerarHTMLTransacao(t, tipoUI)).join('')}
          </div>
        </details>`;
    }).join('');

    container.onclick = onListaTransacaoClick;
}

// Cache das "próximas" para permitir expandir/retrair esses boxes também
let _proximasCtx = [];

/** Contexto de um lançamento nas listas do mês (Receitas/Despesas) */
function ctxNoMes(id) {
    const e = estadoApp.transacoes.entradas.find(t => t.id === id);
    if (e) return { trans: e, tipoUI: 'entrada', opts: {} };
    const s = estadoApp.transacoes.saidas.find(t => t.id === id);
    if (s) return { trans: s, tipoUI: 'saida', opts: {} };
    return null;
}

/** Acha um lançamento por id em qualquer lista (mês ou "próximas") */
function acharCtxTransacao(id) {
    return ctxNoMes(id) || _proximasCtx.find(x => x.trans.id === id) || null;
}

/**
 * Alterna o "box completo" (compacto <-> completo). Re-renderiza TODAS as
 * cópias do item (o mesmo id pode estar em Receitas/Despesas e em Próximas),
 * cada uma com o contexto certo.
 */
function alternarExpandirTransacao(id) {
    if (itensExpandidos.has(id)) itensExpandidos.delete(id);
    else itensExpandidos.add(id);

    document.querySelectorAll(`.despesa-item[data-id="${id}"]`).forEach(el => {
        const ctx = el.closest('#proximasLista')
            ? _proximasCtx.find(x => x.trans.id === id)
            : ctxNoMes(id);
        if (ctx) el.outerHTML = gerarHTMLTransacao(ctx.trans, ctx.tipoUI, ctx.opts);
    });
}

/**
 * Gera HTML para uma transação
 */
// Ids de lançamentos com o "box completo" aberto (default: todos compactos)
const itensExpandidos = new Set();

function gerarHTMLTransacao(trans, tipo, opts = {}) {
    const compacto = !itensExpandidos.has(trans.id);
    const ehSemanalChips = trans.tipoRecorrencia === 'Semanal' && Array.isArray(trans.semanas) && trans.semanas.length;
    const valorFormatado = ehSemanalChips
        ? `${formatarMoeda(trans.valor)} <span class="valor-meta">/ ${formatarMoeda(trans.valorMes)}</span>`
        : formatarMoeda(trans.valor);
    const sinal = tipo === 'entrada' ? '+' : '-';

    // Cores dos "chips" (tarjinhas) de método / categoria
    const cores = (estadoApp.menus && estadoApp.menus.cores) || {};
    const cor = (mapa, nome) => (mapa && mapa[nome]) || corPadraoChip(nome);
    const chip = (c, txt) => `<span class="chip" style="background:${c}" title="${String(txt).replace(/"/g, '&quot;')}">${txt}</span>`;

    // Dia do mês (sem mês/ano)
    const diaFormatado = trans.data
        ? String(parseDataLocal(trans.data).getDate()).padStart(2, '0')
        : '--';

    const tagPendente = trans.pendente
        ? '<span class="pendente-badge">a confirmar</span>' : '';
    const quandoTag = opts.quando ? `<span class="quando-tag">${opts.quando}</span>` : '';

    const ehParcela = !!trans.parcelasTotal;
    const ehOriginal = ehParcela && trans.parcelaNum === 1;

    // Botão expandir/colapsar — fica no canto esquerdo, ao lado do dia
    const toggle = compacto
        ? `<button class="btn-expandir" data-act="expandir-trans" data-id="${trans.id}" title="Ver detalhes">+</button>`
        : `<button class="btn-expandir" data-act="colapsar-trans" data-id="${trans.id}" title="Recolher">−</button>`;
    const lado = `<div class="despesa-lado">${toggle}<span class="despesa-dia">${diaFormatado}</span></div>`;

    // Ações (nas "próximas" fica só o botão de expandir)
    let acoes = '';
    if (!opts.semAcoes) {
        if (trans.pendente) {
            acoes += `<button class="btn-ok" data-act="confirmar-trans" data-id="${trans.id}" title="Confirmar este mês">OK</button>`;
        }
        if (ehParcela && !trans.quitada && !compacto) {
            const chk = trans.quitadoEm ? 'checked' : '';
            acoes += `<label class="quitar-check" title="Quitar a partir deste mês"><input type="checkbox" data-act="quitar-parc" data-id="${trans.id}" ${chk}> quitar</label>`;
        }
        if (!ehParcela || ehOriginal) {
            acoes += `<button class="btn-icon" data-act="editar-trans" data-id="${trans.id}" title="Editar">✏️</button>`;
        }
        if (!trans.quitada) {
            acoes += `<button class="btn-icon btn-danger" data-act="excluir-trans" data-id="${trans.id}" title="Excluir">🗑️</button>`;
        }
    }

    const classes = `despesa-item ${tipo}`
        + (compacto ? ' compacta' : '')
        + (trans.pendente ? ' pendente' : '')
        + (trans.quitada ? ' quitada' : '');

    if (compacto) {
        return `
        <div class="${classes}" data-id="${trans.id}" data-tipo-transacao="${tipo === 'entrada' ? 'entradas' : 'saidas'}">
            ${lado}
            <span class="despesa-valor">${sinal} ${valorFormatado}</span>
            ${quandoTag}
            ${tagPendente}
            <div class="despesa-actions">${acoes}</div>
        </div>`;
    }

    // Box completo
    let metodoLinha = '';
    if (trans.metodo) {
        metodoLinha = `<div class="despesa-metodo">${chip(cor(cores.metodo, trans.metodo), trans.metodo)}</div>`;
    } else if (trans.formaPagamento && trans.formaPagamento !== 'À vista') {
        metodoLinha = `<div class="despesa-metodo">${trans.formaPagamento}</div>`;
    }
    const catChip = chip(cor(cores.categoria, trans.categoria), trans.categoria);
    const descLinha = trans.descricao
        ? `<div class="despesa-desc-linha">${trans.descricao}</div>` : '';

    // Box completo: uma coisa por linha — valor / método / categoria / descrição
    return `
        <div class="${classes}" data-id="${trans.id}" data-tipo-transacao="${tipo === 'entrada' ? 'entradas' : 'saidas'}">
            ${lado}
            <div class="despesa-info">
                <div class="despesa-topo">
                    <span class="despesa-valor">${sinal} ${valorFormatado}</span>
                    ${quandoTag}
                    ${tagPendente}
                </div>
                ${metodoLinha}
                <div class="despesa-cat">${catChip}</div>
                ${descLinha}
            </div>
            <div class="despesa-actions">${acoes}</div>
        </div>
    `;
}

/** Delegação de clique nas listas de transações */
function onListaTransacaoClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) {
        // Clique em qualquer outra parte do box: expande/retrai
        // (ignora cliques em controles como o checkbox "quitar")
        if (e.target.closest('label, input, button, a')) return;
        const item = e.target.closest('.despesa-item');
        if (item && item.dataset.id && acharCtxTransacao(Number(item.dataset.id))) {
            alternarExpandirTransacao(Number(item.dataset.id));
        }
        return;
    }
    const id = Number(el.dataset.id);

    // Expandir/retrair vale também para as "próximas" (não estão em estadoApp.transacoes)
    if (el.dataset.act === 'expandir-trans' || el.dataset.act === 'colapsar-trans') {
        alternarExpandirTransacao(id);
        return;
    }

    const trans = [...estadoApp.transacoes.entradas, ...estadoApp.transacoes.saidas]
        .find(t => t.id === id);
    if (!trans) return;

    switch (el.dataset.act) {
        case 'confirmar-trans':
            confirmarPendente(id);
            break;
        case 'quitar-parc':
            quitarParcelamento(id, el.checked);
            break;
        case 'editar-trans': {
            const tipo = estadoApp.transacoes.entradas.some(t => t.id === id) ? 'entradas' : 'saidas';
            iniciarEdicaoTransacao(trans, tipo);
            break;
        }
        case 'excluir-trans':
            // Parcela que não é a original: aviso, sem arme de 2 cliques
            if (trans.parcelasTotal && trans.parcelaNum !== 1) {
                excluirTransacao(id); // deixa a API lançar o detalhe e o catch mostra o diálogo
            } else if (el.dataset.armed) {
                excluirTransacao(id);
            } else {
                const orig = el.textContent;
                el.dataset.armed = '1';
                el.textContent = 'excluir?';
                el.classList.add('armed');
                setTimeout(() => { delete el.dataset.armed; el.textContent = orig; el.classList.remove('armed'); }, 3000);
            }
            break;
    }
}

async function excluirTransacao(id) {
    try {
        await deletarTransacaoAPI(id);
        mostrarNotificacao('Transação excluída', 'sucesso');
        await recarregarDados();
        atualizarUI();
    } catch (e) {
        if (e && e.detalhe && e.detalhe.tipo === 'parcela-nao-original') {
            const comp = e.detalhe.competenciaOriginal;
            const label = competenciaParaBR(comp);
            mostrarDialogo({
                titulo: 'Só a 1ª parcela pode ser apagada',
                texto: `A parcela original está em <strong>${label}</strong>. Apagar a original remove todas as parcelas.`,
                acoes: [
                    { label: `Ir para ${label}`, primario: true, onClick: () => irParaMes(comp) },
                    { label: 'Fechar' }
                ]
            });
            return;
        }
        console.error(e);
        mostrarNotificacao('Erro ao excluir', 'erro');
    }
}

async function quitarParcelamento(id, quitar) {
    try {
        await quitarParcelamentoAPI(id, quitar);
        mostrarNotificacao(quitar ? '✓ Parcelamento quitado' : 'Quitação desfeita', 'sucesso');
        await recarregarDados();
        atualizarUI();
    } catch (e) {
        console.error(e);
        mostrarNotificacao('Erro ao quitar', 'erro');
        await recarregarDados();
        atualizarUI();
    }
}

/** Navega a visão mensal para a competência informada (YYYY-MM-01) */
function irParaMes(competencia) {
    if (!competencia) return;
    estadoApp.mesAtual = parseDataLocal(competencia);
    recarregarDados().then(atualizarUI);
}

async function confirmarPendente(id) {
    try {
        await confirmarPendenteAPI(id);
        mostrarNotificacao('✓ Mês confirmado', 'sucesso');
        await recarregarDados();
        atualizarUI();
    } catch (e) {
        console.error(e);
        mostrarNotificacao('Erro ao confirmar', 'erro');
    }
}

/** Carrega a transação no formulário da aba Adicionar em modo edição */
function iniciarEdicaoTransacao(trans, tipoTransacao) {
    estadoApp.editandoId = trans.id;
    // Guarda a tela de origem para voltar depois de salvar/cancelar
    estadoApp.abaOrigemEdicao = document.querySelector('.tab-btn.active')?.dataset.tab || null;

    mudarAba('adicionar');

    // Tipo (entrada/saída) sem recarregar menus
    estadoApp.tipoAtual = tipoTransacao;
    const tipoField = document.querySelector(SELECTORS.tipoTransacao);
    if (tipoField) tipoField.value = tipoTransacao;
    document.querySelectorAll('.tipo-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tipo === tipoTransacao));
    atualizarLabelsPorTipo();

    document.querySelector(SELECTORS.data).value = isoParaDataBR(trans.data);
    document.querySelector(SELECTORS.valor).value =
        (trans.tipoRecorrencia === 'Semanal' && trans.valorSessao != null) ? trans.valorSessao : trans.valor;
    semanasMarcadas = new Set(trans.semanas || []);
    document.querySelector(SELECTORS.categoria).value = trans.categoria;
    document.querySelector(SELECTORS.descricao).value = trans.descricao || '';
    document.querySelector(SELECTORS.metodo).value = trans.metodo || '';
    document.querySelector(SELECTORS.tipoRecorrencia).value = trans.tipoRecorrencia || 'Pontual';

    const diaRec = document.getElementById('diaRecorrencia');
    if (diaRec) diaRec.value = trans.diaRecorrencia || '';
    const pv = document.getElementById('pagarVencimento');
    if (pv) pv.checked = !!trans.pagarNoVencimento;
    const diaSem = document.getElementById('diaSemana');
    if (diaSem) diaSem.value = trans.diaSemana ?? '';
    const parc = document.getElementById('parcelas');
    if (parc) parc.value = 1;
    const comp = document.getElementById('competencia');
    if (comp) { comp.value = competenciaParaBR(trans.competencia); comp.dataset.editado = comp.value ? '1' : ''; }

    // Recorrências "dia útil fixo": restaura a competência
    const ehDiaUtil = typeof RECORRENCIA_DIA_UTIL !== 'undefined'
        && RECORRENCIA_DIA_UTIL.includes(trans.tipoRecorrencia);
    const compRec = document.getElementById('compRecorrente');
    if (compRec) compRec.value = ehDiaUtil ? mesDeCompetencia(trans.competencia) : '';

    atualizarCamposRecorrencia();
    atualizarCampoCredito();

    const btn = document.querySelector('.btn-submit');
    if (btn) btn.textContent = 'Salvar alterações';

    const cancelar = document.getElementById('cancelarEdicao');
    if (cancelar) cancelar.hidden = false;
}

/** Sai do modo edição e limpa o formulário */
function cancelarEdicaoTransacao(voltarParaOrigem = true) {
    const origem = estadoApp.abaOrigemEdicao;
    estadoApp.editandoId = null;
    estadoApp.abaOrigemEdicao = null;
    semanasMarcadas = new Set();
    limparFormulario();
    const btn = document.querySelector('.btn-submit');
    if (btn) btn.textContent = 'Adicionar';
    const cancelar = document.getElementById('cancelarEdicao');
    if (cancelar) cancelar.hidden = true;
    // Cancelar pelo botão: volta para a tela onde o usuário estava
    if (voltarParaOrigem && origem && typeof mudarAba === 'function') mudarAba(origem);
}

/**
 * Atualiza gráfico de categorias
 */
async function atualizarGrafico() {
    const container = document.querySelector(SELECTORS.categoriesList);
    if (!container) return;
    
    const transacoes = estadoApp.transacoes.saidas;
    
    // Agrupar por categoria
    const porCategoria = {};
    transacoes.forEach(trans => {
        if (!porCategoria[trans.categoria]) {
            porCategoria[trans.categoria] = 0;
        }
        porCategoria[trans.categoria] += trans.valor;
    });
    
    // Ordenar por valor decrescente
    const categoriasOrdenadas = Object.entries(porCategoria)
        .sort((a, b) => b[1] - a[1]);
    
    if (categoriasOrdenadas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma despesa neste mês</p>';
        return;
    }
    
    // Total para percentual
    const total = Object.values(porCategoria).reduce((a, b) => a + b, 0);
    
    // Gerar HTML
    let html = '';
    categoriasOrdenadas.forEach((entrada, index) => {
        const [categoria, valor] = entrada;
        const percentual = total > 0 ? (valor / total) * 100 : 0;
        const cor = CORES_CATEGORIAS[index % CORES_CATEGORIAS.length];
        
        html += `
            <div class="category-item">
                <div class="category-color" style="background-color: ${cor};"></div>
                <div class="category-info">
                    <div class="category-name">${categoria}</div>
                    <div class="category-bar">
                        <div class="category-fill" style="width: ${percentual}%; background-color: ${cor};"></div>
                    </div>
                </div>
                <div class="category-value">
                    ${formatarMoeda(valor)} (${percentual.toFixed(1)}%)
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Atualiza lista de próximas transações
 */
async function atualizarProximasTransacoes() {
    const container = document.querySelector(SELECTORS.proximasLista);
    if (!container) return;
    
    try {
        // Carregar próximas de ambos os tipos
        const proximasEntradas = await carregarProximas('entradas');
        const proximasSaidas = await carregarProximas('saidas');
        
        const proximas = [...proximasEntradas, ...proximasSaidas]
            .sort((a, b) => new Date(a.proximaData) - new Date(b.proximaData));
        
        if (proximas.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma transação programada nos próximos 30 dias</p>';
            container.onclick = null;
            _proximasCtx = [];
            return;
        }

        // Mesmo box de Receitas/Despesas: dia (da próxima data) + valor, expansível
        _proximasCtx = proximas.map(trans => {
            const tipoUI = proximasEntradas.some(t => t.id === trans.id) ? 'entrada' : 'saida';
            const dias = calcularDiasAte(trans.proximaData);
            const quando = dias <= 0 ? 'hoje' : `em ${dias}d`;
            return { trans: { ...trans, data: trans.proximaData }, tipoUI, opts: { quando, semAcoes: true } };
        });

        container.innerHTML = _proximasCtx
            .map(c => gerarHTMLTransacao(c.trans, c.tipoUI, c.opts))
            .join('');
        container.onclick = onListaTransacaoClick;
    } catch (error) {
        console.error('Erro ao atualizar próximas transações:', error);
        container.innerHTML = '<p class="empty-message">Erro ao carregar próximas transações</p>';
    }
}

/**
 * Define o texto de um label usando a versão curta quando a completa não
 * couber em uma única linha (labels nunca podem quebrar linha no formulário).
 */
function definirLabelResp(sel, full, short) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return;
    el.textContent = full;
    if (!short) return;
    const semEspaco = window.innerWidth < 560
        || (el.offsetParent !== null && el.scrollWidth > el.clientWidth + 1);
    if (semEspaco) el.textContent = short;
}

/**
 * Quando, no grid de campos, o último campo visível fica sozinho na linha,
 * faz ele ocupar 100% da largura (ex.: "Descrição").
 */
function ajustarCamposSozinhos() {
    const grid = document.getElementById('linhaCampos');
    if (!grid) return;
    grid.querySelectorAll('.solo').forEach(el => el.classList.remove('solo'));
    const cols = (getComputedStyle(grid).gridTemplateColumns.match(/px|fr|%|rem/g) || []).length
        || getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length || 1;
    const cells = [...grid.children].filter(el => !el.hidden && el.offsetParent !== null);
    if (cols > 1 && cells.length % cols === 1) {
        cells[cells.length - 1].classList.add('solo');
    }
}

/**
 * Mostra/esconde os campos que dependem do tipo de recorrência
 * (dia + checkbox "vencimento" para Mensal/Parcelada; nº de parcelas para Parcelada)
 */
function atualizarCamposRecorrencia() {
    const tipo = document.querySelector(SELECTORS.tipoRecorrencia).value;
    const ehReceita = document.querySelector(SELECTORS.tipoTransacao)?.value === 'entradas';
    const comDia = tipo === 'Mensal' || tipo === 'Parcelada';
    const ehSemanal = tipo === 'Semanal';
    const ehCalculada = typeof RECORRENCIA_DIA_UTIL !== 'undefined'
        && RECORRENCIA_DIA_UTIL.includes(tipo);
    // Receita Mensal/Parcelada: a data é automática = próximo dia útil (sem checkbox)
    const receitaAuto = ehReceita && comDia;

    const set = (id, mostrar) => { const el = document.getElementById(id); if (el) el.hidden = !mostrar; };
    set('diaRecorrenciaGroup', comDia);
    set('parceleGroup', tipo === 'Parcelada');
    set('diaSemanaGroup', ehSemanal);
    set('dataCalculadaGroup', ehCalculada);
    // Semanal não usa a área de Data -> esconde a célula inteira (evita buraco no grid)
    set('dataCell', !ehSemanal);

    // Checkbox "pagar no vencimento": só despesa com dia de vencimento (Contas/Parcelada)
    const chkWrap = document.getElementById('pagarVencimentoWrap');
    if (chkWrap) chkWrap.hidden = ehReceita || !comDia;
    const chk = document.getElementById('pagarVencimento');
    if ((ehReceita || !comDia) && chk) chk.checked = false;

    // Campo "Data" livre: escondido para dia-útil fixo e Semanal
    const mostrarData = !ehCalculada && !ehSemanal;
    set('dataGroup', mostrarData);
    const dataMain = document.querySelector(SELECTORS.data);
    if (dataMain) dataMain.required = mostrarData;

    // Rótulos do contexto (nunca ocupam mais de 1 linha; encurtam em tela estreita)
    if (receitaAuto || (!ehReceita && comDia)) {
        definirLabelResp('label[for="data"]', 'Pagamento', 'Pgto.');
    } else {
        definirLabelResp('label[for="data"]', 'Data', null);
    }
    definirLabelResp('label[for="diaRecorrencia"]',
        ehReceita ? 'Pagamento' : 'Vencimento',
        ehReceita ? 'Pgto.' : 'Vcto.');

    // Prefill do dia de vencimento/pagamento com o dia da data digitada, se vazio
    const diaInput = document.getElementById('diaRecorrencia');
    if (comDia && diaInput && !diaInput.value) {
        const iso = parseDataBR(document.querySelector(SELECTORS.data).value);
        if (iso) diaInput.value = String(parseInt(iso.slice(8, 10), 10));
    }

    // Guarda a data livre atual antes de qualquer cálculo automático sobrescrevê-la
    if (dataMain && (ehCalculada || receitaAuto) && !dataMain.readOnly && !dataMain.dataset.userVal) {
        dataMain.dataset.userVal = dataMain.value;
    }

    // Data derivada da competência (primeiro / 5º / último dia útil, deste mês ou do anterior)
    if (ehCalculada) {
        definirLabelResp('label[for="compRecorrente"]', 'Mês de ref.', 'Ref.');
        definirLabelResp('label[for="dataCalculada"]', 'Data', null);
        const compEl = document.getElementById('compRecorrente');
        if (compEl && !compEl.value && typeof estadoApp !== 'undefined' && estadoApp.mesAtual) {
            compEl.value = mesDeCompetencia(formatarDataISO(estadoApp.mesAtual));
        }
        const compISO = competenciaDeMes(compEl ? compEl.value : '');
        const dataISO = compISO ? dataDiaUtilPorCompetencia(compISO, tipo) : '';
        const campo = document.getElementById('dataCalculada');
        if (campo) campo.value = dataISO ? isoParaDataBR(dataISO) : '';
        if (dataMain && dataISO) dataMain.value = isoParaDataBR(dataISO);
    }

    // Receita Mensal/Parcelada: data automática = dia informado no próximo dia útil
    if (dataMain) {
        if (receitaAuto) {
            dataMain.dataset.autoReceita = '1';
            const compISO = (typeof estadoApp !== 'undefined' && estadoApp.mesAtual)
                ? formatarDataISO(estadoApp.mesAtual) : hojeISO();
            const dia = document.getElementById('diaRecorrencia')?.value || '';
            dataMain.value = isoParaDataBR(dataReceitaMensal(compISO, dia));
            dataMain.readOnly = true;
            dataMain.classList.add('campo-travado');
        } else {
            delete dataMain.dataset.autoReceita;
            // Voltou para uma data livre: restaura o que o usuário tinha digitado
            if (!ehCalculada && dataMain.readOnly) {
                dataMain.readOnly = false;
                dataMain.classList.remove('campo-travado');
            }
            if (mostrarData && dataMain.dataset.userVal != null && !chk?.checked) {
                dataMain.value = dataMain.dataset.userVal;
                delete dataMain.dataset.userVal;
            }
        }
    }

    // Semanal: chips por semana (dia fixo -> "seg 07"; sem dia fixo -> "semana 1")
    set('semanasChipsRow', ehSemanal);
    if (ehSemanal) renderSemanasChips();

    // "Pagar no vencimento": trava a data do lançamento no dia do vencimento (despesa)
    aplicarPagarVencimento();

    ajustarCamposSozinhos();
}

/**
 * Ajusta rótulos e campos conforme o tipo (receita = entradas | despesa = saidas):
 * - receita não tem método (campo escondido, não obrigatório)
 * - "Dia de vencimento" vira "Dia do pagamento"; checkbox muda de texto
 */
function atualizarLabelsPorTipo() {
    const ehReceita = document.querySelector(SELECTORS.tipoTransacao)?.value === 'entradas';

    const metodoSel = document.querySelector(SELECTORS.metodo);
    const grpMetodo = metodoSel?.closest('.form-group');
    if (grpMetodo) grpMetodo.hidden = ehReceita;
    if (metodoSel) {
        metodoSel.required = !ehReceita;
        if (ehReceita) metodoSel.value = '';
    }
    if (ehReceita) {
        const compGrp = document.getElementById('competenciaGroup');
        if (compGrp) compGrp.hidden = true;
    } else if (typeof atualizarCampoCredito === 'function') {
        atualizarCampoCredito();
    }

    definirLabelResp('label[for="diaRecorrencia"]',
        ehReceita ? 'Pagamento' : 'Vencimento',
        ehReceita ? 'Pgto.' : 'Vcto.');
    const lblChk = document.getElementById('pagarVencimentoLabel');
    if (lblChk) lblChk.textContent = ehReceita ? 'receber neste dia' : 'pagar no vencimento';

    // Recorrência "Mensal" aparece como "Contas" nas despesas -> refaz o dropdown
    if (typeof preencherDropdownRecorrencias === 'function') preencherDropdownRecorrencias();
    // Categorias são específicas de receita x despesa
    if (typeof preencherDropdownCategorias === 'function') preencherDropdownCategorias();

    ajustarCamposSozinhos();
}

/**
 * Diálogo rápido para criar uma categoria.
 * @param {'saidas'|'entradas'} [catTipo] tipo da categoria; se omitido usa o tipo atual do formulário
 */
function abrirNovaCategoria(catTipo) {
    const tipo = (catTipo === 'entradas' || catTipo === 'saidas')
        ? catTipo
        : (estadoApp.tipoAtual === 'entradas' ? 'entradas' : 'saidas');
    const rotulo = tipo === 'entradas' ? 'receita' : 'despesa';
    mostrarDialogo({
        titulo: `Nova categoria de ${rotulo}`,
        corpoHTML: `
            <div class="campo"><label for="dlgCatNome">Nome</label>
                <input type="text" id="dlgCatNome" placeholder="Ex: Mercado" autocomplete="off"></div>
            <div class="campo"><label for="dlgCatDesc">Descrição <span class="opt">(opcional)</span></label>
                <input type="text" id="dlgCatDesc" autocomplete="off"></div>`,
        acoes: [
            { label: 'Cancelar' },
            { label: 'Adicionar', primario: true, onClick: async (ov) => {
                const nome = ov.querySelector('#dlgCatNome').value.trim();
                if (!nome) { mostrarNotificacao('Informe o nome', 'info'); return true; }
                const ok = await adicionarItemMenuAPI('Categoria', nome, {
                    descricao: ov.querySelector('#dlgCatDesc').value.trim(),
                    categoria_tipo: tipo,
                    cor: corPadraoChip(nome)
                });
                if (!ok) return true;
                await carregarMenus();
                if (typeof carregarAbaMenus === "function") await carregarAbaMenus();
                const sel = document.querySelector(SELECTORS.categoria);
                if (sel && tipo === (estadoApp.tipoAtual === 'entradas' ? 'entradas' : 'saidas')) sel.value = nome;
            } }
        ]
    });
}

/** Diálogo rápido para criar um método a partir do formulário */
function abrirNovoMetodo() {
    const ov = mostrarDialogo({
        titulo: 'Novo método',
        corpoHTML: `
            <div class="campo"><label for="dlgMetKind">Tipo</label>
                <select id="dlgMetKind">
                    <option value="">Selecione...</option>
                    <option value="PIX/Débito">PIX/Débito</option>
                    <option value="Crédito">Crédito</option>
                </select></div>
            <div class="campo"><label for="dlgMetBanco">Banco <span class="opt" id="dlgMetBancoOpt">(opcional)</span></label>
                <input type="text" id="dlgMetBanco" placeholder="Ex: Nubank" autocomplete="off"></div>
            <div class="campo" id="dlgMetVencWrap" hidden><label for="dlgMetVenc">Vencimento (dia)</label>
                <input type="text" id="dlgMetVenc" inputmode="numeric" maxlength="2"></div>
            <div id="dlgMetCartao" hidden>
                <div class="campo"><label for="dlgMetFech">Fechamento (dia) <span class="opt">(opcional)</span></label>
                    <input type="text" id="dlgMetFech" inputmode="numeric" maxlength="2"></div>
                <div class="campo"><label for="dlgMetMelhor">Melhor dia <span class="opt">(opcional)</span></label>
                    <input type="text" id="dlgMetMelhor" inputmode="numeric" maxlength="2"></div>
            </div>`,
        acoes: [
            { label: 'Cancelar' },
            { label: 'Adicionar', primario: true, onClick: async (o) => {
                const kind = o.querySelector('#dlgMetKind').value;
                const banco = o.querySelector('#dlgMetBanco').value.trim();
                if (!kind) { mostrarNotificacao('Escolha o tipo', 'info'); return true; }
                if (kind === 'Crédito' && !banco) { mostrarNotificacao('Informe o banco', 'info'); return true; }
                const nome = banco ? `${kind} — ${banco}` : kind;
                const extra = { metodo_kind: kind, banco, cor: corPadraoChip(nome) };
                if (kind === 'Crédito') {
                    const fech = parseInt(o.querySelector('#dlgMetFech').value, 10);
                    const venc = parseInt(o.querySelector('#dlgMetVenc').value, 10);
                    if (!(venc >= 1 && venc <= 31)) { mostrarNotificacao('Vencimento inválido', 'erro'); return true; }
                    const temFech = fech >= 1 && fech <= 31;
                    if (o.querySelector('#dlgMetFech').value.trim() && !temFech) {
                        mostrarNotificacao('Fechamento inválido', 'erro'); return true;
                    }
                    const melhor = parseInt(o.querySelector('#dlgMetMelhor').value, 10)
                        || (temFech ? sugerirMelhorDiaCompra(fech) : null) || null;
                    extra.dia_vencimento = venc;
                    if (temFech) extra.dia_fechamento = fech;
                    if (melhor) extra.melhor_dia_compra = melhor;
                }
                const ok = await adicionarItemMenuAPI('Método', nome, extra);
                if (!ok) return true;
                await carregarMenus();
                if (typeof carregarAbaMenus === "function") await carregarAbaMenus();
                const sel = document.querySelector(SELECTORS.metodo);
                if (sel) sel.value = nome;
                if (typeof atualizarCampoCredito === 'function') atualizarCampoCredito();
            } }
        ]
    });
    const kindSel = ov.querySelector('#dlgMetKind');
    kindSel.addEventListener('change', () => {
        const ehCredito = kindSel.value === 'Crédito';
        ov.querySelector('#dlgMetVencWrap').hidden = !ehCredito;
        ov.querySelector('#dlgMetCartao').hidden = !ehCredito;
        ov.querySelector('#dlgMetBancoOpt').hidden = ehCredito;
    });
    ov.querySelectorAll('input[inputmode="numeric"]').forEach(inp =>
        inp.addEventListener('input', () => soNumeros(inp, 2)));
}

/**
 * Quando "pagar no vencimento" está marcado, a data do lançamento fica igual à
 * data de vencimento (dia informado, na competência atual) e o campo Data trava.
 */
function aplicarPagarVencimento() {
    const chk = document.getElementById('pagarVencimento');
    const dataEl = document.querySelector(SELECTORS.data);
    if (!chk || !dataEl) return;
    if (dataEl.dataset.autoReceita === '1') return;  // já travado por "próximo dia útil"

    const grupoDia = document.getElementById('diaRecorrenciaGroup');
    // Sem campo de dia de vencimento visível: o checkbox não se aplica; a data
    // é gerenciada por atualizarCamposRecorrencia (não mexer aqui).
    if (!grupoDia || grupoDia.hidden) return;
    const ativo = chk.checked;

    if (ativo) {
        if (dataEl.dataset.userVal == null) dataEl.dataset.userVal = dataEl.value;
        const dia = document.getElementById('diaRecorrencia').value;
        const compBR = document.getElementById('competencia')?.value;
        const compISO = parseCompetencia(compBR || '') ||
            competenciaDe(parseDataBR(dataEl.value) || hojeISO());
        const venc = dataVencimento(compISO, dia);
        if (venc) dataEl.value = isoParaDataBR(venc);
        dataEl.readOnly = true;
        dataEl.classList.add('campo-travado');
    } else {
        dataEl.readOnly = false;
        dataEl.classList.remove('campo-travado');
        // Desmarcou: a data volta para o valor original que estava antes
        if (dataEl.dataset.userVal != null) {
            dataEl.value = dataEl.dataset.userVal;
            delete dataEl.dataset.userVal;
        }
    }
}

// Conjunto de datas (YYYY-MM-DD) marcadas nas chips do formulário
let semanasMarcadas = new Set();

const DOW_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** (Re)desenha as chips de semanas para o mês/dia-da-semana atuais do formulário */
function renderSemanasChips() {
    const box = document.getElementById('semanasChips');
    if (!box) return;
    const dow = parseInt(document.getElementById('diaSemana').value, 10);
    const temDiaFixo = Number.isInteger(dow) && dow >= 0 && dow <= 6;
    // Semanal não tem campo de data -> usa o mês em exibição
    const iso = parseDataBR(document.querySelector(SELECTORS.data).value)
        || (typeof estadoApp !== 'undefined' && estadoApp.mesAtual ? formatarDataISO(estadoApp.mesAtual) : hojeISO());
    if (!iso) { box.innerHTML = ''; return; }

    const d = parseDataLocal(iso);
    let dias;
    if (temDiaFixo) {
        dias = ocorrenciasDoDiaNoMes(d.getFullYear(), d.getMonth(), dow);
    } else {
        // Sem dia fixo: uma "semana N" por semana do mês
        const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const nSemanas = Math.ceil(ultimoDia / 7);
        dias = [];
        for (let i = 0; i < nSemanas; i++) {
            const diaMes = Math.min(1 + i * 7, ultimoDia);
            dias.push(formatarDataISO(new Date(d.getFullYear(), d.getMonth(), diaMes)));
        }
    }
    const hoje = hojeISO();

    // Reinicia (futuras marcadas) se o conjunto atual não pertence a este mês
    const pertence = [...semanasMarcadas].some(x => dias.includes(x));
    if (!pertence) semanasMarcadas = new Set(dias.filter(x => x > hoje));
    // Mantém só as datas válidas deste mês
    semanasMarcadas = new Set([...semanasMarcadas].filter(x => dias.includes(x)));

    box.innerHTML = dias.map((dt, i) => {
        const marc = semanasMarcadas.has(dt);
        const passada = dt <= hoje;
        const rot = temDiaFixo ? `${DOW_ABREV[dow]} ${dt.slice(8, 10)}` : `semana ${i + 1}`;
        return `<button type="button" class="chip${marc ? ' on' : ''}${passada ? ' passada' : ''}" data-dt="${dt}">${rot}</button>`;
    }).join('');

    box.onclick = e => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        const dt = chip.dataset.dt;
        if (semanasMarcadas.has(dt)) semanasMarcadas.delete(dt);
        else semanasMarcadas.add(dt);
        chip.classList.toggle('on');
        atualizarResumoSemanas();
    };

    atualizarResumoSemanas();
}

/** Atualiza o "X / Y" do resumo semanal */
function atualizarResumoSemanas() {
    const el = document.getElementById('semanasResumo');
    if (!el) return;
    const vs = parseFloat(document.querySelector(SELECTORS.valor).value) || 0;
    const hoje = hojeISO();
    const marc = [...semanasMarcadas];
    const x = marc.filter(dt => dt <= hoje).length * vs;
    const y = marc.length * vs;
    el.textContent = `atual ${formatarMoeda(x)} / total ${formatarMoeda(y)}`;
}

/**
 * Mostra/esconde o campo Competência (só para método do tipo Crédito)
 * e recalcula seu valor.
 */
function atualizarCampoCredito() {
    const metodo = typeof metodoSelecionado === 'function' ? metodoSelecionado() : null;
    const ehCredito = !!metodo && metodo.metodoKind === 'Crédito';
    const grupo = document.getElementById('competenciaGroup');
    if (grupo) grupo.hidden = !ehCredito;
    if (ehCredito) recalcularCompetencia();
}

/**
 * Recalcula a competência a partir do fechamento do método + data da compra.
 * Não sobrescreve se o usuário já editou o campo manualmente.
 */
function recalcularCompetencia() {
    const campo = document.getElementById('competencia');
    if (!campo || campo.dataset.editado) return;

    const iso = parseDataBR(document.querySelector(SELECTORS.data).value);
    if (!iso) {
        // Sem data ainda: assume o mês vigente (usuário pode editar)
        if (typeof estadoApp !== 'undefined' && estadoApp.mesAtual) {
            campo.value = competenciaParaBR(formatarDataISO(estadoApp.mesAtual));
        }
        return;
    }

    const metodo = typeof metodoSelecionado === 'function' ? metodoSelecionado() : null;
    const fech = metodo && metodo.metodoKind === 'Crédito' ? metodo.diaFechamento : null;
    campo.value = competenciaParaBR(competenciaDe(iso, fech));
}
