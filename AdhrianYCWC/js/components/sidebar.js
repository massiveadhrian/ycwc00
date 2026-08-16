// ============================================
// DHRYZN — Sidebar Component with User Account Profile
// ============================================

import { t } from '../utils/i18n.js';
import { openAuthModal } from './authModal.js';

export function renderSidebar(container, router, store = null) {
  // If store wasn't passed directly, check window global store if available
  const activeStore = store || window.__dhryzn_store__;

  const navItems = [
    { id: 'dashboard', icon: '🏠', labelKey: 'sidebar.dashboard', route: 'dashboard' },
    { id: 'subjects', icon: '📚', labelKey: 'sidebar.subjects', route: 'subjects' },
    { id: 'progress', icon: '📈', labelKey: 'sidebar.progress', route: 'progress' },
    { id: 'history', icon: '🕒', labelKey: 'sidebar.history', route: 'history' },
    { id: 'settings', icon: '⚙️', labelKey: 'sidebar.settings', route: 'settings' }
  ];

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  function buildUserSection() {
    const user = activeStore ? activeStore.get('currentUser') : null;
    if (user) {
      const initial = (user.username || 'U').charAt(0).toUpperCase();
      return `
        <div class="sidebar-user-card" id="sidebar-user-profile">
          <div class="sidebar-user-avatar">${initial}</div>
          <div class="sidebar-user-details">
            <div class="sidebar-username">${user.username}</div>
            <div class="sidebar-user-status">● Logged In</div>
          </div>
          <button class="sidebar-logout-btn" id="sidebar-logout-btn" title="Log Out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      `;
    }
    return `
      <div class="sidebar-guest-card">
        <button class="sidebar-auth-btn" id="sidebar-auth-btn">
          <span class="auth-btn-icon">👤</span>
          <span>Sign In / Sign Up</span>
        </button>
      </div>
    `;
  }

  sidebar.innerHTML = `
    <div class="sidebar-brand" id="sidebar-brand-link" style="cursor: pointer;" title="Back to Home">
      <div class="sidebar-logo">D</div>
      <span class="sidebar-brand-text">DHRYZN</span>
    </div>
    <nav class="sidebar-nav">
      ${navItems.map(item => `
        <div class="sidebar-nav-item${item.route === 'dashboard' ? ' active' : ''}" data-route="${item.route}" id="nav-${item.id}">
          <span class="sidebar-nav-icon">${item.icon}</span>
          <span class="sidebar-nav-label">${t(item.labelKey)}</span>
        </div>
      `).join('')}
    </nav>
    <div class="sidebar-account-section" id="sidebar-account-section">
      ${buildUserSection()}
    </div>
    <div class="sidebar-footer">
      <p class="sidebar-footer-text">${t('sidebar.footer')}</p>
    </div>
  `;

  // Brand click handler -> Home
  sidebar.querySelector('#sidebar-brand-link')?.addEventListener('click', () => {
    router.navigate('landing');
    sidebar.classList.remove('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.remove('visible');
  });

  // Nav click handlers
  sidebar.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const route = item.dataset.route;
      router.navigate(route);

      // Close mobile menu
      sidebar.classList.remove('open');
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.classList.remove('visible');
    });
  });

  // Attach User Section handlers
  function attachAccountEvents() {
    const authBtn = sidebar.querySelector('#sidebar-auth-btn');
    if (authBtn && activeStore) {
      authBtn.addEventListener('click', () => {
        openAuthModal(activeStore, 'login', () => {
          updateUserSection();
          router.navigate(router.getCurrentRoute() || 'dashboard');
        });
      });
    }

    const logoutBtn = sidebar.querySelector('#sidebar-logout-btn');
    if (logoutBtn && activeStore) {
      logoutBtn.addEventListener('click', async () => {
        await activeStore.logout();
        updateUserSection();
        router.navigate('dashboard');
      });
    }
  }

  function updateUserSection() {
    const accountSec = sidebar.querySelector('#sidebar-account-section');
    if (accountSec) {
      accountSec.innerHTML = buildUserSection();
      attachAccountEvents();
    }
  }

  attachAccountEvents();

  // Listen to auth changes in store to keep sidebar in sync
  if (activeStore) {
    activeStore.on('auth', () => {
      updateUserSection();
    });
  }

  container.appendChild(sidebar);

  // Mobile overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });
  container.appendChild(overlay);

  // Mobile menu button
  const menuBtn = document.createElement('button');
  menuBtn.className = 'mobile-menu-btn';
  menuBtn.id = 'mobile-menu-btn';
  menuBtn.innerHTML = '☰';
  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  });
  container.appendChild(menuBtn);
}
