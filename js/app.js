// ========== CONFIGURAÇÃO INICIAL ==========
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAnB6H8LLXrSwYN5vOV-_XGXKQAGn5lHlP4b8k2D4kLwKQFkSL7Xuqg_Mx40MXVMCA4g/exec'; // ALTERAR COM SUA URL

// Categorias sugeridas por tipo
const CATEGORIAS = {
  entradas: [
    'Salário',
    'Freelance',
    'Investimento',
    'Bônus',
    'Devolução',
    'Outro'
  ],
  saidas: [
    'Alimentação',
    'Alimentação app',
    'Assinatura',
    'Bebida alcoólica',
    'Casa',
    'Compras',
    'Compras online',
    'Lazer',
    'Mercado',
    'Saúde',
    'Serviços',
    'Transporte app',
    'Transporte público',
    'Outro'
  ]
};

// Cores para as categorias (para o gráfico)
const CORES_CATEGORIAS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6',
    '#F1948A', '#85C1E2', '#F8B195', '#C39BD3', '#F1948A'
];

// ========== STATE GLOBAL ==========
let estadoApp = {
    mesAtual: new Date(),
    tipoAtual: 'entradas', // entradas ou saidas
    transacoes: {
        entradas: [],
        saidas: []
    },
    resumo: {
        entradas: 0,
        saidas: 0,
        balanco: 0
    },
    menus: {
        categorias: [],
        metodos: {}
    }
};

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('App Financeiro v2.0 iniciado');
    
    // Definir data atual no formulário
    document.getElementById('data').valueAsDate = new Date();
    
    // Event Listeners
    setupEventListeners();
    
    // Carregar menus (categorias e métodos)
    carregarMenus();
    
    // Carregar dados
    carregarDados();
});

function setupEventListeners() {
    // Navegação de meses
    document.getElementById('prevMonth').addEventListener('click', mesAnterior);
    document.getElementById('nextMonth').addEventListener('click', proximoMes);
    
    // Abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => mudarAba(e.target.dataset.tab));
    });
    
    // Tipo de transação (Entrada/Saída)
    document.querySelectorAll('.tipo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            mudarTipoTransacao(e.target.dataset.tipo);
        });
    });
    
    // Formulário
    document.getElementById('formTransacao').addEventListener('submit', adicionarTransacao);
    
    // Forma de pagamento
    document.getElementById('formaPagamento').addEventListener('change', (e) => {
        const group = document.getElementById('parceleGroup');
        group.style.display = e.target.value === 'Parcelada' ? 'block' : 'none';
    });
}

// ========== NAVEGAÇÃO DE MESES ==========
function mesAnterior() {
    estadoApp.mesAtual.setMonth(estadoApp.mesAtual.getMonth() - 1);
    atualizarUI();
}

function proximoMes() {
    estadoApp.mesAtual.setMonth(estadoApp.mesAtual.getMonth() + 1);
    atualizarUI();
}

// ========== TIPO DE TRANSAÇÃO ==========
function mudarTipoTransacao(tipo) {
    estadoApp.tipoAtual = tipo;
    
    // Atualizar botões
    document.querySelectorAll('.tipo-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tipo="${tipo}"]`).classList.add('active');
    
    // Atualizar campo oculto
    document.getElementById('tipoTransacao').value = tipo;
    
    // Limpar categoria
    document.getElementById('categoria').value = '';
}

// ========== ABAS ==========
function mudarAba(novaAba) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active à aba selecionada
    document.getElementById(novaAba).classList.add('active');
    document.querySelector(`[data-tab="${novaAba}"]`).classList.add('active');
    
    // Atualizar conteúdo específico
    if (novaAba === 'saidas') {
        setTimeout(atualizarGrafico, 100);
    } else if (novaAba === 'proximas') {
        carregarProximasTransacoes();
    }
}

