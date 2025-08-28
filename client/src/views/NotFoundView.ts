import i18next from '../i18n';

export function renderNotFoundView(container: HTMLElement) {
  container.innerHTML = `
  <div class="d-flex flex-column align-items-center justify-content-center text-center h-100">
    <h1 class="display-1 fw-bold">404</h1>
    <p class="fs-3">
      <span class="text-danger">${i18next.t('notFound.oops')}</span> ${i18next.t('notFound.pageNotFound')}
    </p>
    <p class="lead">${i18next.t('notFound.pageNotFoundInfo')}</p>
    <a href="/projects" class="btn btn-primary mt-3">
      <i class="fas fa-arrow-left me-2"></i>${i18next.t('notFound.backToHome')}
    </a>
  </div>
  `;
}
