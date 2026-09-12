/**
 * PLUGGY — conexão de contas bancárias (open finance).
 * Widget de conexão + gestão das contas conectadas (Configurações) +
 * fila de revisão (aba Revisão): confirmar grava um lançamento de
 * verdade, ignorar só marca a linha.
 */

// Versão fixa do SDK (não usar "latest" — evita quebra silenciosa).
const PLUGGY_SDK_URL = 'https://cdn.jsdelivr.net/npm/pluggy-connect-sdk@2.14.2/+esm';
// TODO: desligar quando o app for conectar contas reais (produção) — e
// junto com isso, remover o filtro connectorIds abaixo.
const PLUGGY_INCLUDE_SANDBOX = true;
// Restringe o widget ao conector sandbox "Pluggy Bank" (id 2 na API da
// Pluggy). Sem isso o widget também mostra conectores de demonstração de
// Open Finance (ex.: "MeuPluggy"), que exigem um fluxo OAuth à parte e
// travam em "Nenhuma conta disponível" — só "Pluggy Bank" tem o fluxo
// usuário/senha simples que este app testa.
const PLUGGY_CONNECTOR_IDS = [2];

let _PluggyConnectCtor = null;

/** Carrega o SDK da Pluggy sob demanda (só quando o usuário clica em conectar). */
async function carregarPluggyConnectSdk() {
    if (!_PluggyConnectCtor) {
        const mod = await import(PLUGGY_SDK_URL);
        _PluggyConnectCtor = mod.PluggyConnect;
    }
    return _PluggyConnectCtor;
}

/** Abre o widget Pluggy Connect para conectar uma conta nova. */
async function conectarContaPluggy() {
    try {
        const { data, error } = await sb.functions.invoke('pluggy-connect-token', { body: {} });
        if (error || !data?.accessToken) {
            throw error || new Error('Resposta sem accessToken');
        }

        const PluggyConnect = await carregarPluggyConnectSdk();
        const widget = new PluggyConnect({
            connectToken: data.accessToken,
            includeSandbox: PLUGGY_INCLUDE_SANDBOX,
            connectorIds: PLUGGY_CONNECTOR_IDS,
            onSuccess: async ({ item }) => {
                await finalizarConexaoPluggy(item.id);
            },
            onError: (erro) => {
                console.error(erro);
                mostrarNotificacao('Erro ao conectar: ' + (erro?.message || 'desconhecido'), 'erro');
            },
        });
        await widget.init();
    } catch (e) {
        console.error(e);
        mostrarNotificacao('Erro ao iniciar conexão com a Pluggy', 'erro');
    }
}

/** Grava as contas do item recém-conectado e atualiza a lista na tela. */
async function finalizarConexaoPluggy(itemId) {
    try {
        const { data, error } = await sb.functions.invoke('pluggy-item-conectado', { body: { itemId } });
        if (error) throw error;
        mostrarNotificacao(`${data?.contas?.length || 0} conta(s) conectada(s)`, 'sucesso');
        await carregarContasConectadas();
    } catch (e) {
        console.error(e);
        mostrarNotificacao('Conta conectada na Pluggy, mas houve erro ao salvar aqui — recarregue a página', 'erro');
    }
}

