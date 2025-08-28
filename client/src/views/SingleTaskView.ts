import { api } from '../services/ApiService';
import i18next from 'i18next';
import * as bootstrap from 'bootstrap';
import type { Task } from '../models/Task';
import type { Milestone, Priority } from '../models/Milestone';
import type { User } from '../models/User';
import { showAlert, showConfirm } from '../services/AlertService';

// --- Funkcje pomocnicze ---
function getTaskPriorityFlag(priority: Task['priority']): string {
    const priorityMap = {
        wysoki: { class: 'danger', text: i18next.t('tasks.priority_high') },
        średni: { class: 'warning', text: i18next.t('tasks.priority_medium') },
        niski: { class: 'info', text: i18next.t('tasks.priority_low') }
    };
    const p = priorityMap[priority] || { class: 'light', text: priority };
    return `<span class="badge bg-${p.class}-subtle border border-${p.class}-subtle text-${p.class}-emphasis rounded-pill"><i class="fa-solid fa-flag me-1"></i> ${p.text}</span>`;
}

function getTaskStatusBadge(status: Task['status']): string {
    if (status === 'zakończone') return `<span class="badge bg-success">${i18next.t('tasks.status_done')}</span>`;
    if (status === 'w trakcie') return `<span class="badge bg-info text-black">${i18next.t('tasks.status_inprogress')}</span>`;
    return `<span class="badge bg-secondary">${i18next.t('tasks.status_todo')}</span>`;
}

function getMilestonePriorityFlag(priority: Milestone['priority']): string {
    const priorityMap = {
        wysoki: { class: 'danger', text: i18next.t('milestones.priority_high') },
        średni: { class: 'warning', text: i18next.t('milestones.priority_medium') },
        niski: { class: 'info', text: i18next.t('milestones.priority_low') }
    };
    const p = priorityMap[priority] || { class: 'light', text: priority };
    return `<span class="badge bg-${p.class}-subtle border border-${p.class}-subtle text-${p.class}-emphasis rounded-pill"><i class="fa-solid fa-flag me-1"></i> ${p.text}</span>`;
}

function getMilestoneStatusBadge(status: Milestone['status']): string {
    if (status === 'done') return `<span class="badge bg-success-subtle border border-success-subtle text-success-emphasis rounded-pill">${i18next.t('milestones.status_done')}</span>`;
    if (status === 'doing') return `<span class="badge bg-info-subtle border border-info-subtle text-info-emphasis rounded-pill">${i18next.t('milestones.status_doing')}</span>`;
    return `<span class="badge bg-secondary-subtle border border-secondary-subtle text-secondary-emphasis rounded-pill">${i18next.t('milestones.status_todo')}</span>`;
}

