import { api } from '../services/ApiService';
import i18next from '../i18n';
import type { Task } from '../models/Task';
import { showAlert } from '../services/AlertService';

// --- Funkcja pomocnicza ---
function escapeHtml(text: string | null | undefined): string {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

// --- Główna funkcja widoku ---
export async function renderEditTaskView(container: HTMLElement) {
    const taskId = window.location.pathname.split('/')[2];

    if (!taskId) {
        showAlert(i18next.t('taskedit.errorIdMissing'), 'danger');
        return;
    }

    container.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 50vh;"><div class="spinner-border" role="status"></div></div>`;

    try {
        const [task, users] = await Promise.all([
            api.getTaskById(taskId),
            api.getUsers()
        ]);

        if (!task) { 
            showAlert(i18next.t('taskedit.errorLoad'), 'danger');
            container.innerHTML = `<p class="text-danger">${i18next.t('taskedit.notFound')}</p>`;
            return; 
        }

        const assignedToUser = (task.assignedTo && typeof task.assignedTo === 'object') ? task.assignedTo._id : task.assignedTo;
        const deadlineValue = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';
        const backUrl = `/task/${taskId}`;
        
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 heading-btn-mobile">
                <h2 class="mb-0">${i18next.t('taskedit.title')}</h2>
                <a href="${backUrl}" class="btn btn-secondary"><i class="fa-solid fa-arrow-left me-2"></i>${i18next.t('taskedit.backButton')}</a>
            </div>
            <form id="edit-task-form" class="card p-3 border-0 shadow-sm">
                <div class="mb-3">
                    <label for="task-title" class="form-label">${i18next.t('tasks.title')}</label>
                    <input type="text" id="task-title" class="form-control" value="${escapeHtml(task.title)}" required>
                </div>
                <div class="mb-3">
                    <label for="task-description" class="form-label">${i18next.t('tasks.description')}</label>
                    <textarea id="task-description" class="form-control" rows="3">${escapeHtml(task.description)}</textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="task-status" class="form-label">${i18next.t('tasks.status')}</label>
                        <select id="task-status" class="form-select">
                            <option value="do zrobienia" ${task.status === 'do zrobienia' ? 'selected' : ''}>${i18next.t('tasks.status_todo')}</option>
                            <option value="w trakcie" ${task.status === 'w trakcie' ? 'selected' : ''}>${i18next.t('tasks.status_inprogress')}</option>
                            <option value="zakończone" ${task.status === 'zakończone' ? 'selected' : ''}>${i18next.t('tasks.status_done')}</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="task-priority" class="form-label">${i18next.t('tasks.priority')}</label>
                        <select id="task-priority" class="form-select">
                            <option value="niski" ${task.priority === 'niski' ? 'selected' : ''}>${i18next.t('tasks.priority_low')}</option>
                            <option value="średni" ${task.priority === 'średni' ? 'selected' : ''}>${i18next.t('tasks.priority_medium')}</option>
                            <option value="wysoki" ${task.priority === 'wysoki' ? 'selected' : ''}>${i18next.t('tasks.priority_high')}</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="task-deadline" class="form-label">${i18next.t('tasks.deadline')}</label>
                        <input type="date" id="task-deadline" class="form-control" value="${deadlineValue}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="task-assigned-to" class="form-label">${i18next.t('tasks.assignTo')}</label>
                        <select id="task-assigned-to" class="form-select" required>
                            ${users.map(u => `<option value="${u._id}" ${u._id === assignedToUser ? 'selected' : ''}>${u.imie} ${u.nazwisko || ''}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">${i18next.t('taskedit.updateButton')}</button>
            </form>
        `;
        
        container.querySelector('#edit-task-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedData: Partial<Task> & { _id: string } = {
                _id: taskId,
                title: (container.querySelector('#task-title') as HTMLInputElement).value,
                description: (container.querySelector('#task-description') as HTMLTextAreaElement).value,
                deadline: (container.querySelector('#task-deadline') as HTMLInputElement).value || null,
                status: (container.querySelector('#task-status') as HTMLSelectElement).value as Task['status'],
                priority: (container.querySelector('#task-priority') as HTMLSelectElement).value as Task['priority'],
                assignedTo: (container.querySelector('#task-assigned-to') as HTMLSelectElement).value,
            };
            try {
                await api.updateTask(updatedData);
                showAlert(i18next.t('taskedit.updateSuccess'), 'success');
                setTimeout(() => { window.location.href = backUrl; }, 1500);
            } catch {
                showAlert(i18next.t('taskedit.updateError'), 'danger');
            }
        });
    } catch (error) {
        console.error("Błąd ładowania danych do edycji zadania:", error);
        showAlert(i18next.t('taskedit.errorLoad'), 'danger');
        container.innerHTML = `<p class="text-danger">${i18next.t('taskedit.errorLoad')}</p>`;
    }
}
