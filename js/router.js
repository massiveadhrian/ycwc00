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

  getCurrentRoute() {
    const hash = window.location.hash.slice(1) || 'landing';
    return hash.split('/')[0];
  }

  handleRoute() {
    const rawHash = window.location.hash.slice(1);
    const hash = (!rawHash || rawHash === '' || rawHash === '/') ? 'landing' : rawHash;
    const [route, ...params] = hash.split('/');

    if (this.currentRoute === hash && this.contentEl.children.length > 0) return;
    this.currentRoute = hash;

    // Toggle landing mode on app container
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.classList.toggle('landing-mode', route === 'landing');
    }

    // Run cleanup for previous page
    if (this.currentCleanup && typeof this.currentCleanup === 'function') {
      this.currentCleanup();
    }

    const renderFn = this.routes[route] || this.routes['landing'] || this.routes['dashboard'];
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
      }, 120);
    }
  }

  navigate(path) {
    const rawHash = window.location.hash.slice(1);
    const currentHash = (!rawHash || rawHash === '' || rawHash === '/') ? 'landing' : rawHash;
    if (currentHash === path) {
      this.currentRoute = null;
      this.handleRoute();
    } else {
      window.location.hash = path;
    }
  }

  start() {
    this.handleRoute();
  }
}
