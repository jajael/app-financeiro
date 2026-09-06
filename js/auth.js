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
            <p>Digite seu e-mail para receber um link de acesso.</p>
            <input type="email" id="authEmail" placeholder="seu@email.com" autocomplete="email">
            <button id="authBtn">Enviar link de acesso</button>
            <div class="auth-msg" id="authMsg"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const btn = overlay.querySelector('#authBtn');
    const input = overlay.querySelector('#authEmail');
    const msg = overlay.querySelector('#authMsg');

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
