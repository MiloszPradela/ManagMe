import { api } from '../services/ApiService';
import { renderUserPreviewView } from './UserPreview';
import i18next from '../i18n';
import { showAlert } from '../services/AlertService';
import type { UserWithTaskCount } from '../models/User';

function escapeHtml(text: string | null | undefined): string {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

function getRoleBadge(rola: string): string {
    switch (rola) {
        case 'admin':
            return `<span class="badge text-bg-danger ms-2"><i class="fa-solid fa-crown me-1"></i>${rola}</span>`;
        case 'devops':
            return `<span class="badge text-bg-warning text-dark ms-2"><i class="fa-solid fa-gears me-1"></i>${rola}</span>`;
        case 'developer':
            return `<span class="badge text-bg-primary ms-2"><i class="fa-solid fa-code me-1"></i>${rola}</span>`;
        case 'readonly':
            return `<span class="badge text-bg-info ms-2"><i class="fa-solid fa-eye me-1"></i>${rola}</span>`;
        case 'guest':
            return `<span class="badge text-bg-secondary ms-2"><i class="fa-solid fa-user me-1"></i>${rola}</span>`;
        default:
            return `<span class="badge text-bg-light text-dark ms-2">${rola}</span>`;
    }
}

export async function renderUsersView(container: HTMLElement) {
    const pathParts = window.location.pathname.split('/');
    const isPreview = pathParts.length === 3 && pathParts[1] === 'users';

    if (isPreview) {
        const userId = pathParts[2];
        renderUserPreviewView(container, userId);
        return;
    }

    container.innerHTML = `
        <h2 class="mb-4">${i18next.t('navigation.users')}</h2>
        <div id="user-list-container" class="text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">${i18next.t('users.loading')}</span>
            </div>
        </div>`;
    const userListContainer = container.querySelector<HTMLDivElement>('#user-list-container');
    if (!userListContainer) return;

    try {
        const users: UserWithTaskCount[] = await api.getUsers();
        if (users.length === 0) {
            userListContainer.innerHTML = `<div class="alert alert-info">${i18next.t('users.noUsers')}</div>`;
            return;
        }

        const userItems = users.map(user => {
            const avatarSrc = user.avatarUrl
                ? `http://localhost:3000${user.avatarUrl}`
                : `https://ui-avatars.com/api/?name=${escapeHtml(user.imie)}+${escapeHtml(user.nazwisko)}&background=random&color=fff`;
            const taskCount = user.taskCount ?? 0;

            return `
                <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center mobile-user-view">
                    <a href="/users/${user._id}" class="text-decoration-none text-body d-flex align-items-center flex-grow-1">
                        <img src="${avatarSrc}" class="user-avatar rounded-circle me-3" alt="Avatar">
                        <div class="d-flex flex-column">
                            <div class="d-flex align-items-center">
                                <strong>${escapeHtml(user.imie)} ${escapeHtml(user.nazwisko || '')}</strong>
                                ${getRoleBadge(user.rola)}
                            </div>
                            <div class="d-flex align-items-center gap-2 mt-1">
                                <span class="badge bg-secondary text-center" style="width: 100px;">
                                    <i class="fa-solid fa-list-check me-1"></i>
                                    ${taskCount} ${i18next.t('users.tasks', { count: taskCount })}
                                    
                                </span>
                            </div>
                        </div>
                    </a>
                    <a href="/users/${user._id}" class="btn btn-sm btn-secondary">
                        <i class="fa-solid fa-eye me-1"></i> ${i18next.t('users.viewUser')}
                    </a>
                </div>`;
        }).join('');

        userListContainer.innerHTML = `<div class="list-group">${userItems}</div>`;
    } catch (error) {
        showAlert(i18next.t('users.errorLoading'), 'danger');
        userListContainer.innerHTML = `<div class="alert alert-danger">${i18next.t('users.errorLoading')}</div>`;
    }
}
