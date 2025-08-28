import { api } from '../services/ApiService';
import i18next from '../i18n';
import type { User } from '../models/User';

export async function renderHomeView(container: HTMLElement) {
    let user: User | null = null;

    try {
        user = await api.getMe();
    } catch {
        // Jeśli nie uda się pobrać użytkownika - przekieruj do logowania
        window.location.href = '/login';
        return;
    }

    container.innerHTML = `
        <div class="container-fluid">
            <div class="text-center mb-5">
                <h1 class="display-5 fw-bold">${i18next.t('home.greeting', { name: user?.imie })}</h1>
                <p class="lead text-muted">${i18next.t('home.description')}</p>
            </div>

            <div class="row g-4">
                <!-- Kafelek Projekty -->
                <div class="col-lg-4">
                    <a href="/all-projects" class="card dashboard-card text-decoration-none text-body">
                        <div class="card-body p-4">
                            <i class="fa-solid fa-briefcase dashboard-card-icon"></i>
                            <h5 class="card-title">${i18next.t('home.projectsTitle')}</h5>
                            <p class="card-text">${i18next.t('home.projectsDesc')}</p>
                        </div>
                    </a>
                </div>

                <!-- Kafelek Zadania -->
                <div class="col-lg-4">
                    <a href="/tasks" class="card dashboard-card text-decoration-none text-body">
                        <div class="card-body p-4">
                            <i class="fa-solid fa-list-check dashboard-card-icon"></i>
                            <h5 class="card-title">${i18next.t('home.tasksTitle')}</h5>
                            <p class="card-text">${i18next.t('home.tasksDesc')}</p>
                        </div>
                    </a>
                </div>

                <!-- Kafelek Moje Konto -->
                <div class="col-lg-4">
                    <a href="/my-account/profile" class="card dashboard-card text-decoration-none text-body">
                        <div class="card-body p-4">
                            <i class="fa-solid fa-user-gear dashboard-card-icon"></i>
                            <h5 class="card-title">${i18next.t('home.accountTitle')}</h5>
                            <p class="card-text">${i18next.t('home.accountDesc')}</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    `;
}
