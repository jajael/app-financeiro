/**
 * JAVASCRIPT - ESTRUTURA MODULAR
 * Divisão de responsabilidades por arquivo
 */

# 📋 Estrutura JavaScript Modular

Dividimos o arquivo `app.js` (652 linhas) em **8 arquivos especializados** para melhor manutenção e organização.

## 📂 Arquivos JavaScript

### 1. **config.js** (100 linhas)
**Responsabilidade:** Configurações e constantes imutáveis

**Conteúdo:**
- URL do Google Apps Script (`SCRIPT_URL`)
- Categorias padrão fallback (`CATEGORIAS_PADRAO`)
- Cores para gráficos (`CORES_CATEGORIAS`)
- Temas de balanço (`TEMAS_BALANCO`)
- Seletores do DOM centralizados (`SELECTORS`)
- Configurações de UI (`CONFIG`)

**Uso:** Carregado primeiro - importado por todos os outros

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/...';
const SELECTORS = {
    currentMonth: '#currentMonth',
    balanco: '#balanco',
    // ...
};
```

**Quando editar:**
- Mudar URL de deploy
- Adicionar/remover categorias padrão
- Centralizar novos seletores do DOM
- Ajustar configurações globais

**Exemplo de uso em outros arquivos:**
```javascript
// Em ui.js
const mesEl = document.querySelector(SELECTORS.currentMonth);
```

---

### 2. **state.js** (80 linhas)
**Responsabilidade:** Gerenciamento de estado global

**Conteúdo:**
- Objeto `estadoApp` com toda a state
- Mês/ano atual, tipo atual
- Transações (entradas/saídas)
- Resumo calculado
- Menus dinâmicos
- Status de loading
- Funções auxiliares de estado

**Uso:** Mantém dados sincronizados entre funções

```javascript
let estadoApp = {
    mesAtual: new Date(),
    tipoAtual: 'entradas',
    transacoes: { entradas: [], saidas: [] },
    resumo: { entradas: 0, saidas: 0, balanco: 0 },
    menus: { categorias: [], metodos: {} }
};

