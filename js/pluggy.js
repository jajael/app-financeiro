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
// Restringe o widget aos conectores de teste conhecidos (ids fixos, via
// GET /connectors?sandbox=true na API da Pluggy):
//   2   = "Pluggy Bank"  — sandbox usuário/senha (user-ok / password-ok)
//   200 = "MeuPluggy"    — demo próprio da Pluggy, fluxo OAuth
// Sem essa lista o widget mostra também conectores reais e outros
// conectores de demonstração que exigem cadastro/login à parte.
const PLUGGY_CONNECTOR_IDS = [2, 200];

let _PluggyConnectCtor = null;

/** Título de exibição de uma conta Pluggy — nunca o nome do conector (ex.:
 *  "MeuPluggy" agrega várias instituições reais e não diz nada sozinho).
 *  Prioriza o nome comercial que a Pluggy manda; senão usa um rótulo
 *  genérico pelo tipo de conta ("Cartão de crédito") ou o nome da conta
 *  em si (ex.: "Conta Corrente"). O banco de origem vira uma tag à parte
 *  (banco_origem), editável pelo usuário quando a Pluggy não informa. */
function tituloContaPluggy(c) {
    if (c.marketing_name) return c.marketing_name;
    if (c.tipo_conta === 'CREDIT') return 'Cartão de crédito';
    return c.nome_conta || 'Conta bancária';
}

// Mesma heurística de supabase/functions/pluggy-sync (e pluggy-webhook):
// duplicada aqui pra também sugerir categoria nas linhas que já estavam na
// fila antes dessa lógica existir no servidor (categoria_sugerida só é
// calculada no momento do sync — linhas antigas ficam com o valor de
// então, geralmente nulo, e nunca são recalculadas num sync seguinte).
const PALAVRAS_CHAVE_CATEGORIA = [
    { padrao: /drogaria|farm[aá]cia|droga ?raia|pacheco|pague ?menos/, categoria: 'Saúde' },
    { padrao: /hospital|cl[ií]nica|laborat[oó]rio|dentista|odont/, categoria: 'Saúde' },
    { padrao: /academia|smart ?fit|bodytech|bio ?ritmo/, categoria: 'Saúde' },
    { padrao: /supermercado|hortifruti|atacad[ãa]o|carrefour|extra|p[ãa]o de a[çc][uú]car|assa[íi]/, categoria: 'Mercado' },
    { padrao: /restaurante|lanchonete|padaria|pizzaria|churrascaria/, categoria: 'Alimentação' },
    { padrao: /ifood|rappi|mcdonalds|burger king|habib|subway/, categoria: 'Alimentação' },
    { padrao: /uber|99app|99pop|t[áa]xi/, categoria: 'Transporte' },
    { padrao: /posto|ipiranga|shell|petrobras|ale combust/, categoria: 'Transporte' },
    { padrao: /estacionamento|zona azul/, categoria: 'Transporte' },
    { padrao: /netflix|spotify|disney|amazon prime|hbo|paramount/, categoria: 'Lazer' },
    { padrao: /cinema|cinemark|teatro/, categoria: 'Lazer' },
    { padrao: /escola|faculdade|universidade|udemy|alura/, categoria: 'Educação' },
    { padrao: /condom[ií]nio|imobili[aá]ria|aluguel/, categoria: 'Casa' },
    { padrao: /cemig|light sa|enel|sabesp|copasa|eletropaulo/, categoria: 'Casa' },
];

function sugerirCategoriaPorPalavraChave(descricaoBanco) {
    if (!descricaoBanco) return null;
    const alvo = descricaoBanco.toLowerCase();
    const achado = PALAVRAS_CHAVE_CATEGORIA.find(p => p.padrao.test(alvo));
    return achado ? achado.categoria : null;
}

/** Sugestão de categoria calculada no cliente (fallback quando a linha já
 *  tem categoria_sugerida nula, gravada antes dessa heurística existir).
 *  Mesma ordem de prioridade do servidor: nome exato da descrição →
 *  palavra-chave do estabelecimento → categoria da Pluggy já traduzida.
 *  categoriasApp é a lista de nomes (string) do tipo entrada/saída certo. */
