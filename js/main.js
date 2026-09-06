/**
 * ARQUIVO PRINCIPAL
 * Inicialização e entrada da aplicação
 */

/**
 * Inicializa a aplicação quando o DOM está pronto
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando aplicação...');
    console.log('Versão: 2.0 (Modular)');
    console.log('Data:', new Date().toLocaleString('pt-BR'));
    
    // Adicionar CSS das animações
    adicionarEstilosDinamicos();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Carregar menus
    console.log('📑 Carregando categorias e métodos...');
    await carregarMenus();
    
    // Carregar dados iniciais
    console.log('📊 Carregando dados...');
    await carregarDados();
    
    // Atualizar UI
    atualizarUI();
    
    console.log('✓ Aplicação iniciada com sucesso!');
    console.log('Estado:', estadoApp);
});

/**
 * Adiciona estilos dinâmicos necessários
 */
function adicionarEstilosDinamicos() {
    const css = `
        /* Animações */
        @keyframes slideInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
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
        
        /* Classes utilitárias */
        .empty-message {
            text-align: center;
            color: #9CA3AF;
            padding: 2rem;
            font-style: italic;
        }
        
        .sugestoes.hidden {
            display: none;
        }
        
        /* Loading state */
        .carregando {
            opacity: 0.6;
            pointer-events: none;
        }
    `;
    
    adicionarCSSDinamico(css);
    console.log('✓ Estilos dinâmicos adicionados');
}

/**
 * Função global para recarregar aplicação (útil no console)
 */
window.recarregarApp = async function() {
    console.log('🔄 Recarregando aplicação...');
    resetarEstado();
    await carregarDados();
    atualizarUI();
    console.log('✓ Aplicação recarregada');
};

/**
 * Função de debug para mostrar estado atual
 */
window.debug = function() {
    console.table(estadoApp);
    console.log('Transações entrada:', estadoApp.transacoes.entradas.length);
    console.log('Transações saída:', estadoApp.transacoes.saidas.length);
    console.log('Resumo:', estadoApp.resumo);
};

/**
 * Tratamento de erros não capturados
 */
window.addEventListener('error', (event) => {
    console.error('❌ Erro não capturado:', event.error);
    mostrarNotificacao('❌ Erro na aplicação', 'erro');
});

/**
 * Tratamento de promessas não resolvidas
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada:', event.reason);
    mostrarNotificacao('❌ Erro na requisição', 'erro');
});