function atualizarEstado(chave, valor) { /* ... */ }
```

**Funções auxiliares:**
- `atualizarEstado(chave, valor)` - Atualiza estado
- `resetarEstado()` - Limpa tudo
- `obterDados(tipo)` - Lê dados de um tipo
- `obterResumoFormatado()` - Formata resumo para exibição

**Quando editar:**
- Adicionar novas propriedades ao estado
- Criar setters/getters
- Melhorar sincronização

**Exemplo de uso:**
```javascript
// Em data.js
estadoApp.transacoes.entradas = dados;
estadoApp.carregando = false;
```

---

### 3. **api.js** (130 linhas)
**Responsabilidade:** Chamadas Fetch e comunicação com backend

**Conteúdo:**
- `chamarAPI(acao, tipo, mes, ano)` - Requisição GET
- `chamarAPIPOST(payload)` - Requisição POST
- `carregarTransacoes(tipo, mes, ano)` - Busca transações
- `carregarProximas(tipo)` - Busca próximas transações
- `carregarMenusAPI()` - Busca categorias/métodos
- `carregarResumo(tipo, mes, ano)` - Busca resumo
- `adicionarTransacaoAPI(dados)` - POST nova transação
- `editarTransacaoAPI(dados)` - PUT editar transação
- `deletarTransacaoAPI(id, tipo)` - DELETE transação

**Uso:** Centraliza toda comunicação com Google Apps Script

```javascript
async function chamarAPI(acao, tipo, mes, ano) {
    const url = `${SCRIPT_URL}?acao=${acao}&tipo=${tipo}...`;
    const response = await fetch(url);
    return await response.json();
}
```

**Quando editar:**
- Adicionar novos endpoints
- Melhorar tratamento de erros
- Alterar formato de payload

**Exemplo de uso em data.js:**
```javascript
const transacoes = await carregarTransacoes('entradas', mes, ano);
```

---

### 4. **utils.js** (160 linhas)
**Responsabilidade:** Funções auxiliares e utilitários

**Conteúdo:**
- `formatarMoeda(valor)` - Converte para BRL
- `formatarData(dataStr)` - Formata data pt-BR
- `calcularDiasAte(dataStr)` - Dias até uma data
- `validarCampo(valor)` - Verifica se preenchido
- `validarFormularioTransacao(dados)` - Valida formulário
- `mostrarNotificacao(msg, tipo)` - Toast/alert
- `obterMesAnoFormatado(data)` - "Setembro 2026"
- `debounce(func, delay)` - Evita múltiplas chamadas
- `esperar(ms)` - Promise delay
- `adicionarCSSDinamico(css)` - Injecta CSS
- `limparFormulario()` - Reset form
- `obterDadosFormulario()` - Lê campos do form

**Uso:** Funções reutilizáveis em todo app

```javascript
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}
```

**Quando editar:**
- Adicionar novos formatadores
- Criar validadores especializados
- Melhorar notificações

**Exemplo de uso em ui.js:**
```javascript
const texto = formatarMoeda(1500.50); // "R$ 1.500,50"
```

---

### 5. **data.js** (100 linhas)
**Responsabilidade:** Carregamento de dados e população de estado

**Conteúdo:**
- `carregarDados()` - Carrega entradas/saídas do mês
- `carregarDadosSimulados()` - Fallback com dados teste
- `carregarMenus()` - Busca categorias do backend
- `preencherDropdownCategorias()` - Popula SELECT
- `calcularResumoMes()` - Suma valores
- `recarregarDados()` - Refetch e update UI

**Uso:** Orquestra carregamento de dados

```javascript
async function carregarDados() {
    const mes = estadoApp.mesAtual.getMonth() + 1;
    const ano = estadoApp.mesAtual.getFullYear();
    
    const entradas = await carregarTransacoes('entradas', mes, ano);
    estadoApp.transacoes.entradas = entradas;
    
    calcularResumoMes();
    return true;
}
```

**Quando editar:**
- Adicionar novos dados a carregar
- Melhorar lógica de fallback
- Alterar cálculos de resumo

**Exemplo de uso em main.js:**
```javascript
await carregarMenus();
await carregarDados();
```

---

### 6. **ui.js** (200 linhas)
**Responsabilidade:** Atualização do DOM e renderização

**Conteúdo:**
- `atualizarUI()` - Refresh completo da tela
- `atualizarResumo()` - Atualiza cards de resumo
- `atualizarEntradasLista()` - Renderiza lista de entradas
- `atualizarSaidasLista()` - Renderiza lista de saídas
- `gerarHTMLTransacao(trans, tipo)` - Template de item
- `atualizarGrafico()` - Renderiza análise por categoria
- `atualizarProximasTransacoes()` - Carrega e exibe próximas
- `alternarCampoParcelas()` - Mostra/esconde parcelas

**Uso:** Tudo que toca no DOM passa por aqui

```javascript
function atualizarUI() {
    const mesEl = document.querySelector(SELECTORS.currentMonth);
    mesEl.textContent = obterMesAnoFormatado(estadoApp.mesAtual);
    
    atualizarResumo();
    atualizarEntradasLista();
    atualizarSaidasLista();
}

