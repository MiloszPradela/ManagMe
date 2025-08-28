import { api } from '../services/ApiService';
import i18next from 'i18next';
import * as bootstrap from 'bootstrap';
import type { Task } from '../models/Task';
import type { Milestone } from '../models/Milestone';
import type { User } from '../models/User';
import { showAlert, showConfirm } from '../services/AlertService';
import { renderMilestonesComponent } from '../components/MilestonesComponent';

export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

export function getStatusBadge(status: Task['status'] | Milestone['status']) {
  const statusMap: Record<string, string> = {
    'do zrobienia': `<span class="badge bg-secondary">${i18next.t('tasks.status_todo')}</span>`,
    'w trakcie': `<span class="badge bg-info text-dark">${i18next.t('tasks.status_inprogress')}</span>`,
    'zakończone': `<span class="badge bg-success">${i18next.t('tasks.status_done')}</span>`,
    'todo': `<span class="badge bg-secondary-subtle border border-secondary-subtle text-secondary-emphasis">${i18next.t('milestones.status_todo')}</span>`,
    'doing': `<span class="badge bg-info-subtle border border-info-subtle text-info-emphasis">${i18next.t('milestones.status_doing')}</span>`,
    'done': `<span class="badge bg-success-subtle border border-success-subtle text-success-emphasis">${i18next.t('milestones.status_done')}</span>`,
  };
  return statusMap[status as string] || `<span class="badge bg-light">${status}</span>`;
}

export function getPriorityFlag(priority: Task['priority'] | Milestone['priority']) {
  const priorityMap: Record<string, string> = {
    wysoki: `<span class="badge bg-danger-subtle border border-danger-subtle text-danger-emphasis"><i class="fa-solid fa-flag me-1"></i>${i18next.t('tasks.priority_high')}</span>`,
    średni: `<span class="badge bg-warning-subtle border border-warning-subtle text-warning-emphasis"><i class="fa-solid fa-flag me-1"></i>${i18next.t('tasks.priority_medium')}</span>`,
    niski: `<span class="badge bg-info-subtle border border-info-subtle text-info-emphasis"><i class="fa-solid fa-flag me-1"></i>${i18next.t('tasks.priority_low')}</span>`,
  };
  return priorityMap[priority as string] || '';
}

// --- MODALE PROJEKTU I ZADAŃ ---

