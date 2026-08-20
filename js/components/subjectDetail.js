// ============================================
// DHRYZN — Subject Detail Component
// ============================================

import { staggerReveal } from '../utils/animations.js';
import { t } from '../utils/i18n.js';

export function renderSubjectDetail(container, params, store, router) {
  const subjectId = params[0];
  const subjects = store.get('subjects') || [];
  const subject = subjects.find(s => s.id === subjectId);

  if (!subject) {
    container.innerHTML = `
      <div class="page-container">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h2 class="empty-state-title">${t('subjectDetail.notFound')}</h2>
          <p class="empty-state-text">${t('subjectDetail.notFoundDesc')}</p>
          <button class="btn btn-primary" style="margin-top: 20px;" id="back-to-subjects-btn">${t('subjectDetail.backToSubjects')}</button>
        </div>
      </div>
    `;
    container.querySelector('#back-to-subjects-btn')?.addEventListener('click', () => {
      router.navigate('subjects');
    });
    return;
  }

  const isCustom = subject.isCustom === true && !subject.isBuiltIn;
  const quizHistory = (store.get('quizHistory') || []).filter(q => q.subject === subject.name);
  const examHistory = (store.get('examHistory') || []).filter(e => e.subject === subject.name);
  const totalQuestions = quizHistory.reduce((acc, q) => acc + (Number(q.total) || 0), 0) +
                         examHistory.reduce((acc, e) => acc + (Number(e.total) || 0), 0);

  container.innerHTML = `
    <div class="page-container">
      <div class="subject-detail-header" style="justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <button class="subject-detail-back" id="back-btn" title="Back to Subjects" aria-label="Back to Subjects">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div class="subject-detail-info">
            <div style="display: flex; align-items: center; gap: var(--space-3);">
              <h1>${subject.icon} ${escapeHtml(subject.name)}</h1>
              ${isCustom ? `<span class="badge" style="background: rgba(var(--color-primary-rgb), 0.15); color: var(--color-primary-light);">${t('subjectDetail.custom')}</span>` : ''}
            </div>
            <p>${totalQuestions} ${t('subjectDetail.questionsAnswered')} • ${quizHistory.length} ${t('subjectDetail.quizzes')} • ${examHistory.length} ${t('subjectDetail.exams')}</p>
          </div>
        </div>
        ${isCustom ? `
          <button class="btn btn-secondary" id="detail-delete-btn" style="color: var(--color-error); border-color: rgba(248, 113, 113, 0.3);">
            🗑️ ${t('subjectDetail.deleteCourse')}
          </button>
        ` : ''}
      </div>

      <div class="subject-actions">
        <div class="subject-action-card animate-item" data-action="quiz">
          <div class="subject-action-icon" style="background: rgba(var(--color-primary-rgb), 0.12); color: var(--color-primary-light);">📝</div>
          <div class="subject-action-title">${t('subjectDetail.generateQuiz')}</div>
          <div class="subject-action-desc">${t('subjectDetail.createQuiz')} ${escapeHtml(subject.name)}</div>
        </div>
        <div class="subject-action-card animate-item" data-action="explain">
          <div class="subject-action-icon" style="background: rgba(96, 165, 250, 0.12); color: #60A5FA;">💡</div>
          <div class="subject-action-title">${t('subjectDetail.explainTopic')}</div>
          <div class="subject-action-desc">${t('subjectDetail.getExplanations')}</div>
        </div>
        <div class="subject-action-card animate-item" data-action="exam">
          <div class="subject-action-icon" style="background: rgba(251, 191, 36, 0.12); color: #FBBF24;">🎯</div>
          <div class="subject-action-title">${t('subjectDetail.practiceExam')}</div>
          <div class="subject-action-desc">${t('subjectDetail.simulateExam')}</div>
        </div>
        <div class="subject-action-card animate-item" data-action="results">
          <div class="subject-action-icon" style="background: rgba(52, 211, 153, 0.12); color: #34D399;">📊</div>
          <div class="subject-action-title">${t('subjectDetail.pastResults')}</div>
          <div class="subject-action-desc">${t('subjectDetail.viewHistory')}</div>
        </div>
      </div>

      ${quizHistory.length > 0 ? `
        <h2 class="text-h2" style="margin-bottom: var(--space-4);">${t('subjectDetail.recentActivity')}</h2>
        <div class="history-list">
          ${quizHistory.slice(0, 3).map(q => `
            <div class="history-card">
              <div class="history-card-icon quiz">📝</div>
              <div class="history-card-info">
                <div class="history-card-title">${escapeHtml(q.topic)}</div>
                <div class="history-card-meta">
                  <span>📅 ${q.date}</span>
                  <span>⏱ ${q.duration}</span>
                  <span>📊 ${q.correct}/${q.total}</span>
                </div>
              </div>
              <div class="history-card-score ${q.score >= 80 ? 'high' : q.score >= 60 ? 'medium' : 'low'}">${q.score}%</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="card" style="text-align: center; padding: var(--space-8); color: var(--color-text-secondary);">
          <p>${t('subjectDetail.noActivity').replace('{name}', escapeHtml(subject.name))}</p>
        </div>
      `}

      <!-- Delete Subject Modal -->
      ${isCustom ? `
        <div class="modal-overlay" id="detail-delete-modal" style="display: none;">
          <div class="modal delete-modal">
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: var(--space-3);">
                <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: var(--color-error-bg); color: var(--color-error); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                  ⚠️
                </div>
                <h2 class="modal-title">${t('subjectDetail.deleteModalTitle')}</h2>
              </div>
              <button class="modal-close" id="detail-delete-close" aria-label="Close">✕</button>
            </div>
            <p style="color: var(--color-text-secondary); line-height: var(--leading-relaxed); margin-bottom: var(--space-6);">
              ${t('subjectDetail.deleteModalDesc').replace('{name}', `<strong>${escapeHtml(subject.name)}</strong>`)}
            </p>
            <div style="display: flex; gap: var(--space-3); justify-content: flex-end;">
              <button class="btn btn-secondary" id="detail-delete-cancel">${t('settings.cancel')}</button>
              <button class="btn btn-primary" id="detail-delete-confirm" style="background: var(--color-error); border-color: var(--color-error); box-shadow: none;">
                🗑️ ${t('subjectDetail.deleteCourse')}
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  staggerReveal(container, '.animate-item', 60);

  // Back button
  container.querySelector('#back-btn')?.addEventListener('click', () => {
    router.navigate('subjects');
  });

  // Action handlers
  container.querySelectorAll('.subject-action-card').forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      switch (action) {
        case 'quiz': router.navigate(`quiz/${subjectId}`); break;
        case 'explain': router.navigate(`explain/${subjectId}`); break;
        case 'exam': router.navigate(`exam/${subjectId}`); break;
        case 'results': router.navigate('history'); break;
      }
    });
  });

  // Delete modal handlers for custom subjects
  if (isCustom) {
    const deleteBtn = container.querySelector('#detail-delete-btn');
    const deleteModal = container.querySelector('#detail-delete-modal');
    const deleteClose = container.querySelector('#detail-delete-close');
    const deleteCancel = container.querySelector('#detail-delete-cancel');
    const deleteConfirm = container.querySelector('#detail-delete-confirm');

    function openModal() { if (deleteModal) deleteModal.style.display = 'flex'; }
    function closeModal() { if (deleteModal) deleteModal.style.display = 'none'; }

    deleteBtn?.addEventListener('click', openModal);
    deleteClose?.addEventListener('click', closeModal);
    deleteCancel?.addEventListener('click', closeModal);
    deleteModal?.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeModal();
    });

    deleteConfirm?.addEventListener('click', () => {
      const result = store.deleteSubject(subjectId);
      if (result && result.success) {
        closeModal();
        router.navigate('subjects');
      } else {
        alert(result?.error || t('subjectDetail.deleteFailed'));
        closeModal();
      }
    });
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
