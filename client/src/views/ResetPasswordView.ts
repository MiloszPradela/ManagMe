import { api } from '../services/ApiService';
import i18next from '../i18n';

export function renderResetPasswordView(container: HTMLElement) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        container.innerHTML = `<p class="text-danger text-center">${i18next.t('passwordRecovery.tokenMissing')}</p>`;
        return;
    }

    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card">
                <h3 class="text-center mb-4">${i18next.t('passwordRecovery.setNewPasswordTitle')}</h3>
                <form id="reset-password-form">
                    <div class="mb-3">
                        <label for="password" class="form-label">${i18next.t('passwordRecovery.newPassword')}</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">${i18next.t('passwordRecovery.saveNewPassword')}</button>
                </form>
            </div>
        </div>`;

    const form = container.querySelector<HTMLFormElement>('#reset-password-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = (container.querySelector<HTMLInputElement>('#password')!).value;
        try {
            const response = await api.resetPassword(token, password);
            alert(response.msg);
            window.location.href = '/login';
        } catch (error: any) {
            alert(`Błąd: ${error.message}`);
        }
    });
}
