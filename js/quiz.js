// ============================================
// DHRYZN — Quiz Component (Gemini 3.6 Flash)
// ============================================

import { generateDynamicQuiz } from '../utils/geminiApi.js';
import { staggerReveal } from '../utils/animations.js';
import { drawCircularProgress } from '../utils/charts.js';
import { difficultyLevels, gradeLevels, questionTypes } from '../data/sampleData.js';
import { getLocalDateStr } from '../store.js';
import { t } from '../utils/i18n.js';

export function renderQuiz(container, params, store, router) {
  const subjectId = params[0];
  const subjects = store.get('subjects');
  const subject = subjectId ? subjects.find(s => s.id === subjectId) : null;

  // Check if we were directed here from the AI conversation
  const pendingConfig = store.get('pendingQuizConfig');
  if (pendingConfig) {
    store.set('pendingQuizConfig', null); // Clear it so it doesn't re-trigger
  }

  // Check for a saved quiz session to resume
  const savedSession = store.get('activeQuizSession');
  if (savedSession && savedSession.type === 'quiz') {
    renderQuizTaking(
      container,
      savedSession.questions,
      savedSession.subject,
      savedSession.topic,
      savedSession.questionType,
      store,
      router,
      {
        currentQuestion: savedSession.currentQuestion,
        answers: savedSession.answers,
        answered: savedSession.answered,
        startTime: savedSession.startTime
      },
      savedSession.configMeta
    );
    return;
  }

  renderQuizConfig(container, subject, store, router, pendingConfig);
}

