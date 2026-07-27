/**
 * UI Renderer Module (ui.js)
 * Responsible for modern DOM manipulation, task card rendering,
 * statistics dashboard updates, toast alerts, and visual animations.
 */

export class UIRenderer {
  constructor() {
    this.elements = {
      taskList: document.getElementById('task-list'),
      emptyState: document.getElementById('empty-state'),
      statTotal: document.getElementById('stat-total'),
      statCompleted: document.getElementById('stat-completed'),
      statActive: document.getElementById('stat-active'),
      statPercentage: document.getElementById('stat-percentage'),
      progressBar: document.getElementById('progress-bar-fill'),
      progressRing: document.getElementById('progress-ring-circle'),
      toastContainer: document.getElementById('toast-container'),
      confettiCanvas: document.getElementById('confetti-canvas'),
      filterContainer: document.getElementById('filter-chips'),
      categoryContainer: document.getElementById('category-chips'),
      searchInput: document.getElementById('search-input'),
      sortSelect: document.getElementById('sort-select'),
      themeToggleBtn: document.getElementById('theme-toggle')
    };

    this.editingTaskId = null;
  }

  /**
   * Render main task list view based on current state
   * @param {Array} tasks - Filtered and sorted tasks array
   * @param {Object} state - Full state object
   */
  renderTaskList(tasks, state) {
    const listElement = this.elements.taskList;
    if (!listElement) return;

    // Clear previous list using modern replaceChildren()
    if (tasks.length === 0) {
      listElement.replaceChildren();
      this.renderEmptyState(state);
      return;
    }

    if (this.elements.emptyState) {
      this.elements.emptyState.style.display = 'none';
    }

    const taskCardNodes = tasks.map((task, index) => this.createTaskCardElement(task, index));
    listElement.replaceChildren(...taskCardNodes);
  }

