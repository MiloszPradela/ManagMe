import { api } from '../services/ApiService';
import i18next from '../i18n';
import type { Task } from '../models/Task';
import { showAlert, showConfirm } from '../services/AlertService';

function escapeHtml(text: string | null | undefined): string {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

async function loadAndRenderProjects(container: HTMLElement) {
    try {
        const [projects, allTasks] = await Promise.all([
            api.getProjects(),
            api.getTasks()
        ]);

        if (projects.length === 0) {
            container.innerHTML = `<p class="text-muted">${i18next.t('projects.noProjects')}</p>`;
            return;
        }

        const tasksByProject = new Map<string, Task[]>();
        allTasks.forEach(task => {
            const projectId = (task.project && typeof task.project === 'object') ? task.project._id : task.project as string;
            if (!tasksByProject.has(projectId)) {
                tasksByProject.set(projectId, []);
            }
            tasksByProject.get(projectId)!.push(task);
        });

        container.innerHTML = projects.map(p => {
            const projectId = p._id;
            if (!projectId) return '';

            const teamAvatars = p.team.map(member => {
                const avatarSrc = member.avatarUrl ? `http://localhost:3000${member.avatarUrl}` : `https://ui-avatars.com/api/?name=${escapeHtml(member.imie)}+${escapeHtml(member.nazwisko)}&background=random`;
                return `<img src="${avatarSrc}" class="avatar-sm" title="${escapeHtml(member.imie)} ${escapeHtml(member.nazwisko)}" alt="Avatar">`;
            }).join('');
            
            const projectTasks = (tasksByProject.get(projectId) || [])
                .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

            const tasksHtml = projectTasks.length > 0 ? `
                <div class="project-tasks-list mt-3">
                    <h6>${i18next.t('allprojects.tasksTitle')}</h6>
                    <ul class="list-group list-group-flush">
                        ${projectTasks.map((task, index) => `
                            <li class="list-group-item d-flex justify-content-between align-items-center heading-btn-mobile">
                                <span >${index + 1}. ${escapeHtml(task.title)}</span>
                                <div class="d-flex">
                                    <a href="/edit-task/${task._id}/${projectId}" class="btn btn-outline-secondary btn-sm me-1" title="${i18next.t('allprojects.editTaskTitle')}"><i class="fa-solid fa-pencil"></i></a>
                                    <button class="btn btn-outline-danger btn-sm delete-task" data-task-id="${task._id}" title="${i18next.t('allprojects.deleteTaskTitle')}"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : `<p class="text-muted mt-3 small">${i18next.t('allprojects.noTasks')}</p>`;

            return `
            <div class="project-card">
                <div class="project-card-header heading-btn-mobile">
                    <h5><a href="/project/${projectId}" class="text-decoration-none">${escapeHtml(p.name)}</a></h5>
                    <div class="d-flex">
                        <a href="/project/${projectId}" class="btn btn-secondary btn-sm me-2 edit" data-id="${projectId}">${i18next.t('projects.edit')}</a>
                        <button class="btn btn-danger btn-sm delete" data-id="${projectId}">${i18next.t('projects.delete')}</button>
                    </div>
                </div>
                <div class="project-card-body">
                    <p>${escapeHtml(p.description)}</p>
                    ${tasksHtml} 
                </div>
                <div class="project-card-footer">
                    <div class="deadline-info">
                        <i class="fa-solid fa-calendar-days"></i>
                        <span>${p.deadline ? new Date(p.deadline).toLocaleDateString() : i18next.t('allprojects.deadline')}</span>
                    </div>
                    <div class="team-avatars">${teamAvatars}</div>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        showAlert(i18next.t('allprojects.loadError'), 'danger');
        container.innerHTML = `<p class="text-danger">${i18next.t('allprojects.loadError')}</p>`;
    }
}

async function handleListClick(e: Event, listContainer: HTMLElement) {
    const target = e.target as HTMLElement;
    
    const deleteProjectButton = target.closest('.delete');
    const deleteTaskButton = target.closest('.delete-task');

    if (deleteProjectButton) {
        const id = deleteProjectButton.getAttribute('data-id');
        if (!id) { showAlert(i18next.t('projects.errorId'), 'danger'); return; }
        
        const confirmed = await showConfirm(
            i18next.t('projects.confirmDelete'), 
            i18next.t('actions.confirmDelete'), 
            i18next.t('actions.cancelDelete')
        );
        if (confirmed) {
            try {
                await api.deleteProject(id);
                showAlert(i18next.t('projects.deleteSuccess'), 'success');
                await loadAndRenderProjects(listContainer);
            } catch {
                showAlert(i18next.t('projects.errorDelete'), 'danger');
            }
        }
    }
    
    if (deleteTaskButton) {
        const taskId = deleteTaskButton.getAttribute('data-task-id');
        if (!taskId) { showAlert(i18next.t('tasks.errorId'), 'danger'); return; }
        
        const confirmed = await showConfirm(
            i18next.t('tasks.confirmDelete'), 
            i18next.t('actions.confirmDelete'), 
            i18next.t('actions.cancelDelete')
        );
        if (confirmed) {
            try {
                await api.deleteTask(taskId);
                showAlert(i18next.t('tasks.deleteSuccess'), 'success');
                await loadAndRenderProjects(listContainer);
            } catch {
                showAlert(i18next.t('tasks.deleteError'), 'danger');
            }
        }
    }
}

export async function renderAllProjectsView(container: HTMLElement) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4 heading-btn-mobile">
            <h2 class="mb-0">${i18next.t('allprojects.title')}</h2>
            <a href="/create-project" class="btn btn-success">
                <i class="fa-solid fa-plus me-2"></i>${i18next.t('allprojects.navigation')}
            </a>
        </div>
        <div id="all-projects-list" class="projects-grid"></div>
    `;
    const listContainer = container.querySelector<HTMLDivElement>('#all-projects-list')!;
    await loadAndRenderProjects(listContainer);
    listContainer.addEventListener('click', (e) => handleListClick(e, listContainer));
}