function renderEditProjectModal(project: any, users: User[], onUpdate: () => void) {
  const modalId = `edit-project-modal`;
  document.getElementById(modalId)?.remove();
  const team = project.team as User[];
  const userOptions = users
    .map(
      (user) =>
        `<label class="multiselect-option"><input type="checkbox" value="${user._id}" ${
          team.some((tm) => tm._id === user._id) ? 'checked' : ''
        }><span>${user.imie} ${user.nazwisko}</span></label>`
    )
    .join('');
  const selectedBadges = team.map((member) => `<span class="multiselect-badge">${member.imie} ${member.nazwisko}</span>`).join('');

  const modalHtml = `
    <div class="modal fade" id="${modalId}" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content">
    <form id="project-edit-form-modal">
        <div class="modal-header"><h5 class="modal-title">${i18next.t('projectview.editTitle')}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
            <div class="mb-3"><label class="form-label">${i18next.t('projectview.projectName')}</label><input id="project-name-modal" class="form-control" value="${escapeHtml(
    project.name
  )}" required></div>
            <div class="mb-3"><label class="form-label">${i18next.t('projectview.projectDescription')}</label><textarea id="project-description-modal" class="form-control" rows="3" required>${escapeHtml(
    project.description
  )}</textarea></div>
            <div class="row">
                <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('projectview.deadline')}</label><input id="project-deadline-modal" type="date" class="form-control" value="${
    project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
  }"></div>
                <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('projectview.assignTeam')}</label><div class="custom-multiselect"><div class="multiselect-input"><div class="multiselect-selected d-flex flex-wrap gap-2">${selectedBadges}</div></div><div class="multiselect-dropdown">${userOptions}</div></div></div>
            </div>
        </div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18next.t('actions.cancel')}</button><button type="submit" class="btn btn-primary">${i18next.t(
    'actions.save'
  )}</button></div>
    </form></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById(modalId)!;
  const modal = new bootstrap.Modal(modalEl);

  const multiselect = modalEl.querySelector<HTMLDivElement>('.custom-multiselect')!;
  const input = multiselect.querySelector<HTMLDivElement>('.multiselect-input')!;
  input.addEventListener('click', () => multiselect.classList.toggle('is-open'));
  document.addEventListener('click', (e) => {
    if (!multiselect.contains(e.target as Node)) multiselect.classList.remove('is-open');
  });

  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
  modalEl.querySelector('form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (modalEl.querySelector<HTMLInputElement>('#project-name-modal')!).value.trim();
    const description = (modalEl.querySelector<HTMLTextAreaElement>('#project-description-modal')!).value.trim();
    const deadline = (modalEl.querySelector<HTMLInputElement>('#project-deadline-modal')!).value;
    const selectedTeam = Array.from(modalEl.querySelectorAll('.multiselect-option input:checked')).map((cb) => (cb as HTMLInputElement).value);

    try {
      await api.updateProject({ id: project._id, name, description, deadline: deadline || null, team: selectedTeam });
      showAlert(i18next.t('projectview.updateSuccess'), 'success');
      modal.hide();
      onUpdate();
    } catch (error: any) {
      showAlert(`${i18next.t('projectview.errorSave')}: ${error.message}`, 'danger');
    }
  });
  modal.show();
}

function renderEditTaskModal(task: Task | null, users: User[], projectId: string, onUpdate: () => void) {
  const isEditing = !!task;
  const modalId = `edit-task-modal-${isEditing ? task._id : 'new'}`;
  document.getElementById(modalId)?.remove();

  const userOptions = users
    .map(
      (u) =>
        `<option value="${u._id}" ${
          task?.assignedTo && typeof task.assignedTo === 'object' && task.assignedTo._id === u._id ? 'selected' : ''
        }>${u.imie} ${u.nazwisko}</option>`
    )
    .join('');

  const statusValues = ['do zrobienia', 'w trakcie', 'zakończone'];
  const priorityValues = ['niski', 'średni', 'wysoki'];

  const statusOptions = statusValues
    .map((s) => `<option value="${s}" ${task?.status === s ? 'selected' : ''}>${i18next.t(`tasks.status_${s.replace(' ', '_')}`)}</option>`)
    .join('');
  const priorityOptions = priorityValues
    .map(
      (p) => `<option value="${p}" ${task?.priority === p ? 'selected' : !task && p === 'średni' ? 'selected' : ''}>${i18next.t(`tasks.priority_${p}`)}</option>`
    )
    .join('');

  const modalHtml = `
    <div class="modal fade" id="${modalId}" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <form id="task-form-${modalId}">
            <div class="modal-header">
              <h5 class="modal-title">${isEditing ? i18next.t('tasks.editTaskTitle') : i18next.t('tasks.createNewTask')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3"><label class="form-label">${i18next.t('tasks.title')}</label><input id="task-title-modal" class="form-control" value="${
    task ? escapeHtml(task.title) : ''
  }" required></div>
              <div class="mb-3"><label class="form-label">${i18next.t('tasks.description')}</label><textarea id="task-description-modal" class="form-control" rows="3">${
    task ? escapeHtml(task.description) : ''
  }</textarea></div>
              <div class="row">
                <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('tasks.assignTo')}</label><select id="task-assigned-to-modal" class="form-select"><option value="">${i18next.t(
    'tasks.selectPerson'
  )}</option>${userOptions}</select></div>
                <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('tasks.deadline')}</label><input id="task-deadline-modal" type="date" class="form-control" value="${
    task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
  }"></div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('tasks.status')}</label><select id="task-status-modal" class="form-select">${statusOptions}</select></div>
                <div class="col-md-6 mb-3"><label class="form-label">${i18next.t('tasks.priority')}</label><select id="task-priority-modal" class="form-select">${priorityOptions}</select></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18next.t('actions.cancel')}</button>
              <button type="submit" class="btn btn-primary">${isEditing ? i18next.t('actions.save') : i18next.t('tasks.createTask')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById(modalId)!;
  const modal = new bootstrap.Modal(modalEl);

  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
  modalEl.querySelector('form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (modalEl.querySelector<HTMLInputElement>('#task-title-modal')!).value;
    if (!title.trim()) {
      showAlert(i18next.t('common.fieldRequired', { field: i18next.t('tasks.title') }), 'warning');
      return;
    }

    const taskData = {
      title: title.trim(),
      description: (modalEl.querySelector<HTMLTextAreaElement>('#task-description-modal')!).value,
      assignedTo: (modalEl.querySelector<HTMLSelectElement>('#task-assigned-to-modal')!).value || undefined,
      deadline: (modalEl.querySelector<HTMLInputElement>('#task-deadline-modal')!).value || null,
      status: (modalEl.querySelector<HTMLSelectElement>('#task-status-modal')!).value as Task['status'],
      priority: (modalEl.querySelector<HTMLSelectElement>('#task-priority-modal')!).value as Task['priority'],
    };

    try {
      if (isEditing && task) {
        await api.updateTask({ _id: task._id, ...taskData });
        showAlert(i18next.t('tasks.updateSuccess'), 'success');
      } else {
        await api.addTask({ ...taskData, project: projectId });
        showAlert(i18next.t('tasks.createSuccess'), 'success');
      }
      modal.hide();
      onUpdate();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      showAlert(errorMsg, 'danger');
    }
  });
  modal.show();
}

