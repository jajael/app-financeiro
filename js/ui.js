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
        mesEl.textContent = obterMesAnoFormatado(estadoApp.mesAtual);
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
    if (balancoEl) {
        balancoEl.textContent = resumo.balanco;
        
        // Aplicar tema baseado no saldo
        const card = balancoEl.closest('.summary-card');
        if (card) {
            let tema;
            if (resumo.negativo) {
                tema = TEMAS_BALANCO.negativo;
            } else if (resumo.positivo) {
                tema = TEMAS_BALANCO.positivo;
            } else {
                tema = TEMAS_BALANCO.neutro;
            }
            
            card.style.backgroundColor = tema.bg;
            card.style.borderColor = tema.border;
            card.style.color = tema.color;
        }
    }
}

/**
 * Atualiza lista de entradas
 */
function atualizarEntradasLista() {
    const container = document.querySelector(SELECTORS.entradasLista);
    if (!container) return;
    
    const transacoes = estadoApp.transacoes.entradas;
    
    if (transacoes.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma entrada neste mês</p>';
        return;
    }
    
    // Ordenar por data decrescente
    const ordenadas = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    let html = '';
    ordenadas.forEach(trans => {
        html += gerarHTMLTransacao(trans, 'entrada');
    });

    container.innerHTML = html;
    container.onclick = onListaTransacaoClick;
}

/**
 * Atualiza lista de saídas
 */
function atualizarSaidasLista() {
    const container = document.querySelector(SELECTORS.saidasLista);
    if (!container) return;
    
    const transacoes = estadoApp.transacoes.saidas;
    
    if (transacoes.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma saída neste mês</p>';
        return;
    }
    
    // Ordenar por data decrescente
    const ordenadas = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    let html = '';
    ordenadas.forEach(trans => {
        html += gerarHTMLTransacao(trans, 'saida');
    });

    container.innerHTML = html;
    container.onclick = onListaTransacaoClick;
}

/**
 * Gera HTML para uma transação
 */
function gerarHTMLTransacao(trans, tipo) {
    const dataFormatada = formatarData(trans.data);
    const valorFormatado = formatarMoeda(trans.valor);
    
    // Badge de recorrência
    let badgeRecorrencia = '';
    if (trans.tipoRecorrencia && trans.tipoRecorrencia !== 'Pontual') {
        badgeRecorrencia = `<span class="recorrencia-badge">${trans.tipoRecorrencia}</span>`;
    }
    
    // Informações adicionais
    let meta = '';
    if (trans.metodo || trans.formaPagamento) {
        meta = '<div class="despesa-meta">';
        if (trans.metodo) {
            meta += `<span class="meta-item">💳 ${trans.metodo}</span>`;
        }
        if (trans.formaPagamento && trans.formaPagamento !== 'À vista') {
            meta += `<span class="meta-item">📦 ${trans.formaPagamento}</span>`;
        }
        meta += '</div>';
    }
    
    const tagPendente = trans.pendente
        ? '<span class="pendente-badge">a confirmar</span>' : '';

    const ehParcela = !!trans.parcelasTotal;
    const ehOriginal = ehParcela && trans.parcelaNum === 1;

    // Ações
    let acoes = '';
    if (trans.pendente) {
        acoes += `<button class="btn-ok" data-act="confirmar-trans" data-id="${trans.id}" title="Confirmar este mês">OK</button>`;
    }
    if (ehParcela && !trans.quitada) {
        const chk = trans.quitadoEm ? 'checked' : '';
        acoes += `<label class="quitar-check" title="Quitar a partir deste mês"><input type="checkbox" data-act="quitar-parc" data-id="${trans.id}" ${chk}> quitar</label>`;
    }
    if (!ehParcela || ehOriginal) {
        acoes += `<button class="btn-icon" data-act="editar-trans" data-id="${trans.id}" title="Editar">✏️</button>`;
    }
    if (!trans.quitada) {
        acoes += `<button class="btn-icon btn-danger" data-act="excluir-trans" data-id="${trans.id}" title="Excluir">🗑️</button>`;
    }

    const classes = `despesa-item ${tipo}`
        + (trans.pendente ? ' pendente' : '')
        + (trans.quitada ? ' quitada' : '');

    return `
        <div class="${classes}" data-id="${trans.id}" data-tipo-transacao="${tipo === 'entrada' ? 'entradas' : 'saidas'}">
            <div class="despesa-info">
                <div class="despesa-categoria">
                    ${trans.categoria} ${badgeRecorrencia} ${tagPendente}
                </div>
                ${meta}
                <div class="despesa-descricao">${trans.descricao || 'Sem descrição'} • ${dataFormatada}</div>
            </div>
            <div class="despesa-valor">${tipo === 'entrada' ? '+' : '-'} ${valorFormatado}</div>
            <div class="despesa-actions">${acoes}</div>
        </div>
    `;
}

