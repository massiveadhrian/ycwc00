// ============================================
// DHRYZN — Explain Topic Component (Gemini 3.6 Flash)
// ============================================

import { generateTopicExplanation } from '../utils/geminiApi.js';
import { staggerReveal, typewriterEffect } from '../utils/animations.js';
import { gradeLevels, explanationStyles } from '../data/sampleData.js';
import { t } from '../utils/i18n.js';

export function renderExplainTopic(container, params, store, router) {
  const subjectId = params[0];
  const subjects = store.get('subjects');
  const subject = subjectId ? subjects.find(s => s.id === subjectId) : null;
  const pendingConfig = store.get('pendingExplainConfig');

  if (pendingConfig) {
    store.set('pendingExplainConfig', null);
  }

  const initialTopic = pendingConfig?.topic || (subject ? subject.name : '');
  const initialGrade = pendingConfig?.grade || 'Grade 10';
  const initialStyle = pendingConfig?.style || 'Quick Summary';

  container.innerHTML = `
    <div class="page-container">
      <div class="quiz-config">
        <div class="quiz-config-header">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-2);">
            <h1>${t('explain.title')}</h1>
            <span class="badge" style="background: rgba(var(--color-primary-rgb), 0.15); color: var(--color-primary-light); border: 1px solid rgba(var(--color-primary-rgb), 0.3); font-size: 0.8rem; padding: 4px 10px; border-radius: 999px; font-weight: 600;">
              ✨ Gemini 3.6 Flash
            </span>
          </div>
          <p>${t('explain.subtitle')}</p>
        </div>

        <div class="quiz-config-form">
          <div class="form-group animate-item">
            <label>${t('explain.topic')}</label>
            <input type="text" class="input-field" id="explain-topic" placeholder="${t('explain.topicPlaceholder')}" value="${initialTopic}">
          </div>

          <div class="form-row animate-item">
            <div class="form-group">
              <label>${t('explain.gradeLevel')}</label>
              <select class="select-field" id="explain-grade">
                ${gradeLevels.map(g => `<option value="${g}" ${g === initialGrade ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>${t('explain.style')}</label>
              <select class="select-field" id="explain-style">
                ${explanationStyles.map(s => `<option value="${s}" ${s === initialStyle ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="quiz-config-actions animate-item">
            <button class="btn btn-secondary" id="explain-back-btn">${t('explain.cancel')}</button>
            <button class="btn btn-primary btn-lg" id="explain-go-btn">${t('explain.getExplanation')}</button>
          </div>
        </div>

        <!-- Explanation Result -->
        <div id="explanation-result" style="display: none; margin-top: var(--space-8);">
          <div class="divider"></div>
          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-6); margin-top: var(--space-6); box-shadow: var(--shadow-md);">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4);">
              <div style="display: flex; align-items: center; gap: var(--space-3);">
                <div style="width: 34px; height: 34px; background: var(--gradient-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;">D</div>
                <div>
                  <span style="font-weight: 700; font-size: 1rem; color: var(--color-text);">${t('explain.explains')}</span>
                  <div id="explanation-badge-sub" style="font-size: 0.78rem; color: var(--color-text-secondary);">${t('explain.poweredBy')}</div>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" id="copy-explanation-btn" title="Copy explanation text" style="padding: 4px 10px; font-size: 0.8rem;">${t('explain.copy')}</button>
            </div>
            <div id="explanation-content" style="line-height: 1.8; font-size: 0.96rem; color: var(--color-text);"></div>
          </div>

          <!-- Follow-up Actions -->
          <div style="display: flex; gap: var(--space-3); margin-top: var(--space-5); flex-wrap: wrap;">
            <button class="btn btn-secondary" id="followup-quiz">${t('explain.generateQuizThis')}</button>
            <button class="btn btn-secondary" id="followup-exam">${t('explain.practiceExamThis')}</button>
            <button class="btn btn-secondary" id="followup-another">${t('explain.explainAnother')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  staggerReveal(container, '.animate-item', 60);

  container.querySelector('#explain-back-btn').addEventListener('click', () => {
    window.history.back();
  });

  let currentTopicValue = initialTopic;
  let rawExplanationText = '';

  container.querySelector('#explain-go-btn').addEventListener('click', async () => {
    const topic = container.querySelector('#explain-topic').value.trim() || 'General Topic';
    const grade = container.querySelector('#explain-grade').value;
    const style = container.querySelector('#explain-style').value;
    currentTopicValue = topic;

    const resultEl = container.querySelector('#explanation-result');
    const contentEl = container.querySelector('#explanation-content');
    const goBtn = container.querySelector('#explain-go-btn');

    // Show loading indicator
    resultEl.style.display = 'block';
    goBtn.disabled = true;
    contentEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) 0; color: var(--color-text-secondary);">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
        <span style="font-size: 0.9rem;">${t('explain.explaining')}</span>
      </div>
    `;

    try {
      const explanation = await generateTopicExplanation(topic, style, grade);
      rawExplanationText = explanation;
      contentEl.textContent = '';
      
      await typewriterEffect(contentEl, explanation, 10);
      contentEl.innerHTML = formatMarkdown(contentEl.textContent);
    } catch (e) {
      console.error('Explanation generation failed:', e);
      contentEl.innerHTML = `<div style="color: var(--color-error);">${t('explain.failed')}</div>`;
    } finally {
      goBtn.disabled = false;
    }
  });

  // Copy button
  container.querySelector('#copy-explanation-btn')?.addEventListener('click', () => {
    if (rawExplanationText) {
      navigator.clipboard.writeText(rawExplanationText).then(() => {
        const copyBtn = container.querySelector('#copy-explanation-btn');
        copyBtn.textContent = t('explain.copied');
        setTimeout(() => { copyBtn.textContent = t('explain.copy'); }, 2000);
      });
    }
  });

  // Follow-up buttons
  container.querySelector('#followup-quiz')?.addEventListener('click', () => {
    store.set('pendingQuizConfig', {
      subject: subject ? subject.name : 'General',
      topic: currentTopicValue || 'General'
    });
    router.navigate('quiz');
  });

  container.querySelector('#followup-exam')?.addEventListener('click', () => {
    store.set('pendingExamConfig', {
      subject: subject ? subject.name : 'General',
      topic: currentTopicValue || 'General'
    });
    router.navigate('exam');
  });

  container.querySelector('#followup-another')?.addEventListener('click', () => {
    container.querySelector('#explain-topic').value = '';
    container.querySelector('#explanation-result').style.display = 'none';
    container.querySelector('#explain-topic').focus();
  });

  // If redirected with pending config, auto-trigger
  if (pendingConfig && pendingConfig.topic) {
    container.querySelector('#explain-go-btn').click();
  }
}

/**
 * Format markdown text with rich HTML tags
 */
function formatMarkdown(text) {
  if (!text) return '';
  return text
    // Headings
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1rem; font-weight: 700; margin: 16px 0 8px 0; color: var(--color-primary-light);">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.25rem; font-weight: 700; margin: 20px 0 10px 0; color: var(--color-text); border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.4rem; font-weight: 800; margin: 20px 0 12px 0; color: var(--color-text);">$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet points and lists
    .replace(/^• (.*$)/gim, '<div style="display: flex; gap: 8px; margin: 6px 0;"><span style="color: var(--color-primary);">•</span><div>$1</div></div>')
    .replace(/^- (.*$)/gim, '<div style="display: flex; gap: 8px; margin: 6px 0;"><span style="color: var(--color-primary);">•</span><div>$1</div></div>')
    .replace(/^([0-9]+)\. (.*$)/gim, '<div style="display: flex; gap: 8px; margin: 8px 0;"><span style="font-weight: 700; color: var(--color-primary); min-width: 20px;">$1.</span><div>$2</div></div>')
    // Line breaks
    .replace(/\n\n/g, '<div style="height: 12px;"></div>')
    .replace(/\n/g, '<br>');
}
