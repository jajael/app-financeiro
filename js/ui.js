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
    
    return `
        <div class="despesa-item ${tipo}">
            <div class="despesa-info">
                <div class="despesa-categoria">
                    ${trans.categoria} ${badgeRecorrencia}
                </div>
                ${meta}
                <div class="despesa-descricao">${trans.descricao || 'Sem descrição'} • ${dataFormatada}</div>
            </div>
            <div class="despesa-valor">${tipo === 'entrada' ? '+' : '-'} ${valorFormatado}</div>
        </div>
    `;
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
 * Mostra/esconde campo de parcelas
 */
function alternarCampoParcelas() {
    const tipoRecorrencia = document.querySelector(SELECTORS.tipoRecorrencia).value;
    const parceleGroup = document.querySelector(SELECTORS.parceleGroup);
    
    if (parceleGroup) {
        parceleGroup.style.display = tipoRecorrencia === 'Parcelada' ? 'block' : 'none';
    }
}
