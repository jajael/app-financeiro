# 🏗️ DIAGRAMA DE ARQUITETURA - App Financeiro v2.0

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APP FINANCEIRO v2.0                         │
│                     Full-Stack Finance Application                   │
└─────────────────────────────────────────────────────────────────────┘

                             ┌─────────────┐
                             │   Browser   │
                             │  (Chrome,   │
                             │ Firefox,    │
                             │  Safari)    │
                             └──────┬──────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │       FRONTEND LAYER          │
                    │     (HTML5 + CSS3 + JS)       │
                    └───────────────┼───────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
        ┌───▼──────┐           ┌────▼─────┐           ┌───▼──────┐
        │  index   │           │  css/    │           │   js/    │
        │  .html   │           │(10 files)│           │(8 files) │
        └──────────┘           └──────────┘           └──────────┘
            │                       │                       │
            │    variables.css      │    config.js         │
            │    base.css           │    state.js          │
            │    animations.css     │    api.js            │
            │    layout.css         │    utils.js          │
            │    dashboard.css      │    data.js           │
            │    tabs.css           │    ui.js             │
            │    transactions.css   │    events.js         │
            │    charts.css         │    main.js           │
            │    forms.css          │                      │
            │    responsive.css     │                      │
            │                       │                      │
            └───────────────────────┼──────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   FETCH API (HTTP/CORS)      │
                    │    JSON Request/Response      │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │      GOOGLE APPS SCRIPT       │
                    │      (Backend Layer)          │
                    │    (7 Files + ~870 lines)     │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
        ┌───▼──────┐           ┌────▼─────┐           ┌───▼──────┐
        │constants │           │ helpers  │           │recorrencia
        │  .gs     │           │   .gs    │           │   .gs    │
        └──────────┘           └──────────┘           └──────────┘
            │                       │                       │
        ┌───▼──────┐           ┌────▼─────┐           ┌───▼──────┐
        │  sheets  │           │   crud   │           │  menus   │
        │   .gs    │           │   .gs    │           │   .gs    │
        └──────────┘           └──────────┘           └──────────┘
            │                       │                       │
            └───────────────────────┼──────────────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │   main.gs             │
                        │ (Route Handlers)      │
                        │ doGet / doPost        │
                        └───────────┬───────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   GOOGLE SHEETS API           │
                    │  (Data Persistence)           │
                    └───────────────┬───────────────┘
                                    │
                            ┌───────▼────────┐
                            │ Google Sheets  │
                            │ (Live Database)│
                            │                │
                            │ 3 Sheets:      │
                            │ • Entradas     │
                            │ • Saídas       │
                            │ • Menus        │
                            └────────────────┘
```

---

## Fluxo de Requisições

### 1️⃣ Usuário Interage com Interface (HTML)
```
┌─────────────────────┐
│ Usuário clica botão │ (index.html)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  event.js detecta  │
│  clique do mouse   │
└──────────┬──────────┘
```

### 2️⃣ Validação de Dados (JavaScript)
```
┌──────────────────────────┐
│  utils.js:               │
│ • validarCampo()         │
│ • formatarMoeda()        │
│ • formatarData()         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Estado válido?           │
└──────────┬───────────────┘
           │
     ┌─────┴─────┐
     │           │
    SIM         NÃO
     │           │
     ▼           ▼
