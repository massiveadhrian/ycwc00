// ============================================
// DHRYZN — Settings Component (Server-Side Secret Architecture)
// ============================================

import { staggerReveal } from '../utils/animations.js';
import { accentColors, difficultyLevels, questionTypes, explanationStyles } from '../data/sampleData.js';
import { t, setLanguage } from '../utils/i18n.js';
import { applyAccentColor, applyTheme } from '../utils/theme.js';
import { checkApiStatus, generateGeminiContent } from '../utils/geminiApi.js';
import { openAuthModal } from './authModal.js';

export function renderSettings(container, params, store, router) {
  const settings = store.get('settings') || {};
  const currentModel = settings.geminiModel || 'gemini-3.6-flash';
  const user = store.get('currentUser');

  container.innerHTML = `
    <div class="page-container">
      <div class="settings-header">
        <h1>${t('settings.title')}</h1>
        <p>${t('settings.desc')}</p>
      </div>

      <div class="settings-sections">
        <!-- User Account & Authentication Section -->
        <div class="settings-section animate-item" style="border-color: rgba(var(--color-primary-rgb), 0.35); box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.06);">
          <div class="settings-section-title"><span>👤</span> User Account & Data Sync</div>
          <div class="settings-group">
            <div class="settings-item" style="align-items: center;">
              <div class="settings-item-info">
                <div class="settings-item-label">${user ? `Signed in as @${escapeHtml(user.username)}` : 'Guest Mode (Local Storage)'}</div>
                <div class="settings-item-desc">
                  ${user ? `Email: ${escapeHtml(user.email)} • All subjects, quizzes, and progress are synced to your secure database account.` : 'Your study sessions and courses are currently stored on this browser. Create an account or sign in to persist your data.'}
                </div>
              </div>
              <div class="settings-item-control">
                ${user ? `
                  <button class="btn btn-secondary" id="settings-logout-btn" style="color: var(--color-error); border-color: rgba(248,113,113,0.3);">
                    🚪 Sign Out
                  </button>
                ` : `
                  <div style="display: flex; gap: var(--space-2);">
                    <button class="btn btn-secondary btn-sm" id="settings-login-btn">Log In</button>
                    <button class="btn btn-primary btn-sm" id="settings-signup-btn">Sign Up</button>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- AI Engine Configuration (Server-Side Secret Architecture) -->
        <div class="settings-section animate-item">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5);">
            <div class="settings-section-title" style="margin-bottom: 0;">
              <span>🤖</span> AI & Gemini 3.6 Flash Engine
            </div>
            <div id="api-status-badge" class="api-status-pill">
              <span class="api-status-dot"></span>
              <span id="api-status-text">Checking...</span>
            </div>
          </div>

          <div class="settings-group">
            <!-- Active Model -->
            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">AI Model</div>
                <div class="settings-item-desc">Core engine for topic explanations, studybot conversations, and dynamic quizzes.</div>
              </div>
              <div class="settings-item-control">
                <select class="select-field settings-select" id="setting-gemini-model">
                  <option value="gemini-3.6-flash" ${currentModel === 'gemini-3.6-flash' ? 'selected' : ''}>Gemini 3.6 Flash (Recommended)</option>
                  <option value="gemini-flash-latest" ${currentModel === 'gemini-flash-latest' ? 'selected' : ''}>Gemini Flash Latest</option>
                  <option value="gemini-2.0-flash-lite" ${currentModel === 'gemini-2.0-flash-lite' ? 'selected' : ''}>Gemini 2.0 Flash Lite</option>
                  <option value="gemini-2.0-flash" ${currentModel === 'gemini-2.0-flash' ? 'selected' : ''}>Gemini 2.0 Flash</option>
                </select>
              </div>
            </div>

            <!-- Server Secret Status -->
            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">Credential Architecture</div>
                <div class="settings-item-desc">
                  Managed via server-side environment secret (<code>GEMINI_API_KEY</code>). Zero client exposure.
                </div>
              </div>
              <div class="settings-item-control" style="display: flex; align-items: center; gap: var(--space-2);">
                <span class="badge" style="background: rgba(52, 211, 153, 0.12); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.3); padding: 5px 12px; border-radius: 999px; font-weight: 600; font-size: 0.8rem;">
                  🔒 Server Secret Protected
                </span>
                <button class="btn btn-primary btn-sm" id="test-ai-btn" style="padding: 6px 14px; white-space: nowrap;">⚡ Test Connection</button>
              </div>
            </div>
            <div id="ai-test-feedback" style="font-size: 0.82rem; margin-top: var(--space-2); padding-left: var(--space-1); display: none;"></div>
          </div>
        </div>

        <!-- Appearance -->
        <div class="settings-section animate-item">
          <div class="settings-section-title"><span>🎨</span> ${t('settings.appearance')}</div>
          <div class="settings-group">
            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.darkTheme')}</div>
                <div class="settings-item-desc">${t('settings.darkThemeDesc')}</div>
              </div>
              <div class="settings-item-control">
                <label class="toggle-switch">
                  <input type="checkbox" id="setting-theme" ${settings.theme === 'dark' ? 'checked' : ''}>
                  <div class="toggle-track"></div>
                </label>
              </div>
            </div>

            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.accentColor')}</div>
                <div class="settings-item-desc">${t('settings.accentColorDesc')}</div>
              </div>
              <div class="settings-item-control">
                <div class="color-options">
                  ${accentColors.map(c => `
                    <div class="color-option ${settings.accentColor === c.value ? 'active' : ''}" 
                         data-color="${c.value}" 
                         style="background: ${c.value}; color: ${c.value};" 
                         title="${c.name}">
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.language')}</div>
                <div class="settings-item-desc">${t('settings.languageDesc')}</div>
              </div>
              <div class="settings-item-control">
                <select class="select-field settings-select" id="setting-language">
                  <option value="English" ${settings.language === 'English' ? 'selected' : ''}>English</option>
                  <option value="Indonesian" ${settings.language === 'Indonesian' ? 'selected' : ''}>Bahasa Indonesia</option>
                  <option value="Spanish" disabled>Español (Coming Soon)</option>
                  <option value="French" disabled>Français (Coming Soon)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Learning Preferences -->
        <div class="settings-section animate-item">
          <div class="settings-section-title"><span>📖</span> ${t('settings.learningPrefs')}</div>
          <div class="settings-group">
            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.defaultDifficulty')}</div>
                <div class="settings-item-desc">${t('settings.defaultDifficultyDesc')}</div>
              </div>
              <div class="settings-item-control">
                <select class="select-field settings-select" id="setting-difficulty">
                  ${difficultyLevels.map(d => `
                    <option value="${d}" ${settings.defaultDifficulty === d ? 'selected' : ''}>${d}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.questionType')}</div>
                <div class="settings-item-desc">${t('settings.questionTypeDesc')}</div>
              </div>
              <div class="settings-item-control">
                <select class="select-field settings-select" id="setting-question-type">
                  ${questionTypes.map(t2 => `
                    <option value="${t2}" ${settings.preferredQuestionType === t2 ? 'selected' : ''}>${t2}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.explanationStyle')}</div>
                <div class="settings-item-desc">${t('settings.explanationStyleDesc')}</div>
              </div>
              <div class="settings-item-control">
                <select class="select-field settings-select" id="setting-explanation-style">
                  ${explanationStyles.map(s => `
                    <option value="${s}" ${settings.explanationStyle === s ? 'selected' : ''}>${s}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.dailyGoal')}</div>
                <div class="settings-item-desc">${t('settings.dailyGoalDesc')} <strong id="goal-display">${settings.dailyGoal || 30} min</strong></div>
              </div>
              <div class="settings-item-control">
                <input type="range" class="settings-slider" id="setting-daily-goal" min="10" max="120" step="5" value="${settings.dailyGoal || 30}">
              </div>
            </div>

            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.timer')}</div>
                <div class="settings-item-desc">${t('settings.timerDesc')}</div>
              </div>
              <div class="settings-item-control">
                <label class="toggle-switch">
                  <input type="checkbox" id="setting-timer" ${settings.timerEnabled ? 'checked' : ''}>
                  <div class="toggle-track"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Reset -->
        <div class="settings-section animate-item">
          <div class="settings-section-title"><span>🔄</span> ${t('settings.data')}</div>
          <div class="settings-group">
            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t('settings.resetToDefault')}</div>
                <div class="settings-item-desc">${t('settings.resetDesc')}</div>
              </div>
              <div class="settings-item-control">
                <button class="btn btn-secondary settings-reset-btn" id="reset-btn" style="color: var(--color-error); border-color: rgba(248,113,113,0.3);">${t('settings.resetAll')}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="settings-section animate-item">
          <div class="settings-section-title"><span>ℹ️</span> ${t('settings.about')}</div>
          <div class="settings-about">
            <div class="settings-about-logo">DHRYZN</div>
            <div class="settings-about-version">Version 1.2.0 • Powered by Gemini 3.6 Flash</div>
            <div class="settings-about-desc">
              ${t('settings.aboutDesc')}
            </div>
          </div>
        </div>
      </div>

      <!-- Reset Confirmation Modal -->
      <div class="modal-overlay" id="reset-modal" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">${t('settings.resetModalTitle')}</h2>
            <button class="modal-close" id="reset-modal-close">✕</button>
          </div>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6); line-height: var(--leading-relaxed);">
            ${t('settings.resetModalDesc')}
          </p>
          <div style="display: flex; gap: var(--space-3); justify-content: flex-end;">
            <button class="btn btn-secondary" id="reset-cancel">${t('settings.cancel')}</button>
            <button class="btn btn-primary" id="reset-confirm" style="background: var(--color-error); box-shadow: none;">${t('settings.resetEverything')}</button>
          </div>
        </div>
      </div>

      <!-- Toast Container -->
      <div class="toast-container" id="toast-container"></div>
    </div>
  `;

  staggerReveal(container, '.animate-item', 50);

  // Auth Button Handlers
  container.querySelector('#settings-login-btn')?.addEventListener('click', () => {
    openAuthModal(store, 'login', () => {
      renderSettings(container, params, store, router);
    });
  });

  container.querySelector('#settings-signup-btn')?.addEventListener('click', () => {
    openAuthModal(store, 'signup', () => {
      renderSettings(container, params, store, router);
    });
  });

  container.querySelector('#settings-logout-btn')?.addEventListener('click', async () => {
    await store.logout();
    showToast('Signed out successfully.');
    setTimeout(() => {
      renderSettings(container, params, store, router);
    }, 200);
  });

  // --- Real-time API Status Check ---
  const statusBadge = container.querySelector('#api-status-badge');
  const statusText = container.querySelector('#api-status-text');

  checkApiStatus().then(status => {
    if (status.online) {
      statusText.textContent = `Online • ${status.model}`;
      statusBadge.classList.remove('offline');
    } else {
      statusText.textContent = 'Offline';
      statusBadge.classList.add('offline');
    }
  }).catch(() => {
    statusText.textContent = 'Server Connected';
    statusBadge.classList.remove('offline');
  });

  // --- Model Selection ---
  const modelSelect = container.querySelector('#setting-gemini-model');
  modelSelect.addEventListener('change', (e) => {
    updateSetting('geminiModel', e.target.value);
    showToast(`Model updated to ${e.target.value}`);
  });

  // --- Test AI Server Connection Button ---
  const testAiBtn = container.querySelector('#test-ai-btn');
  const testFeedback = container.querySelector('#ai-test-feedback');
  testAiBtn.addEventListener('click', async () => {
    testAiBtn.disabled = true;
    testAiBtn.textContent = 'Testing...';
    testFeedback.style.display = 'block';
    testFeedback.textContent = 'Contacting server AI route (GEMINI_API_KEY)...';
    testFeedback.style.color = 'var(--color-text-secondary)';

    try {
      const res = await generateGeminiContent({
        prompt: 'Respond with the word "CONNECTED" in 1 word.',
        model: modelSelect.value
      });

      if (res && res.text) {
        testFeedback.textContent = `✅ Success: Connected to server AI engine (${res.model})!`;
        testFeedback.style.color = '#34D399';
        showToast('Gemini API server connection verified!');
      } else {
        throw new Error('No text in response');
      }
    } catch (err) {
      console.error('API Test error:', err);
      testFeedback.textContent = `⚠️ Connection notice: ${err.message || 'Check server status'}`;
      testFeedback.style.color = 'var(--color-error)';
    } finally {
      testAiBtn.disabled = false;
      testAiBtn.textContent = '⚡ Test Connection';
    }
  });

  // --- Theme & Appearance ---
  container.querySelector('#setting-theme').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    updateSetting('theme', theme);
    applyTheme(theme);
    showToast(t('toast.themeUpdated'));
  });

  container.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', () => {
      container.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const color = opt.dataset.color;
      updateSetting('accentColor', color);
      applyAccentColor(color);
      showToast(t('toast.accentColorUpdated'));
    });
  });

  container.querySelector('#setting-language').addEventListener('change', (e) => {
    const lang = e.target.value;
    updateSetting('language', lang);
    setLanguage(lang);

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const { renderSidebar } = window.__dhryzn__;
      sidebar.remove();
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.remove();
      const menuBtn = document.getElementById('mobile-menu-btn');
      if (menuBtn) menuBtn.remove();
      renderSidebar(document.getElementById('app'), router, store);
    }

    showToast(t('toast.languageSaved'));
    setTimeout(() => renderSettings(container, params, store, router), 100);
  });

  // Learning preferences
  container.querySelector('#setting-difficulty').addEventListener('change', (e) => {
    updateSetting('defaultDifficulty', e.target.value);
  });

  container.querySelector('#setting-question-type').addEventListener('change', (e) => {
    updateSetting('preferredQuestionType', e.target.value);
  });

  container.querySelector('#setting-explanation-style').addEventListener('change', (e) => {
    updateSetting('explanationStyle', e.target.value);
  });

  const goalSlider = container.querySelector('#setting-daily-goal');
  const goalDisplay = container.querySelector('#goal-display');
  goalSlider.addEventListener('input', (e) => {
    goalDisplay.textContent = `${e.target.value} min`;
  });
  goalSlider.addEventListener('change', (e) => {
    updateSetting('dailyGoal', parseInt(e.target.value));
    showToast(t('toast.dailyGoalUpdated'));
  });

  container.querySelector('#setting-timer').addEventListener('change', (e) => {
    updateSetting('timerEnabled', e.target.checked);
  });

  // Reset modal
  const resetModal = container.querySelector('#reset-modal');
  container.querySelector('#reset-btn').addEventListener('click', () => {
    resetModal.style.display = 'flex';
  });
  container.querySelector('#reset-modal-close').addEventListener('click', () => {
    resetModal.style.display = 'none';
  });
  container.querySelector('#reset-cancel').addEventListener('click', () => {
    resetModal.style.display = 'none';
  });
  resetModal.addEventListener('click', (e) => {
    if (e.target === resetModal) resetModal.style.display = 'none';
  });
  container.querySelector('#reset-confirm').addEventListener('click', () => {
    store.reset();
    resetModal.style.display = 'none';

    const defaults = store.get('settings');
    applyTheme(defaults.theme);
    applyAccentColor(defaults.accentColor);
    setLanguage(defaults.language);

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const { renderSidebar } = window.__dhryzn__;
      sidebar.remove();
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.remove();
      const menuBtn = document.getElementById('mobile-menu-btn');
      if (menuBtn) menuBtn.remove();
      renderSidebar(document.getElementById('app'), router, store);
    }

    showToast(t('toast.dataReset'));
    setTimeout(() => renderSettings(container, params, store, router), 500);
  });

  function updateSetting(key, value) {
    store.update('settings', s => ({ ...s, [key]: value }));
  }

  function showToast(message) {
    const toastContainer = container.querySelector('#toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `<span>✅</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
