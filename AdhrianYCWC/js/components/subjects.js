// ============================================
// DHRYZN — Subjects Component (with Custom Course Deletion & Confirmation)
// ============================================

import { staggerReveal } from '../utils/animations.js';
import { t } from '../utils/i18n.js';

export function renderSubjects(container, params, store, router) {
  const subjects = store.get('subjects') || [];

  container.innerHTML = `
    <div class="page-container">
      <div class="subjects-header">
        <h1>${t('subjects.title')}</h1>
        <p>${t('subjects.desc')}</p>
      </div>

      <div class="subjects-grid">
        ${subjects.map(subject => {
          const isCustom = subject.isCustom === true && !subject.isBuiltIn;
          return `
            <div class="subject-card card-interactive animate-item ${isCustom ? 'custom-subject-card' : ''}" data-id="${subject.id}">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; width: 100%;">
                <div class="subject-icon" style="background: ${subject.color}18; color: ${subject.color};">${subject.icon}</div>
                ${isCustom ? `
                  <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <span class="badge" style="background: rgba(var(--color-primary-rgb), 0.15); color: var(--color-primary-light); font-size: 0.72rem; padding: 2px 8px; border-radius: 999px;">
                      Custom
                    </span>
                    <button class="delete-subject-btn" data-id="${subject.id}" data-name="${escapeHtml(subject.name)}" title="Delete Custom Course" aria-label="Delete Custom Course">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                ` : ''}
              </div>
              <div class="subject-name">${escapeHtml(subject.name)}</div>
              <div class="subject-meta">
                <span>📝 ${subject.questionsAnswered || 0} ${t('subjects.questionsAnswered')}</span>
              </div>
            </div>
          `;
        }).join('')}

        <div class="subject-card add-card card-interactive animate-item" id="add-subject-btn">
          <div class="add-card-icon">+</div>
          <div class="add-card-text">${t('subjects.addCustom')}</div>
        </div>
      </div>

      <!-- Add Subject Modal -->
      <div class="modal-overlay" id="add-subject-modal" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">${t('subjects.addCustom')}</h2>
            <button class="modal-close" id="modal-close-btn" aria-label="Close">✕</button>
          </div>
          <div class="subject-modal-input">
            <label>${t('subjects.subjectName')}</label>
            <input type="text" class="input-field" id="new-subject-name" placeholder="e.g., Economics, World History, Psychology" maxlength="40">
          </div>
          <div class="subject-modal-input">
            <label>${t('subjects.iconEmoji')}</label>
            <input type="text" class="input-field" id="new-subject-icon" placeholder="e.g., 📊, 🌍, 🧠" maxlength="4">
          </div>
          <div id="add-modal-feedback" style="display: none; color: var(--color-error); font-size: 0.85rem; margin-bottom: var(--space-3);"></div>
          <div class="subject-modal-actions">
            <button class="btn btn-secondary" id="modal-cancel-btn">${t('subjects.cancel')}</button>
            <button class="btn btn-primary" id="modal-save-btn">${t('subjects.addSubject')}</button>
          </div>
        </div>
      </div>

      <!-- Delete Custom Subject Confirmation Modal -->
      <div class="modal-overlay" id="delete-subject-modal" style="display: none;">
        <div class="modal delete-modal">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: var(--space-3);">
              <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: var(--color-error-bg); color: var(--color-error); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                ⚠️
              </div>
              <h2 class="modal-title">Delete Custom Course</h2>
            </div>
            <button class="modal-close" id="delete-modal-close-btn" aria-label="Close">✕</button>
          </div>
          <p style="color: var(--color-text-secondary); line-height: var(--leading-relaxed); margin-bottom: var(--space-6);">
            Are you sure you want to delete <strong id="delete-course-name" style="color: var(--color-text);"></strong>? This will permanently remove this custom course from your subjects list and cannot be undone.
          </p>
          <div style="display: flex; gap: var(--space-3); justify-content: flex-end;">
            <button class="btn btn-secondary" id="delete-modal-cancel-btn">Cancel</button>
            <button class="btn btn-primary" id="delete-modal-confirm-btn" style="background: var(--color-error); border-color: var(--color-error); box-shadow: none;">
              🗑️ Delete Course
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  staggerReveal(container, '.animate-item', 45);

  // Subject card click → navigate to detail (unless delete was clicked)
  container.querySelectorAll('.subject-card:not(.add-card)').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.delete-subject-btn')) {
        return; // Handled by delete handler
      }
      const id = card.dataset.id;
      router.navigate(`subject/${id}`);
    });
  });

  // Delete Custom Subject Handler
  const deleteModal = container.querySelector('#delete-subject-modal');
  const deleteCourseNameEl = container.querySelector('#delete-course-name');
  const deleteCloseBtn = container.querySelector('#delete-modal-close-btn');
  const deleteCancelBtn = container.querySelector('#delete-modal-cancel-btn');
  const deleteConfirmBtn = container.querySelector('#delete-modal-confirm-btn');

  let pendingDeleteId = null;

  function closeDeleteModal() {
    deleteModal.style.display = 'none';
    pendingDeleteId = null;
  }

  container.querySelectorAll('.delete-subject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      pendingDeleteId = btn.dataset.id;
      const courseName = btn.dataset.name || 'this course';
      deleteCourseNameEl.textContent = `"${courseName}"`;
      deleteModal.style.display = 'flex';
    });
  });

  deleteCloseBtn?.addEventListener('click', closeDeleteModal);
  deleteCancelBtn?.addEventListener('click', closeDeleteModal);
  deleteModal?.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  deleteConfirmBtn?.addEventListener('click', () => {
    if (!pendingDeleteId) return;

    const result = store.deleteSubject(pendingDeleteId);
    if (result && result.success) {
      closeDeleteModal();
      showSubjectToast('Custom course deleted successfully.');
      renderSubjects(container, params, store, router); // Re-render to reflect new list
    } else {
      alert(result?.error || 'Failed to delete course.');
      closeDeleteModal();
    }
  });

  // Add subject modal
  const addModal = container.querySelector('#add-subject-modal');
  const addBtn = container.querySelector('#add-subject-btn');
  const closeBtn = container.querySelector('#modal-close-btn');
  const cancelBtn = container.querySelector('#modal-cancel-btn');
  const saveBtn = container.querySelector('#modal-save-btn');
  const nameInput = container.querySelector('#new-subject-name');
  const iconInput = container.querySelector('#new-subject-icon');
  const addFeedback = container.querySelector('#add-modal-feedback');

  function openAddModal() {
    addModal.style.display = 'flex';
    addFeedback.style.display = 'none';
    nameInput.focus();
  }

  function closeAddModal() {
    addModal.style.display = 'none';
    nameInput.value = '';
    iconInput.value = '';
    addFeedback.style.display = 'none';
  }

  addBtn?.addEventListener('click', openAddModal);
  closeBtn?.addEventListener('click', closeAddModal);
  cancelBtn?.addEventListener('click', closeAddModal);
  addModal?.addEventListener('click', (e) => {
    if (e.target === addModal) closeAddModal();
  });

  saveBtn?.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const icon = iconInput.value.trim() || '📄';
    
    if (!name) {
      addFeedback.textContent = 'Please enter a subject name.';
      addFeedback.style.display = 'block';
      return;
    }

    const currentSubjects = store.get('subjects') || [];
    if (currentSubjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      addFeedback.textContent = 'A subject with this name already exists.';
      addFeedback.style.display = 'block';
      return;
    }

    const colors = ['#7C5CFF', '#60A5FA', '#34D399', '#F87171', '#FBBF24', '#A78BFA', '#FB923C'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    store.addSubject({ name, icon, color });
    closeAddModal();
    showSubjectToast(`Added custom course: ${name}`);
    renderSubjects(container, params, store, router); // Re-render
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

function showSubjectToast(msg) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `<span>✅</span> <span>${msg}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