/** Delegação de clique nas listas de transações */
function onListaTransacaoClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const id = Number(el.dataset.id);
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

    mudarAba('adicionar');

    // Tipo (entrada/saída) sem recarregar menus
    estadoApp.tipoAtual = tipoTransacao;
    const tipoField = document.querySelector(SELECTORS.tipoTransacao);
    if (tipoField) tipoField.value = tipoTransacao;
    document.querySelectorAll('.tipo-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tipo === tipoTransacao));

    document.querySelector(SELECTORS.data).value = isoParaDataBR(trans.data);
    document.querySelector(SELECTORS.valor).value = trans.valor;
    document.querySelector(SELECTORS.categoria).value = trans.categoria;
    document.querySelector(SELECTORS.descricao).value = trans.descricao || '';
    document.querySelector(SELECTORS.metodo).value = trans.metodo || '';
    document.querySelector(SELECTORS.tipoRecorrencia).value = trans.tipoRecorrencia || 'Pontual';

    const diaRec = document.getElementById('diaRecorrencia');
    if (diaRec) diaRec.value = trans.diaRecorrencia || '';
    const diaSem = document.getElementById('diaSemana');
    if (diaSem) diaSem.value = trans.diaSemana ?? '';
    const parc = document.getElementById('parcelas');
    if (parc) parc.value = 1;
    const comp = document.getElementById('competencia');
    if (comp) { comp.value = competenciaParaBR(trans.competencia); comp.dataset.editado = comp.value ? '1' : ''; }

    atualizarCamposRecorrencia();
    atualizarCampoCredito();

    const btn = document.querySelector('.btn-submit');
    if (btn) btn.textContent = 'Salvar alterações';

    const cancelar = document.getElementById('cancelarEdicao');
    if (cancelar) cancelar.hidden = false;
}

/** Sai do modo edição e limpa o formulário */
function cancelarEdicaoTransacao() {
    estadoApp.editandoId = null;
    limparFormulario();
    const btn = document.querySelector('.btn-submit');
    if (btn) btn.textContent = 'Adicionar Transação';
    const cancelar = document.getElementById('cancelarEdicao');
    if (cancelar) cancelar.hidden = true;
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
        container.innerHTML = '<p class="empty-message">Nenhuma saída neste mês</p>';
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
            return;
        }
        
        let html = '';
        proximas.forEach(trans => {
            const tipo = proximasEntradas.some(t => t.id === trans.id) ? 'entrada' : 'saida';
            const dataFormatada = formatarData(trans.proximaData);
            const diasAte = calcularDiasAte(trans.proximaData);
            
            html += `
                <div class="despesa-item ${tipo}">
                    <div class="despesa-info">
                        <div class="despesa-categoria">
                            ${trans.categoria}
                            <span class="recorrencia-badge">${trans.tipoRecorrencia}</span>
                        </div>
                        <div class="despesa-meta">
                            <span class="meta-item">📅 ${dataFormatada}</span>
                            <span class="meta-item">⏱️ Em ${diasAte} dias</span>
                        </div>
                        <div class="despesa-descricao">${trans.descricao || 'Sem descrição'}</div>
                    </div>
                    <div class="despesa-valor">${tipo === 'entrada' ? '+' : '-'} ${formatarMoeda(trans.valor)}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Erro ao atualizar próximas transações:', error);
        container.innerHTML = '<p class="empty-message">Erro ao carregar próximas transações</p>';
    }
}

/**
 * Mostra/esconde os campos que dependem do tipo de recorrência
 * (dia + checkbox "vencimento" para Mensal/Parcelada; nº de parcelas para Parcelada)
 */
function atualizarCamposRecorrencia() {
    const tipo = document.querySelector(SELECTORS.tipoRecorrencia).value;
    const comDia = tipo === 'Conta' || tipo === 'Parcelada';
    const ehSemanal = tipo === 'Semanal';
    const ehCalculada = tipo === 'Último dia útil do mês' || tipo === 'Primeiro dia útil do mês';

    const set = (id, mostrar) => { const el = document.getElementById(id); if (el) el.hidden = !mostrar; };
    set('diaRecorrenciaGroup', comDia);
    set('parceleGroup', tipo === 'Parcelada');
    set('diaSemanaGroup', ehSemanal);
    set('dataCalculadaGroup', ehCalculada);

    // Prefill do dia de vencimento com o dia da data digitada, se vazio
    const diaInput = document.getElementById('diaRecorrencia');
    if (comDia && diaInput && !diaInput.value) {
        const iso = parseDataBR(document.querySelector(SELECTORS.data).value);
        if (iso) diaInput.value = String(parseInt(iso.slice(8, 10), 10));
    }

    // Campo cinza com a data calculada (último/primeiro dia útil)
    if (ehCalculada) {
        const iso = parseDataBR(document.querySelector(SELECTORS.data).value);
        const campo = document.getElementById('dataCalculada');
        if (campo) campo.value = iso ? isoParaDataBR(dataDaOcorrencia(iso, tipo)) : '';
    }
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
    if (!iso) return;

    const metodo = typeof metodoSelecionado === 'function' ? metodoSelecionado() : null;
    const fech = metodo && metodo.metodoKind === 'Crédito' ? metodo.diaFechamento : null;
    campo.value = competenciaParaBR(competenciaDe(iso, fech));
}