function sugerirCategoriaCliente(item, categoriasApp) {
    const descNorm = (item.descricao_banco || '').trim().toLowerCase();
    if (descNorm) {
        const exata = categoriasApp.find(nome => nome.toLowerCase() === descNorm);
        if (exata) return exata;
    }
    const porPalavraChave = sugerirCategoriaPorPalavraChave(item.descricao_banco);
    if (porPalavraChave) {
        const achada = categoriasApp.find(nome => nome.toLowerCase() === porPalavraChave.toLowerCase());
        if (achada) return achada;
    }
    if (item.categoria_pluggy) {
        const alvo = item.categoria_pluggy.trim().toLowerCase();
        const exata = categoriasApp.find(nome => nome.toLowerCase() === alvo);
        if (exata) return exata;
        const parcial = categoriasApp.find(nome => alvo.includes(nome.toLowerCase()) || nome.toLowerCase().includes(alvo));
        if (parcial) return parcial;
    }
    return null;
}

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

        // nome_conta/numero_mascarado/marca_cartao vêm da Pluggy só na hora
        // de conectar (pluggy-item-conectado). O título nunca é o nome do
        // conector (ex.: "MeuPluggy" agrega várias instituições reais e não
        // diz nada sozinho) — banco_origem vira uma tag automática ao lado
        // do título (sem campo editável: o que a Pluggy manda já basta).
        const detalhesConta = [
            c.nome_conta,
            c.numero_mascarado ? `final ${c.numero_mascarado}` : null,
            c.marca_cartao,
        ].filter(Boolean).join(' · ');
        const saldoTxt = c.tipo_conta === 'BANK' && typeof c.saldo === 'number'
            ? `saldo: ${formatarMoeda(c.saldo)}` : '';

        return `
        <div class="menu-item ativo" data-conta-id="${c.id}">
            <div class="item-info">
                <div class="item-nome">${tituloContaPluggy(c)}
                    ${c.banco_origem && c.banco_origem !== tituloContaPluggy(c)
                        ? `<span class="chip chip--neutro">${c.banco_origem}</span>` : ''}
                    ${statusTag}
                </div>
                ${detalhesConta ? `<div class="item-descricao">${detalhesConta}</div>` : ''}
                <div class="item-descricao">${ultimoSync}${saldoTxt ? ' · ' + saldoTxt : ''}</div>
                <div class="item-descricao campo-metodo-conta">
                    <label for="metodo-conta-${c.id}">Método do app:</label>
                    <div class="campo-com-add campo-com-add--mini">
                        <select id="metodo-conta-${c.id}" data-act="metodo-conta" data-id="${c.id}">
                            <option value="">Selecione...</option>
                            ${opcoesMetodo}
                        </select>
                        <button type="button" class="btn-mini-add" data-act="add-metodo" title="Novo método">+</button>
                    </div>
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
    container.onchange = onContasConectadasChange;
}

function onContasConectadasClick(e) {
    const btnAddMetodo = e.target.closest('[data-act="add-metodo"]');
    if (btnAddMetodo) {
        abrirNovoMetodo();
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

function onContasConectadasChange(e) {
    const sel = e.target.closest('select[data-act="metodo-conta"]');
    if (sel) {
        associarMetodoConta(Number(sel.dataset.id), sel.value ? Number(sel.value) : null);
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

/** Botão "Limpar tudo": mesmo padrão de 2 cliques usado em Configurações
 *  (sem confirm() nativo) — marca toda a fila pendente como 'ignorada'.
 *  Não apaga as linhas (perderia o dedup por pluggy_transaction_id e o
 *  próximo sync reimportaria tudo de novo). */
function onClickLimparRevisao(e) {
    const btn = e.currentTarget;
    if (btn.dataset.armed) {
        limparFilaRevisao(btn);
        return;
    }
    const original = btn.textContent;
    btn.dataset.armed = '1';
    btn.textContent = 'confirmar?';
    btn.classList.add('armed');
    setTimeout(() => {
        if (!btn.isConnected) return;
        delete btn.dataset.armed;
        btn.textContent = original;
        btn.classList.remove('armed');
    }, 3000);
}

async function limparFilaRevisao(btn) {
    delete btn.dataset.armed;
    btn.classList.remove('armed');
    const original = '🧹 Limpar tudo';
    btn.disabled = true;
    try {
        const { error } = await sb.from('transacoes_importadas').update({ status: 'ignorada' }).eq('status', 'pendente');
        if (error) throw error;
        mostrarNotificacao('Fila de revisão limpa', 'sucesso');
        await carregarRevisaoPluggy();
    } catch (e) {
        console.error(e);
        mostrarNotificacao('Erro ao limpar a fila', 'erro');
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
}

/** Carrega e renderiza a fila de revisão (aba "Revisão"). */
async function carregarRevisaoPluggy() {
    const container = document.getElementById('revisaoLista');
    if (!container) return;

    const { data, error } = await sb
        .from('transacoes_importadas')
        .select('*, conta:conta_id(nome_instituicao, tipo_conta, nome_conta, marketing_name, banco_origem, metodo_id)')
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

    // Nunca mostra o nome do conector (ex.: "MeuPluggy") — usa banco de
    // origem quando o usuário já preencheu, senão o título genérico da
    // conta (mesma regra de tituloContaPluggy).
    const contaTag = item.conta
        ? `<span class="chip chip--neutro">${item.conta.banco_origem || tituloContaPluggy(item.conta)}</span>`
        : '';
    // Editável — a descrição que vem do banco às vezes é um código/sigla
    // (ex.: "DROGARIAS IMPERIAL LTDA") que o usuário quer ajustar antes de
    // confirmar o lançamento. Escapa aspas pro valor não quebrar o atributo.
    const descEscapada = (item.descricao_banco || '').replace(/"/g, '&quot;');
    const desc = `<input type="text" class="input-mini despesa-desc-input" data-campo="descricao"
        value="${descEscapada}" placeholder="Descrição" title="Descrição">`;

    // categoriasReceita/categoriasDespesa são arrays de nomes (string), não objetos.
    const categoriasApp = (estadoApp.menus &&
        (item.tipo === 'entradas' ? estadoApp.menus.categoriasReceita : estadoApp.menus.categoriasDespesa)) || [];
    // categoria_sugerida vem do servidor (calculada no sync); se estiver
    // nula — linha importada antes dessa heurística existir, ou categoria
    // criada depois do sync — recalcula no cliente como reforço.
    const categoriaPreSelecionada = item.categoria_sugerida || sugerirCategoriaCliente(item, categoriasApp);
    const opcoesCategoria = categoriasApp.map(nome =>
        `<option value="${nome}" ${nome === categoriaPreSelecionada ? 'selected' : ''}>${nome}</option>`
    ).join('');

    // metodo_sugerido é gravado no momento do sync, a partir do método que
    // já estava associado à conta ali; mas se a conta só foi associada
    // DEPOIS do sync (fluxo comum: conecta, sincroniza, só então define o
    // método em Contas conectadas), essas linhas antigas ficam com
    // metodo_sugerido nulo — cai pro método atual da conta como reforço.
    const metodoPreSelecionado = item.metodo_sugerido ?? item.conta?.metodo_id ?? null;
    const metodos = (estadoApp.menus && estadoApp.menus.metodos) || [];
    const opcoesMetodo = metodos.map(m =>
        `<option value="${m.id}" ${m.id === metodoPreSelecionado ? 'selected' : ''}>${rotuloMetodo(m)}</option>`
    ).join('');

    return `
        <div class="despesa-item ${item.tipo === 'entradas' ? 'entrada' : 'saida'}" data-importada-id="${item.id}">
            <span class="despesa-data"><span class="despesa-dia">${dia}</span><span class="despesa-dow">${dow}</span></span>
            <span class="despesa-valor">${sinal} ${formatarMoeda(item.valor)}</span>
            <div class="campo-com-add">
                <select class="select-mini" data-campo="categoria" title="Categoria">
                    <option value="">Categoria...</option>
                    ${opcoesCategoria}
                </select>
                <button type="button" class="btn-mini-add" data-act="add-categoria" data-tipo="${item.tipo}" title="Nova categoria">+</button>
            </div>
            <div class="campo-com-add">
                <select class="select-mini" data-campo="metodo" title="Método">
                    <option value="">Método...</option>
                    ${opcoesMetodo}
                </select>
                <button type="button" class="btn-mini-add" data-act="add-metodo" title="Novo método">+</button>
            </div>
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
    if (btn.dataset.act === 'add-categoria') { abrirNovaCategoria(btn.dataset.tipo); return; }
    if (btn.dataset.act === 'add-metodo') { abrirNovoMetodo(); return; }
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

    const descricao = card.querySelector('input[data-campo="descricao"]')?.value.trim() || '';

    const dados = {
        tipo: item.tipo,
        data: item.data,
        valor: item.valor,
        metodo: metodoRotulo,
        categoria,
        descricao,
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
