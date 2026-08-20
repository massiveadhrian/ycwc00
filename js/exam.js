// ============================================
// DHRYZN — Practice Exam Component (Gemini 3.6 Flash)
// ============================================

import { generateDynamicExam } from '../utils/geminiApi.js';
import { staggerReveal } from '../utils/animations.js';
import { drawCircularProgress } from '../utils/charts.js';
import { difficultyLevels, gradeLevels } from '../data/sampleData.js';
import { getLocalDateStr } from '../store.js';
import { t } from '../utils/i18n.js';

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
        timeLeftSeconds: savedSession.timeLeftSeconds,
        endTime: savedSession.endTime
      },
      state,
      savedSession.configMeta
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
  const initDuration = pendingConfig?.duration || 45;

  container.innerHTML = `
    <div class="page-container">
      <div class="exam-config">
        <div class="exam-config-header">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-2);">
            <h1>${t('exam.title')}</h1>
            <span class="badge" style="background: rgba(var(--color-primary-rgb), 0.15); color: var(--color-primary-light); border: 1px solid rgba(var(--color-primary-rgb), 0.3); font-size: 0.8rem; padding: 4px 10px; border-radius: 999px; font-weight: 600;">
              ✨ Gemini 3.6 Flash
            </span>
          </div>
          <p>${t('exam.subtitle')}</p>
        </div>

        <div class="exam-config-form" id="exam-form-box">
          <div class="form-group animate-item">
            <label>${t('exam.subject')}</label>
            <input type="text" class="input-field" id="exam-subject" placeholder="${t('exam.subjectPlaceholder')}" value="${escapeHtml(initSubject)}">
          </div>

          <div class="form-group animate-item">
            <label>${t('exam.topicScope')}</label>
            <input type="text" class="input-field" id="exam-topic" placeholder="${t('exam.topicPlaceholder')}" value="${escapeHtml(initTopic)}">
          </div>

          <div class="form-row animate-item">
            <div class="form-group">
              <label>${t('exam.duration')}</label>
              <select class="select-field" id="exam-duration">
                <option value="15" ${initDuration === 15 ? 'selected' : ''}>${t('exam.min15')}</option>
                <option value="30" ${initDuration === 30 ? 'selected' : ''}>${t('exam.min30')}</option>
                <option value="45" ${initDuration === 45 ? 'selected' : ''}>${t('exam.min45')}</option>
                <option value="60" ${initDuration === 60 ? 'selected' : ''}>${t('exam.min60')}</option>
              </select>
            </div>
            <div class="form-group">
              <label>${t('exam.difficulty')}</label>
              <select class="select-field" id="exam-difficulty">
                ${difficultyLevels.map(d => `<option value="${d}" ${d === initDifficulty ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group animate-item">
            <label>${t('exam.numQuestions')}</label>
            <select class="select-field" id="exam-count">
              <option value="5" ${initCount === 5 ? 'selected' : ''}>${t('exam.q5Quick')}</option>
              <option value="10" ${initCount === 10 ? 'selected' : ''}>${t('exam.q10')}</option>
              <option value="15" ${initCount === 15 ? 'selected' : ''}>${t('exam.q15')}</option>
              <option value="20" ${initCount === 20 ? 'selected' : ''}>${t('exam.q20Standard')}</option>
            </select>
          </div>

          <div class="exam-config-actions animate-item">
            <button class="btn btn-secondary" id="exam-back-btn">${t('exam.cancel')}</button>
            <button class="btn btn-primary btn-lg" id="exam-start-btn">${t('exam.startExam')}</button>
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
    const subjectVal = container.querySelector('#exam-subject')?.value?.trim() || initSubject || 'General Subject';
    const topicVal = container.querySelector('#exam-topic')?.value?.trim() || initTopic || subjectVal;
    const duration = parseInt(container.querySelector('#exam-duration')?.value) || initDuration || 45;
    const count = parseInt(container.querySelector('#exam-count')?.value) || initCount || 10;
    const difficulty = container.querySelector('#exam-difficulty')?.value || initDifficulty || 'Hard';

    const formBox = container.querySelector('#exam-form-box');
    formBox.innerHTML = `
      <div style="text-align: center; padding: var(--space-10) var(--space-4);">
        <div style="font-size: 2.5rem; margin-bottom: var(--space-4);">✨</div>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">${t('exam.craftingExam')}</h3>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">${t('exam.generatingExamQuestions')} <strong>${escapeHtml(subjectVal)} — ${escapeHtml(topicVal)}</strong> (${count} ${t('exam.questionsPanel')})...</p>
        <div class="typing-indicator" style="justify-content: center; margin: 0 auto;">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;

    try {
      const questions = await generateDynamicExam(subjectVal, topicVal, count, difficulty, 'Grade 11');
      state.cleanup = renderExamEnvironment(container, questions, subjectVal, topicVal, duration, store, router, null, state, {
        subject: subjectVal,
        topic: topicVal,
        duration,
        difficulty,
        questionCount: count,
        gradeLevel: 'Grade 11'
      });
    } catch (e) {
      console.error('Exam generation error:', e);
      formBox.innerHTML = `
        <div style="text-align: center; padding: var(--space-8);">
          <div style="color: var(--color-error); font-size: 2rem; margin-bottom: var(--space-3);">⚠️</div>
          <h3 style="margin-bottom: var(--space-2);">${t('exam.couldNotGenerate')}</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">${t('exam.aiIssue')}</p>
          <button class="btn btn-primary" id="exam-retry-btn">${t('exam.tryAgain')}</button>
        </div>
      `;
      container.querySelector('#exam-retry-btn')?.addEventListener('click', () => {
        renderExamConfig(container, subject, store, router, state, pendingConfig);
      });
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
          <h1 style="font-size: var(--text-h1); margin-bottom: var(--space-3);">${t('quiz.unsupportedTitle')}</h1>
          <p style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto; line-height: var(--leading-relaxed);">
            <strong>${escapeHtml(subject)}${topic && topic !== subject ? ' — ' + escapeHtml(topic) : ''}</strong> ${t('exam.unsupportedDesc')}
          </p>
          <p style="color: var(--color-text-secondary); max-width: 480px; margin: var(--space-3) auto 0; line-height: var(--leading-relaxed);">
            ${t('quiz.unsupportedSub')}
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
              ${t('quiz.supportedCourses')}
            </div>
            <div style="color: var(--color-text-secondary); font-size: var(--text-sm); line-height: var(--leading-relaxed);">
              Mathematics • Physics • Chemistry • Biology • English • Computer Science • History • Economics • Geography • Japanese
            </div>
          </div>

          <div class="quiz-config-actions" style="justify-content: center; margin-top: var(--space-8);">
            <button class="btn btn-secondary" id="unsupported-back">${t('exam.goBack')}</button>
            <button class="btn btn-primary" id="unsupported-dashboard">${t('exam.dashboard')}</button>
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

function renderExamEnvironment(container, questions, subject, topic, durationMinutes, store, router, restored, state, configMeta) {
  let currentQuestion = restored ? restored.currentQuestion : 0;
  let answers = restored ? restored.answers : new Array(questions.length).fill(null);
  let bookmarked = restored ? restored.bookmarked : new Array(questions.length).fill(false);
  const effectiveConfig = configMeta || (restored && restored.configMeta) || {
    subject,
    topic,
    duration: durationMinutes,
    difficulty: 'Hard',
    questionCount: questions.length,
    gradeLevel: 'Grade 11'
  };

  let endTime;
  if (restored && typeof restored.endTime === 'number') {
    endTime = restored.endTime;
  } else if (restored && typeof restored.timeLeftSeconds === 'number') {
    endTime = Date.now() + restored.timeLeftSeconds * 1000;
  } else {
    endTime = Date.now() + durationMinutes * 60 * 1000;
  }

  function calculateTimeLeft() {
    return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  }

  let timeLeft = calculateTimeLeft();
  let timerInterval = null;

  function clearSession() {
    store.set('activeQuizSession', null);
  }

  if (timeLeft <= 0) {
    clearSession();
    submitExamResults(container, questions, answers, subject, topic, durationMinutes, 0, store, router, state, effectiveConfig);
    return () => {};
  }

  function saveSession() {
    timeLeft = calculateTimeLeft();
    store.set('activeQuizSession', {
      type: 'exam',
      subject,
      topic,
      durationMinutes,
      questions,
      answers: [...answers],
      bookmarked: [...bookmarked],
      currentQuestion,
      timeLeftSeconds: timeLeft,
      endTime,
      configMeta: effectiveConfig
    });
  }

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
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    timerInterval = setInterval(() => {
      timeLeft = calculateTimeLeft();
      const timerEl = container.querySelector('#exam-timer');
      if (timerEl) {
        timerEl.textContent = formatTime(timeLeft);
        timerEl.parentElement.className = `exam-timer ${getTimerClass()}`;
      }
      if (timeLeft % 10 === 0) {
        saveSession();
      }
      if (timeLeft <= 0) {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        clearSession();
        submitExamResults(container, questions, answers, subject, topic, durationMinutes, 0, store, router, state, effectiveConfig);
      }
    }, 1000);
  }

  function render() {
    timeLeft = calculateTimeLeft();
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
              <span>${escapeHtml(topic)}</span>
              <span>${answeredCount}/${questions.length} ${t('exam.answeredCount')}</span>
            </div>
          </div>

          <div class="exam-body">
            <div class="exam-question-area">
              <div class="exam-question-card">
                <div class="quiz-question-number">${t('exam.questionNum')} ${currentQuestion + 1}</div>
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
                    ${bookmarked[currentQuestion] ? '★' : '☆'} ${bookmarked[currentQuestion] ? t('exam.bookmarked') : t('exam.bookmark')}
                  </button>
                  <div style="display: flex; gap: var(--space-3);">
                    <button class="btn btn-secondary" id="exam-prev" ${currentQuestion === 0 ? 'disabled style="opacity:0.4"' : ''}>${t('exam.prev')}</button>
                    ${currentQuestion < questions.length - 1 ? `
                      <button class="btn btn-primary" id="exam-next">${t('exam.next')}</button>
                    ` : `
                      <button class="btn btn-primary" id="exam-review-btn">${t('exam.reviewSubmit')}</button>
                    `}
                  </div>
                </div>
              </div>
            </div>

            <div class="exam-nav-panel">
              <div class="exam-nav-card">
                <div class="exam-nav-title">${t('exam.questionsPanel')}</div>
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
                    <span>${t('exam.current')}</span>
                  </div>
                  <div class="exam-legend-item">
                    <div class="exam-legend-dot" style="background: var(--color-primary-subtle); border: 1px solid rgba(124,92,255,0.3);"></div>
                    <span>${t('exam.answered')}</span>
                  </div>
                  <div class="exam-legend-item">
                    <div class="exam-legend-dot" style="background: var(--color-bg); border: 1px solid var(--color-border);"></div>
                    <span>${t('exam.unanswered')}</span>
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
        renderExamReview(
          container,
          questions,
          answers,
          bookmarked,
          subject,
          topic,
          durationMinutes,
          endTime,
          store,
          router,
          () => {
            render();
          },
          () => {
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
            clearSession();
          },
          state,
          effectiveConfig
        );
      });
    }
  }

  startTimer();
  render();

  return () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };
}

function renderExamReview(container, questions, answers, bookmarked, subject, topic, durationMinutes, endTime, store, router, goBack, clearSession, state, configMeta) {
  const answeredCount = answers.filter(a => a !== null).length;
  const unanswered = questions.length - answeredCount;
  const bookmarkedCount = bookmarked.filter(b => b).length;

  container.innerHTML = `
    <div class="page-container">
      <div class="exam-review">
        <h2>${t('exam.reviewTitle')}</h2>
        <p class="text-secondary" style="margin-top: var(--space-2);">${t('exam.reviewDesc')}</p>

        <div class="exam-review-summary">
          <div class="exam-review-stat">
            <div class="exam-review-stat-value" style="color: var(--color-success);">${answeredCount}</div>
            <div class="exam-review-stat-label">${t('exam.answered')}</div>
          </div>
          <div class="exam-review-stat">
            <div class="exam-review-stat-value" style="color: var(--color-warning);">${unanswered}</div>
            <div class="exam-review-stat-label">${t('exam.unanswered')}</div>
          </div>
          <div class="exam-review-stat">
            <div class="exam-review-stat-value" style="color: var(--color-info);">${bookmarkedCount}</div>
            <div class="exam-review-stat-label">${t('exam.bookmarked')}</div>
          </div>
        </div>

        ${unanswered > 0 ? `
          <div style="background: var(--color-warning-bg); border: 1px solid rgba(251,191,36,0.2); border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5); margin-bottom: var(--space-5);">
            ${t('exam.warningUnanswered').replace('{count}', `<strong>${unanswered}</strong>`)}
          </div>
        ` : ''}

        <div class="exam-review-actions">
          <button class="btn btn-secondary" id="review-back">${t('exam.goBack')}</button>
          <button class="btn btn-primary btn-lg" id="review-submit">${t('exam.submitExam')}</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#review-back').addEventListener('click', goBack);

  container.querySelector('#review-submit').addEventListener('click', () => {
    clearSession();
    const remainingTime = typeof endTime === 'number' ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;
    submitExamResults(container, questions, answers, subject, topic, durationMinutes, remainingTime, store, router, state, configMeta);
  });
}

