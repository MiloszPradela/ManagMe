import { api } from '../services/ApiService';
import i18next from 'i18next';
import { showAlert } from '../services/AlertService';

export async function renderEditMilestoneView(container: HTMLElement) {
    const milestoneId = window.location.pathname.split('/')[2];
    if (!milestoneId) {
        showAlert('Brak ID kamienia milowego', 'danger');
        return;
    }

    container.innerHTML = `<div class="d-flex justify-content-center p-5"><div class="spinner-border"></div></div>`;
    
    try {
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0">${i18next.t('milestones.editTitle')}</h2>
                <a href="javascript:history.back()" class="btn btn-secondary">${i18next.t('actions.backToList')}</a>
            </div>
            <form id="edit-milestone-form" class="card p-4 shadow-sm">
                <!-- Tu wklej cały formularz z renderMilestoneFormModal -->
                <!-- Pamiętaj, aby wypełnić wartości pól danymi z obiektu 'milestone' -->
            </form>
        `;

        const form = container.querySelector<HTMLFormElement>('#edit-milestone-form')!;


        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedData = { };
            try {
                await api.updateMilestone(milestoneId, updatedData);
                showAlert('Zapisano zmiany!', 'success');
                window.history.back();
            } catch {
                showAlert('Błąd zapisu', 'danger');
            }
        });

    } catch(err) {
        showAlert('Błąd ładowania kamienia milowego', 'danger');
    }
}