/** Carrega e renderiza as contas conectadas (Configurações › Contas conectadas). */
async function carregarContasConectadas() {
    const container = document.getElementById('pluggyContasList');
    if (!container) return;

    const { data, error } = await sb
        .from('pluggy_contas')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) {
        console.error(error);
        container.innerHTML = '<p class="empty-text">Erro ao carregar contas conectadas</p>';
        return;
    }
    if (!data || !data.length) {
        container.innerHTML = '<p class="empty-text">Nenhuma conta conectada ainda</p>';
        container.onclick = null;
        return;
    }

    const metodos = (estadoApp.menus && estadoApp.menus.metodos) || [];
    container.innerHTML = data.map(c => {
        const statusTag = c.status === 'erro'
            ? '<span class="pendente-badge">erro na conexão</span>'
            : c.status === 'desconectado'
                ? '<span class="chip chip--neutro">desconectada</span>' : '';
        const opcoesMetodo = metodos.map(m =>
            `<option value="${m.id}" ${c.metodo_id === m.id ? 'selected' : ''}>${rotuloMetodo(m)}</option>`
        ).join('');
        const ultimoSync = c.ultimo_sync
            ? `último sync: ${new Date(c.ultimo_sync).toLocaleString('pt-BR')}`
            : 'ainda não sincronizada';

        return `
        <div class="menu-item ativo" data-conta-id="${c.id}">
            <div class="item-info">
                <div class="item-nome">${c.nome_instituicao}
                    <span class="chip chip--neutro">${c.tipo_conta === 'CREDIT' ? 'Cartão' : 'Conta'}</span>
                    ${statusTag}
                </div>
                <div class="item-descricao">${ultimoSync}</div>
                <div class="item-descricao">
                    <label>Método do app:
                        <select data-act="metodo-conta" data-id="${c.id}">
                            <option value="">Selecione...</option>
                            ${opcoesMetodo}
                        </select>
                    </label>
                </div>
            </div>
            <div class="item-actions">
                ${c.status !== 'desconectado'
                    ? `<button class="btn-icon btn-danger" data-act="desconectar-conta" data-id="${c.id}" title="Desconectar">🔌</button>`
                    : ''}
                <button class="btn-icon btn-danger" data-act="apagar-conta" data-id="${c.id}" title="Apagar">🗑️</button>
            </div>
        </div>`;
    }).join('');

    container.onclick = onContasConectadasClick;
}

function onContasConectadasClick(e) {
    const sel = e.target.closest('select[data-act="metodo-conta"]');
    if (sel) {
        associarMetodoConta(Number(sel.dataset.id), sel.value ? Number(sel.value) : null);
        return;
    }
    const btnDesconectar = e.target.closest('[data-act="desconectar-conta"]');
    if (btnDesconectar) {
        desconectarConta(Number(btnDesconectar.dataset.id));
        return;
    }
    const btnApagar = e.target.closest('[data-act="apagar-conta"]');
    if (btnApagar) {
        apagarConta(Number(btnApagar.dataset.id));
    }
}

async function associarMetodoConta(contaId, metodoId) {
    const { error } = await sb.from('pluggy_contas').update({ metodo_id: metodoId }).eq('id', contaId);
    if (error) {
        console.error(error);
        mostrarNotificacao('Erro ao associar método', 'erro');
        return;
    }
    mostrarNotificacao('Método associado', 'sucesso');
}

/** "Desconectar": só para de sincronizar por aqui; não remove o item na Pluggy (v1). */
async function desconectarConta(contaId) {
    const { error } = await sb.from('pluggy_contas').update({ status: 'desconectado' }).eq('id', contaId);
    if (error) {
        console.error(error);
        mostrarNotificacao('Erro ao desconectar', 'erro');
        return;
    }
    mostrarNotificacao('Conta desconectada', 'sucesso');
    await carregarContasConectadas();
}

/** "Apagar": remove a conta de vez (diferente de desconectar). Bloqueado
 *  pelo backend se já houver transação confirmada vinda dela. */
async function apagarConta(contaId) {
    if (!confirm('Apagar essa conta de vez? Isso não pode ser desfeito.')) return;
    try {
        const { data, error } = await sb.functions.invoke('pluggy-excluir-conta', { body: { contaId } });
        if (error) {
            // Erros com corpo (ex.: bloqueio por histórico confirmado, 409)
            // vêm no Response guardado em error.context — sem isso a
            // mensagem específica se perde e vira um "erro genérico".
            const detalhe = await error.context?.json?.().catch(() => null);
            throw new Error(detalhe?.error || error.message);
        }
        if (data?.error) throw new Error(data.error);
        mostrarNotificacao('Conta apagada', 'sucesso');
        await carregarContasConectadas();
    } catch (e) {
        console.error(e);
        mostrarNotificacao(e.message || 'Erro ao apagar conta', 'erro');
    }
}

