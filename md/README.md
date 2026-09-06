# 💰 App Financeiro v2.0

> Aplicação web modular para controle de finanças pessoais com arquitetura escalável.

**Status:** ✅ Pronto para Produção | **Versão:** 2.0 Modular | **Docs:** 7 Guias Completos

---

## ✨ O que é?

App Financeiro é uma aplicação **full-stack** que transforma um Google Sheets em uma **plataforma completa de gestão financeira** com:

- ✅ **Frontend Modular:** 18 arquivos organizados (10 CSS + 8 JS)
- ✅ **Backend Robusto:** 7 arquivos Google Apps Script
- ✅ **Recorrências:** 5 tipos (Pontual, Mensal, Último útil, Vencimento, Parcelada)
- ✅ **Holidays:** Cálculo de feriados brasileiros (federal + Rio)
- ✅ **Responsivo:** Mobile, tablet, desktop
- ✅ **Documentação:** 7 guias completos

---

## 🎯 Começar Agora

### 👤 Novo no Projeto?
```bash
1. Leia: INDICE_DOCUMENTACAO.md      (5 min)
2. Depois: GUIA_RAPIDO.md            (10 min)
3. Explore: ARVORE_ARQUIVOS.md       (10 min)
```

### 💻 Editar Código
```bash
CSS:        css/ (10 arquivos)
JavaScript: js/ (8 arquivos)
HTML:       index.html
Backend:    google-apps-script/ (7 arquivos)
```

### 🚀 Deploy Rápido
1. Abra `index.html` em navegador moderno
2. Configure `js/config.js` com URL do Google Apps Script
3. Pronto! Funciona offline (dados do GAS)

---

## 🌟 Características

### Abas Principais
- ✅ **Entradas** - Visualizar receitas
- ✅ **Saídas** - Visualizar despesas  
- ✅ **Próximas** - Transações recorrentes
- ✅ **Adicionar** - Novo formulário

### Recursos
- 📅 Navegação de Meses (Anterior/Próximo)
- 💹 Resumo Financeiro (Receita, Despesa, Saldo)
- 📊 Análise por Categoria (Gráfico)
- 🔁 Recorrências (5 tipos)
- 🇧🇷 Feriados (Federal + Rio)
- 📱 Responsivo (Mobile-first)
- ✅ Validação (Feedback real-time)
- 🔄 Sincronização com Google Sheets

---

## 🚀 Instalação & Configuração

### Parte 1: Backend (Google Apps Script)

1. **Abra Google Apps Script:**
   - Vá para https://script.google.com
   - Clique em "Novo projeto"

2. **Copie os arquivos backend:**
   - Abra `google-apps-script/` (7 arquivos)
   - Copie cada arquivo para o editor GAS
   - Clique em "Guardar"

3. **Execute teste:**
   - Execute função `testar()` para criar sheets
   - Verifique logs

4. **Deploy:**
   - "Deploy" → "Nova versão"
   - "Web app" → "Qualquer pessoa"
   - **Copie URL de deployment**

### Parte 2: Frontend (HTML/CSS/JS)

1. **Abra `js/config.js`**

2. **Configure SCRIPT_URL:**
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID/usercopy';
   ```
   - Substitua `YOUR_ID` pela URL do step anterior

3. **Abra `index.html` no navegador**
   - Ou faça upload para servidor web
   - Ou use GitHub Pages

4. **Pronto!** 🎉

---

## 📂 Estrutura de Arquivos

```
app-financeiro/
├── 📄 README.md                     👈 Este arquivo
├── 📄 index.html                    Marcação semântica
│
├── 📁 css/ (10 arquivos = ~1,663 linhas)
│   ├── variables.css                Cores, espaçamento, tipografia
│   ├── base.css                     Reset e estilos base
│   ├── animations.css               Keyframes e transições
│   ├── layout.css                   Container, grid, flexbox
│   ├── dashboard.css                Cards de resumo
│   ├── tabs.css                     Sistema de abas
│   ├── transactions.css             Listagem de transações
│   ├── charts.css                   Gráficos e análise
│   ├── forms.css                    Formulários e inputs
│   └── responsive.css               Media queries
│
├── 📁 js/ (8 arquivos = ~1,214 linhas)
│   ├── config.js                    Constantes e URLs
│   ├── state.js                     Gerenciamento de estado
│   ├── api.js                       Chamadas Fetch
│   ├── utils.js                     Funções auxiliares
│   ├── data.js                      Carregamento de dados
│   ├── ui.js                        Renderização DOM
│   ├── events.js                    Event listeners
│   └── main.js                      Inicialização
│
├── 📁 google-apps-script/ (7 arquivos)
│   ├── constants.gs                 Configurações globais
│   ├── helpers.gs                   Funções auxiliares
│   ├── recorrencia.gs               Cálculo de datas
│   ├── sheets.gs                    Operações com sheets
│   ├── crud.gs                      CRUD de transações
│   ├── menus.gs                     Gerenciamento de categorias
│   └── main.gs                      HTTP handlers
│
└── 📁 docs/ (7 guias)
    ├── INDICE_DOCUMENTACAO.md       👈 Comece aqui
    ├── SUMARIO_EXECUTIVO.md         Visão geral
    ├── GUIA_RAPIDO.md               Referência ⚡
    ├── CSS_MODULAR.md               Guia CSS
    ├── JS_MODULAR.md                Guia JS
    ├── RESUMO_DIVISAO_CSS_JS.md     Sumário visual
    └── VALIDACAO_DIVISAO.md         Checklist