function renderViewTaskModal(task: Task) {
  const modalId = `view-task-modal-${task._id}`;
  document.getElementById(modalId)?.remove();

  const assigned =
    task.assignedTo && typeof task.assignedTo === 'object'
      ? `${(task.assignedTo as User).imie} ${(task.assignedTo as User).nazwisko || ''}`
      : 'N/A';

  const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A';

  const body = `
    <div class="mb-2"><strong>${i18next.t('tasks.title')}:</strong><br>${escapeHtml(task.title)}</div>
    <div class="mb-2"><strong>${i18next.t('tasks.description')}:</strong><br>${escapeHtml(task.description || '') || '-'}</div>
    <div class="row">
      <div class="col-sm-6 mb-2"><strong>${i18next.t('tasks.assignedTo')}:</strong><br>${escapeHtml(assigned)}</div>
      <div class="col-sm-6 mb-2"><strong>${i18next.t('tasks.deadline')}:</strong><br>${deadline}</div>
      <div class="col-sm-6 mb-2"><strong>${i18next.t('tasks.priority')}:</strong><br>${getPriorityFlag(task.priority)}</div>
      <div class="col-sm-6 mb-2"><strong>${i18next.t('tasks.status')}:</strong><br>${getStatusBadge(task.status)}</div>
    </div>
  `;

  const html = `
    <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${i18next.t('tasks.details')}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18next.t('actions.close')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  const el = document.getElementById(modalId)!;
  const modal = new bootstrap.Modal(el);
  modal.show();
  el.addEventListener('hidden.bs.modal', () => el.remove());
}

// --- Renderowanie sekcji z zadaniami ---
function renderTasksSection(container: HTMLElement, tasks: Task[], users: User[], projectId: string, onUpdate: () => void) {
  if (tasks.length === 0) {
    container.innerHTML = `<div class="p-5 text-center text-muted">${i18next.t('tasks.noTasksAssigned')}</div>`;
    return;
  }

  const tasksHtml = tasks
    .map(
      (task) => `
        <div class="task-wrapper mb-4">
            <div class="task-row p-3 border rounded-top" data-task-id="${task._id}">
                <div class="row align-items-center">
                    <div class="col-12 col-lg-4 mb-2 mb-lg-0">
                        <strong class="d-lg-none">${i18next.t('tasks.title')}: </strong>${escapeHtml(task.title)}
                    </div>
                    <div class="col-6 col-lg-2"><strong class="d-lg-none">${i18next.t('tasks.priority')}: </strong>${getPriorityFlag(task.priority)}</div>
                    <div class="col-6 col-lg-2"><strong class="d-lg-none">${i18next.t('tasks.assignedTo')}: </strong>${
        task.assignedTo ? `${(task.assignedTo as User).imie} ${(task.assignedTo as User).nazwisko}` : 'N/A'
      }</div>
                    <div class="col-6 col-lg-2"><strong class="d-lg-none">${i18next.t('tasks.status')}: </strong>${getStatusBadge(task.status)}</div>
                    <div class="col-6 col-lg-1"><strong class="d-lg-none">${i18next.t('tasks.deadline')}: </strong>${
        task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'
      }</div>
                    <div class="col-12 col-lg-1 text-lg-end mt-2 mt-lg-0">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary view-task-btn" title="${i18next.t('actions.view')}"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn btn-sm btn-outline-secondary edit-task-btn" title="${i18next.t('actions.edit')}"><i class="fa-solid fa-pencil"></i></button>
                            <button class="btn btn-sm btn-outline-danger delete-task-btn" title="${i18next.t('actions.delete')}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="milestones-row" data-milestones-for="${task._id}">
                <div class="milestones-container border border-top-0 rounded-bottom p-3 bg-body-tertiary"></div>
            </div>
        </div>`
    )
    .join('');

  container.innerHTML = `
    <div class="tasks-header d-none d-lg-flex row text-muted small text-uppercase mb-2">
        <div class="col-lg-4">${i18next.t('tasks.title')}</div>
        <div class="col-lg-2">${i18next.t('tasks.priority')}</div>
        <div class="col-lg-2">${i18next.t('tasks.assignedTo')}</div>
        <div class="col-lg-2">${i18next.t('tasks.status')}</div>
        <div class="col-lg-1">${i18next.t('tasks.deadline')}</div>
        <div class="col-lg-1 text-end">${i18next.t('actions.actions')}</div>
    </div>
    ${tasksHtml}`;

  tasks.forEach((task) => {
    const milestonesContainer = container.querySelector<HTMLDivElement>(`[data-milestones-for="${task._id}"] .milestones-container`)!;
    if (milestonesContainer) {
      renderMilestonesComponent(milestonesContainer, task._id!, users, onUpdate);
    }
  });

  container.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const taskRow = target.closest<HTMLDivElement>('.task-row');
    if (!taskRow) return;

    const taskId = taskRow.dataset.taskId!;
    const taskToEdit = tasks.find((t) => t._id === taskId);

    if (target.closest('.view-task-btn')) {
      if (taskToEdit) {
        renderViewTaskModal(taskToEdit);
      }
      return;
    }

    if (target.closest('.edit-task-btn')) {
      if (taskToEdit) renderEditTaskModal(taskToEdit, users, projectId, onUpdate);
    } else if (target.closest('.delete-task-btn')) {
      if (await showConfirm(i18next.t('tasks.confirmDelete'))) {
        try {
          await api.deleteTask(taskId);
          showAlert(i18next.t('tasks.deleteSuccess'), 'success');
          onUpdate();
        } catch (error: any) {
          showAlert(error.message, 'danger');
        }
      }
    }
  });
}

// --- Główna funkcja widoku ---
export async function renderSingleProjectView(container: HTMLElement) {
  const projectId = window.location.pathname.split('/')[2];
  if (!projectId) {
    container.innerHTML = `<p class="text-danger">${i18next.t('projectview.noProjectId')}</p>`;
    return;
  }
  container.innerHTML = `<div class="d-flex justify-content-center p-5"><div class="spinner-border"></div></div>`;

  const loadDataAndRender = async () => {
    try {
      const [users, project, tasks] = await Promise.all([api.getUsers(), api.getProjectById(projectId), api.getTasks(projectId)]);
      const teamMembers =
        (project.team as User[]).map((member) => `<span class="badge bg-light text-dark p-2 me-1">${member.imie} ${member.nazwisko}</span>`).join('') ||
        `<span class="text-muted small">${i18next.t('projectview.noTeam')}</span>`;

      container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4 heading-btn-mobile-projects">
          <h2 class="mb-0">${escapeHtml(project.name)}</h2>
          <div>
            <button id="edit-project-btn" class="btn btn-primary"><i class="fa-solid fa-pencil me-2"></i>${i18next.t('actions.edit')}</button>
            <a href="/all-projects" class="btn btn-secondary ms-2"><i class="fa-solid fa-arrow-left me-2"></i>${i18next.t('actions.backToList')}</a>
          </div>
        </div>
        <div class="card p-4 mb-5 shadow-sm">
          <p class="mb-3">${escapeHtml(project.description)}</p>
          <div class="row border-top pt-3">
            <div class="col-md-6"><strong>${i18next.t('projectview.deadline')}:</strong> ${
        project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'
      }</div>
            <div class="col-md-6"><strong>${i18next.t('projectview.team')}:</strong> ${teamMembers}</div>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-3 heading-btn-mobile">
          <h3 class="mb-0">${i18next.t('tasks.assignedTasks')}</h3>
          <button id="add-task-btn" class="btn btn-success"><i class="fa-solid fa-plus me-2"></i>${i18next.t('tasks.createNewTask')}</button>
        </div>
        <div id="tasks-list-container"></div>`;

      renderTasksSection(container.querySelector<HTMLDivElement>('#tasks-list-container')!, tasks, users, projectId, loadDataAndRender);

      document.getElementById('edit-project-btn')?.addEventListener('click', () => renderEditProjectModal(project, users, loadDataAndRender));
      document.getElementById('add-task-btn')?.addEventListener('click', () => renderEditTaskModal(null, users, projectId, loadDataAndRender));
    } catch (error) {
      showAlert(i18next.t('projectview.errorLoad'), 'danger');
      container.innerHTML = `<p class="text-danger">${i18next.t('projectview.errorLoadDetails', { error: error instanceof Error ? error.message : String(error) })}</p>`;
    }
  };
  await loadDataAndRender();
}
