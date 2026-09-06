/**
 * FUNÇÕES UTILITÁRIAS
 * Formatação, validação, notificações
 */

/**
 * Formata um valor numérico como moeda brasileira
 */
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

/**
 * Formata uma data para o padrão português
 */
function formatarData(dataStr) {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
}

/**
 * Calcula dias até uma data
 */
function calcularDiasAte(dataStr) {
    const data = new Date(dataStr);
    const hoje = new Date();
    const diferenca = data - hoje;
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
}

/**
 * Valida se um campo está preenchido
 */
function validarCampo(valor) {
    return valor !== null && valor !== undefined && valor.toString().trim() !== '';
}

/**
 * Valida um formulário de transação
 */
function validarFormularioTransacao(dados) {
    const campos = ['tipo', 'data', 'valor', 'metodo', 'categoria'];
    
    for (let campo of campos) {
        if (!validarCampo(dados[campo])) {
            return {
                valido: false,
                erro: `Campo "${campo}" é obrigatório`
            };
        }
    }
    
    if (isNaN(parseFloat(dados.valor)) || parseFloat(dados.valor) <= 0) {
        return {
            valido: false,
            erro: 'Valor deve ser um número positivo'
        };
    }
    
    return { valido: true };
}

/**
 * Mostra notificação na tela
 */
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    const notif = document.createElement('div');
    const cores = {
        sucesso: '#10B981',
        erro: '#EF4444',
        info: '#3B82F6'
    };
    
    const cor = cores[tipo] || cores.info;
    
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
    
    // Remover após tempo configurado
    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notif.remove(), CONFIG.ANIMACAO_DURACAO);
    }, CONFIG.NOTIFICACAO_DURACAO);
}

/**
 * Obtém mês/ano formatados
 */
function obterMesAnoFormatado(data) {
    const opcoes = { month: 'long', year: 'numeric' };
    const mesFormatado = data.toLocaleDateString('pt-BR', opcoes);
    return mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1);
}

/**
 * Debounce para evitar múltiplas chamadas
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Delay assíncrono
 */
function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Adiciona CSS dinamicamente
 */
function adicionarCSSDinamico(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Limpa o formulário de transação
 */
function limparFormulario() {
    const form = document.querySelector(SELECTORS.formTransacao);
    if (form) {
        form.reset();
        document.querySelector(SELECTORS.data).valueAsDate = new Date();
        document.querySelector(SELECTORS.tipoTransacao).value = 'entradas';
    }
}

/**
 * Obtém dados do formulário
 */
function obterDadosFormulario() {
    return {
        tipo: document.querySelector(SELECTORS.tipoTransacao).value,
        data: document.querySelector(SELECTORS.data).value,
        valor: parseFloat(document.querySelector(SELECTORS.valor).value),
        metodo: document.querySelector(SELECTORS.metodo).value,
        categoria: document.querySelector(SELECTORS.categoria).value,
        formaPagamento: document.querySelector(SELECTORS.formaPagamento).value,
        tipoRecorrencia: document.querySelector(SELECTORS.tipoRecorrencia).value,
        descricao: document.querySelector(SELECTORS.descricao).value
    };
}