```

---

## 📖 Documentação

**Novo dev?** Leia nesta ordem:
1. 📄 [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md) - Mapa de navegação
2. ⚡ [GUIA_RAPIDO.md](GUIA_RAPIDO.md) - Referência rápida
3. 🔍 [ARVORE_ARQUIVOS.md](ARVORE_ARQUIVOS.md) - Localizar código

**Editando código?**
- 🎨 [CSS_MODULAR.md](CSS_MODULAR.md) - Para mudanças CSS
- ⚙️ [JS_MODULAR.md](JS_MODULAR.md) - Para mudanças JS

**Antes de deploy?**
- ✅ [VALIDACAO_DIVISAO.md](VALIDACAO_DIVISAO.md) - Checklist completo

---

## 💻 Stack Tecnológico

### Frontend
- **HTML5** - Semântico
- **CSS3** - Grid, Flexbox, Variáveis, Media Queries
- **JavaScript ES6+** - Fetch API, async/await, Closures

### Backend
- **Google Apps Script** - Runtime V8
- **Google Sheets** - Persistência de dados
- **Web App** - Deploy pública

### Ambiente
- **Browser:** Chrome, Firefox, Safari, Edge (moderno)
- **Locale:** Português (pt-BR)

---

## ⚡ Atalhos Úteis

### No Console (F12)
```javascript
// Recarregar dados
window.recarregarApp();

// Ver estado completo  
window.debug();

// Testar API
carregarTransacoes('entradas', 9, 2026);

// Validar formulário
validarFormularioTransacao({...});
```

### Buscas no Código
```
Ctrl+Shift+F    Busca global
Ctrl+F          Busca no arquivo  
Ctrl+G          Ir para linha
```

---

## 🚨 Troubleshooting

| Problema | Solução |
|---|---|
| **Dados não carregam** | Verifique `js/config.js` - SCRIPT_URL correto? |
| **Estilo quebrado mobile** | Abra DevTools → F12 → Toggle device |
| **Botão não funciona** | Procure em `js/events.js` por `configurarEventListeners()` |
| **Campo novo não aparece** | Verificou HTML + CSS + JS + SELECTORS? |

**Mais problemas?** Leia [GUIA_RAPIDO.md](#) - "Erros Comuns"

---

## 📱 Responsividade Testada

- ✅ **Desktop:** 1920px, 1440px, 1024px
- ✅ **Tablet:** 768px, 640px
- ✅ **Mobile:** 480px, 375px, 320px
- ✅ **Landscape:** Todos os modos
- ✅ **Dark Mode:** CSS-ready

---

## 📊 Estatísticas

| Métrica | Valor |
|---|---|
| Arquivos CSS | 10 |
| Arquivos JavaScript | 8 |
| Linhas CSS (total) | ~1,663 |
| Linhas JS (total) | ~1,214 |
| Max linhas/arquivo | 393 |
| Documentação | 7 guias |
| Funcionalidades | 12+ |

---

## 🚀 Roadmap

### Curto Prazo (v2.1)
- [ ] Testes automatizados
- [ ] Build process (webpack)
- [ ] Minificação CSS/JS

### Médio Prazo (v3.0)
- [ ] TypeScript
- [ ] Dark mode toggle
- [ ] Offline support
- [ ] PWA capabilities

### Longo Prazo (v4.0)
- [ ] Banco de dados real
- [ ] Multi-usuário
- [ ] Exportação/Importação
- [ ] Relatórios avançados

---

## 🎯 Fluxo de Dados

```
USER INTERACTION (HTML)
        ↓
    events.js (Listeners)
        ↓
    utils.js (Validação)
        ↓
    api.js (API Calls)
        ↓
    data.js (Processa)
        ↓
    state.js (Estado)
        ↓
    ui.js (Renderiza)
        ↓
    CSS (Estilos)
        ↓
    SCREEN (Resultado)