// ========== MENUS DINÂMICOS ==========
async function carregarMenus() {
    try {
        const response = await fetch(`${SCRIPT_URL}?acao=menus`);
        const data = await response.json();
        
        if (data.status === 'sucesso') {
            estadoApp.menus.categorias = data.dados.categorias || [];
            estadoApp.menus.metodos = data.dados.metodos || {};
            
            console.log('✓ Menus carregados:', estadoApp.menus);
            
            // Preencher dropdown de categoria com os valores iniciais
            preencherDropdownCategorias();
        }
    } catch (error) {
        console.error('Erro ao carregar menus:', error);
        console.log('Usando categorias padrão...');
        // Usar fallback (CATEGORIAS hardcoded permanece como fallback)
    }
}

function preencherDropdownCategorias() {
    const selectCategoria = document.getElementById('categoria');
    
    // Se for um select, preencher com as opções
    if (selectCategoria && selectCategoria.tagName === 'SELECT') {
        selectCategoria.innerHTML = '<option value="">-- Selecione uma categoria --</option>';
        
        estadoApp.menus.categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectCategoria.appendChild(option);
        });
    }
}

// ========== CARREGAMENTO DE DADOS ==========
async function carregarDados() {
    const mes = estadoApp.mesAtual.getMonth() + 1;
    const ano = estadoApp.mesAtual.getFullYear();
    
    try {
        // Carregar entradas
        const resEntradas = await fetch(`${SCRIPT_URL}?acao=listar&tipo=entradas&mes=${mes}&ano=${ano}`);
        const dataEntradas = await resEntradas.json();
        
        if (dataEntradas.status === 'sucesso') {
            estadoApp.transacoes.entradas = dataEntradas.dados.transacoes || [];
        }
        
        // Carregar saídas
        const resSaidas = await fetch(`${SCRIPT_URL}?acao=listar&tipo=saidas&mes=${mes}&ano=${ano}`);
        const dataSaidas = await resSaidas.json();
        
        if (dataSaidas.status === 'sucesso') {
            estadoApp.transacoes.saidas = dataSaidas.dados.transacoes || [];
        }
        
        calcularResumoMes();
        atualizarUI();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        
        // Se falhar, usar dados simulados
        console.log('Usando dados simulados...');
        carregarDadosSimulados();
        atualizarUI();
    }
}

