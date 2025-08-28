import { api } from '../services/ApiService';
import i18next from '../i18n';

export function renderLostPasswordView(container: HTMLElement) {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h3 class="text-center mb-4">${i18next.t('passwordRecovery.title')}</h3>
                <p class="text-center text-muted mb-4">${i18next.t('passwordRecovery.info')}</p>
                <form id="lost-password-form">
                    <div class="mb-3">
                        <label for="login" class="form-label">Login (e-mail)</label>
                        <input type="email" id="login" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">${i18next.t('passwordRecovery.sendLink')}</button>
                </form>
                <div class="text-center mt-3">
                    <a href="/login">${i18next.t('passwordRecovery.backToLogin')}</a>
                </div>
            </div>
        </div>`;

    const form = container.querySelector<HTMLFormElement>('#lost-password-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const login = (container.querySelector<HTMLInputElement>('#login')!).value;
        try {
            const response = await api.forgotPassword(login);
            alert(response.msg);
        } catch (error: any) {
            alert(`Błąd: ${error.message}`);
        }
    });
}
