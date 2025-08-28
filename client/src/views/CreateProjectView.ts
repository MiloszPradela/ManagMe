import { api } from '../services/ApiService';
import i18next from '../i18n';
import type { User } from '../models/User';
import { showAlert } from '../services/AlertService'; 

function setupCustomMultiselect() {
    const multiselect = document.querySelector<HTMLDivElement>('.custom-multiselect');
    if (!multiselect) return;

    const input = multiselect.querySelector<HTMLDivElement>('.multiselect-input')!;
    const dropdown = multiselect.querySelector<HTMLDivElement>('.multiselect-dropdown')!;

    input.addEventListener('click', () => {
        multiselect.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
        if (!multiselect.contains(e.target as Node)) {
            multiselect.classList.remove('is-open');
        }
    });

    dropdown.addEventListener('change', () => {
        const selectedContainer = multiselect.querySelector('.multiselect-selected')!;
        selectedContainer.innerHTML = '';
        document.querySelectorAll('.multiselect-option input:checked').forEach(checkbox => {
            const label = checkbox.nextElementSibling?.textContent;
            const badge = document.createElement('span');
            badge.className = 'multiselect-badge';
            badge.textContent = label ?? '';
            selectedContainer.appendChild(badge);
        });
    });
}

async function handleFormSubmit(e: Event) {
    e.preventDefault();
    const name = (document.querySelector('#project-name') as HTMLInputElement).value.trim();
    const description = (document.querySelector('#project-description') as HTMLTextAreaElement).value.trim();
    const deadline = (document.querySelector('#project-deadline') as HTMLInputElement).value;
    
    const team: string[] = [];
    document.querySelectorAll('.multiselect-option input:checked').forEach(checkbox => {
        team.push((checkbox as HTMLInputElement).value);
    });

    if (!name || !description) {
        showAlert(i18next.t('projects.fillAllFields'), 'warning');
        return;
    }

    try {
        await api.addProject({ name, description, deadline: deadline || null, team, status: 'planowany' as const });
        showAlert('Projekt został pomyślnie utworzony!', 'success');
        setTimeout(() => {
            window.location.href = '/all-projects';
        }, 1500);

    } catch (error: any) {
        showAlert(`${i18next.t('projects.errorSave')}: ${error.message}`, 'danger');
    }
}

// --- Główna funkcja renderująca widok ---
export async function renderCreateProjectView(container: HTMLElement) {
    let users: User[] = [];

    try {
        users = await api.getUsers();
    } catch {
        showAlert('Nie udało się załadować listy użytkowników.', 'danger');
        container.innerHTML = `<p class="text-danger">Nie udało się załadować danych. Odśwież stronę.</p>`;
        return;
    }

    const userOptions = users.map(user => `
        <label class="multiselect-option">
            <input type="checkbox" value="${user._id}" id="user-${user._id}">
            <span>${user.imie} ${user.nazwisko}</span>
        </label>
    `).join('');

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4 heading-btn-mobile">
            <h2 class="mb-0">${i18next.t('projects.createProjectTitle')}</h2>
            <a href="/all-projects" class="btn btn-secondary"><i class="fa-solid fa-arrow-left me-2"></i>${i18next.t('projectview.backButton')}</a>
        </div>
        <form id="project-form" class="card p-3 mb-4">
            <div class="mb-3">
                <label for="project-name" class="form-label">${i18next.t('projects.projectName')}</label>
                <input id="project-name" type="text" class="form-control" required />
            </div>
            <div class="mb-3">
                <label for="project-description" class="form-label">${i18next.t('projects.projectDescription')}</label>
                <textarea id="project-description" class="form-control" rows="3" required></textarea>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="project-deadline" class="form-label">${i18next.t('projects.deadline')}</label>
                    <input id="project-deadline" type="date" class="form-control">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">${i18next.t('projects.assignTeam')}</label>
                    <div class="custom-multiselect" id="project-team">
                        <div class="multiselect-input">
                            <div class="multiselect-selected d-flex flex-wrap gap-2"></div>
                        </div>
                        <div class="multiselect-dropdown">${userOptions}</div>
                    </div>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">${i18next.t('projects.save')}</button>
        </form>
    `;

    container.querySelector('#project-form')?.addEventListener('submit', (e) => handleFormSubmit(e));
    setupCustomMultiselect();
}
