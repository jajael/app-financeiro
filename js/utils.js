/**
 * FUNÇÕES UTILITÁRIAS
 * Formatação, validação, notificações
 */

/**
 * Formata um valor numérico como moeda brasileira
 */
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

/**
 * Formata uma data para o padrão português
 */
function formatarData(dataStr) {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
}

/**
 * Calcula dias até uma data
 */
function calcularDiasAte(dataStr) {
    const data = new Date(dataStr);
    const hoje = new Date();
    const diferenca = data - hoje;
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
}

/**
 * Valida se um campo está preenchido
 */
function validarCampo(valor) {
    return valor !== null && valor !== undefined && valor.toString().trim() !== '';
}

/**
 * Valida um formulário de transação
 */
function validarFormularioTransacao(dados) {
    // Receita (entradas) não tem método
    const campos = dados.tipo === 'saidas'
        ? ['tipo', 'data', 'valor', 'metodo', 'categoria']
        : ['tipo', 'data', 'valor', 'categoria'];

    for (let campo of campos) {
        if (!validarCampo(dados[campo])) {
            return {
                valido: false,
                erro: `Campo "${campo}" é obrigatório`
            };
        }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data)) {
        return { valido: false, erro: 'Data inválida (use dd/mm/aaaa)' };
    }

    if (isNaN(parseFloat(dados.valor)) || parseFloat(dados.valor) <= 0) {
        return {
            valido: false,
            erro: 'Valor deve ser um número positivo'
        };
    }

    const met = typeof metodoSelecionado === 'function' ? metodoSelecionado() : null;
    if (met && met.metodoKind === 'Crédito' && !dados.competencia) {
        return { valido: false, erro: 'Informe a competência (mm/aaaa)' };
    }

    if ((dados.tipoRecorrencia === 'Mensal' || dados.tipoRecorrencia === 'Parcelada')
        && !(parseInt(dados.diaRecorrencia, 10) >= 1 && parseInt(dados.diaRecorrencia, 10) <= 31)) {
        return { valido: false, erro: 'Informe o dia de vencimento (1-31)' };
    }

    // Semanal com dia da semana fixo: precisa de ao menos 1 semana marcada
    if (dados.tipoRecorrencia === 'Semanal' && dados.diaSemana !== '' && dados.diaSemana != null
        && !(dados.semanas && dados.semanas.length >= 1)) {
        return { valido: false, erro: 'Marque ao menos uma semana' };
    }

    return { valido: true };
}

// ===== Máscaras / conversão de datas (dd/mm/aaaa) =====

/** Aplica a máscara dd/mm/aaaa enquanto digita */
function mascaraDataBR(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 4) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
    else if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    input.value = v;
}

/** 'dd/mm/aaaa' ou 'dd/mm/aa' -> 'YYYY-MM-DD' (ou '' se incompleto/ inválido) */
function parseDataBR(str) {
    const m = String(str).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (!m) return '';
    let [, d, mo, y] = m;
    d = +d; mo = +mo; y = +y;
    if (y < 100) y += 2000;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return '';
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' -> 'dd/mm/aaaa' */
function isoParaDataBR(iso) {
    const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function dataHojeBR() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Mantém um input só com dígitos, limitado a `max` caracteres */
function soNumeros(input, max) {
    input.value = input.value.replace(/\D/g, '').slice(0, max);
}

/**
 * Diálogo modal simples (sem alert/confirm nativos).
 * @param {{titulo?:string, texto:string, acoes?:Array<{label:string, primario?:boolean, onClick?:Function}>}}
 */
function mostrarDialogo({ titulo, texto, acoes }) {
    const ov = document.createElement('div');
    ov.className = 'dialogo-overlay';
    ov.innerHTML = `
        <div class="dialogo">
            ${titulo ? `<h3>${titulo}</h3>` : ''}
            <p>${texto}</p>
            <div class="dialogo-acoes"></div>
        </div>`;
    const box = ov.querySelector('.dialogo-acoes');
    (acoes && acoes.length ? acoes : [{ label: 'OK' }]).forEach(a => {
        const b = document.createElement('button');
        b.textContent = a.label;
        b.className = a.primario ? 'btn-add' : 'btn-cancelar';
        b.onclick = () => { ov.remove(); if (a.onClick) a.onClick(); };
        box.appendChild(b);
    });
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
}

/** Máscara mm/aaaa */
function mascaraCompetencia(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 6);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    input.value = v;
}

/** 'mm/aaaa' -> 'YYYY-MM-01' (ou '') */
function parseCompetencia(str) {
    const m = String(str).trim().match(/^(\d{1,2})\/(\d{4})$/);
    if (!m) return '';
    const mo = +m[1];
    if (mo < 1 || mo > 12) return '';
    return `${m[2]}-${String(mo).padStart(2, '0')}-01`;
}

/** 'YYYY-MM-01' -> 'mm/aaaa' */
function competenciaParaBR(iso) {
    const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})/);
    return m ? `${m[2]}/${m[1]}` : '';
}