function submitExamResults(container, questions, answers, subject, topic, durationMinutes, timeLeft, store, router, state, configMeta) {
  // Ensure session is cleared when showing results
  store.set('activeQuizSession', null);

  let correct = 0;
  questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
  const score = Math.round((correct / questions.length) * 100);
  const timeUsed = (durationMinutes * 60) - timeLeft;
  const minutes = Math.floor(timeUsed / 60);

  console.log('[DHRYZN Runtime Diagnostic 1: Exam Submission]', {
    subject,
    topic,
    questionCount: questions ? questions.length : 0,
    answersCount: answers ? answers.length : 0,
    firstQuestion: questions && questions[0] ? questions[0] : null,
    firstAnswer: answers ? answers[0] : null
  });

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
    status: 'completed',
    questions,
    answers,
    questionType: 'Multiple Choice'
  });

  const latestExamHistory = store.get('examHistory');
  console.log('[DHRYZN Runtime Diagnostic 2: After addExamToHistory]', {
    savedHistoryLength: latestExamHistory ? latestExamHistory.length : 0,
    savedItemQuestions: latestExamHistory && latestExamHistory[0] ? latestExamHistory[0].questions : null
  });

  // Weak topics (mock)
  const weakTopics = [
    { name: t('exam.topicAdvanced'), score: Math.max(20, score - 30) },
    { name: t('exam.topicApplication'), score: Math.max(25, score - 20) },
    { name: t('exam.topicTheory'), score: Math.min(95, score + 10) }
  ];

  container.innerHTML = `
    <div class="page-container">
      <div class="exam-results">
        <div class="exam-results-header">
          <h1>${score >= 80 ? t('exam.outstanding') : score >= 60 ? t('exam.goodEffort') : t('exam.roomToGrow')}</h1>
          <p class="text-secondary">${score >= 80 ? t('exam.outstandingDesc') : score >= 60 ? t('exam.goodEffortDesc') : t('exam.roomToGrowDesc')}</p>
        </div>

        <div class="exam-results-grid">
          <div class="exam-result-card">
            <h3>${t('exam.performance')}</h3>
            <div class="readiness-gauge">
              <canvas id="exam-score-chart"></canvas>
              <div class="readiness-label">${score}%</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-4);">
              <div style="text-align: center;">
                <div style="font-size: var(--text-h2); font-weight: 700; color: var(--color-success);">${correct}</div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">${t('exam.correct')}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: var(--text-h2); font-weight: 700; color: var(--color-error);">${questions.length - correct}</div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">${t('exam.incorrect')}</div>
              </div>
            </div>
          </div>

          <div class="exam-result-card">
            <h3>${t('exam.timeAnalysis')}</h3>
            <div style="display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4) 0;">
              <div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-1);">${t('exam.timeUsed')}</div>
                <div style="font-size: var(--text-h2); font-weight: 700;">${minutes} min</div>
              </div>
              <div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-1);">${t('exam.avgPerQuestion')}</div>
                <div style="font-size: var(--text-h2); font-weight: 700;">${Math.round(timeUsed / questions.length)}s</div>
              </div>
              <div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-1);">${t('exam.timeRemaining')}</div>
                <div style="font-size: var(--text-h2); font-weight: 700;">${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s</div>
              </div>
            </div>
          </div>

          <div class="exam-result-card">
            <h3>${t('exam.topicAnalysis')}</h3>
            <div class="weak-topics-list">
              ${weakTopics.map(t => `
                <div class="weak-topic-item">
                  <span class="weak-topic-name">${escapeHtml(t.name)}</span>
                  <span class="weak-topic-score" style="color: ${t.score >= 70 ? 'var(--color-success)' : t.score >= 50 ? 'var(--color-warning)' : 'var(--color-error)'};">${t.score}%</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="exam-result-card">
            <h3>${t('exam.readinessTitle')}</h3>
            <div class="readiness-section" style="flex-direction: column; align-items: center;">
              <div class="readiness-chart-wrap">
                <canvas id="readiness-chart"></canvas>
                <div class="readiness-chart-value">${Math.round(score * 0.9)}%</div>
              </div>
              <div style="text-align: center; margin-top: var(--space-3);">
                <div class="readiness-status">${score >= 80 ? t('exam.readinessReady') : score >= 60 ? t('exam.readinessAlmost') : t('exam.readinessPractice')}</div>
                <div class="readiness-desc">${score >= 80 ? t('exam.readinessReadyDesc') : score >= 60 ? t('exam.readinessAlmostDesc') : t('exam.readinessPracticeDesc')}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); justify-content: center; margin-top: var(--space-6);">
          <button class="btn btn-secondary" id="exam-retake">${t('exam.retakeExam')}</button>
          <button class="btn btn-primary" id="exam-dashboard">${t('exam.dashboard')}</button>
        </div>
      </div>
    </div>
  `;

  // Draw charts
  const scoreCanvas = container.querySelector('#exam-score-chart');
  if (scoreCanvas) drawCircularProgress(scoreCanvas, score, { size: 120, lineWidth: 10 });

  const readinessCanvas = container.querySelector('#readiness-chart');
  if (readinessCanvas) drawCircularProgress(readinessCanvas, Math.round(score * 0.9), { size: 120, lineWidth: 10 });

  container.querySelector('#exam-retake').addEventListener('click', () => {
    store.set('activeQuizSession', null);
    if (state && state.cleanup) {
      state.cleanup();
      state.cleanup = null;
    }
    renderExamConfig(container, null, store, router, state || { cleanup: null }, {
      subject,
      topic,
      duration: durationMinutes,
      difficulty: configMeta?.difficulty || 'Hard',
      questionCount: configMeta?.questionCount || questions.length
    });
  });

  container.querySelector('#exam-dashboard').addEventListener('click', () => router.navigate('dashboard'));
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
