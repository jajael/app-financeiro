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

// Tipos que se repetem indefinidamente (materializados por um horizonte)
const RECORRENTES = ['Conta', 'Semanal', 'Último dia útil do mês', 'Primeiro dia útil do mês'];
const HORIZONTE_MESES = 12;   // Conta / dia útil
const HORIZONTE_SEMANAS = 26; // Semanal

/**
 * Adiciona nova transação.
 * - Parcelada: uma linha por parcela.
 * - Conta / Semanal / Último/Primeiro dia útil: gera as ocorrências dos
 *   próximos meses (cada uma na sua competência).
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

/**
 * Gera as linhas de uma série recorrente (Conta / Semanal / dia útil),
 * a partir de `dados`, com `total` ocorrências, todas no mesmo grupo.
 */
function gerarSerieRecorrente(dados, grupoId, total) {
    const tipo = dados.tipoRecorrencia;
    const base = montarRegistro(dados);
    base.grupo_id = grupoId;

    const datas = [base.data];
    for (let i = 1; i < total; i++) {
        const prox = calcularProximaData(datas[i - 1], tipo, dados.diaRecorrencia, dados.diaSemana);
        if (!prox) break;
        datas.push(prox);
    }

    return datas.map((dt, i) => ({
        ...base,
        data: dt,
        competencia: i === 0 ? base.competencia : competenciaDe(dt),
        proxima_data: datas[i + 1] || null
    }));
}

async function adicionarRecorrenteAPI(dados) {
    const total = dados.tipoRecorrencia === 'Semanal' ? HORIZONTE_SEMANAS : HORIZONTE_MESES;
    const registros = gerarSerieRecorrente(dados, crypto.randomUUID(), total);

    const { data, error } = await sb.from('transacoes').insert(registros).select();
    if (error) throw error;
    return (data || []).map(mapearTransacao);
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

/** Nº de meses de `compA` (YYYY-MM-01) até `compB`, inclusivo */
function mesesInclusive(compA, compB) {
    const [ya, ma] = compA.slice(0, 7).split('-').map(Number);
    const [yb, mb] = compB.slice(0, 7).split('-').map(Number);
    return Math.max(1, (yb - ya) * 12 + (mb - ma) + 1);
}

/**
 * Edita uma transação. Se ela faz parte de uma série (grupo_id), a alteração
 * cascateia para essa ocorrência e todas as SEGUINTES (meses anteriores ficam
 * como estavam).
 */
async function editarTransacaoAPI(dados) {
    if (!dados.id) throw new Error('ID é obrigatório para editar');

    const { data: alvo, error: e1 } = await sb
        .from('transacoes')
        .select('grupo_id, competencia, tipo_recorrencia')
        .eq('id', dados.id)
        .single();
    if (e1) throw e1;

    // Sem série -> update simples
    if (!alvo.grupo_id) {
        const registro = montarRegistro(dados);
        delete registro.tipo;
        const { data, error } = await sb.from('transacoes')
            .update(registro).eq('id', dados.id).select().single();
        if (error) throw error;
        return mapearTransacao(data);
    }

    // Parcelada: propaga campos para as parcelas seguintes, sem regerar
    if (alvo.tipo_recorrencia === 'Parcelada') {
        const registro = montarRegistro(dados);
        ['tipo', 'data', 'competencia', 'proxima_data', 'grupo_id'].forEach(k => delete registro[k]);
        const { error } = await sb.from('transacoes')
            .update(registro)
            .eq('grupo_id', alvo.grupo_id)
            .gte('competencia', alvo.competencia);
        if (error) throw error;
        return { mensagem: 'Parcelas atualizadas' };
    }

    // Recorrente: apaga do mês editado pra frente e regera com os novos valores
    const { data: irmaos } = await sb.from('transacoes')
        .select('competencia').eq('grupo_id', alvo.grupo_id)
        .order('competencia', { ascending: false }).limit(1);
    const ultimaComp = irmaos?.[0]?.competencia || alvo.competencia;

    const total = alvo.tipo_recorrencia === 'Semanal'
        ? HORIZONTE_SEMANAS
        : mesesInclusive(alvo.competencia, ultimaComp);

    await sb.from('transacoes').delete()
        .eq('grupo_id', alvo.grupo_id)
        .gte('competencia', alvo.competencia);

    const registros = gerarSerieRecorrente(dados, alvo.grupo_id, total);
    const { data, error } = await sb.from('transacoes').insert(registros).select();
    if (error) throw error;
    return (data || []).map(mapearTransacao);
}

/**
 * Deleta uma transação. Se faz parte de uma série, apaga essa ocorrência e
 * todas as SEGUINTES do mesmo grupo.
 */
async function deletarTransacaoAPI(id) {
    const { data: alvo, error: e1 } = await sb
        .from('transacoes').select('grupo_id, competencia').eq('id', id).single();
    if (e1) throw e1;

    if (alvo.grupo_id) {
        const { error } = await sb.from('transacoes').delete()
            .eq('grupo_id', alvo.grupo_id)
            .gte('competencia', alvo.competencia);
        if (error) throw error;
        return { mensagem: 'Série apagada a partir deste mês' };
    }

    const { error } = await sb.from('transacoes').delete().eq('id', id);
    if (error) throw error;
    return { mensagem: 'Transação deletada' };
}
