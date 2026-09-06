# GUIA DE CONFIGURAÇÃO - GERENCIAMENTO DE MENUS

## 📋 Visão Geral

O sistema de menus permite ao usuário gerenciar três tipos de opções no aplicativo:

1. **Categorias** - Tipos de transações (Alimentação, Saúde, etc)
2. **Métodos de Pagamento** - Formas de pagar (Pix, Cartão, etc)
3. **Tipos de Recorrência** - Padrões de repetição (Mensal, Pontual, etc)

## 🚀 Funcionalidades

### Gerenciar Menus - Aba ⚙️

Acesse a aba **"Menus"** no aplicativo para:

- ✅ **Visualizar** todos os itens de cada categoria
- ✅ **Adicionar** novos itens com nome e descrição
- ✅ **Editar** itens existentes
- ✅ **Desativar** itens (mais seguro que remover)
- ✅ **Ativar** itens desativados
- ✅ **Remover** itens permanentemente

### Dados Padrão (19 itens)

**Categorias (8)**
- Alimentação
- Casa
- Lazer
- Saúde
- Transporte
- Compras
- Serviços
- Outros

**Métodos de Pagamento (6)**
- Pix
- Cartão Crédito
- Cartão Débito
- Dinheiro
- Boleto
- Transferência

**Tipos de Recorrência (5)**
- Pontual
- Mensal
- Último Útil
- Vencimento
- Parcelada

## 🔧 Configuração Inicial (Clasp)

### Pré-requisitos

1. Node.js instalado
2. Conta Google com acesso ao Google Apps Script

### Instalação do Clasp

```bash
npm install -g @google/clasp
clasp login
```

### Configuração do Projeto

1. Edite `.clasp.json`:
```json
{
  "scriptId": "SEU_SCRIPT_ID_AQUI",
  "rootDir": "google-apps-script",
  "projectId": "app-financeiro-v2"
}
```

2. Localize seu SCRIPT_ID:
   - Google Apps Script Editor → Projeto → ID do Projeto
   - Copie o ID

3. Execute `clasp push` para sincronizar os arquivos `.gs`

### Sincronizar com Google Sheets

No Google Apps Script Editor:
1. Abra `main.gs`
2. Execute a função `testar()`
3. A planilha "menus" será criada automaticamente

## 📱 Como Usar

### Adicionar Item

1. Vá para aba **Menus**
2. Na seção desejada (Categorias, Métodos, Recorrências)
3. Digite **Nome** e **Descrição** (opcional)
4. Clique em **+ Adicionar**

### Editar Item

1. Encontre o item desejado
2. Clique em **✏️ Editar**
3. Digite o novo nome
4. Confirme com OK

### Desativar Item

1. Clique em **⊘ Desativar** no item
2. O item ficará inativo mas continuará no banco

### Remover Item

1. Clique em **🗑️ Remover**
2. Confirme a remoção (⚠️ Ação irreversível)

## 📊 Estrutura de Dados (Google Sheets)

A planilha **"menus"** contém:

| Tipo | Nome | Descrição | Status |
|------|------|-----------|--------|
| Categoria | Alimentação | Compras de alimentos | Ativo |
| Método | Pix | Transferência instantânea | Ativo |
| Recorrência | Mensal | Pagamento todo mês | Ativo |

## 🔌 API Endpoints

### POST - Adicionar Item
```javascript
acao: 'adicionarItemMenu',
tipo: 'Categoria',
nome: 'Novo Item',
descricao: 'Descrição'
```

### POST - Editar Item
```javascript
acao: 'editarItemMenu',
linha: 2,
nome: 'Nome Atualizado',
descricao: 'Nova descrição',
status: 'Ativo'
```

### POST - Desativar Item
```javascript
acao: 'desativarItemMenu',
linha: 2
```

### GET - Obter Menus Completos
```javascript
GET: ?acao=menusCompleto
```

## 🛠️ Arquivos Envolvidos

### Backend (Google Apps Script)
- `constants.gs` - Configurações e constantes
- `menus.gs` - CRUD de menus
- `main.gs` - Rotas API

### Frontend
- `index.html` - Interface HTML
- `css/menus.css` - Estilos
- `js/menus-api.js` - Chamadas de API
- `js/menus-ui.js` - Renderização da aba
- `js/events.js` - Eventos

### Configuração
- `.clasp.json` - Configuração do Clasp
- `config.js` - Constantes frontend

## 📝 Notas Importantes

⚠️ **Desativar vs Remover**
- **Desativar**: Mantém os dados, marca como "Inativo"
- **Remover**: Deleta permanentemente da planilha

⚠️ **Descrição**
- Campo opcional para detalhar o item
- Útil para itens complexos

⚠️ **Status**
- Sempre "Ativo" ou "Inativo"
- Itens inativos não aparecem nos formulários

## 🐛 Troubleshooting

### Menus não carregam
1. Verifique conexão com internet
2. Verifique SCRIPT_URL em config.js
3. Execute `testar()` no Google Apps Script

### Erro ao adicionar item
1. Verifique se o nome não está duplicado
2. Verifique se o tipo está correto (Categoria, Método, Recorrência)
3. Veja o console do navegador (F12) para mais detalhes

### Clasp não sincroniza
1. Verifique se .clasp.json está configurado
2. Execute `clasp login` novamente
3. Verifique se SCRIPT_ID está correto

## 📞 Suporte

Para mais informações sobre Google Apps Script:
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Clasp CLI](https://github.com/google/clasp)
