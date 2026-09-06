/**
 * AUTENTICAÇÃO - Supabase Auth (magic link)
 * Login sem senha: o usuário informa o e-mail e recebe um link de acesso.
 * Enquanto não houver sessão, uma tela cobre o app.
 */

const AUTH_REDIRECT = window.location.origin + window.location.pathname;

/**
 * Injeta o CSS e o HTML da tela de login (uma vez).
 */
function montarTelaLogin() {
    if (document.getElementById('authOverlay')) return;

    const css = `
        #authOverlay {
            position: fixed; inset: 0; z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #4F46E5, #7C3AED);
            font-family: inherit;
        }
        #authOverlay .auth-card {
            background: #fff; padding: 2.5rem 2rem; border-radius: 16px;
            box-shadow: 0 20px 50px rgba(0,0,0,.25);
            width: min(90vw, 380px); text-align: center;
        }
        #authOverlay h2 { margin: 0 0 .25rem; color: #1F2937; }
        #authOverlay p { margin: 0 0 1.5rem; color: #6B7280; font-size: .9rem; }
        #authOverlay input {
            width: 100%; padding: .8rem 1rem; margin-bottom: .8rem;
            border: 1px solid #D1D5DB; border-radius: 8px; font-size: 1rem;
        }
        #authOverlay button {
            width: 100%; padding: .8rem 1rem; border: 0; border-radius: 8px;
            background: #4F46E5; color: #fff; font-size: 1rem; font-weight: 600;
            cursor: pointer;
        }
        #authOverlay button:disabled { opacity: .6; cursor: default; }
        #authOverlay #authGoogle {
            background: #fff; color: #1F2937; border: 1px solid #D1D5DB;
            display: flex; align-items: center; justify-content: center; gap: .5rem;
        }
        #authOverlay .auth-sep {
            display: flex; align-items: center; gap: .6rem;
            color: #9CA3AF; font-size: .8rem; margin: 1rem 0 .8rem;
        }
        #authOverlay .auth-sep::before, #authOverlay .auth-sep::after {
            content: ""; flex: 1; height: 1px; background: #E5E7EB;
        }
        #authOverlay .auth-msg { margin-top: 1rem; font-size: .9rem; min-height: 1.2em; }
        #authOverlay .auth-msg.ok { color: #059669; }
        #authOverlay .auth-msg.err { color: #DC2626; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.innerHTML = `
        <div class="auth-card">
            <h2>💰 Controle Financeiro</h2>
            <p>Entre para acessar suas finanças.</p>
            <button id="authGoogle">
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 3-2.26 5.54-4.78 7.24l7.73 6c4.51-4.18 7.09-10.36 7.09-17.71z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Entrar com Google
            </button>
            <div class="auth-sep">ou</div>
            <input type="email" id="authEmail" placeholder="seu@email.com" autocomplete="email">
            <button id="authBtn">Enviar link por e-mail</button>
            <div class="auth-msg" id="authMsg"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const btn = overlay.querySelector('#authBtn');
    const btnGoogle = overlay.querySelector('#authGoogle');
    const input = overlay.querySelector('#authEmail');
    const msg = overlay.querySelector('#authMsg');

    btnGoogle.addEventListener('click', async () => {
        btnGoogle.disabled = true;
        msg.className = 'auth-msg';
        msg.textContent = 'Redirecionando para o Google...';
        const { error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: AUTH_REDIRECT }
        });
        if (error) {
            btnGoogle.disabled = false;
            msg.className = 'auth-msg err';
            msg.textContent = 'Erro: ' + error.message;
        }
    });

    const enviar = async () => {
        const email = input.value.trim();
        if (!email) { msg.className = 'auth-msg err'; msg.textContent = 'Informe um e-mail.'; return; }

        btn.disabled = true;
        msg.className = 'auth-msg';
        msg.textContent = 'Enviando...';

        const { error } = await sb.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: AUTH_REDIRECT }
        });

        if (error) {
            btn.disabled = false;
            msg.className = 'auth-msg err';
            msg.textContent = 'Erro: ' + error.message;
        } else {
            msg.className = 'auth-msg ok';
            msg.textContent = '✓ Link enviado! Confira seu e-mail.';
        }
    };

    btn.addEventListener('click', enviar);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); });
}

function mostrarTelaLogin() {
    montarTelaLogin();
    document.getElementById('authOverlay').hidden = false;
    const logout = document.getElementById('btnLogout');
    if (logout) logout.hidden = true;
}

function esconderTelaLogin() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.hidden = true;
    const logout = document.getElementById('btnLogout');
    if (logout) logout.hidden = false;
}

/**
 * Retorna true se já existe uma sessão válida; caso contrário mostra o login.
 * Também religa o app quando o usuário entra/sai.
 */
async function initAuth() {
    const logout = document.getElementById('btnLogout');
    if (logout) {
        logout.addEventListener('click', async () => {
            await sb.auth.signOut();
        });
    }

    sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
            esconderTelaLogin();
            if (typeof carregarMenus === 'function') carregarMenus();
            if (typeof window.recarregarApp === 'function') window.recarregarApp();
        } else if (event === 'SIGNED_OUT') {
            mostrarTelaLogin();
        }
    });

    const { data: { session } } = await sb.auth.getSession();

    if (session) {
        esconderTelaLogin();
        return true;
    }

    mostrarTelaLogin();
    return false;
}
