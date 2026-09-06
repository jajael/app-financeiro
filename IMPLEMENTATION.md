# IMPLEMENTAÇÃO - GERENCIAMENTO DE MENUS

## 📌 Resumo Executivo

Implementação completa de sistema de gerenciamento de menus para o App Financeiro v2.0, permitindo que usuários adicionem, editem e removam opções de categorias, métodos de pagamento e tipos de recorrência.

**Status**: ✅ **IMPLEMENTADO**

## 🏗️ Arquitetura

### Backend (Google Apps Script)

#### constants.gs
Define as constantes do sistema:
```javascript
TIPOS_MENU = {
  CATEGORIA: 'Categoria',
  METODO: 'Método',
  RECORRENCIA: 'Recorrência'
}

MENUS_HEADERS = ['Tipo', 'Nome', 'Descrição', 'Status']
STATUS_VALIDOS = ['Ativo', 'Inativo']
```

#### menus.gs (11 funções)

**Funções de Utilidade:**
- `obterPlanilhaMenus()` - Get/create planilha "menus"
- `inicializarPlanilhaMenus(sheet)` - Add headers + 19 default items
- `validarDadosItem(tipo, nome)` - Valida tipo, nome, duplicatas

**Funções de Leitura:**
- `obterMenus()` - Retorna {categorias[], metodos[], recorrencias[]} (apenas Ativo)
- `obterMenusCompleto()` - Retorna {categorias[], metodos[], recorrencias[]} (com metadata: linha, descrição, status)
- `obterItensPorTipo(tipo)` - Retorna todos items de um tipo (com linhas e status)

**Funções de Manipulação:**
- `adicionarItemMenu(tipo, nome, descricao='')` - Adiciona nova linha
- `editarItemMenu(linha, novoNome, novaDescricao='', novoStatus='Ativo')` - Atualiza linha
- `removerItemMenu(linha)` - Deleta linha (hard delete)
- `desativarItemMenu(linha)` - Marca como "Inativo" (soft delete)
- `ativarItemMenu(linha)` - Marca como "Ativo"

#### main.gs (Rotas Atualizadas)

**POST Routes (nova extensão):**
- `acao: 'adicionarItemMenu'` → `adicionarItemMenu(tipo, nome, descricao)`
- `acao: 'editarItemMenu'` → `editarItemMenu(linha, nome, descricao, status)`
- `acao: 'removerItemMenu'` → `removerItemMenu(linha)`
- `acao: 'desativarItemMenu'` → `desativarItemMenu(linha)`
- `acao: 'ativarItemMenu'` → `ativarItemMenu(linha)`

**GET Routes (nova extensão):**
- `acao=menusCompleto` → Retorna todos menus com metadata
- `acao=itensPorTipo&tipo=Categoria` → Retorna items de um tipo específico

### Frontend

#### index.html
- 5ª aba adicionada: `<button data-tab="menus">⚙️ Menus</button>`
- Seção dedicada: `<section id="menus" class="tab-content">`
- Referências dos novos CSS e JS

#### css/menus.css
- `.menus-gerenciamento` - Grid layout responsivo
- `.menu-section` - Cards para cada tipo
- `.menu-item` - Item individual com status visual
- `.add-item-form` - Formulário de adição
- `.btn-icon` - Botões de ação (editar, desativar, remover)
- Responsividade para mobile

#### js/menus-api.js (7 funções)
Chamadas fetch para API:
```javascript
carregarMenusCompleto() - GET /menus completos
obterItensPorTipo(tipo) - GET items de um tipo
adicionarItemMenuAPI(tipo, nome, descricao) - POST novo item
editarItemMenuAPI(linha, nome, descricao, status) - POST edição
removerItemMenuAPI(linha) - POST remoção
desativarItemMenuAPI(linha) - POST desativar
ativarItemMenuAPI(linha) - POST ativar
```

#### js/menus-ui.js (10 funções)
Renderização e interação:
```javascript
carregarAbaMenus() - Renderiza a aba
renderizarItemsMenu(tipo, containerId, itens) - Renderiza items
adicionarNovaCategoria() - Handler adicionar categoria
adicionarNovoMetodo() - Handler adicionar método
adicionarNovaRecorrencia() - Handler adicionar recorrência
editarItemMenuUI(linha, tipo) - Modal edição
desativarItemMenuUI(linha) - Desativa com confirmação
ativarItemMenuUI(linha) - Ativa item
removerItemMenuUI(linha) - Remove com confirmação
```

#### js/events.js (Modificado)
Adicionado ao `mudarAba()`:
```javascript
else if (novaAba === 'menus') {
  carregarAbaMenus();
}
```

#### js/config.js (Modificado)
Adicionado ao SELECTORS:
```javascript
menusContainer: '#menusContainer',
```

## 📊 Estrutura de Dados

### Google Sheets - Planilha "menus"

| Row | Tipo | Nome | Descrição | Status |
|-----|------|------|-----------|--------|
| 1 | Tipo | Nome | Descrição | Status |
| 2 | Categoria | Alimentação | Compras de alimentos | Ativo |
| 3 | Categoria | Casa | Despesas domésticas | Ativo |
| ... | ... | ... | ... | ... |
| 20 | Recorrência | Parcelada | Pagamento em parcelas | Ativo |

**Total Inicial**: 19 items (8 categorias + 6 métodos + 5 recorrências)

## 🔄 Fluxos de Dados

### Adicionar Item
```
Frontend: adicionarNovaCategoria() 
  ↓
JS: adicionarItemMenuAPI(tipo, nome, desc)
  ↓
Fetch POST: {acao: 'adicionarItemMenu', tipo, nome, descricao}
  ↓
Backend: main.gs → adicionarItemMenu()
  ↓
Google Sheets: Nova linha adicionada
  ↓
Response: {status: 'sucesso', dados: {}, mensagem}
  ↓
Frontend: carregarAbaMenus() - Recarrega lista
```

