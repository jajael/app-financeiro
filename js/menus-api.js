/**
 * API DE MENUS - SUPABASE
 * Gerencia categorias, métodos e tipos de recorrência (tabela menu_itens).
 * Mantém as assinaturas usadas por js/menus-ui.js.
 * "linha" nas funções abaixo = coluna id (bigint) da tabela.
 */

// Conjunto padrão criado para cada novo usuário (inclui visitantes)
const CATEGORIAS_PADRAO_SEED = ['Salário', 'Freelance', 'Investimento', 'Bônus', 'Devolução',
    'Alimentação', 'Alimentação app', 'Assinatura', 'Casa', 'Compras',
    'Compras online', 'Lazer', 'Mercado', 'Saúde', 'Serviços',
    'Transporte app', 'Transporte público', 'Outro'];
// Vocabulário fixo de tipos de recorrência (Pontual é obrigatório/indeletável)
const RECORRENCIAS_KINDS = ['Pontual', 'Conta', 'Parcelada',
  'Último dia útil do mês', 'Primeiro dia útil do mês', 'Semanal'];
const RECORRENCIAS_PADRAO_SEED = RECORRENCIAS_KINDS.slice();

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

        const linhas = [
            ...CATEGORIAS_PADRAO_SEED.map(nome => ({ tipo: 'Categoria', nome })),
            ...RECORRENCIAS_PADRAO_SEED.map(nome => ({ tipo: 'Recorrência', nome })),
            { tipo: 'Método', nome: 'Dinheiro', metodo_kind: 'Dinheiro' },
            { tipo: 'Método', nome: 'PIX/Débito', metodo_kind: 'PIX/Débito' }
        ];
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
        status: row.status || 'Ativo',
        metodoKind: row.metodo_kind || null,
        banco: row.banco || '',
        diaFechamento: row.dia_fechamento || null,
        diaVencimento: row.dia_vencimento || null,
        melhorDiaCompra: row.melhor_dia_compra || null
    };
}

/** Rótulo mostrado no dropdown do formulário para um método */
function rotuloMetodo(item) {
    if (!item.metodoKind || item.metodoKind === 'Dinheiro') return item.nome;
    return item.banco ? `${item.metodoKind} — ${item.banco}` : item.metodoKind;
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
 * Adiciona novo item ao menu.
 * @param {string} tipo   'Categoria' | 'Método' | 'Recorrência'
 * @param {string} nome
 * @param {object} extra  campos opcionais: descricao, metodo_kind, banco,
 *                        dia_fechamento, dia_vencimento, melhor_dia_compra
 */
async function adicionarItemMenuAPI(tipo, nome, extra = {}) {
    try {
        const { error } = await sb
            .from('menu_itens')
            .insert({ tipo, nome, ...extra });

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
 * Edita um item existente. `campos` = objeto com o que mudar
 * (nome, descricao, status, banco, dia_fechamento, ...).
 */
async function editarItemMenuAPI(linha, campos) {
    try {
        const { error } = await sb.from('menu_itens').update(campos).eq('id', linha);
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
