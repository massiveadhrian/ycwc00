// ============================================
// DHRYZN — Main Application Entry
// ============================================

import { Store } from './store.js';
import { Router } from './router.js';
import { renderSidebar } from './components/sidebar.js';
import { renderLandingPage } from './components/landing.js';
import { renderDashboard } from './components/dashboard.js';
import { renderSubjects } from './components/subjects.js';
import { renderSubjectDetail } from './components/subjectDetail.js';
import { renderQuiz } from './components/quiz.js';
import { renderExplainTopic } from './components/explainTopic.js';
import { renderExam } from './components/exam.js';
import { renderProgress } from './components/progress.js';
import { renderHistory } from './components/history.js';
import { renderSettings } from './components/settings.js';
import { setLanguage } from './utils/i18n.js';
import { applyAccentColor, applyTheme } from './utils/theme.js';

// Initialize store
const store = new Store();
window.__dhryzn_store__ = store;

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const appLayout = document.getElementById('app');
  const mainContent = document.getElementById('main-content');

  // Apply saved settings on startup
  const settings = store.get('settings');
  if (settings) {
    applyTheme(settings.theme || 'dark');
    if (settings.accentColor && settings.accentColor !== '#7C5CFF') {
      applyAccentColor(settings.accentColor);
    }
    setLanguage(settings.language || 'English');
  }

  // Initialize router
  const router = new Router(mainContent);

  // Render sidebar
  renderSidebar(appLayout, router, store);

  // Expose globally so settings and auth can re-render it
  window.__dhryzn__ = { renderSidebar, store, router };

  // Register routes
  router.register('landing', (el, params) => renderLandingPage(el, params, store, router));
  router.register('dashboard', (el, params) => renderDashboard(el, params, store, router));
  router.register('subjects', (el, params) => renderSubjects(el, params, store, router));
  router.register('subject', (el, params) => renderSubjectDetail(el, params, store, router));
  router.register('quiz', (el, params) => renderQuiz(el, params, store, router));
  router.register('explain', (el, params) => renderExplainTopic(el, params, store, router));
  router.register('exam', (el, params) => renderExam(el, params, store, router));
  router.register('progress', (el, params) => renderProgress(el, params, store, router));
  router.register('history', (el, params) => renderHistory(el, params, store, router));
  router.register('settings', (el, params) => renderSettings(el, params, store, router));

  // Start router
  router.start();
});
