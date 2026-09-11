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
     - `https://apps-rafa.github.io`
     - `http://localhost:8777`
   - **Authorized redirect URIs:**
     - `https://lbfnjxzthbclvgnszway.supabase.co/auth/v1/callback`
   - Create → copie o **Client ID** e o **Client secret**

## 2. Supabase

Os dois apps (`app-financeiro-of` e o "plano B" `app-financeiro`) usam o
**mesmo projeto Supabase** (`lbfnjxzthbclvgnszway`), então essa configuração
é uma só e vale pros dois sites.

**Authentication → Providers → Google**
- Enable
- Cole o **Client ID** e o **Client Secret**
- Save

**Authentication → URL Configuration**:
- Site URL: `https://apps-rafa.github.io/app-financeiro-of`
- Redirect URLs (uma por linha):
  - `https://apps-rafa.github.io/app-financeiro-of/**`
  - `https://apps-rafa.github.io/app-financeiro/**`
  - `http://localhost:8777/**`

> Histórico: o app já morou em `https://jajael.github.io/app-financeiro`
> antes do repo ser transferido pra org `apps-rafa` em 2026-09-11 — se
> ainda tiver essa URL configurada em algum painel, pode remover.

## 3. Pronto

Abra o site → "Entrar com Google" → escolhe a conta → volta logado.
A sessão fica salva no navegador (não pede login toda vez; só quando expira,
troca de navegador/dispositivo ou faz logout).

Google é o único método de login (o magic link por e-mail foi removido).
