/**
 * API DE CARTÕES - Supabase (tabela cartoes)
 */

function mapearCartao(row) {
    return {
        id: row.id,
        nome: row.nome,
        diaFechamento: row.dia_fechamento,
        diaVencimento: row.dia_vencimento,
        melhorDiaCompra: row.melhor_dia_compra,
        status: row.status || 'Ativo'
    };
}

/** Lista todos os cartões (ativos e inativos) */
async function listarCartoesAPI() {
    try {
        const { data, error } = await sb
            .from('cartoes')
            .select('*')
            .order('nome', { ascending: true });
        if (error) throw error;
        return (data || []).map(mapearCartao);
    } catch (error) {
        console.error('Erro ao listar cartões:', error);
        return [];
    }
}

async function adicionarCartaoAPI({ nome, diaFechamento, diaVencimento, melhorDiaCompra }) {
    try {
        const { error } = await sb.from('cartoes').insert({
            nome,
            dia_fechamento: diaFechamento,
            dia_vencimento: diaVencimento,
            melhor_dia_compra: melhorDiaCompra || null
        });
        if (error) throw error;
        mostrarNotificacao(`Cartão "${nome}" adicionado!`, 'sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao adicionar cartão:', error);
        mostrarNotificacao('Erro ao adicionar cartão', 'erro');
        return false;
    }
}

async function editarCartaoAPI(id, { nome, diaFechamento, diaVencimento, melhorDiaCompra, status }) {
    try {
        const patch = {};
        if (nome !== undefined) patch.nome = nome;
        if (diaFechamento !== undefined) patch.dia_fechamento = diaFechamento;
        if (diaVencimento !== undefined) patch.dia_vencimento = diaVencimento;
        if (melhorDiaCompra !== undefined) patch.melhor_dia_compra = melhorDiaCompra || null;
        if (status !== undefined) patch.status = status;

        const { error } = await sb.from('cartoes').update(patch).eq('id', id);
        if (error) throw error;
        mostrarNotificacao('Cartão atualizado!', 'sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao atualizar cartão:', error);
        mostrarNotificacao('Erro ao atualizar cartão', 'erro');
        return false;
    }
}

async function removerCartaoAPI(id) {
    try {
        const { error } = await sb.from('cartoes').delete().eq('id', id);
        if (error) throw error;
        mostrarNotificacao('Cartão removido!', 'sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao remover cartão:', error);
        mostrarNotificacao('Erro ao remover cartão', 'erro');
        return false;
    }
}