```

---

## 🤝 Como Contribuir

1. Leia [VALIDACAO_DIVISAO.md](VALIDACAO_DIVISAO.md) - Checklist
2. Siga padrões em [CSS_MODULAR.md](CSS_MODULAR.md) / [JS_MODULAR.md](JS_MODULAR.md)
3. Teste em todos breakpoints
4. Atualize documentação

---

## 📝 FAQ

**P: Por que tantos arquivos?**  
A: Mantém código organizado, fácil de achar, e escalável.

**P: Como adiciono novo campo?**  
A: Leia [GUIA_RAPIDO.md](#) - "Como adicionar nova feature"

**P: Funciona offline?**  
A: Não (precisa conexão para GAS). Futuro: PWA com cache.

**P: Qual navegador usar?**  
A: Qualquer moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**P: Preciso de Node.js?**  
A: Não! É vanilla JS com Fetch API.

---

## 🙌 Creditos

**Desenvolvido por:** Assistant (GitHub Copilot)  
**Baseado em:** Google Sheets Finance Template  
**Framework:** Vanilla (HTML5 + CSS3 + ES6+ JS)  
**Backend:** Google Apps Script  

---

## 📅 Histórico de Versões

| Versão | Data | Status | Notas |
|---|---|---|---|
| v1.0 | 2024 | ❌ Depreciado | Monolítico (style.css + app.js) |
| **v2.0** | 2024 | ✅ **ATUAL** | **Modular (10 CSS + 8 JS)** |

---

## 🎉 Próximo Passo?

1. **👤 Novo dev?** → Leia [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)
2. **💻 Editar código?** → Abra arquivo + [GUIA_RAPIDO.md](GUIA_RAPIDO.md)
3. **🚀 Adicionar feature?** → Consulte [RESUMO_DIVISAO_CSS_JS.md](RESUMO_DIVISAO_CSS_JS.md)
4. **✅ Fazer deploy?** → Valide com [VALIDACAO_DIVISAO.md](VALIDACAO_DIVISAO.md)

---

**Última Atualização:** 2024  
**Status:** ✅ Pronto para Produção  
**Documentação:** Completa  
**Licença:** Propriedade Privada

**Boa sorte! 🚀**
```

## 🐛 Troubleshooting

### App não carrega dados
- Verifique se a URL do Script está correta em `js/app.js`
- Verifique no console (F12 → Console) se há erros
- Certifique-se que o Apps Script foi deployado corretamente

### "Erro de CORS"
- Verifique se a URL do Apps Script está completa
- Certifique-se que o deploy tem acesso "Qualquer pessoa"

### Transações não salvam
- Abra o console (F12 → Console) e veja o erro
- Verifique se o Google Sheets está configurado corretamente
- Teste a função `testar()` no Apps Script novamente

## 📊 Estrutura dos Dados

A planilha Google Sheets terá as seguintes colunas:

| Data | Tipo | Categoria | Descrição | Valor | Criado em |
|------|------|-----------|-----------|-------|-----------|
| 2026-09-05 | receita | Salário | Salário mensal | 8513.37 | 2026-09-05 10:30:45 |
| 2026-09-02 | despesa | Alimentação | Mercado | 344.00 | 2026-09-02 14:15:32 |

## 🌐 Hospedagem

Para hospedar o app online (gratuito):

1. **GitHub Pages**
   - Faça push do projeto para GitHub
   - Ative "Pages" nas configurações do repositório
   - Seu app estará em: `seu-usuario.github.io/nome-repositorio`

2. **Firebase Hosting**
   - Instale Firebase CLI: `npm install -g firebase-tools`
   - Execute: `firebase init hosting`
   - Faça deploy: `firebase deploy`

3. **Netlify**
   - Conecte seu repositório GitHub
   - Deploy automático a cada push

## 📝 Notas Importantes

- O apps script tem um limite de 20k requisições/dia (mais que suficiente para uso pessoal)
- Os dados são armazenados no Google Sheets, seguro e sempre sincronizado
- Você pode compartilhar a planilha com outras pessoas
- O frontend (HTML/CSS/JS) pode ser hospedado em qualquer lugar

## 🎓 Próximos Passos

- [ ] Adicionar busca/filtro de transações
- [ ] Exportar dados em CSV
- [ ] Adicionar metas de orçamento
- [ ] Criar alertas de limite
- [ ] Adicionar suporte offline (Service Workers)
- [ ] Melhorar gráficos (Chart.js)
- [ ] Adicionar temas (claro/escuro)

## 📞 Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Veja os logs do Google Apps Script
3. Verifique se a planilha "Transações" foi criada
4. Teste a função `testar()` no Apps Script

---

Desenvolvido com ❤️ | App Financeiro v1.0
