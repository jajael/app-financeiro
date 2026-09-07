/**
 * EVENTOS E INTERAÇÕES
 * Handlers e event listeners
 */

/**
 * Configura todos os event listeners
 */
function configurarEventListeners() {
    console.log('⚙️ Configurando event listeners...');
    
    // Navegação de meses
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    if (prevBtn) prevBtn.addEventListener('click', mesAnterior);
    if (nextBtn) nextBtn.addEventListener('click', proximoMes);
    
    // Seletor de tipo
    const tipoButtons = document.querySelectorAll('.tipo-btn');
    tipoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tipo = btn.dataset.tipo;
            mudarTipoTransacao(tipo);
        });
    });
    
    // Abas
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            mudarAba(tab);
        });
    });
    
    // Formulário
    const form = document.querySelector(SELECTORS.formTransacao);
    if (form) {
        form.addEventListener('submit', submeterFormulario);
    }
    
    // Campo de tipo de recorrência
    const tipoRecorrencia = document.querySelector(SELECTORS.tipoRecorrencia);
    if (tipoRecorrencia) {
        tipoRecorrencia.addEventListener('change', atualizarCamposRecorrencia);
    }

    // Método -> mostra campo de competência se for Crédito
    const metodo = document.querySelector(SELECTORS.metodo);
    if (metodo) metodo.addEventListener('change', atualizarCampoCredito);

    // Cancelar edição de transação
    const cancelar = document.getElementById('cancelarEdicao');
    if (cancelar) cancelar.addEventListener('click', cancelarEdicaoTransacao);

    // Campo Data: máscara dd/mm/aaaa + recalcular competência
    const dataInput = document.querySelector(SELECTORS.data);
    if (dataInput) {
        dataInput.addEventListener('input', () => {
            mascaraDataBR(dataInput);
            recalcularCompetencia();
            atualizarCamposRecorrencia();
        });
    }

    // Campo Competência: máscara mm/aaaa + marca como editado manualmente
    const compInput = document.getElementById('competencia');
    if (compInput) {
        compInput.addEventListener('input', () => {
            mascaraCompetencia(compInput);
            compInput.dataset.editado = compInput.value ? '1' : '';
        });
    }

    // Dia da recorrência: só números, 2 dígitos; recalcula "pagar no vencimento"
    const diaRec = document.getElementById('diaRecorrencia');
    if (diaRec) diaRec.addEventListener('input', () => {
        soNumeros(diaRec, 2);
        if (typeof aplicarPagarVencimento === 'function') aplicarPagarVencimento();
    });

    // Checkbox "pagar no vencimento"
    const pagarVenc = document.getElementById('pagarVencimento');
    if (pagarVenc) pagarVenc.addEventListener('change', aplicarPagarVencimento);

    // Botões "+" para criar categoria/método sem sair do lançamento
    const btnCat = document.getElementById('btnNovaCategoria');
    if (btnCat) btnCat.addEventListener('click', abrirNovaCategoria);
    const btnMet = document.getElementById('btnNovoMetodo');
    if (btnMet) btnMet.addEventListener('click', abrirNovoMetodo);

    // Semanal: dia da semana -> refaz as chips; valor -> atualiza o resumo X/Y
    const diaSem = document.getElementById('diaSemana');
    if (diaSem) diaSem.addEventListener('change', atualizarCamposRecorrencia);
    const valorInput = document.querySelector(SELECTORS.valor);
    if (valorInput) valorInput.addEventListener('input', () => {
        if (typeof atualizarResumoSemanas === 'function') atualizarResumoSemanas();
    });
    
    // Campo de categoria para sugestões (opcional)
    const categoriaInput = document.querySelector(SELECTORS.categoria);
    if (categoriaInput && categoriaInput.tagName === 'INPUT') {
        categoriaInput.addEventListener('input', mostrarSugestoes);
        categoriaInput.addEventListener('blur', ocultarSugestoes);
    }
    
    console.log('✓ Event listeners configurados');
}

/**
 * Muda para mês anterior
 */
function mesAnterior() {
    estadoApp.mesAtual.setMonth(estadoApp.mesAtual.getMonth() - 1);
    recarregarDados();
}

/**
 * Muda para próximo mês
 */
function proximoMes() {
    estadoApp.mesAtual.setMonth(estadoApp.mesAtual.getMonth() + 1);
    recarregarDados();
}

