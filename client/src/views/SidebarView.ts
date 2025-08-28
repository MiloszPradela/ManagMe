import i18next from '../i18n';

export function renderSidebar(container: HTMLElement) {
    container.innerHTML = `
        <div class="sidebar-top sidebar-logo">
            <h1 class="h2 mb-0">
                <!-- ZMIANA TUTAJ: Link w logo prowadzi do strony głównej -->
                <a href="/" class="text-white text-decoration-none">
                    <i class="fa-solid fa-layer-group me-2"> ManagMe</i>
                </a>
            </h1>
        </div>
        <nav class="sidebar-middle nav flex-column">
             <a class="nav-link" href="/create-project">
                 <i class="fa-solid fa-plus fa-fw me-2"></i>${i18next.t('navigation.projects')}
            </a>
            <a class="nav-link" href="/all-projects">
                <i class="fa-solid fa-briefcase fa-fw me-2"></i>${i18next.t('navigation.allProjects')}
            </a>
            <a class="nav-link" href="/tasks">
                <i class="fa-solid fa-list-check fa-fw me-2"></i>${i18next.t('navigation.tasks')}
            </a>
            <a class="nav-link" href="/users">
                <i class="fa-solid fa-users fa-fw me-2"></i>${i18next.t('navigation.users')}
            </a>
            <a class="nav-link" href="/my-account/profile">
                <i class="fa-solid fa-user-gear fa-fw me-2"></i>${i18next.t('navigation.myAccount')}
            </a>
            <a class="nav-link" href="/settings">
                <i class="fa-solid fa-sliders fa-fw me-2"></i>${i18next.t('navigation.settings')}
            </a>
        </nav>
        <div class="sidebar-bottom">
            <button id="logout-btn" class="btn btn-secondary w-100">
                <i class="fa-solid fa-arrow-right-from-bracket me-2"></i>${i18next.t('navigation.logout')}
            </button>
        </div>
    `;

    container.querySelector('#logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });

    const currentPathname = window.location.pathname;
    const baseRoute = '/' + currentPathname.split('/')[1];
    
    if (currentPathname === '/') {
    } else {
        const navLinks = container.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref && linkHref.startsWith(baseRoute)) {
                link.classList.add('active');
            }
        });
    }
}
