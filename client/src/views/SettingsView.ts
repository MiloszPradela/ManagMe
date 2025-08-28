import { api } from '../services/ApiService';
import i18next from '../i18n';

export function renderSettingsView(container: HTMLElement) {
    const isDarkMode = document.documentElement.dataset.bsTheme === 'dark';
    
    container.innerHTML = `
        <h2 class="mb-4">${i18next.t('settings.title')}</h2>
        <div class="card p-3">
            <h5>${i18next.t('settings.appearance')}</h5>
            <div class="form-check form-switch fs-5">
                <input class="form-check-input" id="darkModeToggle" type="checkbox" ${isDarkMode ? 'checked' : ''}>
                <label class="form-check-label" for="darkModeToggle">${i18next.t('settings.darkMode')}</label>
            </div>
            <hr>
            <h5>${i18next.t('settings.language')}</h5>
            <select class="form-select w-auto" id="language-select">
                <option value="pl" ${i18next.language === 'pl' ? 'selected' : ''}>${i18next.t('settings.lang_pl')}</option>
                <option value="en" ${i18next.language === 'en' ? 'selected' : ''}>${i18next.t('settings.lang_en')}</option>
            </select>
        </div>`;

    container.querySelector('#darkModeToggle')?.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const theme = target.checked ? 'dark' : 'light';
        document.documentElement.dataset.bsTheme = theme;
        localStorage.setItem('theme', theme);
    });

    container.querySelector('#language-select')?.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement;
        const newLang = target.value as 'pl' | 'en';
        
        try {
            localStorage.setItem('language', newLang);
            await api.saveMySettings({ language: newLang });
        } catch (error) {
            console.error("Nie udało się zapisać języka w bazie danych.", error);
        }
        
        await i18next.changeLanguage(newLang);
        location.reload();
    });
}
