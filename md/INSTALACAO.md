# 🚀 Guia Rápido de Instalação

## 5 Passos para Colocar o App em Funcionamento

### ✅ Passo 1: Preparar o Google Apps Script (Backend)

```
1. Abra https://script.google.com
2. Clique em "Novo projeto"
3. Copie TODO o conteúdo de: google-apps-script/Code.gs
4. Cole no editor do Google Apps Script
5. Clique em "Guardar" (Ctrl+S)
6. Pressione Ctrl+Enter para executar a função testar()
```

### ✅ Passo 2: Deploy do Google Apps Script

```
1. Clique em "Deploy" (botão azul)
2. Clique em "Nova versão"
3. Selecione "Web app" como tipo
4. "Executar como" → Seu email
5. "Quem tem acesso" → "Qualquer pessoa"
6. Clique em "Deploy"
7. COPIE a URL que aparecerá (parece com: 
   https://script.google.com/macros/s/...YOUR_ID.../usercopy)
```

### ✅ Passo 3: Configurar o Frontend

```
1. Abra o arquivo: js/app.js
2. Procure por: const SCRIPT_URL = 'YOUR_SCRIPT_URL'
3. Substitua 'YOUR_SCRIPT_URL' pela URL que você copiou
4. Salve o arquivo (Ctrl+S)
```

### ✅ Passo 4: Testar o App

```
1. Abra index.html no navegador
   (Clique duplo no arquivo, ou
    Clique direito → Abrir com → Navegador)
2. Você deve ver o dashboard com dados simulados
3. Clique em "➕ Adicionar" e tente adicionar uma transação
4. Verifique se apareceu no resumo
5. Abra o console (F12) para ver as requisições
```

### ✅ Passo 5: Verificar a Sincronização

```
1. No Google Apps Script, vá em "Execuções"
2. Você deve ver as requisições do app
3. Abra a planilha Google Sheets (ID do Apps Script)
4. Você deve ver as transações na aba "Transações"
```

---

## ⚡ Atalhos Importantes

| Ação | Atalho |
|------|--------|
| Abrir Console | F12 ou Ctrl+Shift+I |
| Guardar arquivo | Ctrl+S |
| Recarregar página | F5 ou Ctrl+R |
| Executar Apps Script | Ctrl+Enter |

---

## 🎯 O que Cada Arquivo Faz

| Arquivo | Função |
|---------|--------|
| `index.html` | Define a interface (HTML) |
| `css/style.css` | Estilos bonitos (CSS) |
| `js/app.js` | Lógica e interações (JavaScript) |
| `google-apps-script/Code.gs` | Backend que salva dados (Google Apps Script) |
| `README.md` | Documentação completa |

---

## 🐛 Primeiros Testes

### Teste 1: Interface
- [ ] Abri index.html e vi o dashboard
- [ ] Os cartões (Receita, Despesa, Balanço) aparecem
- [ ] Consigo navegar entre abas

### Teste 2: Funcionalidade
- [ ] Consigo adicionar uma transação
- [ ] A transação aparece no resumo
- [ ] O balanço é atualizado
- [ ] Consigo navegar entre meses

### Teste 3: Backend
- [ ] Console (F12) não mostra erros vermelhos
- [ ] Posso ver requisições em "Rede" (Network)
- [ ] Planilha "Transações" foi criada no Google Sheets

---

## 💡 Dicas Importantes

1. **Erro CORS?** 
   - Verifique se deployou como "Web app" (não App Script)
   - Verifique se copiou a URL correta

2. **Transações não salvam?**
   - Abra Console (F12) e procure por erros vermelhos
   - Verifique se a URL do Script está correta em app.js

3. **Dados sumiram?**
   - Eles estão no Google Sheets!
   - Abra a planilha Google Sheets associada ao Apps Script
   - Procure pela aba "Transações"

4. **Quer adicionar categorias?**
   - Edite `CATEGORIAS_SUGERIDAS` em `js/app.js`
   - Adicione suas categorias favoritas

---

## 🌐 Próximo Passo: Hospedar Online

Depois que tudo funcionar, hospede em:

- **GitHub Pages** (Grátis, fácil)
- **Firebase** (Grátis, mais recursos)
- **Netlify** (Grátis, interface bonita)

---

## 📞 Precisa de Ajuda?

1. **Veja os logs do Apps Script:**
   ```
   Apps Script → Execuções → Veja os erros
   ```

2. **Abra o console do navegador:**
   ```
   F12 → Console → Procure por mensagens de erro
   ```

3. **Verifique se a planilha foi criada:**
   ```
   Abra o Google Sheets do seu Apps Script
   Procure pela aba "Transações"
   ```

---

**Você está pronto! 🚀**

Agora é só clicar e começar a usar! Se tiver dúvidas, consulte o `README.md` para documentação completa.

Bom uso! 💰
