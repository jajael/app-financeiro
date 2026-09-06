# 🚀 GUIA RÁPIDO DE REFERÊNCIA

## Estrutura Modular v2.0 - Cheat Sheet

---

## 📂 Encontre o Código Rapidamente

### "Preciso mudar... "

#### 🎨 Cores
```
✅ Arquivo: css/variables.css
📍 Linha: ~10-30
💡 Use: --primary, --danger, --success, etc
```

#### 💬 Textos e Tipografia
```
✅ Arquivo: css/variables.css
📍 Linha: ~50-70
💡 Use: --font-size-base, --font-weight-bold, etc
```

#### 📦 Espaçamento
```
✅ Arquivo: css/variables.css
📍 Linha: ~30-45
💡 Use: --spacing-sm, --spacing-md, --spacing-lg, etc
```

#### ✨ Animações
```
✅ Arquivo: css/animations.css
📍 Linha: ~1-200
💡 @keyframes, transições, efeitos visuais
```

#### 📱 Layout
```
✅ Arquivo: css/layout.css
📍 Linha: ~1-50
💡 Container, header, main, footer
```

#### 💳 Cards de Resumo
```
✅ Arquivo: css/dashboard.css
📍 Linha: ~1-80
💡 .summary-card, .summary-card.entradas, etc
```

#### 📑 Abas
```
✅ Arquivo: css/tabs.css
📍 Linha: ~1-60
💡 .tabs, .tab-btn, .tab-content
```

#### 📋 Listagem de Transações
```
✅ Arquivo: css/transactions.css
📍 Linha: ~1-80
💡 .despesa-item, .recorrencia-badge, etc
```

#### 📊 Gráficos
```
✅ Arquivo: css/charts.css
📍 Linha: ~1-100
💡 .chart-container, .category-item, etc
```

#### 📝 Formulário
```
✅ Arquivo: css/forms.css
📍 Linha: ~1-100
💡 .form-transacao, .tipo-selector, etc
```

#### 📱 Mobile/Responsivo
```
✅ Arquivo: css/responsive.css
📍 Linha: ~200-500
💡 @media queries para 480px, 768px, 1024px+
```

---

### "Preciso editar código..."

#### ⚙️ Configurações
```
✅ Arquivo: js/config.js
📍 Linha: ~1-50
💡 SCRIPT_URL, SELECTORS, CATEGORIAS_PADRAO
```

#### 📊 Estado da App
```
✅ Arquivo: js/state.js
📍 Linha: ~1-80
💡 estadoApp, atualizarEstado, obterDados
```

#### 🔌 API Calls
```
✅ Arquivo: js/api.js
📍 Linha: ~1-130
💡 chamarAPI, adicionarTransacao, carregarMenus
```

#### 🔧 Funções Auxiliares
```
✅ Arquivo: js/utils.js
📍 Linha: ~1-160
💡 formatarMoeda, validar, mostrarNotificacao
```

#### 📥 Carregar Dados
```
✅ Arquivo: js/data.js
📍 Linha: ~1-100
💡 carregarDados, carregarMenus, calcularResumo
```

#### 🎨 Renderizar Interface
```
✅ Arquivo: js/ui.js
📍 Linha: ~1-200
💡 atualizarUI, gerarHTML, atualizarGrafico
```

#### 🖱️ Interações do Usuário
```
✅ Arquivo: js/events.js
📍 Linha: ~1-150
💡 configurarEventListeners, submeterFormulario
```

#### 🚀 Inicializar App
```
✅ Arquivo: js/main.js
📍 Linha: ~1-120
💡 DOMContentLoaded, debug functions
```

---

## 🔗 Fluxo de Dados Típico

### Ao carregar a página:
```
1. main.js → DOMContentLoaded
2. main.js → configurarEventListeners() (events.js)
3. main.js → carregarMenus() (data.js)
   └─ data.js → carregarMenusAPI() (api.js)
      └─ api.js → chamarAPI('menus')
         └─ data.js → preencherDropdownCategorias() (ui.js)
4. main.js → carregarDados() (data.js)
   └─ data.js → carregarTransacoes() (api.js)
5. main.js → atualizarUI() (ui.js)
```

### Ao clicar em um mês:
```
1. events.js → proximoMes()
2. events.js → recarregarDados()
   └─ data.js → carregarDados() (api.js)
      └─ data.js → calcularResumoMes() (state.js)
3. data.js → atualizarUI() (ui.js)
   └─ ui.js → atualizarResumo()
   └─ ui.js → atualizarEntradasLista()
   └─ ui.js → atualizarSaidasLista()
```

### Ao submeter formulário:
```
1. events.js → submeterFormulario()
2. events.js → obterDadosFormulario() (utils.js)
3. events.js → validarFormularioTransacao() (utils.js)
4. events.js → adicionarTransacaoAPI() (api.js)
5. events.js → mostrarNotificacao() (utils.js)
6. events.js → recarregarDados() (data.js)
7. data.js → atualizarUI() (ui.js)
```

---

## 💡 Padrões Comuns

### Acessar elemento do DOM
```javascript
// Em config.js
const SELECTORS = {
    currentMonth: '#currentMonth'
};

// Em qualquer outro arquivo
const elemento = document.querySelector(SELECTORS.currentMonth);
```

### Usar variável CSS
```css
/* Em variables.css */
:root {
    --primary: #4F46E5;
}

/* Em qualquer arquivo CSS */
.btn { color: var(--primary); }
```

