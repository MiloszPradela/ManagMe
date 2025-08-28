import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import { api } from './services/ApiService';
import i18next from './i18n';
import type { User } from './models/User';

// Importy widoków
import { renderHomeView } from './views/HomeView';
import { renderCreateProjectView } from './views/CreateProjectView';
import { renderAllProjectsView } from './views/AllProjectsView';
import { renderSingleProjectView } from './views/SingleProjectView';
import { renderLoginView } from './views/LoginView';
import { renderRegisterView } from './views/RegisterView';
import { renderLostPasswordView } from './views/LostPasswordView';
import { renderResetPasswordView } from './views/ResetPasswordView';
import { renderTasksView } from './views/TasksView';
import { renderUsersView } from './views/UsersView';
import { renderMyAccountView } from './views/MyAccountView';
import { renderSettingsView } from './views/SettingsView';
import { renderNotFoundView } from './views/NotFoundView';
import { renderSidebar } from './views/SidebarView';
import { renderEditTaskView } from './views/EditTaskView';
import { renderMilestoneView } from './views/MilestoneView';
import { renderEditMilestoneView } from './views/EditMilestoneView';
import { renderSingleTaskView } from './views/SingleTaskView';

// --- Router ---
const root = document.querySelector<HTMLDivElement>('#root')!;

const privateRoutes: { [key: string]: (container: HTMLElement) => Promise<void> | void } = {
    '/': renderHomeView,
    '/all-projects': renderAllProjectsView,
    '/create-project': renderCreateProjectView,
    '/tasks': renderTasksView,
    '/users': renderUsersView,
    '/my-account': renderMyAccountView,
    '/settings': renderSettingsView,
    '/milestones': renderMilestoneView,
};

const publicRoutes: { [key: string]: (container: HTMLElement) => void } = {
    '/login': renderLoginView,
    '/register': renderRegisterView,
    '/lost-password': renderLostPasswordView,
    '/reset-password': renderResetPasswordView,
};

async function appRouter() {
    root.innerHTML = '';
    const pathname = window.location.pathname;
    const token = localStorage.getItem('token');

    if (!token) {
        const view = publicRoutes[pathname] || renderLoginView;
        view(root);
        return;
    }

    await renderMainLayout(root);
    const contentContainer = document.querySelector<HTMLElement>('#content-middle')!;

    let mainViewFn: ((container: HTMLElement) => Promise<void> | void) | undefined;
    
    const pathSegments = pathname.split('/').filter(Boolean); 
    
    if (pathSegments.length === 0) { 
        mainViewFn = privateRoutes['/'];
    } else {
        const baseRoute = `/${pathSegments[0]}`; 
        
        switch (baseRoute) {
            case '/task':
                mainViewFn = renderSingleTaskView;
                break;
            case '/project':
                mainViewFn = renderSingleProjectView;
                break;
            case '/edit-task':
                mainViewFn = renderEditTaskView;
                break;
            case '/edit-milestone':
                mainViewFn = renderEditMilestoneView;
                break;
            default:
                mainViewFn = privateRoutes[baseRoute];
                break;
        }
    }


    if (mainViewFn) {
        await mainViewFn(contentContainer);
    } else {
        renderNotFoundView(contentContainer);
    }
}

// --- Inicjalizacja aplikacji i nawigacja ---

async function startApp() {
    await i18next.init();
    await handleTokenInUrl();
    setupSpaNavigation();
    await appRouter();
}

function setupSpaNavigation() {
    document.body.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.href.startsWith(window.location.origin) && !link.hasAttribute('data-external')) {
            e.preventDefault();
            window.history.pushState({}, '', link.href);
            appRouter();
        }
    });
    window.addEventListener('popstate', appRouter);
    window.addEventListener('hashchange', async () => {
        await handleTokenInUrl();
        await appRouter();
    });
}

async function handleTokenInUrl() {
    const hash = window.location.hash;
    if (hash.startsWith('#token=')) {
        const token = hash.substring(7);
        localStorage.setItem('token', token);
        try {
            const user = await api.getMe();
            localStorage.setItem('userRole', user.rola);
        } catch (error) {
            console.error('Błąd pobierania danych użytkownika po zalogowaniu:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
        } finally {
            window.history.replaceState(null, '', '/');
        }
    }
}

// --- Renderowanie layoutu ---

async function renderMainLayout(container: HTMLElement) {
    container.innerHTML = `
        <div class="app-layout d-flex">
            <aside class="sidebar"></aside>
            <div class="app-overlay"></div>
            <div class="main-content-wrapper w-100">
                <header class="app-header">
                    <button class="sidebar-toggle" type="button" aria-label="Toggle sidebar">
                        <span class="sidebar-toggle-bar"></span>
                        <span class="sidebar-toggle-bar"></span>
                        <span class="sidebar-toggle-bar"></span>
                    </button>
                    <a href="/my-account/profile" id="header-user-info" class="d-flex align-items-center ms-auto text-decoration-none text-body"></a>
                </header>
                <main id="content-middle"></main>
            </div>
        </div>
       
    `;
    const sidebarContainer = container.querySelector<HTMLElement>('.sidebar');
    if (sidebarContainer) {
        renderSidebar(sidebarContainer);
    }
    await updateUserInfo();
    setupLayoutEvents();
}

function setupLayoutEvents() {
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.sidebar-toggle');
    const overlay = document.querySelector('.app-overlay');
    if (sidebar && toggleButton && overlay) {
        toggleButton.addEventListener('click', () => sidebar.classList.toggle('is-open'));
        overlay.addEventListener('click', () => sidebar.classList.remove('is-open'));
    }
}

async function updateUserInfo(userToUpdate?: User) {
    const container = document.querySelector<HTMLElement>('#header-user-info');
    if (!container) return;
    try {
        const user = userToUpdate || await api.getMe();
        localStorage.setItem('userRole', user.rola);
        const initials = `${user.imie.charAt(0)}${(user.nazwisko || '').charAt(0)}`.toUpperCase();
        const avatarSrc = user.avatarUrl ? `http://localhost:3000${user.avatarUrl}` : `https://via.placeholder.com/40?text=${initials}`;
        container.innerHTML = `
            <img src="${avatarSrc}" class="user-avatar rounded-circle" alt="Avatar">
            <span class="fw-bold ms-2">${user.imie} ${user.nazwisko || ''}</span>
        `;
    } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.dataset.bsTheme = savedTheme;
    }
}

loadTheme();
startApp();
