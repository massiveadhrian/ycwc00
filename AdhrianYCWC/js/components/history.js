// ============================================
// DHRYZN — History Component
// ============================================

import { staggerReveal } from '../utils/animations.js';
import { t } from '../utils/i18n.js';

export function renderHistory(container, params, store, router) {
  let activeTab = 'quiz';
  let searchQuery = '';
  let filterSubject = '';

  function render() {
    const quizHistory = store.get('quizHistory') || [];
    const examHistory = store.get('examHistory') || [];
    const items = activeTab === 'quiz' ? quizHistory : examHistory;

    // Apply filters
    let filtered = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.topic.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q)
      );
    }
    if (filterSubject) {
      filtered = filtered.filter(item => item.subject === filterSubject);
    }

    // Get unique subjects for filter
    const allSubjects = [...new Set([...quizHistory, ...examHistory].map(i => i.subject))];

    container.innerHTML = `
      <div class="page-container">
        <div class="history-header">
          <h1>${t('history.title')}</h1>
        </div>

        <!-- Tabs -->
        <div class="history-tabs">
          <div class="tab-bar">
            <div class="tab-item ${activeTab === 'quiz' ? 'active' : ''}" data-tab="quiz">${t('history.quizHistory')}</div>
            <div class="tab-item ${activeTab === 'exam' ? 'active' : ''}" data-tab="exam">${t('history.examHistory')}</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="history-filters">
          <div class="history-search">
            <span class="history-search-icon">🔍</span>
            <input type="text" class="input-field" id="history-search" placeholder="${t('history.searchPlaceholder')}" value="${searchQuery}">
          </div>
          <select class="select-field history-filter-select" id="history-filter-subject">
            <option value="">${t('history.allSubjects')}</option>
            ${allSubjects.map(s => `<option value="${s}" ${filterSubject === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>

        <!-- List -->
        <div class="history-list" id="history-list">
          ${filtered.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">${activeTab === 'quiz' ? '📝' : '🎯'}</div>
              <h2 class="empty-state-title">${activeTab === 'quiz' ? t('history.noQuizzes') : t('history.noExams')}</h2>
              <p class="empty-state-text">${searchQuery || filterSubject ? t('history.noResults') : (activeTab === 'quiz' ? t('history.startQuiz') : t('history.startExam'))}</p>
              ${!searchQuery && !filterSubject ? `
                <button class="btn btn-primary" style="margin-top: var(--space-5);" id="history-start-btn">
                  ${activeTab === 'quiz' ? t('history.generateQuiz') : t('history.startPracticeExam')}
                </button>
              ` : ''}
            </div>
          ` : filtered.map((item, index) => `
            <div class="history-card animate-item" data-id="${item.id}" style="animation-delay: ${index * 40}ms;">
              <div class="history-card-icon ${item.type}">
                ${item.type === 'quiz' ? '📝' : '🎯'}
              </div>
              <div class="history-card-info">
                ${item.subject && item.subject !== item.topic ? `<div class="history-card-subject">${item.subject}</div>` : ''}
                <div class="history-card-title">${item.topic}</div>
                <div class="history-card-meta">
                  <span>📅 ${formatDate(item.date)}</span>
                  <span>⏱ ${item.duration}</span>
                  <span>📊 ${item.correct}/${item.total} ${t('history.correct')}</span>
                  <span>🎯 ${item.score}% ${t('history.accuracy')}</span>
                </div>
              </div>
              <div class="history-card-score ${item.score >= 80 ? 'high' : item.score >= 60 ? 'medium' : 'low'}">
                ${item.score}%
              </div>
              <div class="history-card-actions">
                <button class="btn btn-ghost btn-icon retake-btn" data-id="${item.id}" title="Retake">🔄</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    staggerReveal(container, '.animate-item', 40);

    // Tab switching
    container.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        render();
      });
    });

    // Search
    const searchInput = container.querySelector('#history-search');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        render();
      }, 300);
    });

    // Filter
    container.querySelector('#history-filter-subject').addEventListener('change', (e) => {
      filterSubject = e.target.value;
      render();
    });

    // Retake buttons
    container.querySelectorAll('.retake-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        router.navigate(activeTab === 'quiz' ? 'quiz' : 'exam');
      });
    });

    // Start button in empty state
    const startBtn = container.querySelector('#history-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        router.navigate(activeTab === 'quiz' ? 'quiz' : 'exam');
      });
    }

    // Card click → could open detail
    container.querySelectorAll('.history-card').forEach(card => {
      card.addEventListener('click', () => {
        // For now, just highlight
        card.style.borderColor = 'var(--color-primary)';
        setTimeout(() => {
          card.style.borderColor = '';
        }, 800);
      });
    });
  }

  render();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diff === 0) return t('date.today');
  if (diff === 1) return t('date.yesterday');
  if (diff < 7) return `${diff} ${t('date.daysAgo')}`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