export async function renderSingleTaskView(container: HTMLElement) {
    const taskId = window.location.pathname.split('/')[2];
    if (!taskId) { showAlert(i18next.t('tasks.errorIdMissing'), 'danger'); return; }

    const loadDataAndRender = async () => {
        container.innerHTML = `<div class="d-flex justify-content-center p-5"><div class="spinner-border"></div></div>`;
        try {
            const [task, users] = await Promise.all([api.getTaskById(taskId), api.getUsers()]);
            const milestones = task.milestones || [];
            const assignedUser = (task.assignedTo && typeof task.assignedTo === 'object') ? task.assignedTo : null;

            container.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4 heading-btn-mobile">
                    <h2 class="mb-0">${i18next.t('tasks.taskDetails')}</h2>
                    <a href="/tasks" class="btn btn-secondary"><i class="fa-solid fa-arrow-left me-2"></i>${i18next.t('actions.backToList')}</a>
                </div>
                <div class="card p-4 mb-4 shadow-sm">
                    <h3 class="mb-3">${task.title}</h3>
                    <p class="text-muted">${task.description || ''}</p>
                    <hr>
                    <div class="row gy-4">
                        <div class="col-md-3"><small class="text-muted d-block mb-1">${i18next.t('tasks.status')}</small>${getTaskStatusBadge(task.status)}</div>
                        <div class="col-md-3"><small class="text-muted d-block mb-1">${i18next.t('tasks.priority')}</small>${getTaskPriorityFlag(task.priority)}</div>
                        <div class="col-md-3"><small class="text-muted d-block mb-1">${i18next.t('tasks.deadline')}</small><div>${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</div></div>
                        <div class="col-md-3"><small class="text-muted d-block mb-1">${i18next.t('tasks.assignedTo')}</small><div>${assignedUser ? `${assignedUser.imie} ${assignedUser.nazwisko || ''}` : 'N/A'}</div></div>
                    </div>
                    <div class="d-flex justify-content-end gap-2 mt-4">
                        <a href="/edit-task/${task._id}" class="btn btn-primary">${i18next.t('actions.edit')}</a>
                        <button id="delete-task-btn" class="btn btn-danger">${i18next.t('actions.delete')}</button>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3 heading-btn-mobile ">
                    <h4 class="mb-0">${i18next.t('milestones.title')}</h4>
                    <div id="milestone-filter-buttons" class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-secondary active" data-filter="all">${i18next.t('milestones.filters.all')}</button>
                        <button type="button" class="btn btn-outline-secondary" data-filter="todo">${i18next.t('milestones.status_todo')}</button>
                        <button type="button" class="btn btn-outline-secondary" data-filter="doing">${i18next.t('milestones.status_doing')}</button>
                        <button type="button" class="btn btn-outline-secondary" data-filter="done">${i18next.t('milestones.status_done')}</button>
                    </div>
                </div>
                <div class="table-responsive-wrapper ">
                <div class="card shadow-sm">
                    <div class="card-header bg-body-tertiary milestones-header">
                        <div class="d-flex justify-content-between w-100 align-items-center">
                            <div class="col-md-5"><h6 class="mb-0 text-muted text-uppercase small fw-bold">${i18next.t('milestones.name')}</h6></div>
                            <div class="col-md-2"><h6 class="mb-0 text-muted text-uppercase small fw-bold">${i18next.t('milestones.priority')}</h6></div>
                            <div class="col-md-2"><h6 class="mb-0 text-muted text-uppercase small fw-bold">${i18next.t('milestones.startDate')}</h6></div>
                            <div class="col-md-1"><h6 class="mb-0 text-muted text-uppercase small fw-bold">${i18next.t('milestones.status')}</h6></div>
                            <div class="col-md-2 text-end">
                                <button id="add-milestone-btn" class="btn btn-success btn-sm"><i class="fa-solid fa-plus me-2"></i>${i18next.t('milestones.add')}</button>
                            </div>
                        </div>
                    </div>
                    <div id="milestones-list" class="list-group list-group-flush"></div>
                 <div>
                </div>`;
            
            renderMilestonesList(document.getElementById('milestones-list')!, milestones, users, taskId, loadDataAndRender);
            
            document.getElementById('milestone-filter-buttons')?.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                if (target.tagName === 'BUTTON') {
                    document.querySelectorAll('#milestone-filter-buttons button').forEach(btn => btn.classList.remove('active'));
                    target.classList.add('active');
                    
                    const filter = target.dataset.filter;
                    
                    document.querySelectorAll('#milestones-list .list-group-item').forEach(item => {
                        const milestoneItem = item as HTMLElement;
                        if (filter === 'all' || milestoneItem.dataset.status === filter) {
                            milestoneItem.style.display = 'block';
                        } else {
                            milestoneItem.style.display = 'none';
                        }
                    });
                }
            });

            container.querySelector<HTMLButtonElement>('#delete-task-btn')?.addEventListener('click', async () => {
                if (await showConfirm(i18next.t('tasks.confirmDelete'), i18next.t('actions.confirmDelete'), i18next.t('actions.cancelDelete'), i18next.t('actions.confirmTitle'))) {
                    try {
                        await api.deleteTask(taskId);
                        showAlert(i18next.t('tasks.deleteSuccess'), 'success');
                        window.location.pathname = '/tasks';
                    } catch { showAlert(i18next.t('tasks.deleteError'), 'danger'); }
                }
            });
            
            container.querySelector<HTMLButtonElement>('#add-milestone-btn')?.addEventListener('click', () => {
                renderMilestoneFormModal(null, taskId, users, loadDataAndRender);
            });
        } catch (error) {
            console.error("Błąd ładowania danych zadania:", error);
            showAlert(i18next.t('milestones.alerts.loadError'), 'danger');
        }
    };
    await loadDataAndRender();
}

function renderMilestonesList(container: HTMLElement, milestones: Milestone[], users: User[], taskId: string, onUpdate: () => void) {
    if (!milestones || milestones.length === 0) {
        container.innerHTML = `<div class="list-group-item text-center text-muted p-4">${i18next.t('milestones.noMilestonesForTask')}</div>`;
        return;
    }
    const milestonesHtml = milestones.map(m => {
        const displayDate = m.startDate ? new Date(m.startDate).toLocaleDateString() : (m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A');
        return `
            <div class="list-group-item list-group-item-action" data-status="${m.status}">
                <div class="d-flex justify-content-between w-100 align-items-center">
                    <div class="col-md-5">
                        <h6 class="mb-1">${m.name}</h6>
                        <p class="mb-1 text-muted small truncate-text">${m.description || ''}</p>
                    </div>
                    <div class="col-md-2">${getMilestonePriorityFlag(m.priority)}</div>
                    <div class="col-md-2">${displayDate}</div>
                    <div class="col-md-1">${getMilestoneStatusBadge(m.status)}</div>
                    <div class="col-md-2 text-end">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary view-milestone-btn" data-milestone-id="${m._id}"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn btn-sm btn-outline-secondary edit-milestone-btn" data-milestone-id="${m._id}"><i class="fa-solid fa-pencil"></i></button>
                            <button class="btn btn-sm btn-outline-danger remove-milestone-btn" data-milestone-id="${m._id}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
    
    container.innerHTML = milestonesHtml;

    container.querySelectorAll<HTMLButtonElement>('.view-milestone-btn').forEach(button => {
        button.addEventListener('click', () => {
            const milestoneId = button.dataset.milestoneId;
            const milestoneToShow = milestones.find(m => m._id === milestoneId);
            if (milestoneToShow) {
                renderMilestoneViewModal(milestoneToShow);
            }
        });
    });

    container.querySelectorAll<HTMLButtonElement>('.edit-milestone-btn').forEach(button => {
        button.addEventListener('click', () => {
            const milestoneId = button.dataset.milestoneId;
            const milestoneToEdit = milestones.find(m => m._id === milestoneId);
            if (milestoneToEdit) {
                renderMilestoneFormModal(milestoneToEdit, taskId, users, onUpdate);
            }
        });
    });

    container.querySelectorAll<HTMLButtonElement>('.remove-milestone-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const milestoneId = button.dataset.milestoneId!;
            if (await showConfirm(i18next.t('milestones.confirmDelete'), i18next.t('actions.confirmDelete'), i18next.t('actions.cancelDelete'), i18next.t('actions.confirmTitle'))) {
                try {
                    await api.deleteMilestone(milestoneId);
                    showAlert(i18next.t('milestones.alerts.deleteSuccess'), 'success');
                    onUpdate();
                } catch { showAlert(i18next.t('milestones.alerts.deleteError'), 'danger'); }
            }
        });
    });
}

