import i18next from '../i18n'; 
type AlertType = 'success' | 'danger' | 'warning' | 'info';
export function showAlert(message: string, type: AlertType = 'info', duration: number = 3000) {
    const container = document.querySelector('#alert-container');
    if (!container) {
        console.error('Alert container not found!');
        return;
    }

    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    container.appendChild(alertElement);

    setTimeout(() => {
        alertElement.classList.remove('show');
        alertElement.addEventListener('transitionend', () => alertElement.remove());
    }, duration);
}

/**
 * @param message - Wiadomość do wyświetlenia w oknie dialogowym.
 * @param confirmText - Tekst na przycisku potwierdzenia.
 * @param cancelText - Tekst na przycisku anulowania.
 * @param title - Opcjonalny tytuł okna.
 * @returns Promise<boolean>
 */
export function showConfirm(
    message: string, 
    confirmText: string = 'OK', 
    cancelText: string = 'Anuluj',
    title: string = i18next.t('actions.confirmTitle') 
): Promise<boolean> {
    return new Promise(resolve => {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'confirm-container-dynamic';
        modalContainer.className = 'position-fixed top-0 start-0 w-100 h-100';
        modalContainer.style.zIndex = '99999';
        
        modalContainer.innerHTML = `
            <div class="modal-backdrop fade show"></div>
            <div class="modal fade show" tabindex="-1" style="display: block;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title text-danger">${title}</h5> <!-- 3. UŻYJ PARAMETRU TUTAJ -->
                            <button type="button" class="btn-close" data-action="cancel"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                            <button type="button" class="btn btn-danger" data-action="confirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);

        const confirmButton = modalContainer.querySelector('[data-action="confirm"]');
        const cancelButtons = modalContainer.querySelectorAll('[data-action="cancel"]');

        const cleanup = () => {
            document.body.removeChild(modalContainer);
        };

        confirmButton?.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });

        cancelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
        });
    });
}