/**
 * FILA DE REVISÃO — transações trazidas do banco, aguardando confirmação.
 * Confirmar grava um lançamento de verdade (via adicionarTransacaoAPI);
 * ignorar só marca a linha, sem apagar nada.
 */

// Cache dos itens pendentes carregados por último (pra ler data/valor/tipo
// na hora de confirmar, sem precisar buscar de novo no banco).
let _revisaoCache = {};

/** Botão "Sincronizar agora": busca transações novas em todas as contas. */
async function sincronizarPluggyAgora() {
    const btn = document.getElementById('btnSincronizarPluggy');
    const textoOriginal = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sincronizando...'; }
    try {
        const { data, error } = await sb.functions.invoke('pluggy-sync', { body: {} });
        if (error) throw error;
        const novas = data?.novas || 0;
        mostrarNotificacao(
            novas ? `${novas} transação(ões) nova(s) pra revisar` : 'Nada novo por enquanto',
            'sucesso'
        );
        await carregarRevisaoPluggy();
    } catch (e) {
        console.error(e);
        mostrarNotificacao('Erro ao sincronizar com a Pluggy', 'erro');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = textoOriginal || '↻ Sincronizar agora'; }
    }
}

/** Carrega e renderiza a fila de revisão (aba "Revisão"). */
async function carregarRevisaoPluggy() {
    const container = document.getElementById('revisaoLista');
    if (!container) return;

    const { data, error } = await sb
        .from('transacoes_importadas')
        .select('*, conta:conta_id(nome_instituicao, tipo_conta)')
        .eq('status', 'pendente')
        .order('data', { ascending: false });

    atualizarBadgeRevisao(data ? data.length : 0);

    if (error) {
        console.error(error);
        container.innerHTML = '<p class="empty-message">Erro ao carregar a fila de revisão</p>';
        return;
    }
    if (!data || !data.length) {
        _revisaoCache = {};
        container.innerHTML = '<p class="empty-message">Nada pendente — toque em "Sincronizar agora" pra buscar transações novas</p>';
        container.onclick = null;
        return;
    }
    _revisaoCache = Object.fromEntries(data.map(item => [item.id, item]));
    container.innerHTML = data.map(gerarHTMLImportada).join('');
    container.onclick = onRevisaoClick;
}

/** Contador de pendentes no botão da aba. */
function atualizarBadgeRevisao(n) {
    const badge = document.getElementById('badgeRevisao');
    if (!badge) return;
    badge.hidden = !n;
    badge.textContent = n ? ` ${n}` : '';
}

/** Card de uma transação importada: dados da Pluggy + categoria/método
 *  ajustáveis antes de confirmar. */
