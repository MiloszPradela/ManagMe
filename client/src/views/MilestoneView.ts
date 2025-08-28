import { api } from '../services/ApiService';
import i18next from 'i18next';
import type { Milestone } from '../models/Milestone';
import type { Project } from '../models/Project';
import { showAlert } from '../services/AlertService';

export async function renderMilestoneView(container: HTMLElement) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0">${i18next.t('milestones.title')}</h2>
            <a href="/edit-milestone/new" class="btn btn-primary">
                <i class="fa-solid fa-plus me-2"></i>${i18next.t('milestones.createNew')}
            </a>
        </div>
        <div id="milestones-list-container" class="card p-3 shadow-sm"></div>
    `;

    const listContainer = container.querySelector<HTMLDivElement>('#milestones-list-container')!;
    listContainer.innerHTML = `<div class="d-flex justify-content-center p-5"><div class="spinner-border"></div></div>`;

    try {
        const milestones = await api.getMilestones();

        if (milestones.length === 0) {
            listContainer.innerHTML = `<p class="text-muted text-center p-4">${i18next.t('milestones.noMilestones')}</p>`;
            return;
        }

        const getStatusBadge = (status: Milestone['status']) => {
            switch (status) {
                case 'todo': return `<span class="badge text-bg-secondary">${i18next.t('milestones.status_todo')}</span>`;
                case 'doing': return `<span class="badge text-bg-info">${i18next.t('milestones.status_doing')}</span>`;
                case 'done': return `<span class="badge text-bg-success">${i18next.t('milestones.status_done')}</span>`;
                default: return `<span class="badge text-bg-light">${status}</span>`;
            }
        };

        const getPriorityFlag = (priority: Milestone['priority']) => {
            const priorityMap = {
                wysoki: { class: 'danger', text: i18next.t('milestones.priority_high') },
                średni: { class: 'warning', text: i18next.t('milestones.priority_medium') },
                niski: { class: 'success', text: i18next.t('milestones.priority_low') }
            };
            const priorityInfo = priorityMap[priority] || { class: 'secondary', text: priority };
            return `<span class="badge bg-${priorityInfo.class}-subtle border border-${priorityInfo.class}-subtle text-${priorityInfo.class}-emphasis rounded-pill">
                        <i class="fa-solid fa-flag me-1"></i> ${priorityInfo.text}
                    </span>`;
        };

        const tableRows = milestones.map(m => {
            const storyName = (m.story && typeof m.story === 'object') ? (m.story as Project).name : 'N/A';
            return `
                <tr>
                    <td><a href="/edit-milestone/${m._id}" class="fw-bold text-decoration-none">${m.name}</a></td>
                    <td>${storyName}</td>
                    <td>${getStatusBadge(m.status)}</td>
                    <td>${getPriorityFlag(m.priority)}</td>
                    <td class="text-end">
                        <a href="/edit-milestone/${m._id}" class="btn btn-sm btn-outline-secondary">
                            ${i18next.t('actions.edit')}
                        </a>
                    </td>
                </tr>
            `;
        }).join('');

        listContainer.innerHTML = `
            <div class="table-responsive-wrapper">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>${i18next.t('milestones.name')}</th>
                            <th>${i18next.t('milestones.story')}</th>
                            <th>${i18next.t('milestones.status')}</th>
                            <th>${i18next.t('milestones.priority')}</th>
                            <th class="text-end">${i18next.t('actions.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;
    } catch (error) {
        showAlert(i18next.t('milestones.loadError'), 'danger');
        listContainer.innerHTML = `<p class="text-danger text-center p-4">${i18next.t('milestones.loadError')}</p>`;
    }
}
