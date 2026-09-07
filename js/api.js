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
        status: row.status || 'Ativa',
        cartaoId: row.cartao_id || null,
        grupoId: row.grupo_id || null,
        pendente: !!row.pendente,
        competencia: row.competencia || '',
        diaRecorrencia: row.dia_recorrencia || '',
        diaSemana: row.dia_semana ?? null
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
            .gte('competencia', ini)
            .lt('competencia', fim)
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
            .select('*')
            .eq('status', 'Ativo')
            .order('nome', { ascending: true });

        if (error) throw error;
        const itens = (data || []).map(mapearItemMenu);

        return {
            categorias: itens.filter(i => i.tipo === 'Categoria').map(i => i.nome),
            // métodos como objetos (o formulário precisa do tipo/fechamento p/ competência)
            metodos: itens.filter(i => i.tipo === 'Método'),
            recorrencias: itens.filter(i => i.tipo === 'Recorrência').map(i => i.nome)
        };
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
            .gte('competencia', ini)
            .lt('competencia', fim);

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
        dia_recorrencia: parseInt(dados.diaRecorrencia, 10) || null,
        dia_semana: dados.diaSemana === '' || dados.diaSemana == null ? null : parseInt(dados.diaSemana, 10),
        proxima_data: calcularProximaData(dados.data, tipoRecorrencia, dados.diaRecorrencia, dados.diaSemana),
        competencia: dados.competencia || competenciaDe(dados.data),
        status: dados.status || 'Ativa'
    };
}

// Tipos que se repetem "rolando" um mês por vez (mês atual + 1 pendente)
const RECORRENTES = ['Conta', 'Semanal', 'Último dia útil do mês', 'Primeiro dia útil do mês'];

/**
 * Adiciona nova transação.
 * - Parcelada: uma linha por parcela.
 * - Conta / Semanal / dia útil: mês atual (confirmado) + próximo mês (pendente).
 * - Pontual: uma linha.
 */
async function adicionarTransacaoAPI(dados) {
    if (dados.tipoRecorrencia === 'Parcelada') return adicionarParceladoAPI(dados);
    if (RECORRENTES.includes(dados.tipoRecorrencia)) return adicionarRecorrenteAPI(dados);

    const { data, error } = await sb
        .from('transacoes')
        .insert(montarRegistro(dados))
        .select()
        .single();

    if (error) throw error;
    return mapearTransacao(data);
}

/** Clona os campos de negócio de uma linha para gerar a próxima ocorrência */
function ocorrenciaSeguinte(row, novaData) {
    return {
        tipo: row.tipo,
        valor: row.valor,
        metodo: row.metodo,
        categoria: row.categoria,
        descricao: row.descricao,
        forma_pagamento: row.forma_pagamento,
        tipo_recorrencia: row.tipo_recorrencia,
        dia_recorrencia: row.dia_recorrencia,
        dia_semana: row.dia_semana,
        status: row.status,
        grupo_id: row.grupo_id,
        data: novaData,
        competencia: competenciaDe(novaData),
        proxima_data: null,
        pendente: true
    };
}

async function adicionarRecorrenteAPI(dados) {
    const grupoId = crypto.randomUUID();
    const tipo = dados.tipoRecorrencia;
    const atual = { ...montarRegistro(dados), grupo_id: grupoId, pendente: false };

    const proxData = calcularProximaData(atual.data, tipo, dados.diaRecorrencia, dados.diaSemana);
    atual.proxima_data = proxData || null;

    const registros = [atual];
    if (proxData) registros.push(ocorrenciaSeguinte(atual, proxData));

    const { data, error } = await sb.from('transacoes').insert(registros).select();
    if (error) throw error;
    return (data || []).map(mapearTransacao);
}

/**
 * Confirma uma ocorrência pendente: marca como confirmada e cria a próxima
 * (mês seguinte) também pendente.
 */
