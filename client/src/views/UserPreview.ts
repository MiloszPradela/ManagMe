import { api } from '../services/ApiService';
import i18next from '../i18n';
import { showAlert } from '../services/AlertService';
import type { Task } from '../models/Task';
import type { User } from '../models/User';

function escapeHtml(text: string | null | undefined): string {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

function getStatusBadge(status: Task['status']) {
    switch (status) {
        case 'do zrobienia': return `<span class="badge text-bg-secondary">${i18next.t('tasks.status_todo')}</span>`;
        case 'w trakcie': return `<span class="badge bg-pink text-dark">${i18next.t('tasks.status_inprogress')}</span>`;
        case 'zakończone': return `<span class="badge text-bg-success">${i18next.t('tasks.status_done')}</span>`;
        default: return `<span class="badge text-bg-light">${status}</span>`;
    }
}

function getRoleBadge(rola: User['rola']): string {
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

function extractId(field: any): string | null {
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field && field._id) return field._id;
    return null;
}

export async function renderUserPreviewView(container: HTMLElement, userId: string) {
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 50vh;"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

    try {
        const [user, projects, tasks] = await Promise.all([
            api.getUsers().then(users => users.find(u => u._id === userId)),
            api.getProjects(),
            api.getTasks()
        ]);

        if (!user) {
            showAlert('Nie znaleziono użytkownika.', 'danger');
            container.innerHTML = `<p class="text-danger">Nie znaleziono użytkownika o podanym ID.</p>`;
            return;
        }

        const userProjects = projects.filter(p => p.team.some(member => extractId(member) === user._id));
        const userTasksByProject = new Map<string, Task[]>();
        
        tasks.forEach(task => {
            const assignedToId = extractId(task.assignedTo);
            if (assignedToId === user._id) {
                const projectId = extractId(task.project) || 'unassigned';
                if (!userTasksByProject.has(projectId)) {
                    userTasksByProject.set(projectId, []);
                }
                userTasksByProject.get(projectId)!.push(task);
            }
        });

        const avatarSrc = user.avatarUrl ? `http://localhost:3000${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${escapeHtml(user.imie)}+${escapeHtml(user.nazwisko)}&background=random&size=96`;

        const projectsContent = userProjects.length > 0
            ? userProjects.map(project => {
                const tasksForProject = userTasksByProject.get(project._id) || [];
                const tasksListHtml = tasksForProject.length > 0
                    ? tasksForProject.map(task => `
                        <li class="list-group-item d-flex justify-content-between align-items-center mobile-user-preview">
                            <a href="/task/${task._id}" class="text-decoration-none">${escapeHtml(task.title)}</a>
                            ${getStatusBadge(task.status)}
                        </li>`).join('')
                    : `<li class="list-group-item text-muted small">${i18next.t('users.noTasksAssigned')}</li>`;

                return `
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0"><a href="/project/${project._id}" class="text-decoration-none">${escapeHtml(project.name)}</a></h5>
                        </div>
                        <ul class="list-group list-group-flush">${tasksListHtml}</ul>
                    </div>
                `;
            }).join('')
            : `<div class="alert alert-light">${i18next.t('users.noProjectsAssigned')}</div>`;

        container.innerHTML = `
            <div class="user-profile-header-card card card-body mb-5">
                <div class="d-flex align-items-center heading-btn-mobile">
                    <img src="${avatarSrc}" class="user-profile-avatar rounded-circle me-4" alt="Avatar" style="width: 96px; height: 96px;">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center">
                            <h2 class="mb-1">${escapeHtml(user.imie)} ${escapeHtml(user.nazwisko || '')}</h2>
                            ${getRoleBadge(user.rola)}
                        </div>
                        <p class="text-muted mb-0">${escapeHtml(user.login)}</p>
                    </div>
                </div>
            </div>
            <h4 class="mb-4">${i18next.t('users.projects')} i ${i18next.t('users.tasks')}</h4>
            ${projectsContent}
        `;

    } catch (error) {
        showAlert('Błąd ładowania danych użytkownika.', 'danger');
        container.innerHTML = `<p class="text-danger">Wystąpił błąd podczas ładowania profilu.</p>`;
    }
}
