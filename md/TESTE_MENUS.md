# 🧪 Guia de Teste - Menus Dinâmicos

## ✅ Implementação Concluída

Sua aplicação agora tem:

### 📊 Nova Aba no Google Sheets: "menus"

Coluna 1: **Tags** (Categorias)  
Coluna 2: **Métodos de pagamento** (Associados)

**Dados pré-carregados:**
- Alimentação → Crédito Bradesco
- Alimentação app → Crédito Nubank
- Assinatura → Pix
- Bebida alcoólica → (vazio)
- Casa → (vazio)
- Compras → (vazio)
- Compras online → (vazio)
- Lazer → (vazio)
- Mercado → (vazio)
- Nelson → (vazio)
- Outros → (vazio)
- Saúde → (vazio)
- Serviços → (vazio)
- Transporte app → (vazio)
- Transporte público → (vazio)

### 💻 Atualizações no Frontend

- ✨ Campo "Categoria" agora é um **dropdown SELECT**
- 🔄 Categorias carregadas dinamicamente da aba "menus"
- 📥 Função `carregarMenus()` busca dados ao iniciar
- 🎯 Função `preencherDropdownCategorias()` popula o select

---

## 🚀 Passo a Passo para Testar

### 1️⃣ Atualizar o Google Apps Script

1. Abra seu Google Apps Script (script.google.com)
2. Apague TODO o código anterior
3. Cole o novo código de `google-apps-script/Code.gs`
4. Clique em **Guardar** (Ctrl+S)
5. No console, execute a função `testar()` (Ctrl+Enter)
   - Você deve ver na saída:
   ```
   ✓ Planilhas criadas: Entradas, Saídas e menus
   ✓ Menus carregados: 15 categorias
   ✓ Testes concluídos
   ```

### 2️⃣ Verificar as Abas no Google Sheets

Depois de rodar `testar()`, você deve ter 3 abas:

- **Entradas**: com 1 linha de teste (Salário)
- **Saídas**: com 1 linha de teste (Alimentação)
- **menus**: com as categorias e métodos

### 3️⃣ Deploy como Web App

1. Em Google Apps Script, clique em **Deploy** (canto superior direito)
2. Selecione **Nova versão** → **Web app**
3. Configurar como:
   - Executar como: Sua conta
   - Ter acesso: **Qualquer pessoa**
4. Clique em **Deploy**
5. Copie a URL de deployment (ex: `https://script.google.com/macros/s/ABC123...XYZ/usercopy`)

### 4️⃣ Atualizar o Frontend

1. Abra `js/app.js`
2. Procure por:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/usercopy';
   ```
3. Substitua `YOUR_DEPLOYMENT_ID` pela URL completa que copiou
4. Salve

### 5️⃣ Testar no Navegador

1. Abra `index.html` no navegador
2. Você deve ver:
   - Dashboard com dados (Salário R$8513.37 na entrada, etc)
   - 4 abas: Entradas, Saídas, Próximas, Adicionar
3. Clique na aba **➕ Adicionar**
4. Teste os campos:
   - Clique no botão **📤 Saída** para mudar o tipo
   - **Categoria** deve ser um dropdown com as opções:
     - Alimentação
     - Alimentação app
     - Assinatura
     - Bebida alcoólica
     - Casa
     - Compras
     - Compras online
     - Lazer
     - Mercado
     - Nelson
     - Outros
     - Saúde
     - Serviços
     - Transporte app
     - Transporte público

### 6️⃣ Adicionar uma Transação de Teste

1. Preencha:
   - Data: Hoje (2026-09-05)
   - Valor: 100,00
   - Método: PIX
   - **Categoria: Alimentação** (selecione do dropdown)
   - Forma de Pagamento: À vista
   - Tipo de Recorrência: Pontual
   - Descrição: Teste de categoria dinâmica

2. Clique em **Adicionar Transação**
3. Você deve ver:
   - ✓ Mensagem de sucesso
   - A página muda para a aba "Saídas"
   - A nova transação aparece na lista

### 7️⃣ Verificar no Google Sheets

1. Abra seu Google Sheets
2. Vá para a aba **Saídas**
3. Você deve ver 2 linhas:
   - Linha 2: Alimentação (teste automático, R$344.00)
   - Linha 3: Alimentação (sua transação, R$100.00)

---

## 🔍 Troubleshooting

### ❌ "Categoria é undefined" ou dropdown vazio

**Causa:** Os menus não foram carregados
**Solução:**
1. Abra o Console (F12)
2. Veja se há erro ao chamar `${SCRIPT_URL}?acao=menus`
3. Verifique se o SCRIPT_URL está correto
4. Execute `testar()` no Apps Script novamente
5. Recarregue a página (F5)

### ❌ "Erro ao conectar com Google Sheets"

**Causa:** URL do Apps Script inválida ou não deployado
**Solução:**
1. Verifique o SCRIPT_URL em `js/app.js`
2. Teste a URL no navegador: `https://...?acao=menus`
3. Deve retornar JSON com categorias
4. Se não funcionar, re-deploy o Apps Script

### ❌ "Dropdown de categoria não aparece"

**Causa:** JavaScript não executou
**Solução:**
1. Verifique o Console (F12)
2. Procure por erros vermelhos
3. Teste se `carregarMenus()` foi executado:
   - Console → Digite: `estadoApp.menus`
   - Deve mostrar um objeto com categorias

### ✅ "Tudo funcionando!"

Parabéns! Sua app está pronta para usar 🎉

---

## 📝 Próximas Melhorias Opcionais

1. **Métodos dinâmicos por categoria**
   - Quando selecionar "Alimentação", mostrar "Crédito Bradesco"
   - Quando selecionar "Assinatura", mostrar "Pix"

2. **Editar a aba "menus" e recarregar**
   - Adicionar novos métodos sem modificar o código
   - Recarregar a página para ver as mudanças

3. **Adicionar categorias customizadas**
   - Permitir que o usuário adicione novas categorias
   - Salvar na aba "menus"

4. **Sugestões inteligentes**
   - Baseado no histórico
   - "Você costuma usar Crédito com Alimentação?"

---

**Status: Pronto para Uso** ✅

Desenvolvido com ❤️
