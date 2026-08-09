// ============================================
// DHRYZN — Practice Exam Component (Gemini 3.6 Flash)
// ============================================

import { generateDynamicExam } from '../utils/geminiApi.js';
import { staggerReveal } from '../utils/animations.js';
import { drawCircularProgress } from '../utils/charts.js';
import { difficultyLevels, gradeLevels } from '../data/sampleData.js';
import { getLocalDateStr } from '../store.js';

export function renderExam(container, params, store, router) {
  const subjectId = params[0];
  const subjects = store.get('subjects');
  const subject = subjectId ? subjects.find(s => s.id === subjectId) : null;

  // Check if we were directed here from the AI conversation
  const pendingConfig = store.get('pendingExamConfig');
  if (pendingConfig) {
    store.set('pendingExamConfig', null);
  }

  // Shared cleanup reference so timer can be cleared on page exit
  const state = { cleanup: null };

  // Check for a saved exam session to resume
  const savedSession = store.get('activeQuizSession');
  if (savedSession && savedSession.type === 'exam') {
    state.cleanup = renderExamEnvironment(
      container,
      savedSession.questions,
      savedSession.subject,
      savedSession.topic,
      savedSession.durationMinutes,
      store,
      router,
      {
        answers: savedSession.answers,
        bookmarked: savedSession.bookmarked,
        currentQuestion: savedSession.currentQuestion,
        timeLeftSeconds: savedSession.timeLeftSeconds
      }
    );
    return () => {
      if (state.cleanup) state.cleanup();
    };
  }

  renderExamConfig(container, subject, store, router, state, pendingConfig);

  return () => {
    if (state.cleanup) state.cleanup();
  };
}

function renderExamConfig(container, subject, store, router, state, pendingConfig) {
  const initSubject = pendingConfig?.subject || (subject ? subject.name : '');
  const initTopic = pendingConfig?.topic || '';
  const initDifficulty = pendingConfig?.difficulty || 'Hard';
  const initCount = pendingConfig?.questionCount || 10;

  container.innerHTML = `
    <div class="page-container">
      <div class="exam-config">
        <div class="exam-config-header">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-2);">
            <h1>🎯 Practice Exam</h1>
            <span class="badge" style="background: rgba(var(--color-primary-rgb), 0.15); color: var(--color-primary-light); border: 1px solid rgba(var(--color-primary-rgb), 0.3); font-size: 0.8rem; padding: 4px 10px; border-radius: 999px; font-weight: 600;">
              ✨ Gemini 3.6 Flash
            </span>
          </div>
          <p>Simulate real exam conditions with timed sessions, realistic questions, and comprehensive performance analysis.</p>
        </div>

        <div class="exam-config-form" id="exam-form-box">
          <div class="form-group animate-item">
            <label>Subject</label>
            <input type="text" class="input-field" id="exam-subject" placeholder="e.g., Mathematics, Physics, Chemistry, Computer Science" value="${initSubject}">
          </div>

          <div class="form-group animate-item">
            <label>Topic / Scope</label>
            <input type="text" class="input-field" id="exam-topic" placeholder="e.g., Midterm Review, Mechanics, Organic Chemistry" value="${initTopic}">
          </div>

          <div class="form-row animate-item">
            <div class="form-group">
              <label>Duration</label>
              <select class="select-field" id="exam-duration">
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45" selected>45 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>
            <div class="form-group">
              <label>Difficulty</label>
              <select class="select-field" id="exam-difficulty">
                ${difficultyLevels.map(d => `<option value="${d}" ${d === initDifficulty ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group animate-item">
            <label>Number of Questions</label>
            <select class="select-field" id="exam-count">
              <option value="5">5 Questions (Quick Test)</option>
              <option value="10" ${initCount === 10 ? 'selected' : ''}>10 Questions</option>
              <option value="15">15 Questions</option>
              <option value="20" ${initCount === 20 ? 'selected' : ''}>20 Questions (Standard)</option>
            </select>
          </div>

          <div class="exam-config-actions animate-item">
            <button class="btn btn-secondary" id="exam-back-btn">Cancel</button>
            <button class="btn btn-primary btn-lg" id="exam-start-btn">🎯 Start Exam</button>
          </div>
        </div>
      </div>
    </div>
  `;

  staggerReveal(container, '.animate-item', 60);

  container.querySelector('#exam-back-btn').addEventListener('click', () => {
    window.history.back();
  });

  container.querySelector('#exam-start-btn').addEventListener('click', async () => {
    const subjectVal = container.querySelector('#exam-subject').value.trim() || 'General Subject';
    const topicVal = container.querySelector('#exam-topic').value.trim() || subjectVal;
    const duration = parseInt(container.querySelector('#exam-duration').value);
    const count = parseInt(container.querySelector('#exam-count').value);
    const difficulty = container.querySelector('#exam-difficulty').value;

    const formBox = container.querySelector('#exam-form-box');
    formBox.innerHTML = `
      <div style="text-align: center; padding: var(--space-10) var(--space-4);">
        <div style="font-size: 2.5rem; margin-bottom: var(--space-4);">✨</div>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">Gemini 3.6 Flash is Crafting Your Exam</h3>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">Generating ${count} exam questions for <strong>${subjectVal} — ${topicVal}</strong>...</p>
        <div class="typing-indicator" style="justify-content: center; margin: 0 auto;">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;

    try {
      const questions = await generateDynamicExam(subjectVal, topicVal, count, difficulty, 'Grade 11');
      state.cleanup = renderExamEnvironment(container, questions, subjectVal, topicVal, duration, store, router);
    } catch (e) {
      console.error('Exam generation error:', e);
      formBox.innerHTML = `
        <div style="text-align: center; padding: var(--space-8);">
          <div style="color: var(--color-error); font-size: 2rem; margin-bottom: var(--space-3);">⚠️</div>
          <h3 style="margin-bottom: var(--space-2);">Could Not Generate Exam</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">There was a temporary issue contacting the AI engine.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Try Again</button>
        </div>
      `;
    }
  });
}

