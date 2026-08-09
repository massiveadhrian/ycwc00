// ============================================
// DHRYZN — SPA Router
// ============================================

export class Router {
  constructor(contentEl) {
    this.routes = {};
    this.contentEl = contentEl;
    this.currentRoute = null;
    this.currentCleanup = null;

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  register(path, renderFn) {
    this.routes[path] = renderFn;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const [route, ...params] = hash.split('/');

    if (this.currentRoute === hash) return;
    this.currentRoute = hash;

    // Run cleanup for previous page
    if (this.currentCleanup && typeof this.currentCleanup === 'function') {
      this.currentCleanup();
    }

    const renderFn = this.routes[route];
    if (renderFn) {
      // Page transition
      this.contentEl.classList.remove('page-enter');
      this.contentEl.classList.add('page-exit');

      setTimeout(() => {
        this.contentEl.innerHTML = '';
        this.currentCleanup = renderFn(this.contentEl, params) || null;
        this.contentEl.classList.remove('page-exit');
        this.contentEl.classList.add('page-enter');

        // Update sidebar active state
        document.querySelectorAll('.sidebar-nav-item').forEach(item => {
          item.classList.toggle('active', item.dataset.route === route);
        });

        // Scroll to top
        this.contentEl.scrollTop = 0;
        window.scrollTo(0, 0);
      }, 150);
    }
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    this.handleRoute();
  }
}