### Chamar API
```javascript
// Em api.js
async function carregarTransacoes(tipo, mes, ano) {
    return await chamarAPI('listar', tipo, mes, ano);
}

// Em data.js
const transacoes = await carregarTransacoes('entradas', 9, 2026);
```

### Atualizar estado
```javascript
// Em state.js
estadoApp.transacoes.entradas = [];

// Em data.js
estadoApp.transacoes.entradas = dados;
calcularResumoMes();
```

### Renderizar lista
```javascript
// Em ui.js
function atualizarEntradasLista() {
    const container = document.querySelector(SELECTORS.entradasLista);
    let html = '';
    estadoApp.transacoes.entradas.forEach(trans => {
        html += gerarHTMLTransacao(trans, 'entrada');
    });
    container.innerHTML = html;
}
```

---

## ⚡ Atalhos Úteis no Console

```javascript
// Recarregar dados
window.recarregarApp();

// Ver estado completo
window.debug();

// Testar formatação
formatarMoeda(1500.50);

// Testar API
carregarMenusAPI().then(console.log);

// Validar formulário
validarFormularioTransacao({
    tipo: 'entradas',
    data: '2026-09-01',
    valor: 1000,
    metodo: 'PIX',
    categoria: 'Salário'
});
```

---

## 🎯 Checklist Antes de Editar

- [ ] Identifiquei o arquivo correto
- [ ] Entendi a responsabilidade dele
- [ ] Fiz backup das mudanças
- [ ] Testei em desktop
- [ ] Testei em tablet (768px)
- [ ] Testei em mobile (480px)
- [ ] Não quebrei nada
- [ ] Atualizei documentação se necessário

---

## 🚨 Erros Comuns

### ❌ Erro: Variável não definida
**Causa:** Arquivo carregado fora de ordem
**Solução:** Verifique ordem em `index.html`

### ❌ Erro: Elemento não encontrado
**Causa:** ID/classe não existe
**Solução:** Verifique `index.html` e SELECTORS em `config.js`

### ❌ Erro: Estilo não aplicado
**Causa:** CSS carregado depois de ativo
**Solução:** Aumente especificidade ou mova para arquivo anterior

### ❌ Erro: Botão não funciona
**Causa:** Listener não configurado
**Solução:** Adicione em `configurarEventListeners()` em `events.js`

### ❌ Erro: Dados não carregam
**Causa:** API call falhando
**Solução:** Verifique `SCRIPT_URL` em `config.js`

---

## 📈 Como Adicionar Nova Feature

### 1️⃣ Novo Campo no Formulário

**HTML** (index.html):
```html
<div class="form-group">
    <label for="novocampo">Novo Campo:</label>
    <input type="text" id="novocamp" required>
</div>
```

**Seletor** (config.js):
```javascript
const SELECTORS = {
    // ... existentes
    novocamp: '#novocamp'
};
```

**CSS** (forms.css):
```css
#novocamp { /* estilos */ }
```

**Validação** (utils.js):
```javascript
function validarFormularioTransacao(dados) {
    // ... código existente
    if (!dados.novocamp) return { valido: false, erro: '...' };
}
```

**Submit** (events.js):
```javascript
function obterDadosFormulario() {
    return {
        // ... existentes
        novocamp: document.querySelector(SELECTORS.novocamp).value
    };
}
```

### 2️⃣ Novo Endpoint de API

**Function** (api.js):
```javascript
async function meuEndpoint(parametro) {
    return chamarAPI('meuacao', parametro);
}
```

**Uso** (data.js):
```javascript
const resultado = await meuEndpoint(valor);
```

### 3️⃣ Novo Componente Visual

**CSS** (novo arquivo ou existente):
```css
.meu-componente {
    /* estilos */
}
```

**HTML** (index.html):
```html
<div class="meu-componente">
    <!-- conteúdo -->
</div>
```

**Renderização** (ui.js):
```javascript
function renderizarMeuComponente() {
    // gera HTML e injeta
}
```

---

## 📚 Documentação Completa

- **CSS_MODULAR.md** → Guia detalhado CSS
- **JS_MODULAR.md** → Guia detalhado JavaScript
- **ARVORE_ARQUIVOS.md** → Árvore e mapeamento
- **VALIDACAO_DIVISAO.md** → Checklist de validação
- **RESUMO_DIVISAO_CSS_JS.md** → Resumo visual

---

## 📞 Suporte Rápido

### Perguntas Frequentes

**P: Onde mudo a cor do header?**
A: `css/variables.css` linha ~10, variável `--primary`

**P: Como adiciono novo event listener?**
A: `js/events.js`, função `configurarEventListeners()`

**P: Por que o mobile está quebrado?**
A: Verifique `css/responsive.css` e media queries

**P: Como debugo dados?**
A: Console: `window.debug()` ou `console.log(estadoApp)`

**P: Qual arquivo controla a API?**
A: `js/api.js` tem todas as chamadas fetch

---

## ✨ Dicas Pro

1. Use `Ctrl+Shift+F` para buscar em múltiplos arquivos
2. Abra lado a lado: CSS e JS relacionados
3. Use DevTools para testar CSS em tempo real
4. Console é seu amigo: `window.debug()`
5. Sempre respeite a ordem de carregamento

---

**Versão:** 2.0 Modular  
**Última Atualização:** 2024

