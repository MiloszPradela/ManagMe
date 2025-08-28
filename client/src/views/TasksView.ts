import { api } from '../services/ApiService';
import i18next from 'i18next';
import type { Task } from '../models/Task';
import type { Project } from '../models/Project';
import type { User } from '../models/User';
import { showAlert } from '../services/AlertService';
import * as bootstrap from 'bootstrap';

// --- Funkcje pomocnicze ---

function escapeHtml(text: string | null | undefined): string {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

function getPriorityFlag(priority: Task['priority']) {
    const priorityMap = {
        wysoki: { class: 'danger', icon: 'fa-flag', text: i18next.t('tasks.priority_high') },
        średni: { class: 'warning', icon: 'fa-flag', text: i18next.t('tasks.priority_medium') },
        niski: { class: 'secondary', icon: 'fa-flag', text: i18next.t('tasks.priority_low') }
    };
    const priorityInfo = priorityMap[priority] || { class: 'light', icon: 'fa-flag', text: priority };
    return `<span class="badge bg-${priorityInfo.class}-subtle border border-${priorityInfo.class}-subtle text-${priorityInfo.class}-emphasis rounded-pill">
                <i class="fa-solid ${priorityInfo.icon} me-1"></i> ${priorityInfo.text}
            </span>`;
}

function getStatusBadge(status: Task['status']) {
    if (status === 'zakończone') return `<span class="badge bg-success text-white">${i18next.t('tasks.status_done')}</span>`;
    if (status === 'w trakcie') return `<span class="badge bg-info text-dark">${i18next.t('tasks.status_inprogress')}</span>`;
    return `<span class="badge bg-secondary text-white">${i18next.t('tasks.status_todo')}</span>`;
}

// --- Renderowanie komponentów ---

function renderTasksTable(container: HTMLElement, tasks: Task[], users: User[]) {
    if (tasks.length === 0) {
        container.innerHTML = `<div class="card p-4 text-center text-muted">${i18next.t('tasks.noTasks')}</div>`;
        return;
    }

    const tasksHtml = tasks.map(task => {
        const assignedTo =
            typeof task.assignedTo === 'object' && task.assignedTo !== null
                ? `${task.assignedTo.imie} ${task.assignedTo.nazwisko || ''}`
                : users.find(u => u._id === task.assignedTo)?.imie ?? 'N/A';

        return `
            <tr>
                <td><a href="/task/${task._id}" class="fw-bold text-decoration-none">${escapeHtml(task.title)}</a></td>
                <td>${getPriorityFlag(task.priority)}</td>
                <td>${escapeHtml(assignedTo.trim())}</td>
                <td>${getStatusBadge(task.status)}</td>
                <td>${task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}</td>
                <td class="text-end actions-cell">
                    <a href="/task/${task._id}" class="btn btn-sm btn-outline-primary">
                        <i class="fa-solid fa-eye me-1"></i> ${i18next.t('actions.view')}
                    </a>
                </td>
            </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="card p-3">
            <div class="table-responsive-wrapper">
                <table class="table table-hover align-middle tasks-table">
                    <thead>
                        <tr>
                            <th>${i18next.t('tasks.title')}</th>
                            <th>${i18next.t('tasks.priority')}</th>
                            <th>${i18next.t('tasks.assignedTo')}</th>
                            <th>${i18next.t('tasks.status')}</th>
                            <th>${i18next.t('tasks.deadline')}</th>
                            <th class="text-end">${i18next.t('actions.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasksHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderFilters(projects: Project[]) {
    return `
        <div class="card p-3 mb-4">
            <div class="row gap-2 align-items-end">
                <div class="col-md">
                    <label for="filter-status" class="form-label">${i18next.t('tasks.filterByStatus')}</label>
                    <select id="filter-status" class="form-select">
                        <option value="all">${i18next.t('tasks.filterAll')}</option>
                        <option value="do zrobienia">${i18next.t('tasks.status_todo')}</option>
                        <option value="w trakcie">${i18next.t('tasks.status_inprogress')}</option>
                        <option value="zakończone">${i18next.t('tasks.status_done')}</option>
                    </select>
                </div>
                <div class="col-md">
                    <label for="filter-project" class="form-label">${i18next.t('tasks.filterByProject')}</label>
                    <select id="filter-project" class="form-select">
                        <option value="all">${i18next.t('tasks.filterAllProjects')}</option>
                        ${projects.map(p => `<option value="${p._id}">${escapeHtml(p.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>
    `;
}

// --- NOWY MODAL DO TWORZENIA ZADANIA ---
function renderCreateTaskModal(projects: Project[], users: User[], onUpdate: () => void) {
    const modalId = 'create-task-modal';
    document.getElementById(modalId)?.remove();

    const projectOptions = projects.map(p => `<option value="${p._id}">${escapeHtml(p.name)}</option>`).join('');
    const userOptions = users.map(u => `<option value="${u._id}">${u.imie} ${u.nazwisko}</option>`).join('');
    
    const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <form id="create-task-form">
                        <div class="modal-header">
                            <h5 class="modal-title">${i18next.t('tasks.createNewTask')}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3"><label class="form-label">${i18next.t('tasks.title')}</label><input id="task-title-modal" class="form-control" required></div>
                            <div class="mb-3"><label class="form-label">${i18next.t('tasks.project')}</label><select id="task-project-modal" class="form-select" required><option value="">Wybierz projekt</option>${projectOptions}</select></div>
                            <div class="mb-3"><label class="form-label">${i18next.t('tasks.description')}</label><textarea id="task-description-modal" class="form-control" rows="3"></textarea></div>
                            <div class="row">
                                <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('tasks.assignTo')}</label><select id="task-assigned-to-modal" class="form-select"><option value="">Wybierz osobę</option>${userOptions}</select></div>
                                <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('tasks.deadline')}</label><input id="task-deadline-modal" type="date" class="form-control"></div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">${i18next.t('tasks.status')}</label>
                                    <select id="task-status-modal" class="form-select">
                                        <option value="do zrobienia" selected>${i18next.t('tasks.status_todo')}</option>
                                        <option value="w trakcie">${i18next.t('tasks.status_inprogress')}</option>
                                        <option value="zakończone">${i18next.t('tasks.status_done')}</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">${i18next.t('tasks.priority')}</label>
                                    <select id="task-priority-modal" class="form-select">
                                        <option value="niski">${i18next.t('tasks.priority_low')}</option>
                                        <option value="średni" selected>${i18next.t('tasks.priority_medium')}</option>
                                        <option value="wysoki">${i18next.t('tasks.priority_high')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18next.t('actions.cancel')}</button>
                            <button type="submit" class="btn btn-primary">${i18next.t('actions.create')}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById(modalId)!;
    const modal = new bootstrap.Modal(modalEl);

    modalEl.querySelector('form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskData = {
            title: (modalEl.querySelector<HTMLInputElement>('#task-title-modal')!).value.trim(),
            project: (modalEl.querySelector<HTMLSelectElement>('#task-project-modal')!).value,
            description: (modalEl.querySelector<HTMLTextAreaElement>('#task-description-modal')!).value,
            assignedTo: (modalEl.querySelector<HTMLSelectElement>('#task-assigned-to-modal')!).value || undefined,
            deadline: (modalEl.querySelector<HTMLInputElement>('#task-deadline-modal')!).value || null,
            status: (modalEl.querySelector<HTMLSelectElement>('#task-status-modal')!).value as Task['status'],
            priority: (modalEl.querySelector<HTMLSelectElement>('#task-priority-modal')!).value as Task['priority']
        };

        if (!taskData.title || !taskData.project) {
            showAlert('Tytuł i projekt są wymagane.', 'warning');
            return;
        }

        try {
            await api.addTask(taskData);
            showAlert(i18next.t('tasks.createSuccess'), 'success');
            modal.hide();
            onUpdate();
        } catch (err: any) {
            showAlert(err.message, 'danger');
        }
    });

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    modal.show();
}

// --- Główna funkcja widoku ---

export async function renderTasksView(container: HTMLElement) {
    container.innerHTML = `<div class="d-flex justify-content-center p-5"><div class="spinner-border" role="status"></div></div>`;
    
    const loadAndRenderAll = async () => {
        try {
            const [tasks, projects, users] = await Promise.all([api.getTasks(), api.getProjects(), api.getUsers()]);

            container.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4 heading-btn-mobile">
                    <h2 class="mb-0">${i18next.t('tasks.assignedTasks')}</h2>
                    <button id="create-task-btn" class="btn btn-primary">
                        <i class="fa-solid fa-plus me-2"></i>${i18next.t('tasks.createNewTask')}
                    </button>
                </div>
                <div id="filter-container"></div>
                <div id="tasks-list-container"></div>
            `;

            const filterContainer = container.querySelector<HTMLElement>('#filter-container')!;
            const tasksListContainer = container.querySelector<HTMLElement>('#tasks-list-container')!;
            
            filterContainer.innerHTML = renderFilters(projects);

            const filterStatus = container.querySelector<HTMLSelectElement>('#filter-status')!;
            const filterProject = container.querySelector<HTMLSelectElement>('#filter-project')!;

            const filterAndRender = () => {
                const statusValue = filterStatus.value;
                const projectValue = filterProject.value;

                let filtered = tasks;
                if (statusValue !== 'all') {
                    filtered = filtered.filter(t => t.status === statusValue);
                }
                if (projectValue !== 'all') {
                    filtered = filtered.filter(t => {
                        const taskProjectId = (typeof t.project === 'object' && t.project !== null) ? t.project._id : t.project;
                        return taskProjectId === projectValue;
                    });
                }
                renderTasksTable(tasksListContainer, filtered, users);
            };

            filterStatus.addEventListener('change', filterAndRender);
            filterProject.addEventListener('change', filterAndRender);
            
            container.querySelector('#create-task-btn')?.addEventListener('click', () => {
                renderCreateTaskModal(projects, users, loadAndRenderAll);
            });

            filterAndRender();

        } catch (err) {
            showAlert(i18next.t('tasks.errorLoading'), 'danger');
            container.innerHTML = `<p class="text-danger">${i18next.t('tasks.errorLoading')}</p>`;
        }
    };

    await loadAndRenderAll();
}
