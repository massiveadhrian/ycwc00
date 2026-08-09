// ============================================
// DHRYZN — Dashboard Component (Gemini 3.6 Flash Studybot)
// ============================================

import { getGreeting } from '../utils/greeting.js';
import { chatWithStudybot } from '../utils/geminiApi.js';
import { staggerReveal } from '../utils/animations.js';
import { suggestedPrompts } from '../data/sampleData.js';
import { t } from '../utils/i18n.js';

export function renderDashboard(container, params, store, router) {
  const greeting = getGreeting();
  const progress = store.get('progress');
  const messages = store.get('chatMessages') || [];

  container.innerHTML = `
    <div class="page-container">
      <!-- Greeting -->
      <div class="dashboard-greeting">
        <div class="greeting-emoji">${greeting.emoji}</div>
        <h1 class="greeting-text">${greeting.text}!</h1>
        <p class="greeting-sub">${greeting.motivational}</p>
      </div>

      <!-- Quick Stats -->
      <div class="dashboard-stats">
        <div class="stat-card animate-item">
          <div class="stat-icon" style="background: rgba(var(--color-primary-rgb), 0.12); color: var(--color-primary-light);">🔥</div>
          <div class="stat-info">
            <div class="stat-value">${progress.streak}</div>
            <div class="stat-label">${t('stat.dayStreak')}</div>
          </div>
        </div>
        <div class="stat-card animate-item">
          <div class="stat-icon" style="background: rgba(52, 211, 153, 0.12); color: #34D399;">📊</div>
          <div class="stat-info">
            <div class="stat-value">${progress.averageAccuracy}%</div>
            <div class="stat-label">${t('stat.avgAccuracy')}</div>
          </div>
        </div>
        <div class="stat-card animate-item">
          <div class="stat-icon" style="background: rgba(96, 165, 250, 0.12); color: #60A5FA;">📝</div>
          <div class="stat-info">
            <div class="stat-value">${progress.completedQuizzes !== undefined ? progress.completedQuizzes : (progress.totalQuestions || 0)}</div>
            <div class="stat-label">${t('stat.completedQuizzes')}</div>
          </div>
        </div>
      </div>

      ${renderContinueCard(store)}

      <!-- Quick Actions -->
      <div class="quick-actions">
        <div class="quick-action-card animate-item" data-action="quiz">
          <div class="quick-action-icon quiz">📝</div>
          <div class="quick-action-title">${t('action.generateQuiz')}</div>
          <div class="quick-action-desc">${t('action.generateQuizDesc')}</div>
        </div>
        <div class="quick-action-card animate-item" data-action="explain">
          <div class="quick-action-icon explain">💡</div>
          <div class="quick-action-title">${t('action.explainTopic')}</div>
          <div class="quick-action-desc">${t('action.explainTopicDesc')}</div>
        </div>
        <div class="quick-action-card animate-item" data-action="exam">
          <div class="quick-action-icon exam">🎯</div>
          <div class="quick-action-title">${t('action.practiceExam')}</div>
          <div class="quick-action-desc">${t('action.practiceExamDesc')}</div>
        </div>
        <div class="quick-action-card animate-item" data-action="review">
          <div class="quick-action-icon review">🔍</div>
          <div class="quick-action-title">${t('action.reviewMistakes')}</div>
          <div class="quick-action-desc">${t('action.reviewMistakesDesc')}</div>
        </div>
      </div>

      <!-- AI Chat -->
      <div class="chat-section">
        <div class="chat-header">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <div class="chat-header-dot"></div>
            <span class="chat-header-title">${t('chat.title')}</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span class="badge" style="background: rgba(var(--color-primary-rgb), 0.15); color: var(--color-primary-light); border: 1px solid rgba(var(--color-primary-rgb), 0.3); font-size: 0.76rem; padding: 2px 8px; border-radius: 999px; font-weight: 600;">
              ✨ Gemini 3.6 Flash
            </span>
            <span class="chat-header-status">${t('chat.status')}</span>
          </div>
        </div>

        <div class="chat-messages" id="chat-messages">
          ${messages.length === 0 ? `
            <div class="chat-message ai">
              <div class="chat-avatar ai">D</div>
              <div class="chat-bubble">
                ${t('chat.greeting')}
              </div>
            </div>
          ` : messages.map(msg => `
            <div class="chat-message ${msg.role}">
              <div class="chat-avatar ${msg.role}">${msg.role === 'ai' ? 'D' : '👤'}</div>
              <div class="chat-bubble">${formatMessage(msg.content)}</div>
            </div>
          `).join('')}
        </div>

        <div class="chat-input-area">
          <div class="prompt-bar">
            <input type="text" class="prompt-input" id="prompt-input" placeholder="${t('chat.placeholder')}" autocomplete="off">
            <button class="prompt-send-btn" id="prompt-send" aria-label="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          <div class="suggested-prompts" id="suggested-prompts">
            ${suggestedPrompts.map(p => `
              <span class="suggested-prompt-chip">${p}</span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Animate items
  staggerReveal(container, '.animate-item', 60);

  // Chat functionality
  const chatMessages = container.querySelector('#chat-messages');
  const promptInput = container.querySelector('#prompt-input');
  const sendBtn = container.querySelector('#prompt-send');
  const suggestedPromptsEl = container.querySelector('#suggested-prompts');

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  scrollToBottom();

  async function sendMessage(text) {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: text };
    addMessageToUI(userMsg);
    
    const existingMsgs = store.get('chatMessages') || [];
    const updatedMsgs = [...existingMsgs, userMsg];
    store.set('chatMessages', updatedMsgs);

    promptInput.value = '';
    sendBtn.disabled = true;

    // Show typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message ai';
    typingEl.innerHTML = `
      <div class="chat-avatar ai">D</div>
      <div class="chat-bubble">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(typingEl);
    scrollToBottom();

    try {
      // Call Gemini 3.6 Flash Studybot
      const result = await chatWithStudybot(text, updatedMsgs, progress);

      // Remove typing indicator and add response
      chatMessages.removeChild(typingEl);
      const aiMsg = { role: 'ai', content: result.text };
      addMessageToUI(aiMsg);
      store.update('chatMessages', msgs => [...msgs, aiMsg]);

      // Handle navigation actions if user requested a quiz or exam
      if (result.action) {
        handleAction(result.action);
      }
    } catch (e) {
      console.error('Studybot error:', e);
      chatMessages.removeChild(typingEl);
      const errorMsg = { role: 'ai', content: `Sorry, I had a brief issue connecting to the AI model. Please try again!` };
      addMessageToUI(errorMsg);
    } finally {
      sendBtn.disabled = false;
      promptInput.focus();
    }
  }

  /** Handle navigation actions triggered by the AI conversation flow */
  function handleAction(action) {
    switch (action.type) {
      case 'NAVIGATE_QUIZ': {
        store.set('pendingQuizConfig', action.data);
        setTimeout(() => router.navigate('quiz'), 1200);
        break;
      }
      case 'NAVIGATE_EXPLAIN': {
        store.set('pendingExplainConfig', action.data);
        setTimeout(() => router.navigate('explain'), 1200);
        break;
      }
      case 'NAVIGATE_EXAM': {
        store.set('pendingExamConfig', action.data);
        setTimeout(() => router.navigate('exam'), 1200);
        break;
      }
    }
  }

  function addMessageToUI(msg) {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${msg.role}`;
    msgEl.innerHTML = `
      <div class="chat-avatar ${msg.role}">${msg.role === 'ai' ? 'D' : '👤'}</div>
      <div class="chat-bubble">${formatMessage(msg.content)}</div>
    `;
    chatMessages.appendChild(msgEl);
    scrollToBottom();
  }

  // Event listeners
  sendBtn.addEventListener('click', () => sendMessage(promptInput.value));

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(promptInput.value);
    }
  });

  suggestedPromptsEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.suggested-prompt-chip');
    if (chip) {
      sendMessage(chip.textContent.trim());
    }
  });

  // Quick action handlers
  container.querySelectorAll('.quick-action-card').forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      switch (action) {
        case 'quiz': router.navigate('quiz'); break;
        case 'explain': router.navigate('explain'); break;
        case 'exam': router.navigate('exam'); break;
        case 'review': router.navigate('history'); break;
      }
    });
  });

  // Continue session handlers
  const continueBtn = container.querySelector('#continue-session-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      const session = store.get('activeQuizSession');
      if (session) {
        router.navigate(session.type === 'exam' ? 'exam' : 'quiz');
      }
    });
  }

  const discardBtn = container.querySelector('#discard-session-btn');
  if (discardBtn) {
    discardBtn.addEventListener('click', () => {
      store.set('activeQuizSession', null);
      const card = container.querySelector('.continue-session-card');
      if (card) {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => card.remove(), 300);
      }
    });
  }
}