function renderQuizConfig(container, subject, store, router, pendingConfig) {
  // Determine initial values (pending AI config > subject param > defaults)
  const initSubject = pendingConfig?.subject || (subject ? subject.name : '');
  const initTopic = pendingConfig?.topic || '';
  const initDifficulty = pendingConfig?.difficulty || 'Medium';
  const initType = pendingConfig?.questionType || 'Multiple Choice';
  const initCount = Number(pendingConfig?.questionCount) || 10;
  const initGrade = pendingConfig?.gradeLevel || 'Grade 10';

  container.innerHTML = `
    <div class="page-container">
      <div class="quiz-config">
        <div class="quiz-config-header">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-2);">
            <h1>${t('quiz.generateTitle')}</h1>
            <span class="badge" style="background: rgba(var(--color-primary-rgb), 0.15); color: var(--color-primary-light); border: 1px solid rgba(var(--color-primary-rgb), 0.3); font-size: 0.8rem; padding: 4px 10px; border-radius: 999px; font-weight: 600;">
              ✨ Gemini 3.6 Flash
            </span>
          </div>
          <p>${t('quiz.generateDesc')}</p>
        </div>

        <div class="quiz-config-form" id="quiz-form-box">
          <div class="form-group animate-item">
            <label>${t('quiz.subject')}</label>
            <input type="text" class="input-field" id="quiz-subject" placeholder="${t('quiz.subjectPlaceholder')}" value="${escapeHtml(initSubject)}">
          </div>

          <div class="form-group animate-item">
            <label>${t('quiz.topic')}</label>
            <input type="text" class="input-field" id="quiz-topic" placeholder="${t('quiz.topicPlaceholder')}" value="${escapeHtml(initTopic)}">
          </div>

          <div class="form-row animate-item">
            <div class="form-group">
              <label>${t('quiz.gradeLevel')}</label>
              <select class="select-field" id="quiz-grade">
                ${gradeLevels.map(g => `<option value="${g}" ${g === initGrade ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>${t('quiz.difficulty')}</label>
              <select class="select-field" id="quiz-difficulty">
                ${difficultyLevels.map(d => `<option value="${d}" ${d === initDifficulty ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group animate-item">
            <label>${t('quiz.numQuestions')}</label>
            <select class="select-field" id="quiz-count">
              <option value="5" ${initCount === 5 ? 'selected' : ''}>5 ${t('quiz.questions')}</option>
              <option value="10" ${initCount === 10 ? 'selected' : ''}>10 ${t('quiz.questions')}</option>
              <option value="15" ${initCount === 15 ? 'selected' : ''}>15 ${t('quiz.questions')}</option>
              <option value="20" ${initCount === 20 ? 'selected' : ''}>20 ${t('quiz.questions')}</option>
            </select>
          </div>

          <div class="form-group animate-item">
            <label>${t('quiz.questionType')}</label>
            <div class="question-type-grid" id="question-type-grid">
              ${questionTypes.map((typeOption) => `
                <div class="question-type-option${typeOption === initType ? ' selected' : ''}" data-type="${typeOption}">${typeOption}</div>
              `).join('')}
            </div>
          </div>

          <div class="quiz-config-actions animate-item">
            <button class="btn btn-secondary" id="quiz-back-btn">${t('quiz.cancel')}</button>
            <button class="btn btn-primary btn-lg" id="quiz-start-btn">${t('quiz.startQuiz')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  staggerReveal(container, '.animate-item', 60);

  // Question type toggle
  let selectedType = initType;
  container.querySelector('#question-type-grid').addEventListener('click', (e) => {
    const opt = e.target.closest('.question-type-option');
    if (!opt) return;
    container.querySelectorAll('.question-type-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedType = opt.dataset.type;
  });

  // Back
  container.querySelector('#quiz-back-btn').addEventListener('click', () => {
    window.history.back();
  });

  // Start quiz
  container.querySelector('#quiz-start-btn').addEventListener('click', async () => {
    const subjectVal = container.querySelector('#quiz-subject')?.value?.trim() || initSubject || 'General Knowledge';
    const topicVal = container.querySelector('#quiz-topic')?.value?.trim() || initTopic || subjectVal;
    const gradeVal = container.querySelector('#quiz-grade')?.value || initGrade || 'Grade 10';
    const count = parseInt(container.querySelector('#quiz-count')?.value) || initCount || 10;
    const difficulty = container.querySelector('#quiz-difficulty')?.value || initDifficulty || 'Medium';

    const formBox = container.querySelector('#quiz-form-box');
    formBox.innerHTML = `
      <div style="text-align: center; padding: var(--space-10) var(--space-4);">
        <div style="font-size: 2.5rem; margin-bottom: var(--space-4);">✨</div>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">${t('quiz.craftingQuiz')}</h3>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">${t('quiz.generatingQuestions')} <strong>${escapeHtml(topicVal)}</strong> (${count} ${t('quiz.questions')})...</p>
        <div class="typing-indicator" style="justify-content: center; margin: 0 auto;">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;

    try {
      const questions = await generateDynamicQuiz(subjectVal, topicVal, count, selectedType, difficulty, gradeVal);
      renderQuizTaking(container, questions, subjectVal, topicVal, selectedType, store, router, null, {
        subject: subjectVal,
        topic: topicVal,
        difficulty,
        gradeLevel: gradeVal,
        questionCount: count,
        questionType: selectedType
      });
    } catch (e) {
      console.error('Failed to generate quiz:', e);
      formBox.innerHTML = `
        <div style="text-align: center; padding: var(--space-8);">
          <div style="color: var(--color-error); font-size: 2rem; margin-bottom: var(--space-3);">⚠️</div>
          <h3 style="margin-bottom: var(--space-2);">${t('quiz.couldNotGenerate')}</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">${t('quiz.aiIssue')}</p>
          <button class="btn btn-primary" id="quiz-error-retry">${t('quiz.tryAgain')}</button>
        </div>
      `;
      container.querySelector('#quiz-error-retry')?.addEventListener('click', () => {
        renderQuizConfig(container, subject, store, router, {
          subject: subjectVal,
          topic: topicVal,
          difficulty,
          gradeLevel: gradeVal,
          questionCount: count,
          questionType: selectedType
        });
      });
    }
  });
}

/** Friendly message when a course doesn't have proper quiz content */
function renderUnsupportedCourse(container, subject, topic, store, router) {
  container.innerHTML = `
    <div class="page-container">
      <div class="quiz-config">
        <div class="quiz-config-header" style="text-align: center; padding: var(--space-10) 0;">
          <div style="font-size: 3rem; margin-bottom: var(--space-4);">🧪</div>
          <h1 style="font-size: var(--text-h1); margin-bottom: var(--space-3);">${t('quiz.unsupportedTitle')}</h1>
          <p style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto; line-height: var(--leading-relaxed);">
            <strong>${subject}${topic && topic !== subject ? ' — ' + topic : ''}</strong> ${t('quiz.unsupportedDesc')}
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
            <button class="btn btn-secondary" id="unsupported-back">${t('quiz.goBack')}</button>
            <button class="btn btn-primary" id="unsupported-dashboard">${t('quiz.dashboard')}</button>
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

function renderQuizTaking(container, questions, subject, topic, questionType, store, router, restored, configMeta) {
  let currentQuestion = restored ? restored.currentQuestion : 0;
  let answers = restored ? restored.answers : new Array(questions.length).fill(null);
  let answered = restored ? restored.answered : new Array(questions.length).fill(false);
  let startTime = restored ? restored.startTime : Date.now();
  const effectiveConfig = configMeta || (restored && restored.configMeta) || {
    subject,
    topic,
    questionType,
    questionCount: questions.length,
    difficulty: 'Medium',
    gradeLevel: 'Grade 10'
  };

  /** Save the current quiz session to the store for resume */
  function saveSession() {
    store.set('activeQuizSession', {
      type: 'quiz',
      subject,
      topic,
      questionType,
      questions,
      answers: [...answers],
      answered: [...answered],
      currentQuestion,
      startTime,
      configMeta: effectiveConfig
    });
  }

  /** Clear the saved session (quiz is done) */
  function clearSession() {
    store.set('activeQuizSession', null);
  }

  // Save immediately when entering the quiz
  saveSession();

  function render() {
    const q = questions[currentQuestion];
    const isAnswered = answered[currentQuestion];
    const isTF = questionType === 'True / False';
    const isText = questionType === 'Short Answer' || questionType === 'Essay';
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    const trueLetter = t('quiz.trueLetter');
    const falseLetter = t('quiz.falseLetter');
    const trueText = t('quiz.trueText');
    const falseText = t('quiz.falseText');

    container.innerHTML = `
      <div class="page-container">
        <div class="quiz-taking">
          <div class="quiz-progress-header">
            <span class="quiz-progress-text">${t('quiz.questionOf')} ${currentQuestion + 1} ${t('quiz.of')} ${questions.length}</span>
            <span class="quiz-progress-text">${escapeHtml(topic)}</span>
          </div>
          <div class="quiz-progress-bar">
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
          </div>

          <div class="quiz-question-card">
            <div class="quiz-question-number">${t('quiz.questionOf')} ${currentQuestion + 1}</div>
            <div class="quiz-question-text">${q.question}</div>

            ${isText ? `
              <textarea class="quiz-text-input" id="text-answer" placeholder="${t('quiz.typePlaceholder')}" rows="${questionType === 'Essay' ? 6 : 2}">${answers[currentQuestion] || ''}</textarea>
            ` : isTF ? `
              <div class="quiz-options">
                <div class="quiz-option ${answers[currentQuestion] === true ? 'selected' : ''} ${isAnswered ? (q.answer === true ? 'correct' : answers[currentQuestion] === true ? 'incorrect' : '') : ''} ${isAnswered ? 'disabled' : ''}" data-answer="true">
                  <div class="quiz-option-letter">${answers[currentQuestion] === true && isAnswered ? (q.answer === true ? '✓' : '✗') : trueLetter}</div>
                  <span>${trueText}</span>
                </div>
                <div class="quiz-option ${answers[currentQuestion] === false ? 'selected' : ''} ${isAnswered ? (q.answer === false ? 'correct' : answers[currentQuestion] === false ? 'incorrect' : '') : ''} ${isAnswered ? 'disabled' : ''}" data-answer="false">
                  <div class="quiz-option-letter">${answers[currentQuestion] === false && isAnswered ? (q.answer === false ? '✓' : '✗') : falseLetter}</div>
                  <span>${falseText}</span>
                </div>
              </div>
            ` : `
              <div class="quiz-options">
                ${q.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected = answers[currentQuestion] === i;
                  const isCorrect = q.correct === i;
                  let classes = 'quiz-option';
                  if (isSelected) classes += ' selected';
                  if (isAnswered) {
                    classes += ' disabled';
                    if (isCorrect) classes += ' correct';
                    else if (isSelected && !isCorrect) classes += ' incorrect';
                  }
                  let letterContent = letter;
                  if (isAnswered && isCorrect) letterContent = '✓';
                  else if (isAnswered && isSelected && !isCorrect) letterContent = '✗';
                  return `
                    <div class="${classes}" data-index="${i}">
                      <div class="quiz-option-letter">${letterContent}</div>
                      <span>${opt}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            `}

            ${isAnswered && q.explanation ? `
              <div class="quiz-feedback ${isTF ? (answers[currentQuestion] === q.answer ? 'correct' : 'incorrect') : (answers[currentQuestion] === q.correct ? 'correct' : 'incorrect')}">
                <div class="quiz-feedback-title">
                  ${isTF ? (answers[currentQuestion] === q.answer ? t('quiz.correctFeedback') : t('quiz.incorrectFeedback')) : (answers[currentQuestion] === q.correct ? t('quiz.correctFeedback') : t('quiz.incorrectFeedback'))}
                </div>
                <div>${q.explanation}</div>
              </div>
            ` : ''}
          </div>

          <div class="quiz-nav-actions">
            <button class="btn btn-secondary" id="quiz-prev" ${currentQuestion === 0 ? 'disabled style="opacity:0.4"' : ''}>${t('quiz.previous')}</button>
            <div style="display: flex; gap: var(--space-3);">
              ${!isAnswered && !isText ? `<button class="btn btn-secondary" id="quiz-check" disabled>${t('quiz.checkAnswer')}</button>` : ''}
              ${isText && !isAnswered ? `<button class="btn btn-primary" id="quiz-submit-text">${t('quiz.submitAnswer')}</button>` : ''}
              ${currentQuestion < questions.length - 1 ? `
                <button class="btn btn-primary" id="quiz-next">${t('quiz.next')}</button>
              ` : `
                <button class="btn btn-primary" id="quiz-finish">${t('quiz.finish')}</button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Event handlers
    if (!isText && !isAnswered) {
      container.querySelectorAll('.quiz-option').forEach(opt => {
        opt.addEventListener('click', () => {
          if (isAnswered) return;

          if (isTF) {
            answers[currentQuestion] = opt.dataset.answer === 'true';
          } else {
            answers[currentQuestion] = parseInt(opt.dataset.index);
          }

          container.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');

          const checkBtn = container.querySelector('#quiz-check');
          if (checkBtn) checkBtn.disabled = false;

          saveSession();
        });
      });

      const checkBtn = container.querySelector('#quiz-check');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          answered[currentQuestion] = true;
          saveSession();
          render();
        });
      }
    }

    // Text answer submit
    const submitTextBtn = container.querySelector('#quiz-submit-text');
    if (submitTextBtn) {
      submitTextBtn.addEventListener('click', () => {
        const textEl = container.querySelector('#text-answer');
        answers[currentQuestion] = textEl.value.trim();
        answered[currentQuestion] = true;
        saveSession();
        render();
      });
    }

    // Navigation
    const prevBtn = container.querySelector('#quiz-prev');
    if (prevBtn && currentQuestion > 0) {
      prevBtn.addEventListener('click', () => { currentQuestion--; saveSession(); render(); });
    }

    const nextBtn = container.querySelector('#quiz-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => { currentQuestion++; saveSession(); render(); });
    }

    const finishBtn = container.querySelector('#quiz-finish');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        clearSession();
        const elapsed = Date.now() - startTime;
        renderQuizResults(container, questions, answers, answered, questionType, subject, topic, elapsed, store, router, effectiveConfig);
      });
    }
  }

  render();
}