function renderMilestoneViewModal(milestone: Milestone) {
    const modalId = `milestone-view-modal-${milestone._id}`;
    document.getElementById(modalId)?.remove();

    const assignedUser = milestone.assignedTo && typeof milestone.assignedTo === 'object' ? `${milestone.assignedTo.imie} ${milestone.assignedTo.nazwisko || ''}` : 'N/A';
    const startDate = milestone.startDate ? new Date(milestone.startDate).toLocaleDateString() : 'N/A';
    const endDate = milestone.endDate ? new Date(milestone.endDate).toLocaleDateString() : 'N/A';

    const modalBody = `
        <p>${milestone.description || 'Brak opisu.'}</p>
        <hr>
        <div class="row">
            <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.priority')}:</strong><br>${getMilestonePriorityFlag(milestone.priority)}</div>
            <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.status')}:</strong><br>${getMilestoneStatusBadge(milestone.status)}</div>
            <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.assignedTo')}:</strong><br>${assignedUser}</div>
            <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.estimatedTime')}:</strong><br>${milestone.estimatedTime || 0} min</div>
            <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.startDate')}:</strong><br>${startDate}</div>
            <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.endDate')}:</strong><br>${endDate}</div>
        </div>`;

    const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${milestone.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${modalBody}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18next.t('actions.close')}</button>
                    </div>
                </div>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById(modalId)!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}