/** Render the "Continue Your Quiz/Exam" card if a saved session exists */
function renderContinueCard(store) {
  const session = store.get('activeQuizSession');
  if (!session) return '';

  const isExam = session.type === 'exam';
  const subject = session.subject || 'Unknown';
  const totalQuestions = session.questions ? session.questions.length : 0;
  const currentQ = (session.currentQuestion || 0) + 1;
  const percent = totalQuestions > 0 ? Math.round((currentQ / totalQuestions) * 100) : 0;

  let timeInfo = '';
  if (isExam && typeof session.timeLeftSeconds === 'number') {
    const m = Math.floor(session.timeLeftSeconds / 60);
    const s = session.timeLeftSeconds % 60;
    timeInfo = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return `
    <div class="continue-session-card animate-item">
      <div class="continue-session-content">
        <div class="continue-session-icon">${isExam ? '🎯' : '📝'}</div>
        <div class="continue-session-info">
          <div class="continue-session-title">Continue ${isExam ? 'Practice Exam' : 'Your Quiz'}</div>
          <div class="continue-session-subject">${subject}</div>
          <div class="continue-session-meta">
            <span>Question ${currentQ} / ${totalQuestions}</span>
            <span>•</span>
            <span>${percent}% Complete</span>
            ${timeInfo ? `<span>•</span><span>⏱ ${timeInfo}</span>` : ''}
          </div>
          <div class="continue-session-progress">
            <div class="continue-session-progress-fill" style="width: ${percent}%"></div>
          </div>
        </div>
      </div>
      <div class="continue-session-actions">
        <button class="btn btn-primary" id="continue-session-btn">${isExam ? '▶ Resume' : '▶ Continue'}</button>
        <button class="continue-session-discard" id="discard-session-btn" title="Discard session">✕</button>
      </div>
    </div>
  `;
}

function formatMessage(text) {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• (.*$)/gim, '<div style="display: flex; gap: 6px; margin: 4px 0;"><span style="color: var(--color-primary);">•</span><div>$1</div></div>')
    .replace(/^- (.*$)/gim, '<div style="display: flex; gap: 6px; margin: 4px 0;"><span style="color: var(--color-primary);">•</span><div>$1</div></div>')
    .replace(/\n\n/g, '<div style="height: 8px;"></div>')
    .replace(/\n/g, '<br>')
    .replace(/→ /g, '→ ');
}