/** Friendly message when a course doesn't have proper exam content */
function renderUnsupportedCourse(container, subject, topic, store, router) {
  container.innerHTML = `
    <div class="page-container">
      <div class="exam-config">
        <div class="exam-config-header" style="text-align: center; padding: var(--space-10) 0;">
          <div style="font-size: 3rem; margin-bottom: var(--space-4);">🧪</div>
          <h1 style="font-size: var(--text-h1); margin-bottom: var(--space-3);">Experimental Course</h1>
          <p style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto; line-height: var(--leading-relaxed);">
            <strong>${subject}${topic && topic !== subject ? ' — ' + topic : ''}</strong> is not yet fully supported for practice exams.
          </p>
          <p style="color: var(--color-text-secondary); max-width: 480px; margin: var(--space-3) auto 0; line-height: var(--leading-relaxed);">
            We're working on adding high-quality exam questions for this subject. In the meantime, try one of our supported courses for the best exam preparation experience.
          </p>

          <div style="
            background: var(--color-info-bg);
            border: 1px solid rgba(96, 165, 250, 0.2);
            border-radius: var(--radius-lg);
            padding: var(--space-4) var(--space-5);
            margin: var(--space-6) auto 0;
            max-width: 480px;
            text-align: left;
          ">
            <div style="font-weight: var(--weight-semibold); margin-bottom: var(--space-2); color: var(--color-info);">
              📚 Supported Courses
            </div>
            <div style="color: var(--color-text-secondary); font-size: var(--text-sm); line-height: var(--leading-relaxed);">
              Mathematics • Physics • Chemistry • Biology • English • Computer Science • History • Economics • Geography • Japanese
            </div>
          </div>

          <div class="quiz-config-actions" style="justify-content: center; margin-top: var(--space-8);">
            <button class="btn btn-secondary" id="unsupported-back">← Go Back</button>
            <button class="btn btn-primary" id="unsupported-dashboard">🏠 Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#unsupported-back').addEventListener('click', () => {
    window.history.back();
  });
  container.querySelector('#unsupported-dashboard').addEventListener('click', () => {
    router.navigate('dashboard');
  });
}

function renderExamEnvironment(container, questions, subject, topic, durationMinutes, store, router, restored) {
  let currentQuestion = restored ? restored.currentQuestion : 0;
  let answers = restored ? restored.answers : new Array(questions.length).fill(null);
  let bookmarked = restored ? restored.bookmarked : new Array(questions.length).fill(false);
  let timeLeft = restored ? restored.timeLeftSeconds : durationMinutes * 60; // seconds
  let timerInterval = null;

  /** Save the current exam session to the store for resume */
  function saveSession() {
    store.set('activeQuizSession', {
      type: 'exam',
      subject,
      topic,
      durationMinutes,
      questions,
      answers: [...answers],
      bookmarked: [...bookmarked],
      currentQuestion,
      timeLeftSeconds: timeLeft
    });
  }

  /** Clear the saved session (exam is done) */
  function clearSession() {
    store.set('activeQuizSession', null);
  }

  // Save immediately when entering the exam
  saveSession();

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function getTimerClass() {
    const percent = timeLeft / (durationMinutes * 60);
    if (percent <= 0.1) return 'critical';
    if (percent <= 0.25) return 'warning';
    return '';
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      timeLeft--;
      const timerEl = container.querySelector('#exam-timer');
      if (timerEl) {
        timerEl.textContent = formatTime(timeLeft);
        timerEl.parentElement.className = `exam-timer ${getTimerClass()}`;
      }
      // Save timer state periodically (every 10 seconds to avoid excessive writes)
      if (timeLeft % 10 === 0) {
        saveSession();
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        clearSession();
        submitExamResults(container, questions, answers, subject, topic, durationMinutes, timeLeft, store, router);
      }
    }, 1000);
  }

  function render() {
    const q = questions[currentQuestion];
    const answeredCount = answers.filter(a => a !== null).length;

    container.innerHTML = `
      <div class="page-container">
        <div class="exam-environment">
          <div class="exam-top-bar">
            <div class="exam-timer ${getTimerClass()}">
              <span class="exam-timer-icon">⏱</span>
              <span id="exam-timer">${formatTime(timeLeft)}</span>
            </div>
            <div class="exam-info">
              <span>${topic}</span>
              <span>${answeredCount}/${questions.length} answered</span>
            </div>
          </div>

          <div class="exam-body">
            <div class="exam-question-area">
              <div class="exam-question-card">
                <div class="quiz-question-number">Question ${currentQuestion + 1}</div>
                <div class="exam-question-text">${q.question}</div>

                <div class="exam-options">
                  ${q.options.map((opt, i) => `
                    <div class="exam-option ${answers[currentQuestion] === i ? 'selected' : ''}" data-index="${i}">
                      <div class="exam-option-letter">${String.fromCharCode(65 + i)}</div>
                      <span>${opt}</span>
                    </div>
                  `).join('')}
                </div>

                <div class="exam-question-actions">
                  <button class="bookmark-btn ${bookmarked[currentQuestion] ? 'active' : ''}" id="bookmark-btn">
                    ${bookmarked[currentQuestion] ? '★' : '☆'} ${bookmarked[currentQuestion] ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <div style="display: flex; gap: var(--space-3);">
                    <button class="btn btn-secondary" id="exam-prev" ${currentQuestion === 0 ? 'disabled style="opacity:0.4"' : ''}>← Prev</button>
                    ${currentQuestion < questions.length - 1 ? `
                      <button class="btn btn-primary" id="exam-next">Next →</button>
                    ` : `
                      <button class="btn btn-primary" id="exam-review-btn">📋 Review & Submit</button>
                    `}
                  </div>
                </div>
              </div>
            </div>

            <div class="exam-nav-panel">
              <div class="exam-nav-card">
                <div class="exam-nav-title">Questions</div>
                <div class="exam-nav-grid">
                  ${questions.map((_, i) => {
                    let cls = 'exam-nav-btn';
                    if (i === currentQuestion) cls += ' current';
                    else if (answers[i] !== null) cls += ' answered';
                    if (bookmarked[i]) cls += ' bookmarked';
                    return `<button class="${cls}" data-qi="${i}">${i + 1}</button>`;
                  }).join('')}
                </div>
                <div class="exam-nav-legend">
                  <div class="exam-legend-item">
                    <div class="exam-legend-dot" style="background: var(--color-primary);"></div>
                    <span>Current</span>
                  </div>
                  <div class="exam-legend-item">
                    <div class="exam-legend-dot" style="background: var(--color-primary-subtle); border: 1px solid rgba(124,92,255,0.3);"></div>
                    <span>Answered</span>
                  </div>
                  <div class="exam-legend-item">
                    <div class="exam-legend-dot" style="background: var(--color-bg); border: 1px solid var(--color-border);"></div>
                    <span>Unanswered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Option selection
    container.querySelectorAll('.exam-option').forEach(opt => {
      opt.addEventListener('click', () => {
        answers[currentQuestion] = parseInt(opt.dataset.index);
        container.querySelectorAll('.exam-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        opt.querySelector('.exam-option-letter').style.background = 'var(--color-primary)';
        opt.querySelector('.exam-option-letter').style.color = 'white';
        saveSession();
      });
    });

    // Bookmark
    container.querySelector('#bookmark-btn').addEventListener('click', () => {
      bookmarked[currentQuestion] = !bookmarked[currentQuestion];
      saveSession();
      render();
    });

    // Navigation
    const prevBtn = container.querySelector('#exam-prev');
    if (prevBtn && currentQuestion > 0) {
      prevBtn.addEventListener('click', () => { currentQuestion--; saveSession(); render(); });
    }

    const nextBtn = container.querySelector('#exam-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => { currentQuestion++; saveSession(); render(); });
    }

    // Question nav grid
    container.querySelectorAll('.exam-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentQuestion = parseInt(btn.dataset.qi);
        saveSession();
        render();
      });
    });

    // Review & Submit
    const reviewBtn = container.querySelector('#exam-review-btn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        renderExamReview(container, questions, answers, bookmarked, subject, topic, durationMinutes, timeLeft, store, router, () => {
          startTimer();
          render();
        }, clearSession);
      });
    }
  }

  startTimer();
  render();

  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
}