function renderMilestoneFormModal(milestone: Milestone | null, taskId: string, users: User[], onFinished: () => void) {
    const isEditing = milestone !== null;
    const modalId = `milestone-form-modal`;
    document.getElementById(modalId)?.remove();

    const formHtml = `
        <div class="mb-3">
            <label for="milestone-name" class="form-label">${i18next.t('milestones.name')}</label>
            <input type="text" id="milestone-name" class="form-control" required value="${milestone?.name || ''}">
        </div>
        <div class="mb-3">
            <label for="milestone-desc" class="form-label">${i18next.t('milestones.description')}</label>
            <textarea id="milestone-desc" class="form-control" rows="2">${milestone?.description || ''}</textarea>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="milestone-priority" class="form-label">${i18next.t('milestones.priority')}</label>
                <select id="milestone-priority" class="form-select">
                    <option value="niski" ${milestone?.priority === 'niski' ? 'selected' : ''}>${i18next.t('milestones.priority_low')}</option>
                    <option value="średni" ${!milestone || milestone?.priority === 'średni' ? 'selected' : ''}>${i18next.t('milestones.priority_medium')}</option>
                    <option value="wysoki" ${milestone?.priority === 'wysoki' ? 'selected' : ''}>${i18next.t('milestones.priority_high')}</option>
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label for="milestone-status" class="form-label">${i18next.t('milestones.status')}</label>
                <select id="milestone-status" class="form-select">
                    <option value="todo" ${!milestone || milestone?.status === 'todo' ? 'selected' : ''}>${i18next.t('milestones.status_todo')}</option>
                    <option value="doing" ${milestone?.status === 'doing' ? 'selected' : ''}>${i18next.t('milestones.status_doing')}</option>
                    <option value="done" ${milestone?.status === 'done' ? 'selected' : ''}>${i18next.t('milestones.status_done')}</option>
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="milestone-time" class="form-label">${i18next.t('milestones.estimatedTimeInMinutes')}</label>
                <input type="number" id="milestone-time" class="form-control" min="0" placeholder="${i18next.t('milestones.timePlaceholder')}" value="${milestone?.estimatedTime || ''}">
            </div>
            <div class="col-md-6 mb-3">
                <label for="milestone-user" class="form-label">${i18next.t('milestones.assignedTo')}</label>
                <select id="milestone-user" class="form-select">
                    <option value="">-- ${i18next.t('milestones.selectUser')} --</option>
                    ${users.map(u => {
                        const isSelected = milestone?.assignedTo && typeof milestone.assignedTo === 'object' && milestone.assignedTo._id === u._id;
                        return `<option value="${u._id}" ${isSelected ? 'selected' : ''}>${u.imie} ${u.nazwisko || ''}</option>`;
                    }).join('')}
                </select>
            </div>
        </div>
        <div class="modal-footer px-0 pt-4 pb-0">
             <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18next.t('actions.cancel')}</button>
             <button type="submit" class="btn btn-primary">${isEditing ? i18next.t('actions.save') : i18next.t('actions.create')}</button>
        </div>
    `;

    const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${isEditing ? i18next.t('milestones.editTitle') : i18next.t('milestones.createNewAndLink')}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="milestone-form-in-modal">${formHtml}</form>
                    </div>
                </div>
            </div>
        </div>`;
        
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const form = document.querySelector<HTMLFormElement>(`#${modalId} #milestone-form-in-modal`)!;
    const modalEl = document.getElementById(modalId)!;
    const modal = new bootstrap.Modal(modalEl);
    
    modal.show();
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = (form.querySelector<HTMLInputElement>('#milestone-name'))!.value;
        const description = (form.querySelector<HTMLTextAreaElement>('#milestone-desc'))!.value;
        const priority = (form.querySelector<HTMLSelectElement>('#milestone-priority'))!.value as Priority;
        const status = (form.querySelector<HTMLSelectElement>('#milestone-status'))!.value as Milestone['status'];
        const estimatedTimeValue = (form.querySelector<HTMLInputElement>('#milestone-time'))!.value;
        const assignedToValue = (form.querySelector<HTMLSelectElement>('#milestone-user'))!.value;

        const milestoneData: any = { name, description, priority, status };

        if (estimatedTimeValue) milestoneData.estimatedTime = parseInt(estimatedTimeValue, 10);
        if (assignedToValue) milestoneData.assignedTo = assignedToValue;

        const oldStatus = milestone?.status;
        const oldAssignedTo = milestone?.assignedTo && typeof milestone.assignedTo === 'object' ? milestone.assignedTo._id : milestone?.assignedTo;

        if (assignedToValue && !oldAssignedTo) {
            if (status === 'todo') {
                milestoneData.status = 'doing';
            }
            if (!milestone?.startDate) {
                milestoneData.startDate = new Date().toISOString();
            }
        }

        if (status === 'done' && oldStatus !== 'done') {
            milestoneData.endDate = new Date().toISOString();
        } else if (oldStatus === 'done' && status !== 'done') {
            milestoneData.endDate = null;
        }

        try {
            if (isEditing && milestone?._id) {
                await api.updateMilestone(milestone._id, milestoneData);
            } else {
                await api.createMilestoneForTask({ ...milestoneData, taskId });
            }
            showAlert(isEditing ? i18next.t('milestones.alerts.changesSaved') : i18next.t('milestones.alerts.milestoneCreated'), 'success');
            modal.hide();
            onFinished();
        } catch(err) {
            showAlert(i18next.t('milestones.alerts.saveError'), 'danger');
        }
    });
}
