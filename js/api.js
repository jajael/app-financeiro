/**
 * API - CHAMADAS FETCH
 * Comunicação com Google Apps Script
 */

/**
 * Faz requisição GET para o backend
 */
async function chamarAPI(acao, tipo = null, mes = null, ano = null) {
    try {
        let url = `${SCRIPT_URL}?acao=${acao}`;
        
        if (tipo) url += `&tipo=${tipo}`;
        if (mes) url += `&mes=${mes}`;
        if (ano) url += `&ano=${ano}`;
        
        console.log('📡 GET:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'sucesso') {
            console.log('✓ Resposta:', data.dados);
            return data.dados;
        } else {
            console.error('❌ Erro API:', data.mensagem);
            throw new Error(data.mensagem);
        }
    } catch (error) {
        console.error('Erro ao chamar API:', error);
        throw error;
    }
}

/**
 * Faz requisição POST para o backend
 */
async function chamarAPIPOST(payload) {
    try {
        console.log('📡 POST:', payload);
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.status === 'sucesso') {
            console.log('✓ Resposta:', data.dados);
            return data.dados;
        } else {
            console.error('❌ Erro API:', data.mensagem);
            throw new Error(data.mensagem);
        }
    } catch (error) {
        console.error('Erro ao chamar API POST:', error);
        throw error;
    }
}

/**
 * Carrega transações de um tipo específico
 */
async function carregarTransacoes(tipo, mes, ano) {
    try {
        const resultado = await chamarAPI('listar', tipo, mes, ano);
        return resultado.transacoes || [];
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        return [];
    }
}

/**
 * Carrega próximas transações
 */
async function carregarProximas(tipo) {
    try {
        const resultado = await chamarAPI('proximas', tipo);
        return resultado.proximas || [];
    } catch (error) {
        console.error('Erro ao carregar próximas:', error);
        return [];
    }
}

/**
 * Carrega menus (categorias e métodos)
 */
async function carregarMenusAPI() {
    try {
        return await chamarAPI('menus');
    } catch (error) {
        console.error('Erro ao carregar menus:', error);
        return { categorias: [], metodos: {} };
    }
}

/**
 * Carrega resumo de um tipo
 */
async function carregarResumo(tipo, mes, ano) {
    try {
        return await chamarAPI('resumo', tipo, mes, ano);
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
        return {
            total: 0,
            porCategoria: [],
            mes,
            ano
        };
    }
}

/**
 * Adiciona nova transação
 */
async function adicionarTransacaoAPI(dados) {
    return chamarAPIPOST({
        acao: 'adicionar',
        ...dados
    });
}

/**
 * Edita uma transação existente
 */
async function editarTransacaoAPI(dados) {
    return chamarAPIPOST({
        acao: 'editar',
        ...dados
    });
}

/**
 * Deleta uma transação
 */
async function deletarTransacaoAPI(id, tipo) {
    return chamarAPIPOST({
        acao: 'deletar',
        id,
        tipo
    });
}