function renderExamReview(container, questions, answers, bookmarked, subject, topic, durationMinutes, timeLeft, store, router, goBack, clearSession) {
  const answeredCount = answers.filter(a => a !== null).length;
  const unanswered = questions.length - answeredCount;
  const bookmarkedCount = bookmarked.filter(b => b).length;

  container.innerHTML = `
    <div class="page-container">
      <div class="exam-review">
        <h2>📋 Review Before Submitting</h2>
        <p class="text-secondary" style="margin-top: var(--space-2);">Take a moment to review your progress before submitting.</p>

        <div class="exam-review-summary">
          <div class="exam-review-stat">
            <div class="exam-review-stat-value" style="color: var(--color-success);">${answeredCount}</div>
            <div class="exam-review-stat-label">Answered</div>
          </div>
          <div class="exam-review-stat">
            <div class="exam-review-stat-value" style="color: var(--color-warning);">${unanswered}</div>
            <div class="exam-review-stat-label">Unanswered</div>
          </div>
          <div class="exam-review-stat">
            <div class="exam-review-stat-value" style="color: var(--color-info);">${bookmarkedCount}</div>
            <div class="exam-review-stat-label">Bookmarked</div>
          </div>
        </div>

        ${unanswered > 0 ? `
          <div style="background: var(--color-warning-bg); border: 1px solid rgba(251,191,36,0.2); border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5); margin-bottom: var(--space-5);">
            ⚠️ You have <strong>${unanswered} unanswered</strong> question${unanswered > 1 ? 's' : ''}. Are you sure you want to submit?
          </div>
        ` : ''}

        <div class="exam-review-actions">
          <button class="btn btn-secondary" id="review-back">← Go Back</button>
          <button class="btn btn-primary btn-lg" id="review-submit">✅ Submit Exam</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#review-back').addEventListener('click', goBack);

  container.querySelector('#review-submit').addEventListener('click', () => {
    clearSession();
    submitExamResults(container, questions, answers, subject, topic, durationMinutes, timeLeft, store, router);
  });
}

function submitExamResults(container, questions, answers, subject, topic, durationMinutes, timeLeft, store, router) {
  // Ensure session is cleared when showing results
  store.set('activeQuizSession', null);

  let correct = 0;
  questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
  const score = Math.round((correct / questions.length) * 100);
  const timeUsed = (durationMinutes * 60) - timeLeft;
  const minutes = Math.floor(timeUsed / 60);

  // Save with distinct subject and topic
  store.addExamToHistory({
    id: 'e-' + Date.now(),
    subject: subject,
    topic: topic + ' Practice Exam',
    date: getLocalDateStr(new Date()),
    duration: `${minutes} min`,
    score,
    total: questions.length,
    correct,
    type: 'exam',
    status: 'completed'
  });

  // Weak topics (mock)
  const weakTopics = [
    { name: 'Advanced Concepts', score: Math.max(20, score - 30) },
    { name: 'Application Problems', score: Math.max(25, score - 20) },
    { name: 'Theoretical Foundations', score: Math.min(95, score + 10) }
  ];

  container.innerHTML = `
    <div class="page-container">
      <div class="exam-results">
        <div class="exam-results-header">
          <h1>${score >= 80 ? '🎉 Outstanding!' : score >= 60 ? '👏 Good Effort!' : '💪 Room to Grow!'}</h1>
          <p class="text-secondary">${score >= 80 ? 'You\'re well-prepared!' : score >= 60 ? 'Keep practicing to improve!' : 'Focus on your weak areas and try again!'}</p>
        </div>

        <div class="exam-results-grid">
          <div class="exam-result-card">
            <h3>📊 Performance</h3>
            <div class="readiness-gauge">
              <canvas id="exam-score-chart"></canvas>
              <div class="readiness-label">${score}%</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-4);">
              <div style="text-align: center;">
                <div style="font-size: var(--text-h2); font-weight: 700; color: var(--color-success);">${correct}</div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Correct</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: var(--text-h2); font-weight: 700; color: var(--color-error);">${questions.length - correct}</div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Incorrect</div>
              </div>
            </div>
          </div>

          <div class="exam-result-card">
            <h3>⏱ Time Analysis</h3>
            <div style="display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4) 0;">
              <div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-1);">Time Used</div>
                <div style="font-size: var(--text-h2); font-weight: 700;">${minutes} min</div>
              </div>
              <div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-1);">Avg per Question</div>
                <div style="font-size: var(--text-h2); font-weight: 700;">${Math.round(timeUsed / questions.length)}s</div>
              </div>
              <div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-1);">Time Remaining</div>
                <div style="font-size: var(--text-h2); font-weight: 700;">${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s</div>
              </div>
            </div>
          </div>

          <div class="exam-result-card">
            <h3>📈 Topic Analysis</h3>
            <div class="weak-topics-list">
              ${weakTopics.map(t => `
                <div class="weak-topic-item">
                  <span class="weak-topic-name">${t.name}</span>
                  <span class="weak-topic-score" style="color: ${t.score >= 70 ? 'var(--color-success)' : t.score >= 50 ? 'var(--color-warning)' : 'var(--color-error)'};">${t.score}%</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="exam-result-card">
            <h3>🎯 Exam Readiness</h3>
            <div class="readiness-section" style="flex-direction: column; align-items: center;">
              <div class="readiness-chart-wrap">
                <canvas id="readiness-chart"></canvas>
                <div class="readiness-chart-value">${Math.round(score * 0.9)}%</div>
              </div>
              <div style="text-align: center; margin-top: var(--space-3);">
                <div class="readiness-status">${score >= 80 ? 'Exam Ready' : score >= 60 ? 'Almost There' : 'Keep Practicing'}</div>
                <div class="readiness-desc">${score >= 80 ? 'You\'re well prepared for the exam!' : score >= 60 ? 'A few more practice sessions will help.' : 'Focus on weak areas and retake.'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); justify-content: center; margin-top: var(--space-6);">
          <button class="btn btn-secondary" id="exam-retake">🔄 Retake Exam</button>
          <button class="btn btn-primary" id="exam-dashboard">🏠 Dashboard</button>
        </div>
      </div>
    </div>
  `;

  // Draw charts
  const scoreCanvas = container.querySelector('#exam-score-chart');
  if (scoreCanvas) drawCircularProgress(scoreCanvas, score, { size: 120, lineWidth: 10 });

  const readinessCanvas = container.querySelector('#readiness-chart');
  if (readinessCanvas) drawCircularProgress(readinessCanvas, Math.round(score * 0.9), { size: 120, lineWidth: 10 });

  container.querySelector('#exam-retake').addEventListener('click', () => router.navigate('exam'));
  container.querySelector('#exam-dashboard').addEventListener('click', () => router.navigate('dashboard'));
}
