// ============================================
// DHRYZN — Progress Component (with Real Dynamic Calculations)
// ============================================

import { drawBarChart, drawLineChart, drawCircularProgress } from '../utils/charts.js';
import { staggerReveal, countUpAnimation } from '../utils/animations.js';
import { weekDays } from '../data/sampleData.js';
import { t } from '../utils/i18n.js';

export function renderProgress(container, params, store, router) {
  const progress = store.get('progress') || {
    streak: 0,
    totalQuestions: 0,
    averageAccuracy: 0,
    studyTimeMinutes: 0,
    mastery: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    strongTopics: [],
    weakTopics: [],
    examReadiness: 0,
    examTrend: []
  };

  const hasData = progress.totalQuestions > 0;
  const hasExams = progress.examTrend && progress.examTrend.length > 0;

  container.innerHTML = `
    <div class="page-container">
      <div class="progress-page-header">
        <h1>${t('progress.title')}</h1>
        <p>${t('progress.desc')}</p>
      </div>

      <!-- Stats Grid -->
      <div class="progress-stats-grid">
        <div class="progress-stat-card animate-item">
          <div class="progress-stat-icon">🔥</div>
          <div class="progress-stat-value" data-count="${progress.streak}">${progress.streak}</div>
          <div class="progress-stat-label">${t('progress.dayStreak')}</div>
        </div>
        <div class="progress-stat-card animate-item">
          <div class="progress-stat-icon">📝</div>
          <div class="progress-stat-value" data-count="${progress.totalQuestions}">${progress.totalQuestions}</div>
          <div class="progress-stat-label">${t('progress.questionsAnswered')}</div>
        </div>
        <div class="progress-stat-card animate-item">
          <div class="progress-stat-icon">🎯</div>
          <div class="progress-stat-value" data-count="${progress.averageAccuracy}" data-suffix="%">${progress.averageAccuracy}%</div>
          <div class="progress-stat-label">${t('progress.averageAccuracy')}</div>
        </div>
        <div class="progress-stat-card animate-item">
          <div class="progress-stat-icon">⏱</div>
          <div class="progress-stat-value">${formatStudyTime(progress.studyTimeMinutes)}</div>
          <div class="progress-stat-label">${t('progress.totalStudyTime')}</div>
        </div>
      </div>

      <!-- Charts -->
      <div class="progress-charts">
        <!-- Mastery Level -->
        <div class="progress-chart-card animate-item">
          <div class="progress-chart-header">
            <div>
              <div class="progress-chart-title">${t('progress.masteryLevel')}</div>
              <div class="progress-chart-subtitle">${t('progress.masterySubtitle')}</div>
            </div>
          </div>
          <div class="mastery-section">
            <div class="mastery-canvas-wrap">
              <canvas id="mastery-chart"></canvas>
              <div class="mastery-value">
                <span class="mastery-percent">${progress.mastery}%</span>
                <span class="mastery-label">${t('progress.mastery')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Exam Readiness -->
        <div class="progress-chart-card animate-item">
          <div class="progress-chart-header">
            <div>
              <div class="progress-chart-title">${t('progress.examReadiness')}</div>
              <div class="progress-chart-subtitle">${t('progress.examReadinessSubtitle')}</div>
            </div>
          </div>
          <div class="readiness-section">
            <div class="readiness-chart-wrap">
              <canvas id="readiness-chart"></canvas>
              <div class="readiness-chart-value">${progress.examReadiness}%</div>
            </div>
            <div class="readiness-details">
              <div class="readiness-status">${getReadinessStatus(progress.examReadiness, hasData)}</div>
              <div class="readiness-desc">${getReadinessDesc(progress.examReadiness, hasData)}</div>
            </div>
          </div>
        </div>

        <!-- Weekly Activity -->
        <div class="progress-chart-card full-width animate-item">
          <div class="progress-chart-header">
            <div>
              <div class="progress-chart-title">${t('progress.weeklyActivity')}</div>
              <div class="progress-chart-subtitle">${t('progress.weeklyActivitySubtitle')}</div>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="weekly-chart"></canvas>
          </div>
        </div>

        <!-- Strong Topics -->
        <div class="progress-chart-card animate-item">
          <div class="progress-chart-header">
            <div>
              <div class="progress-chart-title">${t('progress.strongTopics')}</div>
              <div class="progress-chart-subtitle">${t('progress.strongTopicsSubtitle')}</div>
            </div>
          </div>
          <div class="topics-list">
            ${progress.strongTopics && progress.strongTopics.length > 0 ? progress.strongTopics.map(tp => `
              <div class="topic-item">
                <div class="topic-item-header">
                  <span class="topic-name">${escapeHtml(tp.name)}</span>
                  <span class="topic-percent">${tp.percent}%</span>
                </div>
                <div class="topic-bar">
                  <div class="topic-bar-fill strong" style="width: ${tp.percent}%;"></div>
                </div>
              </div>
            `).join('') : `
              <div style="padding: var(--space-6) 0; color: var(--color-text-secondary); font-size: var(--text-sm); line-height: 1.6;">
                🎯 Complete quizzes with ≥75% accuracy to highlight your strong topics here.
              </div>
            `}
          </div>
        </div>

        <!-- Weak Topics -->
        <div class="progress-chart-card animate-item">
          <div class="progress-chart-header">
            <div>
              <div class="progress-chart-title">${t('progress.weakTopics')}</div>
              <div class="progress-chart-subtitle">${t('progress.weakTopicsSubtitle')}</div>
            </div>
          </div>
          <div class="topics-list">
            ${progress.weakTopics && progress.weakTopics.length > 0 ? progress.weakTopics.map(tp => `
              <div class="topic-item">
                <div class="topic-item-header">
                  <span class="topic-name">${escapeHtml(tp.name)}</span>
                  <span class="topic-percent">${tp.percent}%</span>
                </div>
                <div class="topic-bar">
                  <div class="topic-bar-fill ${tp.percent >= 60 ? 'medium' : 'weak'}" style="width: ${tp.percent}%;"></div>
                </div>
              </div>
            `).join('') : `
              <div style="padding: var(--space-6) 0; color: var(--color-text-secondary); font-size: var(--text-sm); line-height: 1.6;">
                ✨ No weak topics detected! Topics with accuracy &lt;70% will appear here for targeted review.
              </div>
            `}
          </div>
        </div>

        <!-- Exam Trend -->
        <div class="progress-chart-card full-width animate-item">
          <div class="progress-chart-header">
            <div>
              <div class="progress-chart-title">${t('progress.examTrend')}</div>
              <div class="progress-chart-subtitle">${t('progress.examTrendSubtitle')}</div>
            </div>
          </div>
          <div class="chart-container">
            ${hasExams ? `
              <canvas id="trend-chart"></canvas>
            ` : `
              <div style="height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--color-text-secondary); text-align: center; gap: var(--space-3);">
                <div>🎯 No practice exams completed yet.</div>
                <button class="btn btn-secondary btn-sm" id="progress-take-exam-btn">Start Practice Exam</button>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Recommended Action -->
      <div class="recommended-action animate-item" id="recommended-action">
        <div class="recommended-icon">💡</div>
        <div class="recommended-content">
          <div class="recommended-title">${getRecommendation(progress).title}</div>
          <div class="recommended-desc">${getRecommendation(progress).desc}</div>
        </div>
        <div class="recommended-arrow">→</div>
      </div>
    </div>
  `;

  staggerReveal(container, '.animate-item', 60);

  // Draw charts after render
  requestAnimationFrame(() => {
    // Mastery
    const masteryCanvas = container.querySelector('#mastery-chart');
    if (masteryCanvas) {
      drawCircularProgress(masteryCanvas, progress.mastery || 0, { size: 160, lineWidth: 12 });
    }

    // Readiness
    const readinessCanvas = container.querySelector('#readiness-chart');
    if (readinessCanvas) {
      drawCircularProgress(readinessCanvas, progress.examReadiness || 0, { size: 120, lineWidth: 10 });
    }

    // Weekly activity bar chart
    const weeklyCanvas = container.querySelector('#weekly-chart');
    if (weeklyCanvas) {
      const parentWidth = weeklyCanvas.parentElement.offsetWidth || 500;
      drawBarChart(weeklyCanvas, progress.weeklyActivity || [0, 0, 0, 0, 0, 0, 0], weekDays, {
        width: Math.min(parentWidth, 700),
        height: 200
      });
    }

    // Exam trend line chart (only if exams exist)
    if (hasExams) {
      const trendCanvas = container.querySelector('#trend-chart');
      if (trendCanvas) {
        const parentWidth = trendCanvas.parentElement.offsetWidth || 500;
        const labels = progress.examTrend.map((_, i) => `Exam ${i + 1}`);
        drawLineChart(trendCanvas, progress.examTrend, labels, {
          width: Math.min(parentWidth, 700),
          height: 200
        });
      }
    }
  });

  // Count-up animations
  container.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    countUpAnimation(el, target, 1000, suffix);
  });

  // Recommended action click
  container.querySelector('#recommended-action')?.addEventListener('click', () => {
    const rec = getRecommendation(progress);
    router.navigate(rec.route);
  });

  // Take exam button in empty trend state
  container.querySelector('#progress-take-exam-btn')?.addEventListener('click', () => {
    router.navigate('exam');
  });
}

function formatStudyTime(minutes) {
  if (!minutes || minutes < 1) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function getReadinessStatus(percent, hasData) {
  if (!hasData) return 'No Activity Yet';
  if (percent >= 85) return t('progress.readyExam');
  if (percent >= 70) return t('progress.almostThere');
  if (percent >= 50) return t('progress.gettingCloser');
  return t('progress.keepPracticing');
}

function getReadinessDesc(percent, hasData) {
  if (!hasData) return 'Take quizzes and practice exams to calculate your exam readiness.';
  if (percent >= 85) return t('progress.readyExamDesc');
  if (percent >= 70) return t('progress.almostThereDesc');
  if (percent >= 50) return t('progress.gettingCloserDesc');
  return t('progress.keepPracticingDesc');
}

function getRecommendation(progress) {
  if (progress.weakTopics && progress.weakTopics.length > 0) {
    const weakest = progress.weakTopics[0];
    return {
      title: `${t('progress.practice')} ${weakest.name}`,
      desc: `${t('progress.accuracyOn')} ${weakest.name} ${t('progress.accuracyIs')} ${weakest.percent}%. ${t('progress.focusedQuiz')}`,
      route: 'quiz'
    };
  }
  if (progress.totalQuestions === 0) {
    return {
      title: 'Take Your First Quiz',
      desc: 'Start with a short quiz to establish your baseline study statistics.',
      route: 'quiz'
    };
  }
  return {
    title: t('progress.takeExam'),
    desc: t('progress.takeExamDesc'),
    route: 'exam'
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