function renderQuizResults(container, questions, answers, answered, questionType, subject, topic, elapsed, store, router, configMeta) {
  // Ensure session is cleared when showing results
  store.set('activeQuizSession', null);

  const isTF = questionType === 'True / False';
  const isText = questionType === 'Short Answer' || questionType === 'Essay';

  let correct = 0;
  if (isText) {
    correct = answers.filter(a => a && a.length > 0).length; // All text answers count as correct for demo
  } else if (isTF) {
    questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
  } else {
    questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
  }

  const score = Math.round((correct / questions.length) * 100);
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const duration = `${minutes}m ${seconds}s`;

  console.log('[DHRYZN Runtime Diagnostic 1: Quiz Submission]', {
    subject,
    topic,
    questionCount: questions ? questions.length : 0,
    answersCount: answers ? answers.length : 0,
    questionType,
    firstQuestion: questions && questions[0] ? questions[0] : null,
    firstAnswer: answers ? answers[0] : null
  });

  // Save to history with distinct subject and topic
  store.addQuizToHistory({
    id: 'q-' + Date.now(),
    subject: subject,
    topic: topic,
    date: getLocalDateStr(new Date()),
    duration: `${minutes} min`,
    score,
    total: questions.length,
    correct,
    type: 'quiz',
    status: 'completed',
    questions,
    answers,
    questionType
  });

  const latestHistory = store.get('quizHistory');
  console.log('[DHRYZN Runtime Diagnostic 2: After addQuizToHistory]', {
    savedHistoryLength: latestHistory ? latestHistory.length : 0,
    savedItemQuestions: latestHistory && latestHistory[0] ? latestHistory[0].questions : null
  });

  const trueText = t('quiz.trueText');
  const falseText = t('quiz.falseText');

  container.innerHTML = `
    <div class="page-container">
      <div class="quiz-results">
        <h1 style="font-size: var(--text-h1); margin-bottom: var(--space-2);">
          ${score >= 80 ? t('quiz.excellent') : score >= 60 ? t('quiz.goodJob') : t('quiz.keepPracticing')}
        </h1>
        <p class="text-secondary">${score >= 80 ? t('quiz.excellentDesc') : score >= 60 ? t('quiz.goodJobDesc') : t('quiz.keepPracticingDesc')}</p>

        <div class="quiz-results-score">
          <div class="quiz-score-circle">
            <canvas id="score-chart"></canvas>
            <div class="quiz-score-value">${score}%</div>
          </div>
        </div>

        <div class="quiz-results-stats">
          <div class="quiz-result-stat">
            <div class="quiz-result-stat-value" style="color: var(--color-success);">${correct}</div>
            <div class="quiz-result-stat-label">${t('quiz.correctLabel')}</div>
          </div>
          <div class="quiz-result-stat">
            <div class="quiz-result-stat-value" style="color: var(--color-error);">${questions.length - correct}</div>
            <div class="quiz-result-stat-label">${t('quiz.incorrectLabel')}</div>
          </div>
          <div class="quiz-result-stat">
            <div class="quiz-result-stat-value">${duration}</div>
            <div class="quiz-result-stat-label">${t('quiz.timeTaken')}</div>
          </div>
        </div>

        <div class="quiz-results-actions">
          <button class="btn btn-secondary" id="results-review">${t('quiz.reviewAnswers')}</button>
          <button class="btn btn-primary" id="results-retry">${t('quiz.tryAgain')}</button>
          <button class="btn btn-secondary" id="results-home">${t('quiz.dashboard')}</button>
        </div>

        <div class="quiz-review-list" id="review-list" style="display: none;">
          <h3>${t('quiz.answerReview')}</h3>
          ${questions.map((q, i) => {
            let isCorrectAnswer;
            if (isTF) isCorrectAnswer = answers[i] === q.answer;
            else if (isText) isCorrectAnswer = answers[i] && answers[i].length > 0;
            else isCorrectAnswer = answers[i] === q.correct;

            const userAns = isText
              ? (answers[i] || t('quiz.notAnswered'))
              : isTF
              ? (answers[i] === null ? t('quiz.notAnswered') : answers[i] ? trueText : falseText)
              : (answers[i] !== null && answers[i] !== undefined && q.options && q.options[answers[i]] !== undefined ? q.options[answers[i]] : t('quiz.notAnswered'));

            const correctAns = isText
              ? (q.sampleAnswer || q.explanation || '')
              : isTF
              ? (q.answer ? trueText : falseText)
              : (q.options && q.correct !== undefined ? q.options[q.correct] : '');

            return `
              <div class="quiz-review-item ${isCorrectAnswer ? 'correct' : 'incorrect'}">
                <div class="quiz-review-question">${i + 1}. ${escapeHtml(q.question)}</div>
                <div class="quiz-review-answer">
                  <div><strong>${t('quiz.yourAnswer')}:</strong> ${escapeHtml(userAns)}</div>
                  ${!isCorrectAnswer ? `<div><strong>${t('quiz.correctAnswer')}:</strong> ${escapeHtml(correctAns)}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Draw score chart
  const canvas = container.querySelector('#score-chart');
  if (canvas) {
    drawCircularProgress(canvas, score, { size: 140, lineWidth: 10 });
  }

  // Event handlers
  container.querySelector('#results-review').addEventListener('click', () => {
    const list = container.querySelector('#review-list');
    list.style.display = list.style.display === 'none' ? 'block' : 'none';
  });

  const retryBtn = container.querySelector('#results-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      store.set('activeQuizSession', null);
      renderQuizConfig(container, null, store, router, {
        subject: configMeta?.subject || subject,
        topic: configMeta?.topic || topic,
        difficulty: configMeta?.difficulty || 'Medium',
        gradeLevel: configMeta?.gradeLevel || 'Grade 10',
        questionType: configMeta?.questionType || questionType,
        questionCount: configMeta?.questionCount || questions.length
      });
    });
  }

  container.querySelector('#results-home').addEventListener('click', () => {
    router.navigate('dashboard');
  });
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
