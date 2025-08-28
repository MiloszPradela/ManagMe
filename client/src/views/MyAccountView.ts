import { api } from '../services/ApiService';
import i18next from '../i18n';
import { showAlert, showConfirm } from '../services/AlertService';
import { permissionService, ROLES } from '../services/PermissionService';

// === EDYCJA PROFILU ===
async function renderMyAccountProfile(container: HTMLElement) {
    container.innerHTML = `
        <h4>${i18next.t('account.editProfile')}</h4>
        <div class="row align-items-center">
            <div class="col-md-3 text-center mb-3 mb-md-0 d-flex flex-column gap-2 align-items-center">
                <img id="avatar-preview" src="https://via.placeholder.com/150" class="rounded-circle" alt="Avatar" style="width: 120px; height: 120px; object-fit: cover;">
                <label for="avatar-input" class="btn btn-secondary btn-sm mt-2">${i18next.t('account.changePicture')}</label>
                <input type="file" id="avatar-input" accept="image/*" style="display: none;">
            </div>
            <div class="col-md-9">
                <form id="account-form">
                    <div class="mb-3">
                        <label class="form-label">${i18next.t('account.firstName')}</label>
                        <input type="text" id="imie" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">${i18next.t('account.lastName')}</label>
                        <input type="text" id="nazwisko" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">E-mail</label>
                        <input type="email" id="login" class="form-control" disabled>
                    </div>
                     <div class="mb-3">
                        <label class="form-label">${i18next.t('account.role')}</label>
                        <input type="text" id="rola" class="form-control" disabled>
                    </div>
                    <button type="submit" class="btn btn-primary">${i18next.t('common.saveChanges')}</button>
                </form>
            </div>
        </div>`;
    
    const imieInput = container.querySelector<HTMLInputElement>('#imie')!;
    const nazwiskoInput = container.querySelector<HTMLInputElement>('#nazwisko')!;
    const loginInput = container.querySelector<HTMLInputElement>('#login')!;
    const rolaInput = container.querySelector<HTMLInputElement>('#rola')!;
    const avatarPreview = container.querySelector<HTMLImageElement>('#avatar-preview')!;
    const avatarInput = container.querySelector<HTMLInputElement>('#avatar-input')!;
    const form = container.querySelector<HTMLFormElement>('#account-form')!;

    try {
        const user = await api.getMe();
        imieInput.value = user.imie;
        nazwiskoInput.value = user.nazwisko || '';
        loginInput.value = user.login;
        rolaInput.value = user.rola;
        if (user.avatarUrl) {
            avatarPreview.src = `http://localhost:3000${user.avatarUrl}`;
        }
    } catch (error) {
        showAlert(i18next.t('account.errorLoadProfile'), 'danger');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.updateMyProfile({ imie: imieInput.value, nazwisko: nazwiskoInput.value });
            showAlert(i18next.t('account.updateSuccess'), 'success');
            setTimeout(() => location.reload(), 1500);
        } catch (error: any) {
            showAlert(`${i18next.t('account.updateError')}: ${error.message}`, 'danger');
        }
    });

    avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files?.[0];
        if (file) {
            try {
                await api.uploadAvatar(file);
                showAlert(i18next.t('account.avatarSuccess'), 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error: any) {
                showAlert(`${i18next.t('account.avatarError')}: ${error.message}`, 'danger');
            }
        }
    });
}

// ===  BEZPIECZEŃSTWO  ===
function renderMyAccountSecurity(container: HTMLElement) {
    container.innerHTML = `
        <h4>${i18next.t('account.security')}</h4>
        <hr>
        <h5>${i18next.t('account.changePassword')}</h5>
        <p class="text-muted">${i18next.t('account.passwordInfo')}</p>
        <div class="d-flex"><button id="change-password-btn" class="btn btn-secondary">${i18next.t('account.changePassword')}</button></div>
        <hr>
        <h5>${i18next.t('account.logout')}</h5>
        <p class="text-muted">${i18next.t('account.logoutInfo')}</p>
        <div class="d-flex"><button id="logout-btn" class="btn btn-warning">${i18next.t('account.logout')}</button></div>
        <hr>
        <div class="mt-4">
            <h5>${i18next.t('account.dangerZone')}</h5>
            <p class="text-muted">${i18next.t('account.deleteInfo')}</p>
            <button id="delete-account-btn" class="btn btn-danger">${i18next.t('account.deleteAccount')}</button>
        </div>`;

    container.querySelector('#change-password-btn')?.addEventListener('click', async () => {
        try {
            const user = await api.getMe();
            await api.forgotPassword(user.login);
            showAlert(i18next.t('account.passwordResetLinkSent'), 'info');
        } catch (error: any) {
            showAlert(`${i18next.t('account.passwordResetError')}: ${error.message}`, 'danger');
        }
    });
    
    container.querySelector('#logout-btn')?.addEventListener('click', async () => {
        const confirmed = await showConfirm(i18next.t('account.logoutConfirm'), i18next.t('actions.confirmLogout'), i18next.t('actions.cancelDelete'));
        if (confirmed) {
            showAlert(i18next.t('account.logoutSuccess'), 'success');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login';
            }, 1500);
        }
    });

    container.querySelector('#delete-account-btn')?.addEventListener('click', async () => {
        const confirmed = await showConfirm(i18next.t('account.deleteConfirm'), i18next.t('actions.confirmDeleteAccount'), i18next.t('actions.cancelDelete'));
        if (confirmed) {
            try {
                await api.deleteMe();
                showAlert(i18next.t('account.deleteSuccess'), 'warning');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '/login';
                }, 2000);
            } catch (error: any) {
                showAlert(`${i18next.t('account.deleteError')}: ${error.message}`, 'danger');
            }
        }
    });
}

