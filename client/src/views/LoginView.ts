import { api } from '../services/ApiService';
import i18next from '../i18n';
import { showAlert } from '../services/AlertService';

export function renderLoginView(container: HTMLElement) {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="text-center mb-4"><i class="fa-solid fa-layer-group me-2"></i>ManagMe</h1>
                <h3 class="text-center mb-4">${i18next.t('login.loginTitle')}</h3>
                <form id="login-form" novalidate>
                    <div class="mb-3 position-relative">
                        <label for="login" class="form-label">Login</label>
                        <input type="text" class="form-control" id="login" required>
                        <div id="login-error" class="text-danger mt-1 small" style="display: none;"></div>
                    </div>
                    <div class="mb-3 position-relative">
                        <label for="password" class="form-label">Hasło</label>
                        <input type="password" class="form-control" id="password" required>
                        <div id="password-error" class="text-danger mt-1 small" style="display: none;"></div>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">${i18next.t('login.loginButton')}</button>
                </form>
                <div class="or-divider my-3"><span>LUB</span></div>
                <a href="http://localhost:3000/api/auth/google" class="btn btn-secondary w-100">
                    <i class="fa-brands fa-google me-2"></i> ${i18next.t('login.googleLoginButton')}
                </a>
                <div class="text-center mt-3">
                    <a href="/register">${i18next.t('login.noAccount')}</a> |
                    <a href="/lost-password">${i18next.t('login.forgotPassword')}</a>
                </div>
            </div>
        </div>
    `;

    const form = container.querySelector<HTMLFormElement>('#login-form');
    if (!form) return;

    const loginErrorDiv = container.querySelector<HTMLDivElement>('#login-error')!;
    const passwordErrorDiv = container.querySelector<HTMLDivElement>('#password-error')!;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Czyszczenie błędów
        loginErrorDiv.style.display = 'none';
        passwordErrorDiv.style.display = 'none';

        let isValid = true;
        const loginInput = container.querySelector<HTMLInputElement>('#login')!;
        const passwordInput = container.querySelector<HTMLInputElement>('#password')!;

        if (!loginInput.value.trim()) {
            loginErrorDiv.textContent = i18next.t('login.fieldRequired');
            loginErrorDiv.style.display = 'block';
            isValid = false;
        }

        if (!passwordInput.value.trim()) {
            passwordErrorDiv.textContent = i18next.t('login.fieldRequired');
            passwordErrorDiv.style.display = 'block';
            isValid = false;
        }

        if (!isValid) return;

        try {
            const { token, user } = await api.login(loginInput.value, passwordInput.value);
            
            showAlert(i18next.t('login.loginSuccess'), 'success');

            localStorage.setItem('token', token);
            localStorage.setItem('userRole', user.rola);

            setTimeout(() => {
                window.location.href = '/';
            }, 1500);

        } catch (error) {
            showAlert(i18next.t('login.invalidCredentials'), 'danger');
        }
    });
}
