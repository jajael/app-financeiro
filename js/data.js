/**
 * CARREGAMENTO DE DADOS
 * Busca dados do API e popula estado
 */

/**
 * Carrega todos os dados do mês atual
 */
async function carregarDados() {
    estadoApp.carregando = true;
    
    try {
        const mes = estadoApp.mesAtual.getMonth() + 1;
        const ano = estadoApp.mesAtual.getFullYear();
        
        console.log(`📊 Carregando dados de ${mes}/${ano}...`);
        
        // Carregar entradas
        const entradas = await carregarTransacoes('entradas', mes, ano);
        estadoApp.transacoes.entradas = entradas;
        
        // Carregar saídas
        const saidas = await carregarTransacoes('saidas', mes, ano);
        estadoApp.transacoes.saidas = saidas;
        
        // Calcular resumo
        calcularResumoMes();
        
        console.log('✓ Dados carregados com sucesso');
        estadoApp.carregando = false;
        
        return true;
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        console.log('Usando dados simulados...');
        carregarDadosSimulados();
        estadoApp.carregando = false;
        
        return false;
    }
}

/**
 * Carrega dados de teste para quando API não responde
 */
function carregarDadosSimulados() {
    estadoApp.transacoes = {
        entradas: [
            {
                id: 2,
                data: '2026-09-30',
                valor: 8513.37,
                metodo: 'Transferência',
                categoria: 'Salário',
                descricao: 'Salário mensal',
                formaPagamento: 'À vista',
                tipoRecorrencia: 'Último útil do mês',
                proximaData: '2026-10-30',
                status: 'Ativa'
            }
        ],
        saidas: [
            {
                id: 2,
                data: '2026-09-05',
                valor: 344.00,
                metodo: 'Débito',
                categoria: 'Alimentação',
                descricao: 'Mercado',
                formaPagamento: 'À vista',
                tipoRecorrencia: 'Pontual',
                proximaData: '',
                status: 'Ativa'
            },
            {
                id: 3,
                data: '2026-09-03',
                valor: 229.80,
                metodo: 'PIX',
                categoria: 'Transporte app',
                descricao: 'Uber',
                formaPagamento: 'À vista',
                tipoRecorrencia: 'Pontual',
                proximaData: '',
                status: 'Ativa'
            },
            {
                id: 4,
                data: '2026-09-01',
                valor: 3280.25,
                metodo: 'Débito',
                categoria: 'Casa',
                descricao: 'Condomínio',
                formaPagamento: 'À vista',
                tipoRecorrencia: 'Mensal',
                proximaData: '2026-10-01',
                status: 'Ativa'
            }
        ]
    };
    
    calcularResumoMes();
    console.log('⚠️ Usando dados simulados');
}

/**
 * Carrega e popula menus dinâmicos
 */
async function carregarMenus() {
    try {
        console.log('📑 Carregando menus...');
        
        const menus = await carregarMenusAPI();
        
        estadoApp.menus.categorias = menus.categorias || [];
        estadoApp.menus.metodos = menus.metodos || {};
        
        console.log('✓ Menus carregados:', estadoApp.menus);
        
        // Preencher dropdown
        preencherDropdownCategorias();
        
        return true;
    } catch (error) {
        console.error('Erro ao carregar menus:', error);
        console.log('Usando categorias padrão...');
        
        // Usar fallback
        estadoApp.menus.categorias = CATEGORIAS_PADRAO[estadoApp.tipoAtual] || [];
        
        return false;
    }
}

/**
 * Preenche dropdown de categorias
 */
function preencherDropdownCategorias() {
    const selectCategoria = document.querySelector(SELECTORS.categoria);
    
    if (!selectCategoria || selectCategoria.tagName !== 'SELECT') {
        return;
    }
    
    selectCategoria.innerHTML = '<option value="">-- Selecione uma categoria --</option>';
    
    estadoApp.menus.categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        selectCategoria.appendChild(option);
    });
}

/**
 * Calcula resumo do mês
 */
function calcularResumoMes() {
    const entradas = estadoApp.transacoes.entradas.reduce((acc, t) => acc + t.valor, 0);
    const saidas = estadoApp.transacoes.saidas.reduce((acc, t) => acc + t.valor, 0);
    
    estadoApp.resumo = {
        entradas: parseFloat(entradas.toFixed(2)),
        saidas: parseFloat(saidas.toFixed(2)),
        balanco: parseFloat((entradas - saidas).toFixed(2))
    };
    
    console.log('📈 Resumo calculado:', estadoApp.resumo);
}

/**
 * Recarrega dados e atualiza UI
 */
async function recarregarDados() {
    console.log('🔄 Recarregando dados...');
    await carregarDados();
    atualizarUI();
}
