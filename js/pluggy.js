/**
 * PLUGGY — conexão de contas bancárias (open finance).
 * Widget de conexão + gestão das contas conectadas (Configurações).
 * A fila de revisão (transacoes_importadas) vem nas próximas etapas.
 */

// Versão fixa do SDK (não usar "latest" — evita quebra silenciosa).
const PLUGGY_SDK_URL = 'https://cdn.jsdelivr.net/npm/pluggy-connect-sdk@2.14.2/+esm';
// TODO: desligar quando o app for conectar contas reais (produção).
const PLUGGY_INCLUDE_SANDBOX = true;

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
    const btn = e.target.closest('[data-act="desconectar-conta"]');
    if (btn) {
        desconectarConta(Number(btn.dataset.id));
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

/**
 * FILA DE REVISÃO — transações trazidas do banco, aguardando confirmação.
 * (Confirmar/ignorar vêm numa etapa seguinte; por ora é só leitura + sync.)
 */

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
        container.innerHTML = '<p class="empty-message">Nada pendente — toque em "Sincronizar agora" pra buscar transações novas</p>';
        return;
    }
    container.innerHTML = data.map(gerarHTMLImportada).join('');
}

/** Contador de pendentes no botão da aba. */
function atualizarBadgeRevisao(n) {
    const badge = document.getElementById('badgeRevisao');
    if (!badge) return;
    badge.hidden = !n;
    badge.textContent = n ? ` ${n}` : '';
}

/** Card de uma transação importada (leitura — sem editar/excluir ainda). */
function gerarHTMLImportada(item) {
    const _dowTri = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const dt = item.data ? parseDataLocal(item.data) : null;
    const dia = dt ? String(dt.getDate()).padStart(2, '0') : '--';
    const dow = dt ? _dowTri[dt.getDay()] : '';
    const sinal = item.tipo === 'entradas' ? '+' : '-';

    const cores = (estadoApp.menus && estadoApp.menus.cores) || {};
    const catNome = item.categoria_sugerida || item.categoria_pluggy;
    const catChip = catNome
        ? `<span class="chip" style="background:${(cores.categoria && cores.categoria[catNome]) || corPadraoChip(catNome)}">${catNome}</span>`
        : '<span class="chip chip--neutro">sem categoria sugerida</span>';
    const contaTag = item.conta
        ? `<span class="chip chip--neutro">${item.conta.nome_instituicao}</span>` : '';
    const desc = item.descricao_banco
        ? `<span class="despesa-desc">${item.descricao_banco}</span>` : '';

    return `
        <div class="despesa-item ${item.tipo === 'entradas' ? 'entrada' : 'saida'}">
            <span class="despesa-data"><span class="despesa-dia">${dia}</span><span class="despesa-dow">${dow}</span></span>
            <span class="despesa-valor">${sinal} ${formatarMoeda(item.valor)}</span>
            ${catChip}
            ${contaTag}
            ${desc}
        </div>`;
}
