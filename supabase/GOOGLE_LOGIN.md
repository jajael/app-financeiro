# Login com Google (Supabase Auth)

O código já tem o botão "Entrar com Google" (`js/auth.js`). Falta configurar o
provider — feito uma vez, nos painéis do Google e do Supabase.

## 1. Google Cloud Console

1. Acesse https://console.cloud.google.com/ e crie (ou escolha) um projeto.
2. **APIs & Services → OAuth consent screen**
   - User type: **External** → Create
   - Preencha nome do app, e-mail de suporte, e-mail do desenvolvedor → Save
   - Em **Test users**, adicione seu e-mail (enquanto o app estiver em "Testing")
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     - `https://jajael.github.io`
     - `http://localhost:8777`
   - **Authorized redirect URIs:**
     - `https://lbfnjxzthbclvgnszway.supabase.co/auth/v1/callback`
   - Create → copie o **Client ID** e o **Client secret**

## 2. Supabase

**Authentication → Providers → Google**
- Enable
- Cole o **Client ID** e o **Client Secret**
- Save

**Authentication → URL Configuration** (já deve estar assim do magic link):
- Site URL: `https://jajael.github.io/app-financeiro`
- Redirect URLs: `https://jajael.github.io/app-financeiro/**` e `http://localhost:8777/**`

## 3. Pronto

Abra o site → "Entrar com Google" → escolhe a conta → volta logado.
A sessão fica salva no navegador (não pede login toda vez; só quando expira,
troca de navegador/dispositivo ou faz logout).

O login por e-mail (magic link) continua disponível como alternativa.
