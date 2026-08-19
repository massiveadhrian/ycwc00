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
        (item.topic && item.topic.toLowerCase().includes(q)) ||
        (item.subject && item.subject.toLowerCase().includes(q))
      );
    }
    if (filterSubject) {
      filtered = filtered.filter(item => item.subject === filterSubject);
    }

    // Get unique subjects for filter
    const allSubjects = [...new Set([...quizHistory, ...examHistory].map(i => i.subject).filter(Boolean))];

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
            <input type="text" class="input-field" id="history-search" placeholder="${t('history.searchPlaceholder')}" value="${escapeHtml(searchQuery)}">
          </div>
          <select class="select-field history-filter-select" id="history-filter-subject">
            <option value="">${t('history.allSubjects')}</option>
            ${allSubjects.map(s => `<option value="${escapeHtml(s)}" ${filterSubject === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
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
            <div class="history-card animate-item" data-id="${escapeHtml(String(item.id))}" style="animation-delay: ${index * 40}ms;">
              <div class="history-card-icon ${item.type}">
                ${item.type === 'quiz' ? '📝' : '🎯'}
              </div>
              <div class="history-card-info">
                ${item.subject && item.subject !== item.topic ? `<div class="history-card-subject">${escapeHtml(item.subject)}</div>` : ''}
                <div class="history-card-title">${escapeHtml(item.topic || 'Untitled Attempt')}</div>
                <div class="history-card-meta">
                  <span>📅 ${formatDate(item.date)}</span>
                  <span>⏱ ${escapeHtml(item.duration || '')}</span>
                  <span>📊 ${item.correct || 0}/${item.total || 0} ${t('history.correct')}</span>
                  <span>🎯 ${item.score || 0}% ${t('history.accuracy')}</span>
                </div>
              </div>
              <div class="history-card-score ${(item.score || 0) >= 80 ? 'high' : (item.score || 0) >= 60 ? 'medium' : 'low'}">
                ${item.score || 0}%
              </div>
              <div class="history-card-actions">
                <button class="btn btn-ghost btn-icon retake-btn" data-id="${escapeHtml(String(item.id))}" title="Retake">🔄</button>
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
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchQuery = e.target.value;
          render();
        }, 300);
      });
    }

    // Filter
    const filterSelect = container.querySelector('#history-filter-subject');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        filterSubject = e.target.value;
        render();
      });
    }

    // Start button in empty state
    const startBtn = container.querySelector('#history-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        router.navigate(activeTab === 'quiz' ? 'quiz' : 'exam');
      });
    }
  }

  // Robust Event Delegation on Container for Card Click & Retake Button
  const handleContainerClick = (e) => {
    // 1. Independent Retake Icon Click on Card
    const retakeBtn = e.target.closest('.retake-btn');
    if (retakeBtn) {
      e.stopPropagation();
      e.preventDefault();
      const itemId = retakeBtn.dataset.id;
      const allHistory = [...(store.get('quizHistory') || []), ...(store.get('examHistory') || [])];
      const targetItem = allHistory.find(i => String(i.id) === String(itemId));
      if (targetItem) {
        if (targetItem.type === 'exam') {
          store.set('pendingExamConfig', {
            subject: targetItem.subject || '',
            topic: (targetItem.topic || '').replace(/\s*Practice Exam$/i, '')
          });
          router.navigate('exam');
        } else {
          store.set('pendingQuizConfig', {
            subject: targetItem.subject || '',
            topic: targetItem.topic || ''
          });
          router.navigate('quiz');
        }
      }
      return;
    }

    // 2. History Card Click → Open Detail & Review Modal
    const card = e.target.closest('.history-card');
    if (card) {
      const itemId = card.dataset.id;
      const allHistory = [...(store.get('quizHistory') || []), ...(store.get('examHistory') || [])];
      const targetItem = allHistory.find(i => String(i.id) === String(itemId));
      if (targetItem) {
        openHistoryDetail(targetItem);
      }
      return;
    }
  };

  container.addEventListener('click', handleContainerClick);

  function openHistoryDetail(item) {
    // Attach modal overlay directly to document.body (prevents transform-ancestor wheel scrolling interception)
    let detailModal = document.getElementById('history-detail-modal');
    if (!detailModal) {
      detailModal = document.createElement('div');
      detailModal.className = 'modal-overlay';
      detailModal.id = 'history-detail-modal';
      document.body.appendChild(detailModal);
    } else if (detailModal.parentElement !== document.body) {
      document.body.appendChild(detailModal);
    }

    const isQuiz = item.type === 'quiz';
    const iconEmoji = isQuiz ? '📝' : '🎯';
    const incorrectCount = Math.max(0, (item.total || 0) - (item.correct || 0));
    const score = item.score || 0;
    const scoreClass = score >= 80 ? 'color: var(--color-success);' : score >= 60 ? 'color: var(--color-warning);' : 'color: var(--color-error);';

    let questionsHtml = '';
    if (item.questions && Array.isArray(item.questions) && item.questions.length > 0) {
      const isTF = item.questionType === 'True / False';
      const isText = item.questionType === 'Short Answer' || item.questionType === 'Essay';
      const answers = item.answers || [];

      questionsHtml = `
        <div style="margin-top: var(--space-6);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-2);">
            <h3 style="font-size: var(--text-h3); font-weight: var(--weight-semibold); margin: 0;">Question Review</h3>
            <div style="display: flex; gap: var(--space-2);">
              <button class="history-filter-pill active" id="filter-all-questions">All (${item.questions.length})</button>
              <button class="history-filter-pill" id="filter-mistakes-only">Mistakes (${incorrectCount})</button>
            </div>
          </div>

          <div class="quiz-review-list" id="modal-questions-container" style="margin-top: 0;">
            ${item.questions.map((q, i) => {
              let isCorrectAnswer;
              if (isTF) isCorrectAnswer = answers[i] === q.answer;
              else if (isText) isCorrectAnswer = answers[i] && String(answers[i]).trim().length > 0;
              else isCorrectAnswer = answers[i] === q.correct;

              const userAnswerDisplay = isText
                ? (answers[i] || 'Not answered')
                : isTF
                ? (answers[i] === null || answers[i] === undefined ? 'Not answered' : (answers[i] ? 'True' : 'False'))
                : (answers[i] !== null && answers[i] !== undefined && q.options && q.options[answers[i]] !== undefined ? q.options[answers[i]] : 'Not answered');

              const correctAnswerDisplay = isText
                ? (q.sampleAnswer || q.explanation || 'See explanation')
                : isTF
                ? (q.answer ? 'True' : 'False')
                : (q.options && q.correct !== undefined ? q.options[q.correct] : 'N/A');

              return `
                <div class="quiz-review-item ${isCorrectAnswer ? 'correct' : 'incorrect'}" data-is-correct="${isCorrectAnswer}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-2);">
                    <div class="quiz-review-question" style="font-weight: var(--weight-semibold); margin-bottom: 0;">
                      ${i + 1}. ${escapeHtml(q.question)}
                    </div>
                    <span class="badge" style="background: ${isCorrectAnswer ? 'var(--color-success-bg)' : 'var(--color-error-bg)'}; color: ${isCorrectAnswer ? 'var(--color-success)' : 'var(--color-error)'}; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; margin-left: 8px;">
                      ${isCorrectAnswer ? '✓ Correct' : '✕ Missed'}
                    </span>
                  </div>
                  <div class="quiz-review-answer" style="margin-bottom: var(--space-2); line-height: 1.5;">
                    <div><strong style="color: var(--color-text);">Your Answer:</strong> <span style="${!isCorrectAnswer ? 'color: var(--color-error); font-weight: 500;' : ''}">${escapeHtml(userAnswerDisplay)}</span></div>
                    ${!isCorrectAnswer ? `<div><strong style="color: var(--color-text);">Correct Answer:</strong> <span style="color: var(--color-success); font-weight: 500;">${escapeHtml(correctAnswerDisplay)}</span></div>` : ''}
                  </div>
                  ${q.explanation ? `
                    <div style="font-size: var(--text-xs); color: var(--color-text-secondary); background: var(--color-bg); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border-left: 2px solid var(--color-primary-light);">
                      💡 <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      questionsHtml = `
        <div style="background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-5); margin-top: var(--space-5); text-align: center;">
          <div style="font-size: 1.5rem; margin-bottom: var(--space-2);">📊</div>
          <h4 style="margin-bottom: var(--space-1); font-weight: var(--weight-semibold);">Performance Summary</h4>
          <p style="color: var(--color-text-secondary); font-size: var(--text-sm); line-height: var(--leading-relaxed); margin: 0 auto; max-width: 420px;">
            You completed this ${isQuiz ? 'quiz' : 'practice exam'} with <strong>${item.score}% accuracy</strong>, answering <strong>${item.correct} of ${item.total}</strong> questions correctly in <strong>${item.duration}</strong>.
          </p>
        </div>
      `;
    }

    detailModal.innerHTML = `
      <div class="modal history-detail-modal">
        <div class="modal-header history-modal-header">
          <div>
            <div class="history-card-subject">${escapeHtml(item.subject || (isQuiz ? 'Quiz' : 'Exam'))}</div>
            <h2 class="modal-title" style="font-size: var(--text-h2); display: flex; align-items: center; gap: var(--space-2);">
              <span>${iconEmoji}</span> <span>${escapeHtml(item.topic || (isQuiz ? 'Quiz Attempt' : 'Exam Attempt'))}</span>
            </h2>
          </div>
          <button class="modal-close" id="history-modal-close-btn" aria-label="Close">✕</button>
        </div>
        <div class="history-modal-body" id="history-modal-body">
          <div class="history-modal-stats">
            <div class="history-modal-stat-card">
              <div class="history-modal-stat-value" style="${scoreClass}">${item.score}%</div>
              <div class="history-modal-stat-label">Accuracy</div>
            </div>
            <div class="history-modal-stat-card">
              <div class="history-modal-stat-value" style="color: var(--color-success);">${item.correct}</div>
              <div class="history-modal-stat-label">Correct</div>
            </div>
            <div class="history-modal-stat-card">
              <div class="history-modal-stat-value" style="color: var(--color-error);">${incorrectCount}</div>
              <div class="history-modal-stat-label">Incorrect</div>
            </div>
          </div>

          <div class="history-modal-meta-row">
            <span>📅 <strong>Date:</strong> ${formatDate(item.date)}</span>
            <span>⏱ <strong>Time:</strong> ${item.duration}</span>
            <span>📝 <strong>Total:</strong> ${item.total} Questions</span>
          </div>

          ${questionsHtml}
        </div>
        <div class="history-modal-footer">
          <button class="btn btn-secondary" id="history-modal-dismiss-btn">Close</button>
          <button class="btn btn-primary" id="history-modal-retake-btn">🔄 ${isQuiz ? 'Retake Quiz' : 'Retake Exam'}</button>
        </div>
      </div>
    `;

    function closeDetailModal() {
      detailModal.style.display = 'none';
      document.body.style.overflow = '';
    }

    const closeBtn = detailModal.querySelector('#history-modal-close-btn');
    const dismissBtn = detailModal.querySelector('#history-modal-dismiss-btn');
    const retakeBtn = detailModal.querySelector('#history-modal-retake-btn');

    if (closeBtn) closeBtn.onclick = closeDetailModal;
    if (dismissBtn) dismissBtn.onclick = closeDetailModal;
    detailModal.onclick = (e) => {
      if (e.target === detailModal) closeDetailModal();
    };

    if (retakeBtn) {
      retakeBtn.onclick = () => {
        closeDetailModal();
        if (isQuiz) {
          store.set('pendingQuizConfig', {
            subject: item.subject || '',
            topic: item.topic || ''
          });
          router.navigate('quiz');
        } else {
          store.set('pendingExamConfig', {
            subject: item.subject || '',
            topic: (item.topic || '').replace(/\s*Practice Exam$/i, '')
          });
          router.navigate('exam');
        }
      };
    }

    // Filter pills
    const btnAll = detailModal.querySelector('#filter-all-questions');
    const btnMistakes = detailModal.querySelector('#filter-mistakes-only');
    const qContainer = detailModal.querySelector('#modal-questions-container');

    if (btnAll && btnMistakes && qContainer) {
      btnAll.onclick = () => {
        btnAll.classList.add('active');
        btnMistakes.classList.remove('active');
        qContainer.querySelectorAll('.quiz-review-item').forEach(el => el.style.display = 'block');
      };

      btnMistakes.onclick = () => {
        btnMistakes.classList.add('active');
        btnAll.classList.remove('active');
        qContainer.querySelectorAll('.quiz-review-item').forEach(el => {
          const isCorrect = el.dataset.isCorrect === 'true';
          el.style.display = isCorrect ? 'none' : 'block';
        });
      };
    }

    detailModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Keyboard Escape handler
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('history-detail-modal');
      if (modal && modal.style.display === 'flex') {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  // Initial render
  render();

  // Return cleanup function to remove global listeners when navigating away
  return () => {
    container.removeEventListener('click', handleContainerClick);
    window.removeEventListener('keydown', handleKeyDown);
    const existingModal = document.getElementById('history-detail-modal');
    if (existingModal) existingModal.remove();
    document.body.style.overflow = '';
  };
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diff === 0) return t('date.today');
  if (diff === 1) return t('date.yesterday');
  if (diff < 7 && diff > 0) return `${diff} ${t('date.daysAgo')}`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