/**
 * Mostra notificação na tela
 */
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    const notif = document.createElement('div');
    const cores = {
        sucesso: '#10B981',
        erro: '#EF4444',
        info: '#3B82F6'
    };
    
    const cor = cores[tipo] || cores.info;
    
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${cor}, ${cor}99);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideInDown 0.3s ease;
        font-weight: 600;
    `;
    notif.textContent = mensagem;
    
    document.body.appendChild(notif);
    
    // Remover após tempo configurado
    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notif.remove(), CONFIG.ANIMACAO_DURACAO);
    }, CONFIG.NOTIFICACAO_DURACAO);
}

/**
 * Obtém mês/ano formatados
 */
function obterMesAnoFormatado(data) {
    const opcoes = { month: 'long', year: 'numeric' };
    const mesFormatado = data.toLocaleDateString('pt-BR', opcoes);
    return mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1);
}

/**
 * Debounce para evitar múltiplas chamadas
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Delay assíncrono
 */
function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Adiciona CSS dinamicamente
 */
function adicionarCSSDinamico(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Limpa o formulário de transação
 */
function limparFormulario() {
    const form = document.querySelector(SELECTORS.formTransacao);
    if (form) {
        form.reset();
        document.querySelector(SELECTORS.data).value = dataHojeBR();
        document.querySelector(SELECTORS.tipoTransacao).value = 'entradas';
        const pv = document.getElementById('pagarVencimento');
        if (pv) pv.checked = false;
        if (typeof semanasMarcadas !== 'undefined') semanasMarcadas = new Set();
        if (typeof preencherDropdownRecorrencias === 'function') preencherDropdownRecorrencias();
        if (typeof atualizarCamposRecorrencia === 'function') atualizarCamposRecorrencia();
        if (typeof atualizarLabelsPorTipo === 'function') atualizarLabelsPorTipo();
        if (typeof atualizarCampoCredito === 'function') atualizarCampoCredito();
    }
}

/**
 * Obtém dados do formulário
 */
function obterDadosFormulario() {
    const tipoRecorrencia = document.querySelector(SELECTORS.tipoRecorrencia).value;
    const diaRecorrencia = document.getElementById('diaRecorrencia')?.value || '';

    return {
        tipo: document.querySelector(SELECTORS.tipoTransacao).value,
        data: parseDataBR(document.querySelector(SELECTORS.data).value),
        valor: parseFloat(document.querySelector(SELECTORS.valor).value),
        metodo: document.querySelector(SELECTORS.metodo).value,
        categoria: document.querySelector(SELECTORS.categoria).value,
        formaPagamento: tipoRecorrencia === 'Parcelada' ? 'Parcelada' : 'À vista',
        tipoRecorrencia,
        diaRecorrencia,
        pagarVencimento: !!document.getElementById('pagarVencimento')?.checked,
        diaSemana: document.getElementById('diaSemana')?.value ?? '',
        semanas: typeof semanasMarcadas !== 'undefined' ? [...semanasMarcadas].sort() : [],
        valorSessao: parseFloat(document.querySelector(SELECTORS.valor).value) || 0,
        parcelas: parseInt(document.getElementById('parcelas')?.value, 10) || 1,
        competencia: parseCompetencia(document.getElementById('competencia')?.value || ''),
        descricao: document.querySelector(SELECTORS.descricao).value
    };
}
