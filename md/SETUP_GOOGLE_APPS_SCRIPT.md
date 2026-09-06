# 📌 Passo a Passo: Copiar Arquivos para Google Apps Script

## ⚙️ Preparação

Você agora tem **7 arquivos separados** em vez de 1 grande `Code.gs`.

**Vantagens:**
- ✅ Mais fácil de navegar
- ✅ Menos chance de erro ao editar
- ✅ Mais organizado
- ✅ Mais profissional

---

## 🚀 Como Fazer

### Passo 1: Abrir Google Apps Script

1. Acesse https://script.google.com
2. Abra seu projeto (ou crie um novo)
3. Se houver um arquivo `Code.gs` existente, **delete-o**

### Passo 2: Criar os 7 Arquivos

**Método 1: Manual (pelo Web)**

1. Clique no `+` ao lado de "Arquivos"
2. Selecione "Script"
3. Nomeie como `constants`
4. Copie o conteúdo de `constants.gs`
5. Clique em "Guardar"
6. Repita para os outros 6 arquivos:
   - helpers
   - recorrencia
   - sheets
   - crud
   - menus
   - main

**Método 2: Clasp (recomendado)**

Se tiver Node.js instalado:

```bash
# Instalar clasp
npm install -g @google/clasp

# Login
clasp login

# Criar projeto (se novo)
clasp create --title "App Financeiro" --type sheets

# Copiar arquivos
cp constants.gs .clasp/src/
cp helpers.gs .clasp/src/
# ... etc

# Upload
clasp push
```

### Passo 3: Verificar

1. No Google Apps Script, veja se tem 7 arquivos na esquerda
2. Cada arquivo deve ter seu conteúdo correto
3. Clique em "Guardar" (Ctrl+S)

### Passo 4: Testar

1. Clique em **Selecionar função** (canto superior)
2. Escolha `testar`
3. Clique em ▶️ ou pressione **Ctrl+Enter**
4. Veja o Console (Ctrl+Shift+J) mostrando:
   ```
   ======== TESTANDO APP FINANCEIRO ========
   ✓ Planilhas criadas...
   ✓ Entrada adicionada...
   ✓ Menus carregados...
   ```

---

## 📋 Checklist

- [ ] Deletei o arquivo `Code.gs` original
- [ ] Criei 7 novos arquivos com os nomes corretos
- [ ] Copiei o conteúdo completo de cada arquivo
- [ ] Salvei todos os arquivos (Ctrl+S)
- [ ] Executei `testar()` com sucesso
- [ ] Verifiquei o console mostrando "TESTES CONCLUÍDOS"
- [ ] Deployei como Web App
- [ ] Copiei a URL para `SCRIPT_URL` em `js/app.js`

---

## 🔗 Ordem de Carregamento (Google Apps Script carrega alfabeticamente)

Google Apps Script carrega os arquivos em **ordem alfabética**, então:

1. constants.gs ✓
2. crud.gs ✓
3. helpers.gs ✓
4. main.gs ✓
5. menus.gs ✓
6. recorrencia.gs ✓
7. sheets.gs ✓

Essa ordem está boa porque:
- `constants.gs` (A) - Carrega constantes primeiro
- `crud.gs` (B) - Usa constantes
- Etc.

**Não há conflito de ordem!** ✅

---

## 🆘 Troubleshooting

### ❌ "Função não definida"

**Causa:** Arquivo não foi copiado
**Solução:**
1. Verifique que tem 7 arquivos
2. Clique em "Guardar" (Ctrl+S)
3. Atualize a página (F5)

### ❌ "Erro ao conectar com Sheets"

**Causa:** Espera a aba ser criada
**Solução:**
1. Execute `testar()` primeiro
2. Verifique se tem 3 abas no Sheets
3. Tente novamente

### ❌ "Erro: SHEET_ID undefined"

**Causa:** `constants.gs` não foi carregado
**Solução:**
1. Verifique se arquivo existe
2. Verifique o nome: `constants.gs` (exatamente)
3. Clique em Guardar (Ctrl+S)
4. Atualize (F5)

---

## 📁 Estrutura Final

Seu Google Apps Script deve ficar assim:

```
📁 App Financeiro (projeto)
├── 📄 constants.gs       ← Configurações
├── 📄 crud.gs             ← Operações CRUD
├── 📄 helpers.gs          ← Funções auxiliares
├── 📄 main.gs             ← Rotas (entry point)
├── 📄 menus.gs            ← Menus dinâmicos
├── 📄 recorrencia.gs      ← Cálculos de datas
└── 📄 sheets.gs           ← Manipulação de sheets
```

---

## 🎯 Próximo Passo

Depois de copiar e testar:

1. **Deploy**: Clique em Deploy → Web app
2. **Copiar URL**: Copie a URL de deployment
3. **Configurar Frontend**: Cole em `js/app.js` no `SCRIPT_URL`
4. **Testar**: Abra `index.html` no navegador

---

## 💡 Dica Extra: Atalhos Úteis

| Atalho | Função |
|--------|--------|
| Ctrl+S | Guardar todos os arquivos |
| Ctrl+Enter | Executar função selecionada |
| Ctrl+Shift+J | Abrir Console |
| Ctrl+Shift+K | Limpar Console |
| Ctrl+G | Ir para linha |
| Ctrl+F | Buscar no arquivo |
| Ctrl+H | Buscar e substituir |

---

**Seu código agora está 7 vezes mais organizado!** 🎉

Status: ✅ Pronto para setup