[próximo]    [erro]
```

### 3️⃣ Chamada à API (Fetch)
```
┌──────────────────────────┐
│  api.js:                 │
│ • chamarAPI()            │
│ • adicionarTransacao()   │
│ • carregarTransacoes()   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Fetch POST/GET           │
│ JSON data → GAS          │
└──────────┬───────────────┘
```

### 4️⃣ Backend Processa (Google Apps Script)
```
┌──────────────────────────┐
│  main.gs: doPost()       │
│ Recebe JSON              │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ crud.gs: operação        │
│ • adicionarTransacao()   │
│ • editarTransacao()      │
│ • deletarTransacao()     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ recorrencia.gs:          │
│ calcularProximaData()    │
│ (5 tipos de recorrência) │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ sheets.gs:               │
│ • escreveData()          │
│ • lê dados               │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Google Sheets            │
│ Transações inseridas     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ helpers.gs:              │
│ • retornarJSON()         │
│ • sucesso()              │
│ • erro()                 │
└──────────┬───────────────┘
```

### 5️⃣ Resposta Retorna (JSON)
```
┌──────────────────────────┐
│ main.gs: return JSON     │
│ {                        │
│   sucesso: true,         │
│   dados: { ... }         │
│ }                        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Fetch response           │
│ JSON → JavaScript        │
└──────────┬───────────────┘
```

### 6️⃣ Atualizar Estado (State Management)
```
┌──────────────────────────┐
│ data.js:                 │
│ • carregarDados()        │
│ • calcularResumo()       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ state.js:                │
│ • estadoApp atualizado   │
│ • atualizarEstado()      │
└──────────┬───────────────┘
```

### 7️⃣ Renderizar Interface (DOM Updates)
```
┌──────────────────────────┐
│ ui.js:                   │
│ • atualizarResumo()      │
│ • atualizarListas()      │
│ • gerarHTMLTransacao()   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ index.html: DOM          │
│ innerHTML atualizado     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ CSS:                     │
│ • Cores aplicadas        │
│ • Animações ativadas     │
│ • Responsividade         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Browser Renderiza        │
│ Novo visual exibido      │
└──────────────────────────┘
```

---

## Fluxo Detalhado por Arquivo

### 📂 JavaScript (Ordem de Execução)

```
┌─────────────────────────────────────┐
│ index.html carrega arquivos JS      │
│ em ordem específica:                │
└──────────────┬──────────────────────┘
               │
    ┌──────────▼──────────┐
    │ config.js (1º)      │
    │                     │
    │ • SCRIPT_URL        │
    │ • SELECTORS         │
    │ • CATEGORIAS        │
    │ • Sem dependências  │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │ state.js (2º)       │
    │                     │
    │ • estadoApp         │
    │ • Depende: config   │
    └──────────┬──────────┘
               │
      ┌────────┴────────┐
      │                 │
    ┌─▼──────┐    ┌───▼───┐
    │ api.js │    │utils.js
    │ (3º)   │    │ (4º)  │
    │        │    │       │
    │Fetch   │    │Format │
    │Calls   │    │Valid  │
    └─┬──────┘    └───┬───┘
      │                │
      └────────┬───────┘
               │
    ┌──────────▼──────────┐
    │ data.js (5º)        │
    │                     │
    │ • carregarDados()   │
    │ • Depende: api,     │
    │   state, utils      │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │ ui.js (6º)          │
    │                     │
    │ • atualizarUI()     │
    │ • Depende: state    │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │ events.js (7º)      │
    │                     │
    │ • Listeners         │
    │ • Depende: todos    │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │ main.js (8º)        │
    │                     │
    │ • DOMContentLoaded  │
    │ • Inicialização     │
    └──────────────────────┘
```

### 📂 CSS (Ordem de Cascata)

```
┌──────────────────────────────┐
│ index.html carrega CSS       │
│ em ordem específica:         │
└────────────┬─────────────────┘
             │
  ┌──────────▼──────────┐
  │ variables.css (1º)  │
  │ Cores, espaçamento  │
  │ :root { -- }        │
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ base.css (2º)       │
  │ Reset + base        │
  │ *, html, body       │
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ animations.css (3º) │
  │ @keyframes          │
  │ transitions         │
  └──────────┬──────────┘
             │
  ┌─────────────────────────────────┐
  │      Arquivos Componentes       │
  ├─────────────────────────────────┤
  │ layout.css (4º)                 │
  │ dashboard.css (5º)              │
  │ tabs.css (6º)                   │
  │ transactions.css (7º)           │
  │ charts.css (8º)                 │
  │ forms.css (9º)                  │
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ responsive.css (10º)│
  │ @media queries      │
  │ Mobile override     │
  └──────────────────────┘