function gerarHTMLTransacao(trans, tipo) {
    return `
        <div class="despesa-item ${tipo}">
            <div class="despesa-info">
                <div class="despesa-categoria">${trans.categoria}</div>
                ...
            </div>
        </div>
    `;
}
```

**Quando editar:**
- Mudar layout visual
- Adicionar novos campos na exibição
- Melhorar templates HTML

**Exemplo de uso em events.js:**
```javascript
atualizarUI(); // Após mudar dados
```

---

### 7. **events.js** (150 linhas)
**Responsabilidade:** Event listeners e handlers de interação

**Conteúdo:**
- `configurarEventListeners()` - Setup de todos os eventos
- `mesAnterior()` / `proximoMes()` - Navegação meses
- `mudarTipoTransacao(tipo)` - Muda entrada/saída
- `mudarAba(novaAba)` - Troca abas
- `submeterFormulario(e)` - Valida e envia form
- `mostrarSugestoes(e)` - Autocomplete de categorias
- `ocultarSugestoes()` - Esconde sugestões
- `selecionarSugestao(categoria)` - Clica em sugestão

**Uso:** Todos os cliques/inputs passam por aqui

```javascript
function configurarEventListeners() {
    document.getElementById('prevMonth')?.addEventListener('click', mesAnterior);
    document.getElementById('nextMonth')?.addEventListener('click', proximoMes);
    
    document.querySelectorAll('.tipo-btn').forEach(btn => {
        btn.addEventListener('click', () => mudarTipoTransacao(btn.dataset.tipo));
    });
    
    document.querySelector(SELECTORS.formTransacao)?.addEventListener('submit', submeterFormulario);
}

function submeterFormulario(e) {
    e.preventDefault();
    const dados = obterDadosFormulario();
    
    const validacao = validarFormularioTransacao(dados);
    if (!validacao.valido) {
        mostrarNotificacao('❌ ' + validacao.erro, 'erro');
        return;
    }
    
    // Enviar para API
    adicionarTransacaoAPI(dados);
}
```

**Quando editar:**
- Adicionar novo interações
- Melhorar validação
- Ajustar fluxos de usuário

**Exemplo de uso em main.js:**
```javascript
configurarEventListeners(); // No DOMContentLoaded
```

---

### 8. **main.js** (120 linhas)
**Responsabilidade:** Inicialização e arquivo principal

**Conteúdo:**
- `DOMContentLoaded` event - Inicialização
- `adicionarEstilosDinamicos()` - Injeta CSS de animações
- Funções globais de debug:
  - `window.recarregarApp()` - Reload no console
  - `window.debug()` - Log estado no console
- Tratamento de erros globais
- Catch de Promises rejeitadas

**Uso:** Ponto de entrada da aplicação

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando aplicação...');
    
    adicionarEstilosDinamicos();
    configurarEventListeners();
    
    await carregarMenus();
    await carregarDados();
    
    atualizarUI();
    console.log('✓ Aplicação iniciada!');
});

// Funções globais úteis
window.recarregarApp = async function() {
    resetarEstado();
    await carregarDados();
    atualizarUI();
};

window.debug = function() {
    console.table(estadoApp);
};
```

**Quando editar:**
- Adicionar novas etapas de inicialização
- Melhorar tratamento de erros
- Adicionar novas funções de debug

---

## 📊 Estrutura de Carregamento

```
index.html
├─ <script> config.js
├─ <script> state.js
├─ <script> api.js
├─ <script> utils.js
├─ <script> data.js
├─ <script> ui.js
├─ <script> events.js
└─ <script> main.js
```

**Ordem de carregamento é crítica!**
- `config.js` deve ser primeira
- `state.js` antes de data/ui/events
- `main.js` por último (DOMContentLoaded dispara)

---

## 🔗 Dependências Entre Arquivos

```
config.js (nenhuma)
    ↓
state.js (depende de config)
    ↓
api.js (depende de config)
utils.js (depende de config)
    ↓
data.js (depende de state, api, utils)
ui.js (depende de state, utils)
events.js (depende de state, api, utils, ui, data)
    ↓
main.js (depende de todos)
```

---

## 💡 Boas Práticas

### Ao adicionar funcionalidade:

1. **Identifique o arquivo correto:**
   - Constante/config? → `config.js`
   - Dado/state? → `state.js`
   - Fetch/API? → `api.js`
   - Utilitário? → `utils.js`
   - Carregamento? → `data.js`
   - Renderização? → `ui.js`
   - Interação? → `events.js`

2. **Evite duplicação:**
   - Verifique se já existe função similar
   - Reutilize ao invés de recriar
   - Centralize lógica compartilhada

3. **Mantenha funções puras:**
   - Uma responsabilidade por função
   - Evite side effects
   - Retorne valores previsíveis