function carregarDadosSimulados() {
    estadoApp.transacoes = {
        entradas: [
            {
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
}

function calcularResumoMes() {
    const entradas = estadoApp.transacoes.entradas.reduce((acc, t) => acc + t.valor, 0);
    const saidas = estadoApp.transacoes.saidas.reduce((acc, t) => acc + t.valor, 0);
    
    estadoApp.resumo = {
        entradas: parseFloat(entradas.toFixed(2)),
        saidas: parseFloat(saidas.toFixed(2)),
        balanco: parseFloat((entradas - saidas).toFixed(2))
    };
}

// ========== ATUALIZAÇÃO DA UI ==========
function atualizarUI() {
    // Atualizar mês exibido
    const opcoes = { month: 'long', year: 'numeric' };
    const mesFormatado = estadoApp.mesAtual.toLocaleDateString('pt-BR', opcoes);
    document.getElementById('currentMonth').textContent = 
        mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1);
    
    // Atualizar resumo
    atualizarResumo();
    
    // Atualizar listas
    atualizarEntradasLista();
    atualizarSaidasLista();
}

function atualizarResumo() {
    document.getElementById('totalEntradas').textContent = 
        formatarMoeda(estadoApp.resumo.entradas);
    document.getElementById('totalSaidas').textContent = 
        formatarMoeda(estadoApp.resumo.saidas);
    
    const balanco = estadoApp.resumo.balanco;
    const balancoEl = document.getElementById('balanco');
    balancoEl.textContent = formatarMoeda(balanco);
    
    // Mudar cor baseado no saldo
    const card = balancoEl.closest('.summary-card');
    if (balanco < 0) {
        card.style.backgroundColor = '#FEE2E2';
        card.style.borderColor = '#FECACA';
        card.style.color = '#991B1B';
    } else if (balanco > 0) {
        card.style.backgroundColor = '#DCFCE7';
        card.style.borderColor = '#86EFAC';
        card.style.color = '#166534';
    } else {
        card.style.backgroundColor = '#FEF3C7';
        card.style.borderColor = '#FCD34D';
        card.style.color = '#B45309';
    }
}

function atualizarEntradasLista() {
    const container = document.getElementById('entradasLista');
    const transacoes = estadoApp.transacoes.entradas;
    
    if (transacoes.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma entrada neste mês</p>';
        return;
    }
    
    transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    let html = '';
    transacoes.forEach(trans => {
        html += gerarHTMLTransacao(trans, 'entrada');
    });
    
    container.innerHTML = html;
}

function atualizarSaidasLista() {
    const container = document.getElementById('saidasLista');
    const transacoes = estadoApp.transacoes.saidas;
    
    if (transacoes.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma saída neste mês</p>';
        return;
    }
    
    transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    let html = '';
    transacoes.forEach(trans => {
        html += gerarHTMLTransacao(trans, 'saida');
    });
    
    container.innerHTML = html;
}

function gerarHTMLTransacao(trans, tipo) {
    const dataFormatada = new Date(trans.data).toLocaleDateString('pt-BR');
    const valorFormatado = formatarMoeda(trans.valor);
    
    let badgeRecorrencia = '';
    if (trans.tipoRecorrencia && trans.tipoRecorrencia !== 'Pontual') {
        badgeRecorrencia = `<span class="recorrencia-badge">${trans.tipoRecorrencia}</span>`;
    }
    
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

function atualizarGrafico() {
    const transacoes = estadoApp.transacoes.saidas;
    
    // Agrupar por categoria
    const porCategoria = {};
    transacoes.forEach(trans => {
        if (!porCategoria[trans.categoria]) {
            porCategoria[trans.categoria] = 0;
        }
        porCategoria[trans.categoria] += trans.valor;
    });
    
    // Ordenar por valor
    const categoriaOrdenadas = Object.entries(porCategoria)
        .sort((a, b) => b[1] - a[1]);
    
    // Total para calcular percentual
    const total = Object.values(porCategoria).reduce((a, b) => a + b, 0);
    
    // Gerar HTML das categorias
    let html = '';
    categoriaOrdenadas.forEach((entrada, index) => {
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
    
    if (categoriaOrdenadas.length === 0) {
        html = '<p class="empty-message">Nenhuma saída neste mês</p>';
    }
    
    document.getElementById('categoriesList').innerHTML = html;
}

async function carregarProximasTransacoes() {
    const container = document.getElementById('proximasLista');
    
    try {
        // Carregar próximas entradas
        const resEntradas = await fetch(`${SCRIPT_URL}?acao=proximas&tipo=entradas`);
        const dataEntradas = await resEntradas.json();
        const proximasEntradas = dataEntradas.status === 'sucesso' ? dataEntradas.dados.proximas : [];
        
        // Carregar próximas saídas
        const resSaidas = await fetch(`${SCRIPT_URL}?acao=proximas&tipo=saidas`);
        const dataSaidas = await resSaidas.json();
        const proximasSaidas = dataSaidas.status === 'sucesso' ? dataSaidas.dados.proximas : [];
        
        const proximas = [...proximasEntradas, ...proximasSaidas]
            .sort((a, b) => new Date(a.proximaData) - new Date(b.proximaData));
        
        if (proximas.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma transação programada nos próximos 30 dias</p>';
            return;
        }
        
        let html = '';
        proximas.forEach(trans => {
            const tipo = proximasEntradas.some(t => t.id === trans.id) ? 'entrada' : 'saida';
            const dataFormatada = new Date(trans.proximaData).toLocaleDateString('pt-BR');
            const daysUntil = Math.ceil((new Date(trans.proximaData) - new Date()) / (1000 * 60 * 60 * 24));
            
            html += `
                <div class="despesa-item ${tipo}">
                    <div class="despesa-info">
                        <div class="despesa-categoria">
                            ${trans.categoria} 
                            <span class="recorrencia-badge">${trans.tipoRecorrencia}</span>
                        </div>
                        <div class="despesa-meta">
                            <span class="meta-item">📅 ${dataFormatada}</span>
                            <span class="meta-item">⏱️ Em ${daysUntil} dias</span>
                        </div>
                        <div class="despesa-descricao">${trans.descricao || 'Sem descrição'}</div>
                    </div>
                    <div class="despesa-valor">${tipo === 'entrada' ? '+' : '-'} ${formatarMoeda(trans.valor)}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar próximas transações:', error);
        container.innerHTML = '<p class="empty-message">Erro ao carregar próximas transações</p>';
    }
}

// ========== FORMULÁRIO ==========
async function adicionarTransacao(e) {
    e.preventDefault();
    
    const tipo = document.getElementById('tipoTransacao').value;
    const data = document.getElementById('data').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const metodo = document.getElementById('metodo').value;
    const categoria = document.getElementById('categoria').value;
    const formaPagamento = document.getElementById('formaPagamento').value;
    const tipoRecorrencia = document.getElementById('tipoRecorrencia').value;
    const descricao = document.getElementById('descricao').value;
    
    if (!tipo || !data || !valor || !metodo || !categoria) {
        mostrarNotificacao('❌ Por favor, preencha todos os campos obrigatórios!', 'erro');
        return;
    }
    
    const payload = {
        acao: 'adicionar',
        tipo,
        data,
        valor,
        metodo,
        categoria,
        formaPagamento,
        tipoRecorrencia,
        descricao
    };
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const resultado = await response.json();
        
        if (resultado.status === 'sucesso') {
            console.log('Transação adicionada:', resultado);
            
            // Limpar formulário
            document.getElementById('formTransacao').reset();
            document.getElementById('data').valueAsDate = new Date();
            document.getElementById('tipoTransacao').value = 'entradas';
            
            // Recarregar dados
            carregarDados();
            
            mostrarNotificacao('✓ Transação adicionada com sucesso!', 'sucesso');
            
            // Voltar à aba apropriada
            setTimeout(() => mudarAba(tipo), 500);
        } else {
            mostrarNotificacao('❌ Erro: ' + resultado.mensagem, 'erro');
        }
        
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        mostrarNotificacao('❌ Erro ao salvar transação', 'erro');
    }
}

// ========== SUGESTÕES ==========
function mostrarSugestoes(e) {
    const valor = e.target.value.toLowerCase();
    const container = document.getElementById('categoriaSugestoes');
    const categorias = CATEGORIAS[estadoApp.tipoAtual] || [];
    
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

function ocultarSugestoes() {
    setTimeout(() => {
        document.getElementById('categoriaSugestoes').classList.add('hidden');
    }, 200);
}

function selecionarSugestao(categoria) {
    document.getElementById('categoria').value = categoria;
    document.getElementById('categoriaSugestoes').classList.add('hidden');
    document.getElementById('valor').focus();
}

// ========== UTILITÁRIOS ==========
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    // Criar elemento de notificação
    const notif = document.createElement('div');
    const cores = {
        sucesso: '#10B981',
        erro: '#EF4444'
    };
    
    const cor = cores[tipo] || cores.sucesso;
    
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${cor}, ${cor}99);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideInDown 0.3s ease;
        font-weight: 600;
    `;
    notif.textContent = mensagem;
    
    document.body.appendChild(notif);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
    
    .empty-message {
        text-align: center;
        color: #9CA3AF;
        padding: 2rem;
        font-style: italic;
    }
    
    .sugestoes.hidden {
        display: none;
    }
`;
document.head.appendChild(style);