/**
 * Muda tipo de transação (entrada/saída)
 */
function mudarTipoTransacao(tipo) {
    estadoApp.tipoAtual = tipo;
    console.log(`🔄 Tipo alterado para: ${tipo}`);
    
    // Atualizar botões
    document.querySelectorAll('.tipo-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tipo="${tipo}"]`)?.classList.add('active');
    
    // Atualizar campo oculto
    const tipoField = document.querySelector(SELECTORS.tipoTransacao);
    if (tipoField) tipoField.value = tipo;
    
    // Limpar categoria e recarregar opções
    const categoriaField = document.querySelector(SELECTORS.categoria);
    if (categoriaField) categoriaField.value = '';

    if (typeof atualizarLabelsPorTipo === 'function') atualizarLabelsPorTipo();

    // Recarregar menus para o novo tipo
    carregarMenus();
}

/**
 * Muda aba ativa
 */
function mudarAba(novaAba) {
    console.log(`📑 Mudando para aba: ${novaAba}`);
    
    // Remover classe active
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active
    document.getElementById(novaAba)?.classList.add('active');
    document.querySelector(`[data-tab="${novaAba}"]`)?.classList.add('active');
    
    // Ações específicas
    if (novaAba === 'saidas') {
        // Renderizar gráfico após pequeno delay
        setTimeout(atualizarGrafico, 100);
    } else if (novaAba === 'proximas') {
        // Carregar próximas transações
        atualizarProximasTransacoes();
    } else if (novaAba === 'menus') {
        // Carregar aba de gerenciamento de menus
        carregarAbaMenus();
    }
}

/**
 * Submete formulário de transação
 */
async function submeterFormulario(e) {
    e.preventDefault();
    console.log('📝 Submetendo formulário...');
    
    const dados = obterDadosFormulario();
    
    // Validar
    const validacao = validarFormularioTransacao(dados);
    if (!validacao.valido) {
        mostrarNotificacao('❌ ' + validacao.erro, 'erro');
        return;
    }
    
    try {
        if (estadoApp.editandoId) {
            await editarTransacaoAPI({ id: estadoApp.editandoId, ...dados });
            mostrarNotificacao('✓ Transação atualizada!', 'sucesso');
            cancelarEdicaoTransacao();
        } else {
            await adicionarTransacaoAPI(dados);
            mostrarNotificacao('✓ Lançamento adicionado!', 'sucesso');
            limparFormulario();
        }

        // Recarregar dados
        await recarregarDados();

        // Mudar para aba apropriada
        setTimeout(() => mudarAba(dados.tipo), 500);

    } catch (error) {
        console.error('Erro ao salvar transação:', error);
        mostrarNotificacao('❌ Erro ao salvar transação', 'erro');
    }
}

/**
 * Mostra sugestões de categorias
 */
function mostrarSugestoes(e) {
    const valor = e.target.value.toLowerCase();
    const container = document.querySelector(SELECTORS.categoriaSugestoes);
    
    if (!container) return;
    
    const categorias = estadoApp.menus.categorias.length > 0 
        ? estadoApp.menus.categorias 
        : (CATEGORIAS_PADRAO[estadoApp.tipoAtual] || []);
    
    if (!valor) {
        container.classList.add('hidden');
        return;
    }
    
    const filtradas = categorias.filter(cat =>
        cat.toLowerCase().includes(valor)
    );
    
    if (filtradas.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    let html = '';
    filtradas.forEach(cat => {
        html += `<div class="sugestao-item" onclick="selecionarSugestao('${cat}')">${cat}</div>`;
    });
    
    container.innerHTML = html;
    container.classList.remove('hidden');
}

/**
 * Oculta sugestões após delay
 */
function ocultarSugestoes() {
    setTimeout(() => {
        const container = document.querySelector(SELECTORS.categoriaSugestoes);
        if (container) container.classList.add('hidden');
    }, 200);
}

/**
 * Seleciona uma sugestão
 */
function selecionarSugestao(categoria) {
    const categoriaField = document.querySelector(SELECTORS.categoria);
    if (categoriaField) {
        categoriaField.value = categoria;
        document.querySelector(SELECTORS.categoriaSugestoes)?.classList.add('hidden');
        document.querySelector(SELECTORS.valor)?.focus();
    }
}
