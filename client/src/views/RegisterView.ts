import { api } from '../services/ApiService';
import i18next from '../i18n';
import { showAlert } from '../services/AlertService';

export function renderRegisterView(container: HTMLElement) {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="text-center mb-2"><i class="fa-solid fa-layer-group me-2"></i>ManagMe</h1>
                <h3 class="text-center mb-4">${i18next.t('register.registerTitle')}</h3>
                <form id="register-form" novalidate>
                    <div class="row">
                        <div class="col-md-6 mb-3 position-relative">
                            <label for="imie" class="form-label">${i18next.t('register.firstName')}</label>
                            <input type="text" class="form-control" id="imie" required>
                            <div id="imie-error" class="text-danger mt-1 small" style="display: none;"></div>
                        </div>
                        <div class="col-md-6 mb-3 position-relative">
                            <label for="nazwisko" class="form-label">${i18next.t('register.lastName')}</label>
                            <input type="text" class="form-control" id="nazwisko">
                        </div>
                    </div>
                    <div class="mb-3 position-relative">
                        <label for="login" class="form-label">Login (e-mail)</label>
                        <input type="email" class="form-control" id="login" required>
                        <div id="login-error" class="text-danger mt-1 small" style="display: none;"></div>
                    </div>
                    <div class="mb-3 position-relative">
                        <label for="password" class="form-label">${i18next.t('register.password')}</label>
                        <input type="password" class="form-control" id="password" required>
                        <div id="password-error" class="text-danger mt-1 small" style="display: none;"></div>
                    </div>
                    <div class="mb-4 position-relative">
                        <label for="confirm-password" class="form-label">${i18next.t('register.confirmPassword')}</label>
                        <input type="password" class="form-control" id="confirm-password" required>
                        <div id="confirm-password-error" class="text-danger mt-1 small" style="display: none;"></div>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">${i18next.t('register.registerButton')}</button>
                </form>
                <div class="or-divider my-3"><span>LUB</span></div>
                <a href="http://localhost:3000/api/auth/google" class="btn btn-secondary w-100">
                    <i class="fa-brands fa-google me-2"></i> ${i18next.t('register.googleRegisterButton')}
                </a>
                <div class="text-center mt-3">
                    <a href="/login">${i18next.t('register.haveAccount')}</a>
                </div>
            </div>
        </div>
    `;

    const form = container.querySelector<HTMLFormElement>('#register-form');
    if (!form) return;

    // Pobierz wszystkie kontenery na błędy
    const imieErrorDiv = container.querySelector<HTMLDivElement>('#imie-error')!;
    const loginErrorDiv = container.querySelector<HTMLDivElement>('#login-error')!;
    const passwordErrorDiv = container.querySelector<HTMLDivElement>('#password-error')!;
    const confirmPasswordErrorDiv = container.querySelector<HTMLDivElement>('#confirm-password-error')!;

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) return i18next.t('register.passwordTooShort');
        if (!/[A-Z]/.test(password)) return i18next.t('register.passwordNoUppercase');
        if (!/[a-z]/.test(password)) return i18next.t('register.passwordNoLowercase');
        if (!/\d/.test(password)) return i18next.t('register.passwordNoDigit');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return i18next.t('register.passwordNoSpecialChar');
        return null;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Czyszczenie poprzednich błędów
        imieErrorDiv.style.display = 'none';
        loginErrorDiv.style.display = 'none';
        passwordErrorDiv.style.display = 'none';
        confirmPasswordErrorDiv.style.display = 'none';

        let isValid = true;

        const imie = (container.querySelector<HTMLInputElement>('#imie')!).value;
        const nazwisko = (container.querySelector<HTMLInputElement>('#nazwisko')!).value;
        const login = (container.querySelector<HTMLInputElement>('#login')!).value;
        const password = (container.querySelector<HTMLInputElement>('#password')!).value;
        const confirmPassword = (container.querySelector<HTMLInputElement>('#confirm-password')!).value;

        // Walidacja pola "imię"
        if (!imie.trim()) {
            imieErrorDiv.textContent = i18next.t('register.fieldRequired');
            imieErrorDiv.style.display = 'block';
            isValid = false;
        }

        // Walidacja pola "login"
        if (!login.trim()) {
            loginErrorDiv.textContent = i18next.t('register.fieldRequired');
            loginErrorDiv.style.display = 'block';
            isValid = false;
        }

        const passwordValidationError = validatePassword(password);
        if (passwordValidationError) {
            passwordErrorDiv.textContent = passwordValidationError;
            passwordErrorDiv.style.display = 'block';
            isValid = false;
        }

        if (password !== confirmPassword) {
            confirmPasswordErrorDiv.textContent = i18next.t('register.passwordsDoNotMatch');
            confirmPasswordErrorDiv.style.display = 'block';
            isValid = false;
        }

        // Jeśli którykolwiek z walidatorów zawiódł, przerwij
        if (!isValid) return;

        try {
            const response = await api.register({ imie, nazwisko, login, password });
            showAlert(i18next.t(response.msg, { defaultValue: response.msg }), 'success');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        } catch (error) {
            const errorMessage = (error as Error).message;
            showAlert(i18next.t(errorMessage, { defaultValue: errorMessage }), 'danger');
        }
    });
}
