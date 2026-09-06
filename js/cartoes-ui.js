/**
 * UI DE CARTÕES
 * Aba de cadastro de cartões de crédito + dropdown no formulário de transação.
 */

/** Carrega os cartões no estado e atualiza o dropdown do formulário */
async function carregarCartoes() {
    estadoApp.cartoes = await listarCartoesAPI();
    preencherDropdownCartoes();
}

function preencherDropdownCartoes() {
    const sel = document.getElementById('cartaoSelect');
    if (!sel) return;
    const atual = sel.value;
    sel.innerHTML = '<option value="">Selecione o cartão...</option>';
    estadoApp.cartoes
        .filter(c => c.status === 'Ativo')
        .forEach(c => {
            const o = document.createElement('option');
            o.value = c.id;
            o.textContent = c.nome;
            sel.appendChild(o);
        });
    sel.value = atual;
}

/** Renderiza a aba "Cartões" */
async function carregarAbaCartoes() {
    const container = document.getElementById('cartoesContainer');
    if (!container) return;

    await carregarCartoes();

    container.innerHTML = `
        <div class="menus-gerenciamento">
            <div class="menu-section">
                <h3>💳 Cartões de crédito</h3>
                <div class="menu-list" id="cartoesList"></div>
                <div class="add-item-form cartao-form">
                    <input type="text" id="novoCartaoNome" placeholder="Nome do cartão">
                    <input type="text" id="novoCartaoFech" inputmode="numeric" maxlength="2" placeholder="Fechamento (dia)">
                    <input type="text" id="novoCartaoVenc" inputmode="numeric" maxlength="2" placeholder="Vencimento (dia)">
                    <input type="text" id="novoCartaoMelhor" inputmode="numeric" maxlength="2" placeholder="Melhor dia (auto)">
                    <button onclick="adicionarCartaoUI()" class="btn-add">+ Adicionar</button>
                </div>
            </div>
        </div>
    `;

    // Sugerir melhor dia ao digitar o fechamento
    const fech = document.getElementById('novoCartaoFech');
    const melhor = document.getElementById('novoCartaoMelhor');
    fech.addEventListener('input', () => {
        soNumeros(fech, 2);
        if (!melhor.dataset.editado) melhor.value = sugerirMelhorDiaCompra(fech.value) || '';
    });
    document.getElementById('novoCartaoVenc').addEventListener('input', e => soNumeros(e.target, 2));
    melhor.addEventListener('input', () => { melhor.dataset.editado = '1'; soNumeros(melhor, 2); });

    renderizarCartoes(estadoApp.cartoes);
}

function renderizarCartoes(cartoes) {
    const el = document.getElementById('cartoesList');
    if (!el) return;
    if (!cartoes.length) {
        el.innerHTML = '<p class="empty-text">Nenhum cartão cadastrado</p>';
        return;
    }
    el.innerHTML = cartoes.map(c => `
        <div class="menu-item ${c.status === 'Ativo' ? 'ativo' : 'inativo'}">
            <div class="item-info">
                <div class="item-nome">${c.nome}</div>
                <div class="item-descricao">
                    fecha dia ${c.diaFechamento} · vence dia ${c.diaVencimento}${c.melhorDiaCompra ? ` · melhor compra dia ${c.melhorDiaCompra}` : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-icon" onclick="editarCartaoUI(${c.id})" title="Editar">✏️</button>
                <button class="btn-icon btn-danger" onclick="removerCartaoUI(${c.id})" title="Remover">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function adicionarCartaoUI() {
    const nome = document.getElementById('novoCartaoNome').value.trim();
    const diaFechamento = parseInt(document.getElementById('novoCartaoFech').value, 10);
    const diaVencimento = parseInt(document.getElementById('novoCartaoVenc').value, 10);
    const melhorDiaCompra = parseInt(document.getElementById('novoCartaoMelhor').value, 10) || null;

    if (!nome) return mostrarNotificacao('Informe o nome do cartão', 'info');
    if (!(diaFechamento >= 1 && diaFechamento <= 31)) return mostrarNotificacao('Dia de fechamento inválido', 'erro');
    if (!(diaVencimento >= 1 && diaVencimento <= 31)) return mostrarNotificacao('Dia de vencimento inválido', 'erro');

    const ok = await adicionarCartaoAPI({ nome, diaFechamento, diaVencimento, melhorDiaCompra });
    if (ok) carregarAbaCartoes();
}

async function editarCartaoUI(id) {
    const c = estadoApp.cartoes.find(x => x.id === id);
    if (!c) return;
    const nome = prompt('Nome do cartão:', c.nome);
    if (nome === null) return;
    const diaFechamento = parseInt(prompt('Dia de fechamento:', c.diaFechamento), 10);
    const diaVencimento = parseInt(prompt('Dia de vencimento:', c.diaVencimento), 10);
    const melhorInput = prompt('Melhor dia de compra (deixe vazio para calcular):', c.melhorDiaCompra || '');
    const melhorDiaCompra = melhorInput && melhorInput.trim()
        ? parseInt(melhorInput, 10)
        : sugerirMelhorDiaCompra(diaFechamento) || null;

    const ok = await editarCartaoAPI(id, { nome: nome.trim(), diaFechamento, diaVencimento, melhorDiaCompra });
    if (ok) carregarAbaCartoes();
}

async function removerCartaoUI(id) {
    if (!confirm('Remover este cartão? As transações ligadas a ele ficam sem cartão.')) return;
    const ok = await removerCartaoAPI(id);
    if (ok) carregarAbaCartoes();
}

/** Mantém um input só com dígitos, limitado a `max` caracteres */
function soNumeros(input, max) {
    input.value = input.value.replace(/\D/g, '').slice(0, max);
}
