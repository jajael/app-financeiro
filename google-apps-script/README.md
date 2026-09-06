# 📁 Estrutura de Arquivos - Google Apps Script

O código foi divido em **7 arquivos organizados por responsabilidade**:

## 📋 Arquivos e Funções

### 1. **constants.gs** 
**Constantes e Configurações**
- `SHEET_ID` - ID da planilha
- `SHEET_ENTRADAS`, `SHEET_SAIDAS`, `SHEET_MENUS` - Nomes das abas
- `FERIADOS_FIXOS` - Feriados brasileiros fixos
- `FERIADOS_MOVEIS_2026` - Feriados móveis de 2026
- `SHEET_HEADERS` - Headers das planilhas
- `COLUMN_WIDTHS` - Largura das colunas
- Cores (header)

### 2. **helpers.gs**
**Funções Auxiliares e Utilitárias**
- `validarDados()` - Valida dados de transação
- `formatarData()` - Formata datas para YYYY-MM-DD
- `retornarJSON()` - Retorna resposta JSON
- `sucesso()` - Resposta de sucesso
- `erro()` - Resposta de erro
- `ehFimDeSemanaOuFeriado()` - Verifica feriados e fds
- `atualizarRecorrenciasFuturas()` - Atualiza recorrências

### 3. **recorrencia.gs**
**Cálculos de Recorrência e Datas**
- `calcularProximaData()` - Calcula próxima data por tipo
- `calcularUltimoUtilMes()` - Último dia útil do mês
- `ehDiaUtil()` - Verifica se é dia útil
- `calcularDiasEntre()` - Diferença entre datas
- `obterProximosDiasUteis()` - Próximos N dias úteis

### 4. **sheets.gs**
**Manipulação de Planilhas**
- `obterPlanilha()` - Obtém ou cria sheet de transações
- `inicializarPlanilha()` - Inicializa com headers
- `obterPlanilhaMenus()` - Obtém sheet de menus
- `inicializarPlanilhaMenus()` - Inicializa menus
- `obterTodasAsAbas()` - Lista todas as abas
- `deletarAba()` - Remove uma aba

### 5. **crud.gs**
**Operações CRUD**
- `adicionarTransacao()` - POST - Criar
- `listarTransacoes()` - GET - Ler (filtro por mês/ano)
- `editarTransacao()` - POST - Atualizar
- `deletarTransacao()` - POST - Deletar
- `obterResumo()` - GET - Resumo por categoria
- `obterCategorias()` - GET - Lista de categorias
- `obterProximasTransacoes()` - GET - Próximos 30 dias

### 6. **menus.gs**
**Menus Dinâmicos**
- `obterMenus()` - Retorna categorias e métodos
- `criarAbaMenus()` - Cria aba com dados padrão
- `adicionarCategoria()` - Adiciona nova categoria
- `atualizarMetodo()` - Atualiza método de categoria
- `removerCategoria()` - Remove categoria
- `listarMenus()` - Lista formatada para debug

### 7. **main.gs**
**Rotas Principais e Testes**
- `doPost(e)` - Handler para POST
- `doGet(e)` - Handler para GET
- `testar()` - Função de teste completo
- `debugarPlanilhas()` - Debug de informações
- `resetarTodosDados()` - Limpa tudo (⚠️ cuidado!)

---

## 🔄 Fluxo de Requisições

### **POST (adicionarTransacao, editarTransacao, deletarTransacao)**
```
Frontend → doPost(e) → Roteia para função específica → Valida dados → 
Obtém sheet → Modifica linha → Retorna sucesso/erro
```

### **GET (listarTransacoes, obterMenus)**
```
Frontend → doGet(e) → Roteia para função específica → 
Obtém dados do sheet → Formata resposta → Retorna JSON
```

---

## 🚀 Como Usar

