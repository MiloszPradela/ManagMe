// src/components/MilestonesComponent.ts
import { api } from '../services/ApiService';
import i18next from 'i18next';
import * as bootstrap from 'bootstrap';
import type { Milestone, Priority } from '../models/Milestone';
import type { User } from '../models/User';
import { showAlert, showConfirm } from '../services/AlertService';

// --- Funkcje pomocnicze (lokalne dla komponentu) ---
function escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

function getMilestonePriorityFlag(priority: Priority): string {
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

// --- MODALE ---

// Modal do podglądu szczegółów milestone
function renderMilestoneViewModal(milestone: Milestone) {
  const modalId = `milestone-view-modal-${milestone._id}`;
  document.getElementById(modalId)?.remove();

  const assignedUser =
    milestone.assignedTo && typeof milestone.assignedTo === 'object'
      ? `${milestone.assignedTo.imie} ${milestone.assignedTo.nazwisko || ''}`
      : 'N/A';

  const startDate = (milestone as any).createdAt
    ? new Date((milestone as any).createdAt).toLocaleDateString()
    : (milestone.startDate ? new Date(milestone.startDate).toLocaleDateString() : 'N/A');

  const endDate = milestone.endDate ? new Date(milestone.endDate).toLocaleDateString() : 'N/A';

  const modalBody = `
    <p>${escapeHtml(milestone.description) || 'Brak opisu.'}</p>
    <hr>
    <div class="row">
      <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.priority')}:</strong><br>${getMilestonePriorityFlag(milestone.priority)}</div>
      <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.status')}:</strong><br>${getMilestoneStatusBadge(milestone.status)}</div>
      <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.assignedTo')}:</strong><br>${escapeHtml(assignedUser)}</div>
      <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.estimatedTime')}:</strong><br>${milestone.estimatedTime || 0} min</div>
      <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.startDate')}:</strong><br>${startDate}</div>
      <div class="col-sm-6 mb-3"><strong>${i18next.t('milestones.endDate')}:</strong><br>${endDate}</div>
    </div>`;

  const modalHtml = `
    <div class="modal fade" id="${modalId}" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${escapeHtml(milestone.name)}</h5>
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


// Modal do tworzenia/edycji
function renderMilestoneFormModal(milestone: Milestone | null, taskId: string, users: User[], onFinished: () => void) {
    const isEditing = !!milestone;
    const modalId = `milestone-form-modal-${taskId.replace(/[^a-zA-Z0-9]/g, '')}`;
    document.getElementById(modalId)?.remove();

    const userOptions = users.map(u => `<option value="${u._id}" ${milestone?.assignedTo && typeof milestone.assignedTo === 'object' && milestone.assignedTo._id === u._id ? 'selected' : ''}>${u.imie} ${u.nazwisko || ''}</option>`).join('');

    const modalHtml = `
    <div class="modal fade" id="${modalId}" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <form id="milestone-form-in-modal">
                    <div class="modal-header"><h5 class="modal-title">${isEditing ? i18next.t('milestones.editTitle') : i18next.t('milestones.createNewAndLink')}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body">
                        <div class="mb-3"><label class="form-label">${i18next.t('milestones.name')}</label><input type="text" id="milestone-name" class="form-control" required value="${milestone?.name || ''}"></div>
                        <div class="mb-3"><label class="form-label">${i18next.t('milestones.description')}</label><textarea id="milestone-desc" class="form-control" rows="2">${milestone?.description || ''}</textarea></div>
                        <div class="row">
                            <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('milestones.priority')}</label><select id="milestone-priority" class="form-select"></select></div>
                            <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('milestones.status')}</label><select id="milestone-status" class="form-select"></select></div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('milestones.estimatedTimeInMinutes')}</label><input type="number" id="milestone-time" class="form-control" min="0" placeholder="${i18next.t('milestones.timePlaceholder')}" value="${milestone?.estimatedTime || ''}"></div>
                            <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('milestones.assignedTo')}</label><select id="milestone-user" class="form-select"><option value="">-- ${i18next.t('milestones.selectUser')} --</option>${userOptions}</select></div>
                        </div>
                    </div>
                    <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18next.t('actions.cancel')}</button><button type="submit" class="btn btn-primary">${isEditing ? i18next.t('actions.save') : i18next.t('actions.create')}</button></div>
                </form>
            </div>
        </div>
    </div>`;
    // Wypełnienie opcji dla selectów
    const formContainer = document.createElement('div');
    formContainer.innerHTML = modalHtml;
    const prioritySelect = formContainer.querySelector('#milestone-priority')!;
    prioritySelect.innerHTML = `<option value="niski" ${milestone?.priority === 'niski' ? 'selected' : ''}>${i18next.t('milestones.priority_low')}</option><option value="średni" ${!milestone || milestone?.priority === 'średni' ? 'selected' : ''}>${i18next.t('milestones.priority_medium')}</option><option value="wysoki" ${milestone?.priority === 'wysoki' ? 'selected' : ''}>${i18next.t('milestones.priority_high')}</option>`;
    const statusSelect = formContainer.querySelector('#milestone-status')!;
    statusSelect.innerHTML = `<option value="todo" ${!milestone || milestone?.status === 'todo' ? 'selected' : ''}>${i18next.t('milestones.status_todo')}</option><option value="doing" ${milestone?.status === 'doing' ? 'selected' : ''}>${i18next.t('milestones.status_doing')}</option><option value="done" ${milestone?.status === 'done' ? 'selected' : ''}>${i18next.t('milestones.status_done')}</option>`;
    
    document.body.appendChild(formContainer.firstElementChild!);
    const modalEl = document.getElementById(modalId)!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    modalEl.querySelector('form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (modalEl.querySelector('#milestone-name') as HTMLInputElement).value;
        const description = (modalEl.querySelector('#milestone-desc') as HTMLTextAreaElement).value;
        const priority = (modalEl.querySelector('#milestone-priority') as HTMLSelectElement).value as Priority;
        let status = (modalEl.querySelector('#milestone-status') as HTMLSelectElement).value as Milestone['status'];
        const estimatedTime = (modalEl.querySelector('#milestone-time') as HTMLInputElement).value;
        const assignedTo = (modalEl.querySelector('#milestone-user') as HTMLSelectElement).value;
        const data: Partial<Milestone> = { name, description, priority };
        if (estimatedTime) data.estimatedTime = parseInt(estimatedTime, 10);
        if (assignedTo) data.assignedTo = assignedTo;

        if (!isEditing) data.startDate = new Date().toISOString();
        if (assignedTo && status === 'todo') status = 'doing';
        if (status === 'done' && milestone?.status !== 'done') data.endDate = new Date().toISOString();
        if (status !== 'done' && milestone?.status === 'done') data.endDate = undefined;
        data.status = status;

        try {
            if (isEditing && milestone) {
                await api.updateMilestone(milestone._id, data);
            } else {
                const createData = { ...data, taskId: taskId };
                await api.createMilestoneForTask(createData);
            }
            showAlert(isEditing ? i18next.t('milestones.alerts.changesSaved') : i18next.t('milestones.alerts.milestoneCreated'), 'success');
            modal.hide();
            onFinished();
        } catch (err: any) {
            showAlert(err.message, 'danger');
        }
    });
}

// --- Główna funkcja renderująca komponent ---
export async function renderMilestonesComponent(container: HTMLElement, taskId: string, users: User[], onUpdate: () => void) {
    container.innerHTML = `<div class="p-3 text-center"><div class="spinner-border spinner-border-sm"></div></div>`;
    try {
        const milestones = await api.getMilestonesForTask(taskId);
        
        const headerHtml = `
            <div class="card-header bg-body-tertiary milestones-header">
                <div class="row align-items-center gx-3 text-muted text-uppercase small fw-bold">
                    <div class="col-4"><span>${i18next.t('milestones.name')}</span></div>
                    <div class="col-2"><span>${i18next.t('milestones.priority')}</span></div>
                    <div class="col-2"><span>${i18next.t('milestones.startDate')}</span></div>
                    <div class="col-2"><span>${i18next.t('milestones.status')}</span></div>
                    <div class="col-2 text-end">
                        <button class="btn btn-success btn-sm add-milestone-btn"><i class="fa-solid fa-plus me-2"></i>${i18next.t('milestones.add')}</button>
                    </div>
                </div>
            </div>`;

        const milestonesListHtml = milestones.length > 0
            ? milestones.map(m => {
                const displayDate = m.startDate ? new Date(m.startDate).toLocaleDateString() : (m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A');
                return `
                <div class="list-group-item list-group-item-action milestones-list">
                    <div class="d-flex justify-content-between w-100 align-items-center gx-3">
                        <div class="col-4">
                            <h6 class="mb-0 text-truncate">${escapeHtml(m.name)}</h6>
                        </div>
                        <div class="col-2">${getMilestonePriorityFlag(m.priority)}</div>
                        <div class="col-2">${displayDate}</div>
                        <div class="col-2">${getMilestoneStatusBadge(m.status)}</div>
                        <div class="col-2 text-end">
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary view-milestone-btn" data-milestone-id="${m._id}"><i class="fa-solid fa-eye"></i></button>
                                <button class="btn btn-sm btn-outline-secondary edit-milestone-btn" data-milestone-id="${m._id}"><i class="fa-solid fa-pencil"></i></button>
                                <button class="btn btn-sm btn-outline-danger remove-milestone-btn" data-milestone-id="${m._id}"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('') : `<div class="list-group-item text-center text-muted small p-3">${i18next.t('milestones.noMilestonesForTask')}</div>`;

        container.innerHTML = `
            <div class="card shadow-sm ">
            <div class="table-responsive-wrapper">
                ${headerHtml}
                <div class="list-group list-group-flush">${milestonesListHtml}</div>
                </div>
            </div>`;

        container.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const viewBtn = target.closest('.view-milestone-btn');
            if (viewBtn) {
                const milestoneId = (viewBtn as HTMLElement).dataset.milestoneId!;
                const milestone = milestones.find(m => m._id === milestoneId);
                if (milestone) renderMilestoneViewModal(milestone);
                return;
            }
            const addBtn = target.closest('.add-milestone-btn');
            if (addBtn) {
                renderMilestoneFormModal(null, taskId, users, onUpdate);
                return;
            }
            const editBtn = target.closest('.edit-milestone-btn');
            if (editBtn) {
                const milestoneId = (editBtn as HTMLElement).dataset.milestoneId!;
                const milestone = milestones.find(m => m._id === milestoneId);
                if (milestone) renderMilestoneFormModal(milestone, taskId, users, onUpdate);
                return;
            }
            const removeBtn = target.closest('.remove-milestone-btn');
            if (removeBtn) {
                const milestoneId = (removeBtn as HTMLElement).dataset.milestoneId!;
                if (await showConfirm(i18next.t('milestones.confirmDelete'))) {
                    await api.deleteMilestone(milestoneId);
                    showAlert(i18next.t('milestones.alerts.deleteSuccess'), 'success');
                    onUpdate();
                }
            }
        });
    } catch {
        container.innerHTML = `<div class="alert alert-danger mx-3 mt-2">${i18next.t('milestones.loadError')}</div>`;
    }
}