  /**
   * Create a single task card DOM element using native DOM APIs
   */
  createTaskCardElement(task, index) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''} priority-${task.priority}`;
    card.dataset.id = task.id;
    card.dataset.index = index;
    card.setAttribute('draggable', 'true');
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Task: ${task.title}`);

    // Drag Handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.setAttribute('aria-label', 'Drag to reorder task');
    dragHandle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>`;

    // Checkbox Custom Control
    const checkBtn = document.createElement('button');
    checkBtn.className = `task-checkbox ${task.completed ? 'checked' : ''}`;
    checkBtn.setAttribute('type', 'button');
    checkBtn.setAttribute('aria-label', task.completed ? 'Mark task as incomplete' : 'Mark task as complete');
    checkBtn.dataset.action = 'toggle';
    checkBtn.innerHTML = task.completed
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : '';

    // Task Content Container
    const contentBox = document.createElement('div');
    contentBox.className = 'task-content-box';

    // If currently editing this task inline
    if (this.editingTaskId === task.id) {
      const editForm = document.createElement('form');
      editForm.className = 'inline-edit-form';
      editForm.dataset.action = 'save-edit';

      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'inline-edit-input';
      editInput.value = task.title;
      editInput.required = true;
      editInput.setAttribute('aria-label', 'Edit task title');

      const saveBtn = document.createElement('button');
      saveBtn.type = 'submit';
      saveBtn.className = 'btn-icon-sm btn-save';
      saveBtn.setAttribute('aria-label', 'Save changes');
      saveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn-icon-sm btn-cancel';
      cancelBtn.dataset.action = 'cancel-edit';
      cancelBtn.setAttribute('aria-label', 'Cancel editing');
      cancelBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

      editForm.append(editInput, saveBtn, cancelBtn);
      contentBox.append(editForm);

      // Auto focus input
      setTimeout(() => editInput.focus(), 50);
    } else {
      // Title
      const titleEl = document.createElement('span');
      titleEl.className = 'task-title';
      titleEl.textContent = task.title;

      // Meta Info (Badges & Dates)
      const metaBox = document.createElement('div');
      metaBox.className = 'task-meta-box';

      // Priority Badge
      const priorityBadge = document.createElement('span');
      priorityBadge.className = `badge badge-priority badge-priority-${task.priority}`;
      priorityBadge.textContent = task.priority.toUpperCase();

      // Category Chip
      const categoryChip = document.createElement('span');
      categoryChip.className = 'badge badge-category';
      categoryChip.textContent = `#${task.category}`;

      metaBox.append(priorityBadge, categoryChip);

      // Due Date (if set)
      if (task.dueDate) {
        const dueDateEl = document.createElement('span');
        const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
        dueDateEl.className = `task-due-date ${isOverdue ? 'overdue' : ''}`;
        dueDateEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${task.dueDate}`;
        metaBox.append(dueDateEl);
      }

      contentBox.append(titleEl, metaBox);
    }

    // Action Buttons
    const actionsBox = document.createElement('div');
    actionsBox.className = 'task-actions-box';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-task-action btn-edit';
    editBtn.dataset.action = 'edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-task-action btn-delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

    actionsBox.append(editBtn, deleteBtn);

    card.append(dragHandle, checkBtn, contentBox, actionsBox);
    return card;
  }

  /**
   * Render Empty State when no tasks match
   */
  renderEmptyState(state) {
    if (!this.elements.emptyState) return;

    this.elements.emptyState.style.display = 'flex';
    const titleEl = this.elements.emptyState.querySelector('.empty-title');
    const descEl = this.elements.emptyState.querySelector('.empty-desc');

    if (state.search) {
      if (titleEl) titleEl.textContent = 'No tasks matched your search';
      if (descEl) descEl.textContent = `Try searching for something else or clear filter "${state.search}".`;
    } else if (state.filter === 'completed') {
      if (titleEl) titleEl.textContent = 'No completed tasks yet';
      if (descEl) descEl.textContent = 'Check off tasks from your list as you complete them!';
    } else if (state.filter === 'active') {
      if (titleEl) titleEl.textContent = 'All tasks completed!';
      if (descEl) descEl.textContent = 'Great job! Take a break or add new tasks.';
    } else {
      if (titleEl) titleEl.textContent = 'Your task list is empty';
      if (descEl) descEl.textContent = 'Add your first task above to start organizing your day.';
    }
  }

  /**
   * Update Dashboard Statistics
   */
  updateStatistics(stats) {
    const { total, completed, active, percentage } = stats;

    if (this.elements.statTotal) this.elements.statTotal.textContent = total;
    if (this.elements.statCompleted) this.elements.statCompleted.textContent = completed;
    if (this.elements.statActive) this.elements.statActive.textContent = active;
    if (this.elements.statPercentage) this.elements.statPercentage.textContent = `${percentage}%`;

    // Linear progress bar
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${percentage}%`;
    }

    // SVG Circular progress ring
    if (this.elements.progressRing) {
      const circumference = 2 * Math.PI * 36; // r=36
      const offset = circumference - (percentage / 100) * circumference;
      this.elements.progressRing.style.strokeDashoffset = offset;
    }
  }

  /**
   * Display floating Toast Notification
   * @param {string} message 
   * @param {string} type - 'success' | 'info' | 'warning' | 'danger'
   * @param {string|null} actionText 
   * @param {Function|null} actionCallback 
   */
  showToast(message, type = 'info', actionText = null, actionCallback = null) {
    const container = this.elements.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (actionText && actionCallback) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-action-btn';
      actionBtn.textContent = actionText;
      actionBtn.addEventListener('click', () => {
        actionCallback();
        toast.remove();
      });
      toast.appendChild(actionBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', () => toast.remove());
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  /**
   * Confetti Celebration particle animation when all tasks completed!
   */
  triggerConfetti() {
    const canvas = this.elements.confettiCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#fbbf24', '#f472b6'];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * 80,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
        tiltAngle: 0
      });
    }

    let animationFrameId;
    let startTime = Date.now();

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.tilt = Math.sin(p.tiltAngle) * 15;
      }

      if (Date.now() - startTime < 2500) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationFrameId);
      }
    }

    draw();
  }

  /**
   * Update theme attribute on root HTML element
   */
  updateThemeUI(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = this.elements.themeToggleBtn;
    if (btn) {
      const isLight = theme === 'light';
      btn.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
      btn.innerHTML = `<span class="theme-icon">${isLight ? '🌙' : '☀️'}</span>`;
    }
  }

  setEditingTask(id) {
    this.editingTaskId = id;
  }
}

export const ui = new UIRenderer();