```

---

## Estrutura de Dados

### Estado da Aplicação (state.js)

```javascript
estadoApp = {
  mesAtual: 9,
  anoAtual: 2026,
  tipoAtual: 'entradas',
  
  transacoes: {
    entradas: [
      {
        id: '1',
        data: '2026-09-01',
        valor: 3000.00,
        metodo: 'Salário',
        categoria: 'Renda',
        descricao: 'Salário mensal',
        formaPagamento: 'Transferência',
        tipoRecorrencia: 'Mensal',
        proximaData: '2026-10-01',
        status: 'ativo',
        criadoEm: '2026-01-01T10:00:00Z'
      }
    ],
    saidas: [
      {
        id: '2',
        data: '2026-09-05',
        valor: 1200.00,
        metodo: 'Aluguel',
        categoria: 'Habitação',
        descricao: 'Aluguel do apartamento',
        formaPagamento: 'Débito',
        tipoRecorrencia: 'Mensal',
        proximaData: '2026-10-05',
        status: 'ativo',
        criadoEm: '2026-01-01T10:00:00Z'
      }
    ]
  },
  
  resumo: {
    entradas: 3000.00,
    saidas: 1200.00,
    saldo: 1800.00
  },
  
  menus: {
    categorias: ['Renda', 'Habitação', 'Alimentação'],
    metodos: ['PIX', 'Débito', 'Crédito']
  },
  
  carregando: false,
  erro: null
}
```

### Transação Schema (10 colunas)

```
┌─────────┬──────────┬─────────┬──────────┬───────────┬──────────────┐
│ Data    │ Valor    │ Método  │ Categoria│ Descrição │ Forma Pagto  │
├─────────┼──────────┼─────────┼──────────┼───────────┼──────────────┤
│09/09/26 │ 3000.00  │ Salário │ Renda    │ Salário   │ Transferência│
│         │          │         │          │ mensal    │              │
├─────────┼──────────┼─────────┼──────────┼───────────┼──────────────┤
│05/09/26 │ 1200.00  │ Aluguel │ Habitação│ Aluguel   │ Débito       │
│         │          │         │          │ apto      │              │
└─────────┴──────────┴─────────┴──────────┴───────────┴──────────────┘

Continuação:
┌───────────────────┬──────────────┬────────────────┬───────────────┐
│ Tipo Recorrência  │ Próxima Data │ Status         │ Criado em     │
├───────────────────┼──────────────┼────────────────┼───────────────┤
│ Mensal            │ 01/10/2026   │ ativo          │ 01/01/2026    │
├───────────────────┼──────────────┼────────────────┼───────────────┤
│ Mensal            │ 05/10/2026   │ ativo          │ 01/01/2026    │
└───────────────────┴──────────────┴────────────────┴───────────────┘
```

---

## Padrão MVC Adaptado

```
┌──────────────────────┐
│      MODEL           │
├──────────────────────┤
│ state.js             │
│ • estadoApp          │
│ • obterDados()       │
│ • atualizarEstado()  │
│                      │
│ config.js            │
│ • Constantes         │
│ • SELECTORS          │
└──────────────────────┘
        △
        │
        │ (Atualiza)
        │
┌───────┴──────────────┐
│      CONTROLLER      │
├──────────────────────┤
│ events.js            │
│ • Event listeners    │
│ • Orquestra ações    │
│                      │
│ data.js              │
│ • Carrega dados      │
│ • Processa          │
└──────────────────────┘
        △
        │
        │ (Atualiza)
        │
┌───────┴──────────────┐
│        VIEW          │
├──────────────────────┤
│ ui.js                │
│ • Renderiza DOM      │
│                      │
│ CSS                  │
│ • Estilos            │
│ • Animações          │
│                      │
│ index.html           │
│ • Estrutura          │
└──────────────────────┘
        △
        │
        │ (Dispara)
        │
    [USER]
```

---

## Dependências Entre Módulos

```
config.js (nenhuma)
    ├─ state.js
    │   ├─ data.js
    │   │   ├─ ui.js
    │   │   │   ├─ events.js
    │   │   │   │   └─ main.js
    │   │   └─ api.js
    │   │       └─ events.js
    │   └─ api.js
    │       └─ utils.js
    ├─ api.js (depende: config)
    │   └─ events.js
    ├─ utils.js (depende: config)
    │   ├─ events.js
    │   ├─ data.js
    │   └─ ui.js
    └─ events.js

        main.js (último - depende de TODOS)