async function confirmarPendenteAPI(id) {
    const { data: row, error: e1 } = await sb
        .from('transacoes').select('*').eq('id', id).single();
    if (e1) throw e1;

    const proxData = calcularProximaData(row.data, row.tipo_recorrencia, row.dia_recorrencia, row.dia_semana);

    const { error: e2 } = await sb.from('transacoes')
        .update({ pendente: false, proxima_data: proxData || null })
        .eq('id', id);
    if (e2) throw e2;

    if (proxData && row.grupo_id) {
        const { error: e3 } = await sb.from('transacoes').insert(ocorrenciaSeguinte(row, proxData));
        if (e3) throw e3;
    }
    return { mensagem: 'Confirmado' };
}

async function adicionarParceladoAPI(dados) {
    const n = Math.max(1, parseInt(dados.parcelas, 10) || 1);
    const grupoId = crypto.randomUUID();
    const centavos = Math.round(parseFloat(dados.valor) * 100);
    const baseParc = Math.floor(centavos / n);
    const resto = centavos - baseParc * n;

    const base = montarRegistro(dados);
    base.grupo_id = grupoId;
    const registros = [];

    for (let i = 0; i < n; i++) {
        const valor = (baseParc + (i < resto ? 1 : 0)) / 100;
        registros.push({
            ...base,
            valor,
            data: i === 0 ? base.data : addMeses(base.data, i),
            competencia: i === 0 ? base.competencia : addMeses(base.competencia, i),
            proxima_data: i < n - 1 ? addMeses(base.competencia, i + 1) : null,
            descricao: `${dados.descricao || dados.categoria} (${i + 1}/${n})`
        });
    }

    const { data, error } = await sb.from('transacoes').insert(registros).select();
    if (error) throw error;
    return (data || []).map(mapearTransacao);
}

// Campos "de negócio" que uma edição propaga para a ocorrência pendente da série
const CAMPOS_CASCATA = ['valor', 'metodo', 'categoria', 'descricao',
    'dia_recorrencia', 'dia_semana', 'forma_pagamento'];

/**
 * Edita uma transação. Se faz parte de uma série (grupo_id), a alteração dos
 * campos de negócio também é aplicada à ocorrência pendente (o "mês seguinte"),
 * desde que ela seja posterior. Meses já confirmados não são tocados.
 */
async function editarTransacaoAPI(dados) {
    if (!dados.id) throw new Error('ID é obrigatório para editar');

    const { data: alvo, error: e1 } = await sb
        .from('transacoes')
        .select('grupo_id, competencia, pendente')
        .eq('id', dados.id)
        .single();
    if (e1) throw e1;

    const registro = montarRegistro(dados);
    delete registro.tipo;

    const { data, error } = await sb.from('transacoes')
        .update(registro).eq('id', dados.id).select().single();
    if (error) throw error;

    // Propaga para o pendente da série (se houver e for posterior)
    if (alvo.grupo_id && !alvo.pendente) {
        const patch = {};
        CAMPOS_CASCATA.forEach(k => { if (k in registro) patch[k] = registro[k]; });
        await sb.from('transacoes')
            .update(patch)
            .eq('grupo_id', alvo.grupo_id)
            .eq('pendente', true)
            .gt('competencia', alvo.competencia);
    }

    return mapearTransacao(data);
}

/**
 * Deleta uma transação. Se faz parte de uma série, também remove a ocorrência
 * pendente (encerra a repetição). Meses já confirmados permanecem.
 */
async function deletarTransacaoAPI(id) {
    const { data: alvo, error: e1 } = await sb
        .from('transacoes').select('grupo_id, competencia').eq('id', id).single();
    if (e1) throw e1;

    const { error } = await sb.from('transacoes').delete().eq('id', id);
    if (error) throw error;

    if (alvo.grupo_id) {
        await sb.from('transacoes').delete()
            .eq('grupo_id', alvo.grupo_id)
            .eq('pendente', true)
            .gte('competencia', alvo.competencia);
    }
    return { mensagem: 'Transação removida' };
}
