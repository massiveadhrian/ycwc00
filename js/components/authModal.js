// ============================================
// DHRYZN — Authentication Modal Component (Log In / Sign Up)
// ============================================

import { t } from '../utils/i18n.js';

export function openAuthModal(store, defaultMode = 'login', onSuccess = null) {
  // Remove existing modal if any
  const existing = document.getElementById('auth-modal-overlay');
  if (existing) existing.remove();

  let activeTab = defaultMode; // 'login' | 'signup'

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'auth-modal-overlay';

  function renderModalContent() {
    overlay.innerHTML = `
      <div class="modal auth-modal">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div class="sidebar-logo" style="width: 32px; height: 32px; font-size: 1rem;">D</div>
            <h2 class="modal-title" id="auth-modal-title">${activeTab === 'login' ? 'Sign In to DHRYZN' : 'Create an Account'}</h2>
          </div>
          <button class="modal-close" id="auth-modal-close" aria-label="Close">✕</button>
        </div>

        <!-- Auth Tabs -->
        <div class="auth-tabs">
          <button class="auth-tab-btn ${activeTab === 'login' ? 'active' : ''}" id="tab-login-btn">Log In</button>
          <button class="auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}" id="tab-signup-btn">Sign Up</button>
        </div>

        <div id="auth-feedback" class="auth-feedback" style="display: none;"></div>

        <form id="auth-form" autocomplete="on">
          ${activeTab === 'signup' ? `
            <div class="form-group" style="margin-bottom: var(--space-4);">
              <label class="form-label">Username</label>
              <input type="text" class="input-field" id="auth-username" placeholder="e.g., alex_learner" required autocomplete="username" minlength="3">
            </div>
          ` : ''}

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">${activeTab === 'signup' ? 'Email Address' : 'Username or Email'}</label>
            <input type="${activeTab === 'signup' ? 'email' : 'text'}" class="input-field" id="auth-identifier" placeholder="${activeTab === 'signup' ? 'alex@example.com' : 'Enter username or email'}" required autocomplete="${activeTab === 'signup' ? 'email' : 'username'}">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">Password</label>
            <div style="position: relative;">
              <input type="password" class="input-field" id="auth-password" placeholder="••••••••" required autocomplete="${activeTab === 'signup' ? 'new-password' : 'current-password'}" minlength="6" style="padding-right: 44px;">
              <button type="button" class="btn btn-ghost" id="toggle-auth-password" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); padding: 6px 10px; font-size: 0.85rem;" title="Show/Hide">👁️</button>
            </div>
          </div>

          ${activeTab === 'signup' ? `
            <div class="form-group" style="margin-bottom: var(--space-5);">
              <label class="form-label">Confirm Password</label>
              <input type="password" class="input-field" id="auth-confirm-password" placeholder="••••••••" required autocomplete="new-password" minlength="6">
            </div>
          ` : ''}

          <button type="submit" class="btn btn-primary btn-lg" id="auth-submit-btn" style="width: 100%; margin-top: var(--space-2);">
            ${activeTab === 'login' ? '🔑 Sign In' : '✨ Create Account'}
          </button>
        </form>

        <div class="auth-modal-footer">
          ${activeTab === 'login' ? `
            <p>Don't have an account yet? <a href="#" id="switch-to-signup" style="color: var(--color-primary-light); font-weight: 600;">Sign up for free</a></p>
          ` : `
            <p>Already have an account? <a href="#" id="switch-to-login" style="color: var(--color-primary-light); font-weight: 600;">Sign in</a></p>
          `}
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const closeBtn = overlay.querySelector('#auth-modal-close');
    const tabLogin = overlay.querySelector('#tab-login-btn');
    const tabSignup = overlay.querySelector('#tab-signup-btn');
    const switchSignup = overlay.querySelector('#switch-to-signup');
    const switchLogin = overlay.querySelector('#switch-to-login');
    const form = overlay.querySelector('#auth-form');
    const feedback = overlay.querySelector('#auth-feedback');
    const togglePass = overlay.querySelector('#toggle-auth-password');
    const passInput = overlay.querySelector('#auth-password');

    function closeModal() {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s ease';
      setTimeout(() => overlay.remove(), 200);
    }

    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    tabLogin?.addEventListener('click', () => {
      activeTab = 'login';
      renderModalContent();
    });

    tabSignup?.addEventListener('click', () => {
      activeTab = 'signup';
      renderModalContent();
    });

    switchSignup?.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = 'signup';
      renderModalContent();
    });

    switchLogin?.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = 'login';
      renderModalContent();
    });

    togglePass?.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePass.textContent = isPass ? '🔒' : '👁️';
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = overlay.querySelector('#auth-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';
      feedback.style.display = 'none';

      try {
        if (activeTab === 'signup') {
          const username = overlay.querySelector('#auth-username').value.trim();
          const email = overlay.querySelector('#auth-identifier').value.trim();
          const password = overlay.querySelector('#auth-password').value;
          const confirmPassword = overlay.querySelector('#auth-confirm-password').value;

          if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
          }

          const user = await store.signUp(username, email, password);
          closeModal();
          showAuthToast(`Welcome to DHRYZN, ${user.username}!`);
          if (onSuccess) onSuccess(user);
        } else {
          const identifier = overlay.querySelector('#auth-identifier').value.trim();
          const password = overlay.querySelector('#auth-password').value;

          const user = await store.login(identifier, password);
          closeModal();
          showAuthToast(`Welcome back, ${user.username}!`);
          if (onSuccess) onSuccess(user);
        }
      } catch (err) {
        feedback.textContent = err.message || 'Authentication error. Please try again.';
        feedback.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = activeTab === 'login' ? '🔑 Sign In' : '✨ Create Account';
      }
    });
  }

  renderModalContent();
  document.body.appendChild(overlay);
}

function showAuthToast(msg) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `<span>✨</span> <span>${msg}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