function gerarHTMLImportada(item) {
    const _dowTri = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const dt = item.data ? parseDataLocal(item.data) : null;
    const dia = dt ? String(dt.getDate()).padStart(2, '0') : '--';
    const dow = dt ? _dowTri[dt.getDay()] : '';
    const sinal = item.tipo === 'entradas' ? '+' : '-';

    const contaTag = item.conta
        ? `<span class="chip chip--neutro">${item.conta.nome_instituicao}</span>` : '';
    const desc = item.descricao_banco
        ? `<span class="despesa-desc">${item.descricao_banco}</span>` : '';

    // categoriasReceita/categoriasDespesa são arrays de nomes (string), não objetos.
    const categoriasApp = (estadoApp.menus &&
        (item.tipo === 'entradas' ? estadoApp.menus.categoriasReceita : estadoApp.menus.categoriasDespesa)) || [];
    const opcoesCategoria = categoriasApp.map(nome =>
        `<option value="${nome}" ${nome === item.categoria_sugerida ? 'selected' : ''}>${nome}</option>`
    ).join('');

    const metodos = (estadoApp.menus && estadoApp.menus.metodos) || [];
    const opcoesMetodo = metodos.map(m =>
        `<option value="${m.id}" ${m.id === item.metodo_sugerido ? 'selected' : ''}>${rotuloMetodo(m)}</option>`
    ).join('');

    return `
        <div class="despesa-item ${item.tipo === 'entradas' ? 'entrada' : 'saida'}" data-importada-id="${item.id}">
            <span class="despesa-data"><span class="despesa-dia">${dia}</span><span class="despesa-dow">${dow}</span></span>
            <span class="despesa-valor">${sinal} ${formatarMoeda(item.valor)}</span>
            <select class="select-mini" data-campo="categoria" title="Categoria">
                <option value="">Categoria...</option>
                ${opcoesCategoria}
            </select>
            <select class="select-mini" data-campo="metodo" title="Método">
                <option value="">Método...</option>
                ${opcoesMetodo}
            </select>
            ${contaTag}
            ${desc}
            <div class="despesa-actions">
                <button class="btn-ok" data-act="confirmar-importada" data-id="${item.id}" title="Confirmar">✓</button>
                <button class="btn-icon btn-danger" data-act="ignorar-importada" data-id="${item.id}" title="Ignorar">✕</button>
            </div>
        </div>`;
}

function onRevisaoClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.act === 'confirmar-importada') confirmarImportada(id);
    else if (btn.dataset.act === 'ignorar-importada') ignorarImportada(id);
}

/** Confirma uma importada: grava a transação de verdade e marca a fila. */
async function confirmarImportada(id) {
    const item = _revisaoCache[id];
    const card = document.querySelector(`[data-importada-id="${id}"]`);
    if (!item || !card) return;

    const categoria = card.querySelector('select[data-campo="categoria"]')?.value || '';
    const metodoId = card.querySelector('select[data-campo="metodo"]')?.value;
    if (!categoria) {
        mostrarNotificacao('Escolhe uma categoria antes de confirmar', 'erro');
        return;
    }

    const metodos = (estadoApp.menus && estadoApp.menus.metodos) || [];
    const metodoObj = metodoId ? metodos.find(m => m.id === Number(metodoId)) : null;
    const metodoRotulo = metodoObj ? rotuloMetodo(metodoObj) : null;
    // Crédito: competência vem da data da compra + fechamento do cartão
    // (mesma regra do formulário manual); os demais casos usam o mês da
    // própria data (competenciaDe sem diaFechamento não rola o mês).
    const competencia = competenciaDe(
        item.data,
        metodoObj && metodoObj.metodoKind === 'Crédito' ? metodoObj.diaFechamento : null
    );

    const dados = {
        tipo: item.tipo,
        data: item.data,
        valor: item.valor,
        metodo: metodoRotulo,
        categoria,
        descricao: item.descricao_banco || '',
        formaPagamento: 'À vista',
        tipoRecorrencia: 'Pontual',
        competencia,
    };

    try {
        const nova = await adicionarTransacaoAPI(dados);
        const { error } = await sb
            .from('transacoes_importadas')
            .update({ status: 'confirmada', transacao_id: nova.id })
            .eq('id', id);
        if (error) throw error;
        mostrarNotificacao('Lançamento confirmado', 'sucesso');
        await carregarRevisaoPluggy();
        if (typeof recarregarDados === 'function') await recarregarDados();
        if (typeof atualizarUI === 'function') atualizarUI();
    } catch (e) {
        console.error(e);
        mostrarNotificacao('Erro ao confirmar — o lançamento pode já ter sido criado, confira antes de tentar de novo', 'erro');
    }
}

/** Ignora uma importada: não vira lançamento, só sai da fila. */
async function ignorarImportada(id) {
    const { error } = await sb.from('transacoes_importadas').update({ status: 'ignorada' }).eq('id', id);
    if (error) {
        console.error(error);
        mostrarNotificacao('Erro ao ignorar', 'erro');
        return;
    }
    mostrarNotificacao('Ignorado', 'sucesso');
    await carregarRevisaoPluggy();
}
