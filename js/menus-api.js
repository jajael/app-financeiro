/**
 * API DE MENUS - SUPABASE
 * Gerencia categorias, métodos e tipos de recorrência (tabela menu_itens).
 * Mantém as assinaturas usadas por js/menus-ui.js.
 * "linha" nas funções abaixo = coluna id (bigint) da tabela.
 */

// Conjunto padrão criado para cada novo usuário (inclui visitantes)
const MENUS_PADRAO = [
    ['Categoria', ['Salário', 'Freelance', 'Investimento', 'Bônus', 'Devolução',
        'Alimentação', 'Alimentação app', 'Assinatura', 'Casa', 'Compras',
        'Compras online', 'Lazer', 'Mercado', 'Saúde', 'Serviços',
        'Transporte app', 'Transporte público', 'Outro']],
    ['Método', ['Crédito', 'Dinheiro', 'PIX/Débito']],
    ['Recorrência', ['Pontual', 'Mensal', 'Parcelada', 'Último dia útil do mês']]
];

/**
 * Se o usuário atual ainda não tem nenhum item de menu, cria o conjunto padrão.
 * Chamado no primeiro carregamento (novo usuário ou visitante).
 */
async function semearMenusPadraoSeVazio() {
    try {
        const { count, error } = await sb
            .from('menu_itens')
            .select('id', { count: 'exact', head: true });
        if (error) throw error;
        if (count && count > 0) return false;

        const linhas = [];
        MENUS_PADRAO.forEach(([tipo, nomes]) => nomes.forEach(nome => linhas.push({ tipo, nome })));
        const { error: insErr } = await sb.from('menu_itens').insert(linhas);
        if (insErr) throw insErr;
        console.log('🌱 Menus padrão criados para o usuário');
        return true;
    } catch (error) {
        console.error('Erro ao semear menus padrão:', error);
        return false;
    }
}

function mapearItemMenu(row) {
    return {
        linha: row.id,
        id: row.id,
        tipo: row.tipo,
        nome: row.nome,
        descricao: row.descricao || '',
        status: row.status || 'Ativo'
    };
}

/**
 * Carrega todos os itens (ativos e inativos), agrupados por tipo.
 */
async function carregarMenusCompleto() {
    try {
        const { data, error } = await sb
            .from('menu_itens')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;

        const itens = (data || []).map(mapearItemMenu);
        return {
            categorias: itens.filter(i => i.tipo === 'Categoria'),
            metodos: itens.filter(i => i.tipo === 'Método'),
            recorrencias: itens.filter(i => i.tipo === 'Recorrência')
        };
    } catch (error) {
        console.error('Erro ao carregar menus:', error);
        mostrarNotificacao('Erro ao carregar menus', 'erro');
        return null;
    }
}

/**
 * Itens de um tipo específico ('Categoria' | 'Método' | 'Recorrência')
 */
async function obterItensPorTipo(tipo) {
    try {
        const { data, error } = await sb
            .from('menu_itens')
            .select('*')
            .eq('tipo', tipo)
            .order('nome', { ascending: true });

        if (error) throw error;
        return (data || []).map(mapearItemMenu);
    } catch (error) {
        console.error('Erro ao obter itens:', error);
        return null;
    }
}

/**
 * Adiciona novo item ao menu
 */
async function adicionarItemMenuAPI(tipo, nome, descricao = '') {
    try {
        const { error } = await sb
            .from('menu_itens')
            .insert({ tipo, nome, descricao });

        if (error) throw error;
        mostrarNotificacao(`${nome} adicionado com sucesso!`, 'sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao adicionar item:', error);
        const msg = error.code === '23505' ? 'Item já existe' : 'Erro ao adicionar item';
        mostrarNotificacao(msg, 'erro');
        return false;
    }
}

/**
 * Edita um item existente
 */
async function editarItemMenuAPI(linha, novoNome, novaDescricao = '', novoStatus = 'Ativo') {
    try {
        const { error } = await sb
            .from('menu_itens')
            .update({ nome: novoNome, descricao: novaDescricao, status: novoStatus })
            .eq('id', linha);

        if (error) throw error;
        mostrarNotificacao('Item atualizado com sucesso!', 'sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        mostrarNotificacao('Erro ao atualizar item', 'erro');
        return false;
    }
}

/**
 * Remove um item (delete definitivo)
 */
async function removerItemMenuAPI(linha) {
    try {
        const { error } = await sb.from('menu_itens').delete().eq('id', linha);
        if (error) throw error;
        mostrarNotificacao('Item removido com sucesso!', 'sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao remover item:', error);
        mostrarNotificacao('Erro ao remover item', 'erro');
        return false;
    }
}

/**
 * Desativa um item (status = Inativo)
 */
async function desativarItemMenuAPI(linha) {
    return _mudarStatusItem(linha, 'Inativo', 'Item desativado com sucesso!');
}

/**
 * Ativa um item (status = Ativo)
 */
async function ativarItemMenuAPI(linha) {
    return _mudarStatusItem(linha, 'Ativo', 'Item ativado com sucesso!');
}

async function _mudarStatusItem(linha, status, msgOk) {
    try {
        const { error } = await sb.from('menu_itens').update({ status }).eq('id', linha);
        if (error) throw error;
        mostrarNotificacao(msgOk, 'sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao mudar status do item:', error);
        mostrarNotificacao('Erro ao atualizar item', 'erro');
        return false;
    }
}