### 1. **Copiar para Google Apps Script**
1. Acesse https://script.google.com
2. Crie um novo projeto (ou abra um existente)
3. Delete o arquivo `Code.gs` padrão
4. Crie 7 arquivos com os nomes acima:
   - `constants.gs`
   - `helpers.gs`
   - `recorrencia.gs`
   - `sheets.gs`
   - `crud.gs`
   - `menus.gs`
   - `main.gs`
5. Copie o conteúdo de cada arquivo para seu projeto

### 2. **Testar**
1. Clique em **Selecionar função** (canto superior)
2. Selecione `testar`
3. Pressione **Ctrl+Enter** ou clique em ▶️
4. Veja os resultados no Console (Ctrl+Shift+J)

### 3. **Deploy**
1. Clique em **Deploy** (canto superior direito)
2. Selecione **Nova versão** → **Web app**
3. Configure como:
   - Executar como: Sua conta
   - Ter acesso: Qualquer pessoa
4. Copie a URL e cole em `js/app.js`

---

## 📊 Organização por Responsabilidade

```
constants.gs ──┐
               ├─→ helpers.gs ──┐
helpers.gs ───┤                 ├─→ crud.gs ──┐
recorrencia.gs ┤                 │             ├─→ main.gs (doPost/doGet)
sheets.gs ────┤                 │             │
               ├─→ menus.gs ────┤             │
menus.gs ──────┘                └─────────────┘
```

**Cada arquivo é independente e testável:**
- ✅ Sem código duplicado
- ✅ Fácil encontrar e editar funcionalidades
- ✅ Simples adicionar novos recursos
- ✅ Melhor legibilidade

---

## 💡 Exemplo: Adicionar Nova Funcionalidade

Se quiser adicionar uma nova ação `obterEstatisticas()`:

1. **Se for cálculo de datas:** Adicione em `recorrencia.gs`
2. **Se for consulta ao sheet:** Adicione em `sheets.gs`
3. **Se for operação CRUD:** Adicione em `crud.gs`
4. **Se for relacionado a menus:** Adicione em `menus.gs`
5. **Se for nova rota:** Adicione switch case em `main.gs`
6. **Se for função auxiliar:** Adicione em `helpers.gs`

---

## 🔗 Dependências Entre Arquivos

```
main.gs (entry point)
  ├── Importa: constants.gs (configurações)
  ├── Chama: crud.gs (CRUD operations)
  └── Chama: menus.gs (menus)
       ├── Usa: sheets.gs (obter planilhas)
       ├── Usa: helpers.gs (validação, formatação)
       └── Usa: constants.gs (nomes de abas)

crud.gs
  ├── Usa: sheets.gs (obterPlanilha)
  ├── Usa: helpers.gs (validar, formatar)
  ├── Usa: recorrencia.gs (calcularProximaData)
  └── Usa: constants.gs (nomes de abas)

recorrencia.gs
  ├── Usa: helpers.gs (ehFimDeSemanaOuFeriado)
  └── Usa: constants.gs (FERIADOS)
```

---

## 📝 Tamanho dos Arquivos

| Arquivo | Linhas | Funções |
|---------|--------|---------|
| constants.gs | ~60 | - |
| helpers.gs | ~80 | 8 |
| recorrencia.gs | ~90 | 5 |
| sheets.gs | ~110 | 7 |
| crud.gs | ~200 | 7 |
| menus.gs | ~150 | 6 |
| main.gs | ~180 | 7 |
| **Total** | **~870** | **40** |

**Antes:** 641 linhas em 1 arquivo  
**Depois:** 870 linhas em 7 arquivos ✨

(Aumentou porque adicionei mais funções auxiliares e documentação)

---

## 🔍 Dicas de Manutenção

1. **Sempre comece em `main.gs`** para entender o fluxo
2. **Use `testar()` frequentemente** para validar mudanças
3. **Use `debugarPlanilhas()`** para investigar problemas
4. **Adicione `Logger.log()`** para debug em pontos críticos
5. **Teste funções isoladamente** antes de integrar

---

**Status:** ✅ Pronto para usar | Última atualização: 2026-09-05
