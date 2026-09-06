# 📤 GUIA DE UPLOAD MANUAL - Google Apps Script

Como clasp tem problemas de permissão, aqui está o jeito **mais rápido e simples**: fazer upload manual dos arquivos `.gs` no Google Apps Script Editor.

## 🚀 Passo a Passo

### 1️⃣ Abrir Google Apps Script

1. Vá para: https://script.google.com
2. Clique em **"+ Novo Projeto"**
3. Nome: `App Financeiro v2.0`

### 2️⃣ Copiar Conteúdo dos Arquivos

Você vai copiar o conteúdo de 4 arquivos locais para o Google Apps Script:

**Arquivos a copiar:**
- `google-apps-script/constants.gs`
- `google-apps-script/menus.gs`
- `google-apps-script/main.gs`
- `google-apps-script/helpers.gs` (se existir)

### 3️⃣ Criar os Arquivos no Google Apps Script

Siga para **CADA arquivo**:

#### A. Constants.gs
1. No Google Apps Script, clique em **+ (nova aba)**
2. Selecione **Google Apps Script**
3. Nomeie: `constants`
4. Copie TODO o conteúdo de `google-apps-script/constants.gs`
5. Cole em `constants.gs` no Google Apps Script
6. Clique **Salvar**

#### B. Menus.gs
1. Repita o mesmo processo:
   - **+ (nova aba)** → **Google Apps Script**
   - Nomeie: `menus`
   - Copie conteúdo de `google-apps-script/menus.gs`
   - Cole e salve

#### C. Main.gs
1. **+ (nova aba)** → **Google Apps Script**
2. Nomeie: `main`
3. Copie conteúdo de `google-apps-script/main.gs`
4. Cole e salve

#### D. Helpers.gs (se existir)
1. **+ (nova aba)** → **Google Apps Script**
2. Nomeie: `helpers`
3. Copie conteúdo de `google-apps-script/helpers.gs`
4. Cole e salve

### 4️⃣ Atualizar a URL no Frontend

Após salvar, você verá a URL de deployment:

1. Em Google Apps Script, clique em **Deploy** → **New Deployment**
2. Tipo: **Web app**
3. Confira execute como sua conta
4. Copie a URL gerada
5. No seu projeto, abra `js/config.js`
6. Procure `const SCRIPT_URL = '...'`
7. **Substitua pela nova URL**

### 5️⃣ Testar!

1. Volte ao seu app (`index.html`)
2. Abra aba **Menus**
3. Veja se carrega os menus 🎉

## 📋 Checklist

- [ ] Criada conta Google (ou já tem)
- [ ] Novo projeto no Google Apps Script
- [ ] ✅ constants.gs copiado e salvo
- [ ] ✅ menus.gs copiado e salvo
- [ ] ✅ main.gs copiado e salvo
- [ ] ✅ helpers.gs copiado e salvo (se houver)
- [ ] URL de deployment atualizada em `js/config.js`
- [ ] App testado e funcionando

## 🎯 Resultado Final

Após isso, você terá:
- ✅ Backend funcionando em Google Apps Script
- ✅ Frontend conectado via API
- ✅ Aba de Menus operacional
- ✅ CRUD de categorias/métodos/recorrências

## ⚠️ Dúvidas?

Se algo não funcionar:
1. Verifique se copiou os arquivos **completos** (sem perder linhas)
2. Verifique se a **URL** em config.js está correta
3. Abra o console do navegador (F12) e veja os erros
4. Verifique o log do Google Apps Script (logs são mostrados ao executar)

---

**Próximo passo**: Confirme quando terminar! ✨