4. **Use nomes descritivos:**
   ```javascript
   // ✓ Bom
   function carregarTransacoes(tipo, mes, ano) { }
   
   // ✗ Ruim
   function buscar(t, m, a) { }
   ```

5. **Adicione logs úteis:**
   ```javascript
   console.log('📊 Carregando dados...');
   console.log('✓ Dados carregados:', estadoApp.transacoes);
   console.error('❌ Erro:', error);
   ```

---

## 🚀 Como Adicionar Nova Feature

### Exemplo: Editar transação existente

1. **Adicione função em `api.js`:**
```javascript
async function editarTransacaoAPI(dados) {
    return chamarAPIPOST({
        acao: 'editar',
        ...dados
    });
}
```

2. **Adicione handler em `events.js`:**
```javascript
async function editarTransacao(id, dados) {
    const validacao = validarFormularioTransacao(dados);
    if (!validacao.valido) return;
    
    await editarTransacaoAPI({ id, ...dados });
    mostrarNotificacao('✓ Transação editada!', 'sucesso');
    await recarregarDados();
}
```

3. **Adicione listener em `events.js`:**
```javascript
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
        const id = e.target.dataset.id;
        editarTransacao(id, obterDadosFormulario());
    }
});
```

4. **Atualize UI em `ui.js`:**
```javascript
function gerarHTMLTransacao(trans, tipo) {
    // Adicione botão de editar
    return `
        <div class="despesa-item ${tipo}">
            ...
            <button class="edit-btn" data-id="${trans.id}">Editar</button>
        </div>
    `;
}
```

---

## 📝 Checklist ao Adicionar Novo Módulo

- [ ] Criar arquivo JS (`modulo.js`)
- [ ] Adicionar constantes em `config.js` se necessário
- [ ] Estender estado em `state.js` se necessário
- [ ] Adicionar funções em `api.js` para requisições
- [ ] Adicionar utilitários em `utils.js`
- [ ] Adicionar renderização em `ui.js`
- [ ] Adicionar listeners em `events.js`
- [ ] Chamar em `main.js` se necessário na inicialização
- [ ] Testar todas as funcionalidades

---

## ⚙️ Conversão do app.js Original

| Seção Original | Arquivo Novo |
|---|---|
| `SCRIPT_URL`, `CATEGORIAS`, `CORES_CATEGORIAS` | `config.js` |
| `estadoApp`, estado | `state.js` |
| Fetch calls | `api.js` |
| `formatarMoeda()`, `validarDados()` | `utils.js` |
| `carregarDados()`, `calcularResumo()` | `data.js` |
| `atualizarUI()`, `gerarHTML*()` | `ui.js` |
| Listeners, handlers | `events.js` |
| `DOMContentLoaded` | `main.js` |

---

## 🧪 Testando no Console

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

## 📚 Estrutura Completa do Projeto

```
app-financeiro/
├── index.html (181 linhas)
├── CSS_MODULAR.md (Este arquivo)
├── JS_MODULAR.md
├── css/
│   ├── variables.css (120)
│   ├── base.css (110)
│   ├── animations.css (250)
│   ├── layout.css (150)
│   ├── dashboard.css (100)
│   ├── tabs.css (140)
│   ├── transactions.css (180)
│   ├── charts.css (180)
│   ├── forms.css (200)
│   └── responsive.css (200)
│   └── [TOTAL: ~1,500 linhas CSS bem organizadas]
│
├── js/
│   ├── config.js (100)
│   ├── state.js (80)
│   ├── api.js (130)
│   ├── utils.js (160)
│   ├── data.js (100)
│   ├── ui.js (200)
│   ├── events.js (150)
│   └── main.js (120)
│   └── [TOTAL: ~1,040 linhas JS bem organizadas]
│
└── google-apps-script/
    ├── constants.gs
    ├── helpers.gs
    ├── recorrencia.gs
    ├── sheets.gs
    ├── crud.gs
    ├── menus.gs
    └── main.gs
```