// ===  ZARZĄDZANIE UŻYTKOWNIKAMI (ADMIN ===
async function renderUserManagement(container: HTMLElement) {
    container.innerHTML = `<h4>${i18next.t('account.userManagement')}</h4>`;
    
    try {
        const users = await api.getUsers();
        const userList = users.map(user => `
            <div class="d-flex justify-content-between align-items-center p-2 border-bottom gap-2 mobile-column">
                <span>${user.imie} ${user.nazwisko || ''} (${user.login})</span>
                <div class="d-flex align-items-center gap-2">
                    <select class="form-select form-select-sm" style="width: 150px;" data-userid="${user._id}" ${user.login === 'milosz.pradela1@gmail.com' ? 'disabled' : ''}>
                        ${Object.values(ROLES).map(role => `<option value="${role}" ${user.rola === role ? 'selected' : ''}>${role}</option>`).join('')}
                    </select>
                    <button class="btn btn-danger btn-sm delete-user-btn" data-userid="${user._id}" ${user.login === 'milosz.pradela1@gmail.com' ? 'disabled' : ''}>
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        container.innerHTML += `<div class="mt-3">${userList}</div>`;

        container.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const target = e.target as HTMLSelectElement;
                const userId = target.dataset.userid;
                const newRole = target.value;
                if (userId) {
                    try {
                        await api.updateUserRole(userId, newRole);
                        showAlert(i18next.t('account.roleUpdateSuccess'), 'success');
                    } catch (error: any) {
                        showAlert(`${i18next.t('account.roleUpdateError')}: ${error.message}`, 'danger');
                        try {
                            const originalUser = await api.getUserById(userId);
                            target.value = originalUser.rola;
                        } catch {}
                    }
                }
            });
        });

        container.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const targetButton = e.currentTarget as HTMLButtonElement;
                const userId = targetButton.dataset.userid;
                if (userId) {
                    const confirmed = await showConfirm(i18next.t('account.deleteUserConfirm'), i18next.t('actions.confirmDelete'), i18next.t('actions.cancelDelete'));
                    if (confirmed) {
                        try {
                            await api.deleteUser(userId);
                            showAlert(i18next.t('account.deleteUserSuccess'), 'success');
                            renderUserManagement(container); 
                        } catch (error: any) {
                            showAlert(`${i18next.t('account.deleteUserError')}: ${error.message}`, 'danger');
                        }
                    }
                }
            });
        });
    } catch (error) {
        container.innerHTML += `<p class="text-danger">${i18next.t('account.userLoadError')}</p>`;
    }
}

// ===  GŁÓWNA FUNKCJA WIDOKU "MOJE KONTO" ===

export async function renderMyAccountView(container: HTMLElement) {
    const isAdmin = permissionService.isAdmin();
    
    container.innerHTML = `
        <h2 class="mb-4">${i18next.t('navigation.myAccount')}</h2>
        <div class="row">
            <div class="col-md-3">
                <nav class="nav nav-pills flex-column gap-2">
                    <a class="btn btn-secondary" href="/my-account/profile">${i18next.t('account.editProfile')}</a>
                    <a class="btn btn-secondary" href="/my-account/security">${i18next.t('account.security')}</a>
                    ${isAdmin ? `<a class="btn btn-secondary" href="/my-account/manage-users">${i18next.t('account.userManagement')}</a>` : ''}
                </nav>
            </div>
            <div class="col-md-9">
                <div id="my-account-content" class="card p-3"></div>
            </div>
        </div>`;

    const accountContent = container.querySelector<HTMLDivElement>('#my-account-content')!;
    const currentPath = window.location.pathname;

    let activeSubView = 'profile';
    if (currentPath.includes('security')) activeSubView = 'security';
    if (isAdmin && currentPath.includes('manage-users')) activeSubView = 'manage-users';

    if (activeSubView === 'security') {
        renderMyAccountSecurity(accountContent);
    } else if (activeSubView === 'manage-users') {
        await renderUserManagement(accountContent);
    } else {
        await renderMyAccountProfile(accountContent);
    }

    container.querySelectorAll('.nav-pills a').forEach(linkEl => {
        const link = linkEl as HTMLAnchorElement;
        const linkSubView = link.href.substring(link.href.lastIndexOf('/') + 1);
        if (linkSubView === activeSubView) {
            link.classList.add('btn-primary');
            link.classList.remove('btn-secondary');
        } else {
            link.classList.remove( 'btn-primary');
            link.classList.add('btn-secondary');
        }
    });
}