### Editar Item
```
Frontend: editarItemMenuUI(linha, tipo)
  ↓
Prompt modal: Novo nome + descrição
  ↓
JS: editarItemMenuAPI(linha, nome, desc, status)
  ↓
Fetch POST: {acao: 'editarItemMenu', linha, nome, descricao, status}
  ↓
Backend: main.gs → editarItemMenu()
  ↓
Google Sheets: Linha atualizada
  ↓
Frontend: carregarAbaMenus() - Recarrega
```

### Desativar (Soft Delete)
```
Frontend: desativarItemMenuUI(linha)
  ↓
Confirmação: "Tem certeza?"
  ↓
Fetch POST: {acao: 'desativarItemMenu', linha}
  ↓
Backend: Muda Status para "Inativo"
  ↓
Frontend: Item continua visível mas marcado como inativo
  ↓
Nota: obterMenus() filtra inativos, obterMenusCompleto() mostra todos
```

### Remover (Hard Delete)
```
Frontend: removerItemMenuUI(linha)
  ↓
Confirmação: "Ação irreversível!"
  ↓
Fetch POST: {acao: 'removerItemMenu', linha}
  ↓
Backend: Deleta linha da planilha
  ↓
Frontend: Item desaparece da lista
```

## 🔐 Validações

### Backend (menus.gs)
- Tipo deve estar em TIPOS_MENU
- Nome não pode estar vazio
- Nome não pode ser duplicado para o tipo
- Linha deve ser válida (> 1)
- Status deve estar em STATUS_VALIDOS

### Frontend (menus-ui.js)
- Campo de nome obrigatório
- Confirmações em ações destrutivas
- Tratamento de erros com notificações

## 📝 Resposta API

Formato padrão (helpers.gs):
```javascript
{
  status: 'sucesso' | 'erro',
  dados: { /* dados retornados */ },
  mensagem: 'Descrição legível'
}
```

### Exemplo sucesso
```json
{
  "status": "sucesso",
  "dados": {
    "categorias": [
      {"nome": "Alimentação", "descricao": "...", "status": "Ativo", "linha": 2},
      ...
    ],
    "metodos": [...],
    "recorrencias": [...]
  },
  "mensagem": "Menus carregados"
}
```

### Exemplo erro
```json
{
  "status": "erro",
  "dados": null,
  "mensagem": "Item já existe"
}
```

## 🛠️ Configuração (Clasp)

### .clasp.json
```json
{
  "scriptId": "COLE_SEU_SCRIPT_ID_AQUI",
  "rootDir": "google-apps-script",
  "projectId": "app-financeiro-v2"
}
```

**Como obter SCRIPT_ID:**
1. Google Apps Script Editor
2. Clique em "Projeto" (engrenagem)
3. Copie o "ID do Projeto"

**Usar Clasp:**
```bash
npm install -g @google/clasp
clasp login
# Editar .clasp.json
clasp push   # Sincroniza .gs files
clasp pull   # Baixa alterações
```

## 📦 Arquivos Criados/Modificados

### Criados
- ✅ `google-apps-script/constants.gs` - Constantes
- ✅ `google-apps-script/menus.gs` - Sistema completo
- ✅ `js/menus-api.js` - API calls
- ✅ `js/menus-ui.js` - UI rendering
- ✅ `css/menus.css` - Estilos
- ✅ `.clasp.json` - Configuração Clasp
- ✅ `MENU_MANAGEMENT.md` - Guia usuário
- ✅ `IMPLEMENTATION.md` - Documentação técnica

### Modificados
- ✅ `index.html` - Adicionou aba 5, CSS, JS
- ✅ `js/config.js` - Adicionou seletor menusContainer
- ✅ `js/events.js` - Adicionou handler para aba menus
- ✅ `google-apps-script/main.gs` - Rotas estendidas

## ✅ Checklist de Implementação

- [x] Arquitetura definida (4-column schema)
- [x] Backend implementado (menus.gs + 11 funções)
- [x] API routes estendidas (main.gs)
- [x] Constants definidas (constants.gs)
- [x] Frontend HTML criado (index.html)
- [x] CSS styling completo (menus.css)
- [x] JavaScript API (menus-api.js)
- [x] JavaScript UI (menus-ui.js)
- [x] Events integration (events.js)
- [x] Config updated (config.js)
- [x] Clasp configuration (.clasp.json)
- [x] User documentation (MENU_MANAGEMENT.md)
- [x] Technical documentation (IMPLEMENTATION.md)

## 🧪 Testes Manuais

1. **Carregar aba**: Clique em "⚙️ Menus" → Deve carregar menus completos
2. **Adicionar**: Digite nome → Clique "Adicionar" → Deve aparecer na lista
3. **Editar**: Clique "✏️" → Digite novo nome → Deve atualizar
4. **Desativar**: Clique "⊘" → Deve marcar como inativo
5. **Ativar**: Clique "↻" em item inativo → Deve restaurar
6. **Remover**: Clique "🗑️" → Confirme → Deve desaparecer

## 🚀 Próximos Passos

1. Usuário: Inserir SCRIPT_ID em `.clasp.json`
2. Usuário: Executar `clasp push`
3. Usuário: Testar aba de Menus no app
4. Usuário: Adicionar/editar/remover items conforme necessário

## 📚 Referências

- [Google Apps Script V8 Runtime](https://developers.google.com/apps-script/guides/v8-runtime)
- [Clasp CLI](https://github.com/google/clasp)
- [Google Sheets API via Apps Script](https://developers.google.com/apps-script/reference/spreadsheet)