```

---

## Comparação: Monolítico vs Modular

```
ANTES (v1.0)
──────────────────────────────────
app.js (652 linhas)
    └─ Tudo junto:
       • Config
       • Estado
       • API calls
       • Validação
       • Renderização
       • Event listeners
    └─ Difícil encontrar código
    └─ Difícil testar isoladamente
    └─ Difícil reutilizar

style.css (549 linhas)
    └─ Tudo junto:
       • Variáveis
       • Reset
       • Animações
       • Layout
       • Componentes
       • Media queries
    └─ Cascata complexa
    └─ Difícil encontrar regra


DEPOIS (v2.0)
──────────────────────────────────
js/ (8 arquivos)
  ├─ config.js (103) ← Constantes
  ├─ state.js (67) ← Estado
  ├─ api.js (137) ← API
  ├─ utils.js (153) ← Funções
  ├─ data.js (172) ← Dados
  ├─ ui.js (257) ← Renderização
  ├─ events.js (212) ← Listeners
  └─ main.js (115) ← Inicialização

css/ (10 arquivos)
  ├─ variables.css (82) ← Variáveis
  ├─ base.css (108) ← Reset
  ├─ animations.css (311) ← Animações
  ├─ layout.css (164) ← Layout
  ├─ dashboard.css (134) ← Cards
  ├─ tabs.css (171) ← Abas
  ├─ transactions.css (197) ← Transações
  ├─ charts.css (220) ← Gráficos
  ├─ forms.css (283) ← Formulários
  └─ responsive.css (393) ← Mobile

BENEFÍCIOS:
✅ Fácil localizar código (< 1 min)
✅ Fácil testar isoladamente
✅ Código reutilizável
✅ Manutenção simplificada
✅ Onboarding mais rápido
```

---

## Ciclo de Vida da Aplicação

```
1. CARREGAMENTO
   └─ index.html carrega
      └─ CSS files (variables → responsive)
      └─ JS files (config → main)

2. INICIALIZAÇÃO (main.js)
   └─ DOMContentLoaded
      └─ Adiciona estilos dinâmicos
      └─ Configura event listeners (events.js)
      └─ Carrega menus (data.js → api.js)
      └─ Carrega dados do mês (data.js → api.js)
      └─ Renderiza UI (ui.js → CSS)

3. INTERAÇÃO (events.js)
   └─ Usuário clica/digita
      └─ Validação (utils.js)
      └─ Chamada API (api.js)
      └─ Atualiza estado (state.js)
      └─ Atualiza UI (ui.js)
      └─ Aplica CSS
      └─ Exibe resultado

4. NAVEGAÇÃO
   └─ Usuário clica mês anterior/próximo
      └─ Carrega novos dados (data.js)
      └─ Atualiza estado
      └─ Re-renderiza UI
      └─ Mostra nova página
```

---

## Deploy & Environment

```
┌─────────────────────────────────────┐
│      LOCAL DEVELOPMENT              │
├─────────────────────────────────────┤
│ • Abra index.html                   │
│ • Chrome DevTools (F12)             │
│ • Console: window.debug()           │
│ • Network: Veja requisições         │
│ • Sources: Debug JS                 │
│ • Elements: Inspecione HTML/CSS     │
└─────────────────────┬───────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    ┌────▼────┐          ┌────────▼─────┐
    │LOCALHOST│          │ PRODUCTION    │
    │  :3000  │          │(GitHub Pages) │
    └────────┬┘          └───────┬──────┘
             │                   │
    ┌────────▼─────────┐   ┌────▼──────────┐
    │ assets/          │   │ Upload to:     │
    │ • index.html     │   │ • GitHub Pages │
    │ • css/           │   │ • Netlify      │
    │ • js/            │   │ • Firebase     │
    └──────────────────┘   └────────────────┘
```

---

**Última Atualização:** 2024  
**Versão:** 2.0 Modular

