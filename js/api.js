/**
 * API - SUPABASE
 * Comunicação com o banco de dados Supabase (Postgres).
 * Substitui as antigas chamadas fetch ao Google Apps Script.
 * Mantém as mesmas assinaturas de função usadas pelo resto do app.
 */

/**
 * Converte uma linha do banco (snake_case) para o formato usado na UI (camelCase)
 */
function mapearTransacao(row) {
    return {
        id: row.id,
        data: row.data,
        valor: parseFloat(row.valor) || 0,
        metodo: row.metodo || '',
        categoria: row.categoria || '',
        descricao: row.descricao || '',
        formaPagamento: row.forma_pagamento || 'À vista',
        tipoRecorrencia: row.tipo_recorrencia || 'Pontual',
        proximaData: row.proxima_data || '',
        status: row.status || 'Ativa'
    };
}

/**
 * Primeiro e último dia (exclusivo) de um mês -> ['YYYY-MM-01', 'YYYY-MM-01' do mês seguinte]
 */
function intervaloDoMes(mes, ano) {
    const ini = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const proxMes = mes === 12 ? 1 : mes + 1;
    const proxAno = mes === 12 ? ano + 1 : ano;
    const fim = `${proxAno}-${String(proxMes).padStart(2, '0')}-01`;
    return [ini, fim];
}

/**
 * Carrega transações de um tipo ('entradas' | 'saidas') num mês/ano
 */
async function carregarTransacoes(tipo, mes, ano) {
    try {
        const [ini, fim] = intervaloDoMes(mes, ano);

        const { data, error } = await sb
            .from('transacoes')
            .select('*')
            .eq('tipo', tipo)
            .gte('data', ini)
            .lt('data', fim)
            .order('data', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapearTransacao);
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        return [];
    }
}

/**
 * Carrega transações recorrentes que "vencem" nos próximos 30 dias
 */
async function carregarProximas(tipo) {
    try {
        const hoje = new Date();
        const em30 = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
        const iso = d => d.toISOString().slice(0, 10);

        const { data, error } = await sb
            .from('transacoes')
            .select('*')
            .eq('tipo', tipo)
            .neq('tipo_recorrencia', 'Pontual')
            .gte('proxima_data', iso(hoje))
            .lte('proxima_data', iso(em30))
            .order('proxima_data', { ascending: true });

        if (error) throw error;
        return (data || []).map(mapearTransacao);
    } catch (error) {
        console.error('Erro ao carregar próximas:', error);
        return [];
    }
}

/**
 * Carrega menus ativos (categorias e métodos) para os dropdowns do formulário
 * Mantém o formato { categorias: [...], metodos: [...] }
 */
async function carregarMenusAPI() {
    try {
        const { data, error } = await sb
            .from('menu_itens')
            .select('tipo, nome')
            .eq('status', 'Ativo')
            .order('nome', { ascending: true });

        if (error) throw error;

        const categorias = (data || []).filter(i => i.tipo === 'Categoria').map(i => i.nome);
        const metodos = (data || []).filter(i => i.tipo === 'Método').map(i => i.nome);

        return { categorias, metodos };
    } catch (error) {
        console.error('Erro ao carregar menus:', error);
        return { categorias: [], metodos: [] };
    }
}

/**
 * Resumo de um tipo no mês: total + quebra por categoria
 */
async function carregarResumo(tipo, mes, ano) {
    try {
        const [ini, fim] = intervaloDoMes(mes, ano);

        const { data, error } = await sb
            .from('transacoes')
            .select('valor, categoria')
            .eq('tipo', tipo)
            .gte('data', ini)
            .lt('data', fim);

        if (error) throw error;

        let total = 0;
        const porCat = {};
        (data || []).forEach(r => {
            const v = parseFloat(r.valor) || 0;
            total += v;
            porCat[r.categoria] = (porCat[r.categoria] || 0) + v;
        });

        const porCategoria = Object.entries(porCat)
            .sort((a, b) => b[1] - a[1])
            .map(([categoria, valor]) => ({
                categoria,
                valor: parseFloat(valor.toFixed(2)),
                percentual: total > 0 ? ((valor / total) * 100).toFixed(1) : 0
            }));

        return { mes, ano, total: parseFloat(total.toFixed(2)), porCategoria };
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
        return { total: 0, porCategoria: [], mes, ano };
    }
}

/**
 * Monta o registro do banco a partir dos dados do formulário
 */
function montarRegistro(dados) {
    const tipoRecorrencia = dados.tipoRecorrencia || 'Pontual';
    return {
        tipo: dados.tipo,
        data: dados.data,
        valor: parseFloat(dados.valor),
        metodo: dados.metodo || null,
        categoria: dados.categoria,
        descricao: dados.descricao || '',
        forma_pagamento: dados.formaPagamento || 'À vista',
        tipo_recorrencia: tipoRecorrencia,
        proxima_data: calcularProximaData(dados.data, tipoRecorrencia),
        status: dados.status || 'Ativa'
    };
}

/**
 * Adiciona nova transação
 */
async function adicionarTransacaoAPI(dados) {
    const { data, error } = await sb
        .from('transacoes')
        .insert(montarRegistro(dados))
        .select()
        .single();

    if (error) throw error;
    return mapearTransacao(data);
}

/**
 * Edita uma transação existente (por id)
 */
async function editarTransacaoAPI(dados) {
    if (!dados.id) throw new Error('ID é obrigatório para editar');

    const registro = montarRegistro(dados);
    delete registro.tipo; // não permite trocar entrada <-> saída na edição

    const { data, error } = await sb
        .from('transacoes')
        .update(registro)
        .eq('id', dados.id)
        .select()
        .single();

    if (error) throw error;
    return mapearTransacao(data);
}

/**
 * Deleta uma transação (por id)
 */
async function deletarTransacaoAPI(id, tipo) {
    const { error } = await sb.from('transacoes').delete().eq('id', id);
    if (error) throw error;
    return { mensagem: 'Transação deletada com sucesso' };
}
