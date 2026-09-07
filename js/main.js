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

    // Tema claro/escuro
    configurarTema();

    // Configurar event listeners
    configurarEventListeners();

    // Exigir login (magic link). Sem sessão, mostra a tela de acesso e para aqui.
    const autenticado = await initAuth();
    if (!autenticado) {
        console.log('🔒 Aguardando login...');
        return;
    }

    // Carregar menus (categorias, métodos, recorrências)
    console.log('📑 Carregando menus...');
    await carregarMenus();

    // Estado inicial do formulário
    const dataInput = document.querySelector(SELECTORS.data);
    if (dataInput && !dataInput.value) dataInput.value = dataHojeBR();
    atualizarCamposRecorrencia();
    atualizarCampoCredito();
    atualizarLabelsPorTipo();

    // Carregar dados iniciais
    console.log('📊 Carregando dados...');
    await carregarDados();

    // Atualizar UI
    atualizarUI();

    // Resumo compacto fixo (aparece ao rolar além do dashboard)
    configurarMiniResumo();

    console.log('✓ Aplicação iniciada com sucesso!');
    console.log('Estado:', estadoApp);
});

/**
 * Mostra a barra de resumo compacto quando o card "Gasto diário" sai da tela
 * por cima (usuário rolou para além do dashboard).
 */
function configurarMiniResumo() {
    const alvo = document.querySelector('.summary-card.gasto-diario');
    const ref = document.querySelector('.month-bar');   // fundo da barra fixa (não muda ao abrir o mini)
    const mini = document.getElementById('miniResumo');
    if (!alvo || !ref || !mini) return;

    let raf = 0;
    const avaliar = () => {
        raf = 0;
        // Mostra quando o fundo do card "Gasto diário" já passou acima da barra do mês
        const passou = alvo.getBoundingClientRect().bottom <= ref.getBoundingClientRect().bottom;
        if (mini.hidden === passou) mini.hidden = !passou;
    };
    const agendar = () => { if (!raf) raf = requestAnimationFrame(avaliar); };

    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    avaliar();
}

/**
 * Tema claro/escuro: lê a preferência salva, liga o botão do cabeçalho.
 */
function configurarTema() {
    const btn = document.getElementById('btnTema');

    const temaEfetivo = () => {
        const attr = document.documentElement.dataset.theme;
        if (attr === 'dark' || attr === 'light') return attr;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const aplicar = (tema) => {
        document.documentElement.dataset.theme = tema;
        try { localStorage.setItem('tema', tema); } catch (e) {}
        if (btn) btn.textContent = tema === 'dark' ? '☀️' : '🌙';
    };

    if (btn) {
        btn.textContent = temaEfetivo() === 'dark' ? '☀️' : '🌙';
        btn.addEventListener('click', () => aplicar(temaEfetivo() === 'dark' ? 'light' : 'dark'));
    }
}

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
