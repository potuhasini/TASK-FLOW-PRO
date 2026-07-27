/**
 * TaskFlow Pro Max — Ultimate Vanilla JavaScript State Management & Application Logic
 * Clean ES6+ Architecture: Categories, Subtasks, Audio Effects, JSON Export/Import, Hotkeys & Storage
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. Application State & Storage Keys
  // =========================================================================
  const STORAGE_KEY_TASKS = 'taskflow_tasks_v2';
  const STORAGE_KEY_THEME = 'taskflow_theme_v2';
  const STORAGE_KEY_SOUND = 'taskflow_sound_v2';

  let state = {
    tasks: [],
    filter: 'all', // 'all' | 'active' | 'completed'
    categoryFilter: 'all', // 'all' | 'general' | 'work' | 'personal' | 'health' | 'shopping'
    searchQuery: '',
    sortBy: 'newest', // 'newest' | 'oldest' | 'dueDate' | 'priority'
    theme: 'dark',
    soundEnabled: true,
    draggedIndex: null
  };

  let pendingModalAction = null;

  // Audio Context for synthesized sound effects without external MP3 files
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'check') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'add') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'delete') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      console.warn('Audio playback not allowed yet:', e);
    }
  }

  // =========================================================================
  // 2. DOM Elements Cache
  // =========================================================================
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    shortcutsBtn: document.getElementById('shortcutsBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importTriggerBtn: document.getElementById('importTriggerBtn'),
    importFileInput: document.getElementById('importFileInput'),

    addTaskForm: document.getElementById('addTaskForm'),
    taskInput: document.getElementById('taskInput'),
    categorySelect: document.getElementById('categorySelect'),
    prioritySelect: document.getElementById('prioritySelect'),
    dueDateInput: document.getElementById('dueDateInput'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    
    totalTasksCount: document.getElementById('totalTasksCount'),
    activeTasksCount: document.getElementById('activeTasksCount'),
    completedTasksCount: document.getElementById('completedTasksCount'),
    progressBar: document.getElementById('progressBar'),

    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    filterCategorySelect: document.getElementById('filterCategorySelect'),
    sortSelect: document.getElementById('sortSelect'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),

    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),

    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    modalConfirmBtn: document.getElementById('modalConfirmBtn'),

    shortcutsOverlay: document.getElementById('shortcutsOverlay'),
    shortcutsCloseBtn: document.getElementById('shortcutsCloseBtn'),

    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // 3. Storage Helpers
  // =========================================================================
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(state.tasks));
    } catch (err) {
      console.error('Failed to save tasks to LocalStorage:', err);
    }
  }

  function loadTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TASKS);
      if (data) {
        state.tasks = JSON.parse(data);
      } else {
        // Initial onboarding sample tasks
        state.tasks = [
          {
            id: generateId(),
            text: 'Welcome to TaskFlow Pro Max! Double-click to edit me.',
            category: 'work',
            completed: false,
            createdAt: new Date().toISOString(),
            priority: 'high',
            dueDate: getFormattedTomorrowDate(),
            subtasks: [
              { id: generateId(), text: 'Try checking off this subtask', completed: false },
              { id: generateId(), text: 'Add a new subtask below', completed: true }
            ]
          },
          {
            id: generateId(),
            text: 'Try dragging and dropping tasks to reorder them.',
            category: 'personal',
            completed: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            priority: 'medium',
            dueDate: '',
            subtasks: []
          },
          {
            id: generateId(),
            text: 'Completed tasks show smooth strikethrough styling.',
            category: 'health',
            completed: true,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            priority: 'low',
            dueDate: '',
            subtasks: []
          }
        ];
        saveTasks();
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      state.tasks = [];
    }
  }

  function loadThemeAndSound() {
    state.theme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);

    const savedSound = localStorage.getItem(STORAGE_KEY_SOUND);
    state.soundEnabled = savedSound !== 'false';
    updateSoundUI();
  }

  function updateSoundUI() {
    const onIcon = elements.soundToggleBtn.querySelector('.sound-on-icon');
    const offIcon = elements.soundToggleBtn.querySelector('.sound-off-icon');
    if (state.soundEnabled) {
      onIcon.classList.remove('hidden');
      offIcon.classList.add('hidden');
    } else {
      onIcon.classList.add('hidden');
      offIcon.classList.remove('hidden');
    }
  }

  // =========================================================================
  // 4. Utility Functions
  // =========================================================================
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function getFormattedTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  function formatDateBadge(dueDateStr) {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue (${dueDateStr})`, statusClass: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Due Today', statusClass: 'due-today' };
    } else if (diffDays === 1) {
      return { text: 'Due Tomorrow', statusClass: '' };
    } else {
      return { text: `Due ${dueDateStr}`, statusClass: '' };
    }
  }

  // =========================================================================
  // 5. Core Task Mutations
  // =========================================================================
  function addTask(text, category = 'general', priority = 'medium', dueDate = '') {
    const trimmedText = text.trim();
    if (!trimmedText) {
      showToast('Task description cannot be empty!', 'warning');
      return false;
    }

    const newTask = {
      id: generateId(),
      text: trimmedText,
      category: category,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: priority,
      dueDate: dueDate,
      subtasks: []
    };

    state.tasks.unshift(newTask);
    saveTasks();
    render();
    playSound('add');
    showToast('Task added successfully!', 'success');
    return true;
  }

  function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    render();
    playSound('check');

    const statusMsg = task.completed ? 'Task completed! 🎉' : 'Task marked active';
    showToast(statusMsg, task.completed ? 'success' : 'info');
  }

  function updateTaskText(id, newText) {
    const trimmed = newText.trim();
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    if (!trimmed) {
      showToast('Task description cannot be empty', 'warning');
      render();
      return;
    }

    task.text = trimmed;
    saveTasks();
    render();
    showToast('Task updated', 'success');
  }

  function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    showModal(
      'Delete Task',
      `Are you sure you want to delete "${task.text}"?`,
      () => {
        const itemEl = document.querySelector(`[data-id="${id}"]`);
        if (itemEl) {
          itemEl.classList.add('removing');
          setTimeout(() => {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveTasks();
            render();
            playSound('delete');
            showToast('Task deleted', 'danger');
          }, 240);
        } else {
          state.tasks = state.tasks.filter(t => t.id !== id);
          saveTasks();
          render();
          playSound('delete');
          showToast('Task deleted', 'danger');
        }
      }
    );
  }

  function addSubtask(taskId, text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      id: generateId(),
      text: trimmed,
      completed: false
    });

    saveTasks();
    render();
    playSound('add');
  }

  function toggleSubtask(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (!sub) return;

    sub.completed = !sub.completed;
    saveTasks();
    render();
    playSound('check');
  }

  function deleteSubtask(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    saveTasks();
    render();
  }

  function clearCompleted() {
    const completedCount = state.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear.', 'info');
      return;
    }

    showModal(
      'Clear Completed Tasks',
      `Are you sure you want to delete all ${completedCount} completed task(s)?`,
      () => {
        state.tasks = state.tasks.filter(t => !t.completed);
        saveTasks();
        render();
        playSound('delete');
        showToast(`Cleared ${completedCount} completed task(s)`, 'success');
      }
    );
  }

  // =========================================================================
  // 6. JSON Export & Import Backup System
  // =========================================================================
  function exportTasksToJSON() {
    const jsonStr = JSON.stringify(state.tasks, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `TaskFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Tasks backed up to JSON file!', 'success');
  }

  function importTasksFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          state.tasks = imported;
          saveTasks();
          render();
          showToast(`Successfully imported ${imported.length} tasks!`, 'success');
        } else {
          showToast('Invalid JSON backup file format', 'danger');
        }
      } catch (err) {
        showToast('Error reading JSON file', 'danger');
      }
    };
    reader.readAsText(file);
  }

  // =========================================================================
  // 7. Filtering & Sorting Logic
  // =========================================================================
  function getFilteredAndSortedTasks() {
    let result = [...state.tasks];

    // Filter by Tab (all, active, completed)
    if (state.filter === 'active') {
      result = result.filter(t => !t.completed);
    } else if (state.filter === 'completed') {
      result = result.filter(t => t.completed);
    }

    // Filter by Category
    if (state.categoryFilter !== 'all') {
      result = result.filter(t => (t.category || 'general') === state.categoryFilter);
    }

    // Filter by Search Query
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.text.toLowerCase().includes(q) || 
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Sort Tasks
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    result.sort((a, b) => {
      if (state.sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (state.sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (state.sortBy === 'priority') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      } else if (state.sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });

    return result;
  }

  // =========================================================================
  // 8. Rendering Engine
  // =========================================================================
  function render() {
    renderStats();
    renderTasks();
  }

  function renderStats() {
    const total = state.tasks.length;
    const active = state.tasks.filter(t => !t.completed).length;
    const completed = state.tasks.filter(t => t.completed).length;

    elements.totalTasksCount.textContent = total;
    elements.activeTasksCount.textContent = active;
    elements.completedTasksCount.textContent = completed;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    elements.progressBar.style.width = `${percentage}%`;
  }

  function renderTasks() {
    const visibleTasks = getFilteredAndSortedTasks();

    elements.taskList.innerHTML = '';

    if (visibleTasks.length === 0) {
      elements.emptyState.classList.remove('hidden');
      if (state.searchQuery.trim() !== '') {
        elements.emptyStateDesc.textContent = `No tasks matching "${state.searchQuery}".`;
      } else if (state.filter === 'active') {
        elements.emptyStateDesc.textContent = 'No active tasks found.';
      } else if (state.filter === 'completed') {
        elements.emptyStateDesc.textContent = 'No completed tasks found.';
      } else {
        elements.emptyStateDesc.textContent = 'No tasks found. Add a task above to get started.';
      }
      return;
    }

    elements.emptyState.classList.add('hidden');

    visibleTasks.forEach((task, index) => {
      const li = createTaskElement(task, index);
      elements.taskList.appendChild(li);
    });
  }

  function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);
    li.setAttribute('data-index', index);
    li.setAttribute('draggable', 'true');

    // Category badge
    const catName = task.category || 'general';
    const catBadgeClass = `badge-category badge-cat-${catName}`;

    // Priority badge
    const priorityLabel = task.priority ? task.priority.toUpperCase() : 'MEDIUM';
    const priorityClass = `badge-priority badge-${task.priority || 'medium'}`;

    // Date badge
    const dateBadgeInfo = formatDateBadge(task.dueDate);
    let dateBadgeHTML = '';
    if (dateBadgeInfo) {
      dateBadgeHTML = `
        <span class="badge-date ${dateBadgeInfo.statusClass}" title="Due Date">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${escapeHTML(dateBadgeInfo.text)}
        </span>
      `;
    }

    // Subtasks HTML construction
    let subtasksHTML = '';
    const subtasksList = task.subtasks || [];
    const subtaskItemsHTML = subtasksList.map(sub => `
      <div class="subtask-item ${sub.completed ? 'completed' : ''}" data-subid="${sub.id}">
        <label class="checkbox-container">
          <input type="checkbox" class="subtask-checkbox" ${sub.completed ? 'checked' : ''}>
          <span class="checkmark" style="width: 16px; height: 16px;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </span>
        </label>
        <span style="flex:1;">${escapeHTML(sub.text)}</span>
        <button class="action-btn delete-subtask-btn" title="Delete subtask" style="width:20px;height:20px;">✕</button>
      </div>
    `).join('');

    subtasksHTML = `
      <div class="subtasks-container">
        ${subtaskItemsHTML}
        <div class="subtask-add-row">
          <input type="text" class="subtask-input" placeholder="+ Add subtask (press Enter)">
        </div>
      </div>
    `;

    li.innerHTML = `
      <div class="task-main-row">
        <div class="drag-handle" title="Drag to reorder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="5" r="1"></circle>
            <circle cx="9" cy="12" r="1"></circle>
            <circle cx="9" cy="19" r="1"></circle>
            <circle cx="15" cy="5" r="1"></circle>
            <circle cx="15" cy="12" r="1"></circle>
            <circle cx="15" cy="19" r="1"></circle>
          </svg>
        </div>

        <label class="checkbox-container" title="Toggle complete status">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete">
          <span class="checkmark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        </label>

        <div class="task-content">
          <span class="task-text" title="Double click to edit">${escapeHTML(task.text)}</span>
          <div class="task-meta">
            <span class="${catBadgeClass}">${escapeHTML(catName)}</span>
            <span class="${priorityClass}">${priorityLabel}</span>
            ${dateBadgeHTML}
          </div>
        </div>

        <div class="task-actions">
          <button class="action-btn edit-btn" title="Edit Task" aria-label="Edit task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete-btn" title="Delete Task" aria-label="Delete task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      ${subtasksHTML}
    `;

    return li;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // =========================================================================
  // 9. Event Delegation
  // =========================================================================
  function setupEventDelegation() {
    elements.taskList.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.task-item');
      if (!taskItem) return;

      const taskId = taskItem.getAttribute('data-id');

      // Subtask Checkbox
      if (e.target.classList.contains('subtask-checkbox')) {
        const subRow = e.target.closest('.subtask-item');
        if (subRow) {
          const subId = subRow.getAttribute('data-subid');
          toggleSubtask(taskId, subId);
        }
        return;
      }

      // Delete Subtask
      if (e.target.classList.contains('delete-subtask-btn')) {
        const subRow = e.target.closest('.subtask-item');
        if (subRow) {
          const subId = subRow.getAttribute('data-subid');
          deleteSubtask(taskId, subId);
        }
        return;
      }

      // Toggle Task Checkbox
      if (e.target.classList.contains('task-checkbox') || e.target.closest('.checkbox-container')) {
        if (e.target.tagName !== 'INPUT') {
          const cb = taskItem.querySelector('.task-checkbox');
          if (cb) cb.checked = !cb.checked;
        }
        toggleTask(taskId);
        return;
      }

      // Delete Task Button
      if (e.target.closest('.delete-btn')) {
        deleteTask(taskId);
        return;
      }

      // Edit Task Button
      if (e.target.closest('.edit-btn')) {
        enableInlineEditing(taskItem, taskId);
        return;
      }
    });

    // Subtask Keydown (Enter to add subtask)
    elements.taskList.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('subtask-input') && e.key === 'Enter') {
        e.preventDefault();
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        const taskId = taskItem.getAttribute('data-id');
        addSubtask(taskId, e.target.value);
      }
    });

    // Double Click to Edit Text
    elements.taskList.addEventListener('dblclick', (e) => {
      const taskItem = e.target.closest('.task-item');
      if (!taskItem) return;
      const taskId = taskItem.getAttribute('data-id');
      if (e.target.classList.contains('task-text')) {
        enableInlineEditing(taskItem, taskId);
      }
    });
  }

  function enableInlineEditing(taskItem, taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskTextSpan = taskItem.querySelector('.task-text');
    if (!taskTextSpan || taskItem.querySelector('.task-edit-input')) return;

    const currentText = task.text;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = currentText;

    taskTextSpan.replaceWith(input);
    input.focus();
    input.setSelectionRange(0, input.value.length);

    function commitEdit() {
      updateTaskText(taskId, input.value);
    }

    input.addEventListener('blur', commitEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.removeEventListener('blur', commitEdit);
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        input.removeEventListener('blur', commitEdit);
        render();
      }
    });
  }

  // =========================================================================
  // 10. Drag-and-Drop
  // =========================================================================
  function setupDragAndDrop() {
    elements.taskList.addEventListener('dragstart', (e) => {
      const taskItem = e.target.closest('.task-item');
      if (!taskItem) return;
      state.draggedIndex = parseInt(taskItem.getAttribute('data-index'), 10);
      taskItem.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', state.draggedIndex);
    });

    elements.taskList.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const targetItem = e.target.closest('.task-item');
      if (targetItem && !targetItem.classList.contains('dragging')) {
        targetItem.style.borderTop = '2px solid var(--color-primary)';
      }
    });

    elements.taskList.addEventListener('dragleave', (e) => {
      const targetItem = e.target.closest('.task-item');
      if (targetItem) targetItem.style.borderTop = '';
    });

    elements.taskList.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetItem = e.target.closest('.task-item');
      if (!targetItem) return;

      targetItem.style.borderTop = '';
      const dropIndex = parseInt(targetItem.getAttribute('data-index'), 10);

      if (state.draggedIndex !== null && state.draggedIndex !== dropIndex) {
        const visibleTasks = getFilteredAndSortedTasks();
        const draggedTask = visibleTasks[state.draggedIndex];
        const targetTask = visibleTasks[dropIndex];

        const realDraggedIndex = state.tasks.findIndex(t => t.id === draggedTask.id);
        const realTargetIndex = state.tasks.findIndex(t => t.id === targetTask.id);

        if (realDraggedIndex !== -1 && realTargetIndex !== -1) {
          const [movedItem] = state.tasks.splice(realDraggedIndex, 1);
          state.tasks.splice(realTargetIndex, 0, movedItem);

          saveTasks();
          render();
          showToast('Tasks reordered', 'info');
        }
      }
    });

    elements.taskList.addEventListener('dragend', (e) => {
      const taskItem = e.target.closest('.task-item');
      if (taskItem) taskItem.classList.remove('dragging');
      state.draggedIndex = null;
    });
  }

  // =========================================================================
  // 11. Modal, Shortcuts & Toasts
  // =========================================================================
  function showModal(title, message, onConfirm) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    pendingModalAction = onConfirm;

    elements.modalOverlay.classList.remove('hidden');
    elements.modalOverlay.setAttribute('aria-hidden', 'false');
    elements.modalConfirmBtn.focus();
  }

  function hideModal() {
    elements.modalOverlay.classList.add('hidden');
    elements.modalOverlay.setAttribute('aria-hidden', 'true');
    pendingModalAction = null;
  }

  function setupModalListeners() {
    elements.modalCloseBtn.addEventListener('click', hideModal);
    elements.modalCancelBtn.addEventListener('click', hideModal);
    elements.modalConfirmBtn.addEventListener('click', () => {
      if (typeof pendingModalAction === 'function') pendingModalAction();
      hideModal();
    });

    elements.modalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.modalOverlay) hideModal();
    });

    // Shortcuts Modal Listeners
    elements.shortcutsBtn.addEventListener('click', () => {
      elements.shortcutsOverlay.classList.remove('hidden');
    });
    elements.shortcutsCloseBtn.addEventListener('click', () => {
      elements.shortcutsOverlay.classList.add('hidden');
    });
    elements.shortcutsOverlay.addEventListener('click', (e) => {
      if (e.target === elements.shortcutsOverlay) {
        elements.shortcutsOverlay.classList.add('hidden');
      }
    });
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    if (type === 'success') {
      iconSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'warning' || type === 'danger') {
      iconSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `${iconSVG} <span>${escapeHTML(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // Global Keyboard Hotkeys
  function setupGlobalHotkeys() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger hotkeys when typing in input/textarea unless specified
      const isTyping = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);

      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        elements.shortcutsOverlay.classList.toggle('hidden');
      } else if (e.key === '/' && !isTyping) {
        e.preventDefault();
        elements.taskInput.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        elements.searchInput.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        elements.taskInput.focus();
      } else if (e.key === 'Escape') {
        if (!elements.shortcutsOverlay.classList.contains('hidden')) {
          elements.shortcutsOverlay.classList.add('hidden');
        } else if (!elements.modalOverlay.classList.contains('hidden')) {
          hideModal();
        } else if (document.activeElement === elements.searchInput) {
          elements.searchInput.value = '';
          state.searchQuery = '';
          renderTasks();
          elements.searchInput.blur();
        }
      }
    });
  }

  // =========================================================================
  // 12. Form & Control Handlers
  // =========================================================================
  function setupFormAndControlListeners() {
    // Theme Toggle
    elements.themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      localStorage.setItem(STORAGE_KEY_THEME, state.theme);
      showToast(`Switched to ${state.theme} theme`, 'info');
    });

    // Sound Toggle
    elements.soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem(STORAGE_KEY_SOUND, state.soundEnabled);
      updateSoundUI();
      showToast(`Sound effects ${state.soundEnabled ? 'enabled' : 'muted'}`, 'info');
    });

    // Export & Import
    elements.exportBtn.addEventListener('click', exportTasksToJSON);
    elements.importTriggerBtn.addEventListener('click', () => elements.importFileInput.click());
    elements.importFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importTasksFromJSON(e.target.files[0]);
      }
    });

    // Add Task Submit
    elements.addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = elements.taskInput.value;
      const category = elements.categorySelect.value;
      const priority = elements.prioritySelect.value;
      const dueDate = elements.dueDateInput.value;

      const success = addTask(text, category, priority, dueDate);
      if (success) {
        elements.taskInput.value = '';
        elements.dueDateInput.value = '';
        elements.prioritySelect.value = 'medium';
        elements.categorySelect.value = 'general';
        elements.taskInput.focus();
      }
    });

    // Search Input
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.searchQuery) {
        elements.clearSearchBtn.classList.remove('hidden');
      } else {
        elements.clearSearchBtn.classList.add('hidden');
      }
      renderTasks();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      renderTasks();
    });

    // Filter Buttons
    elements.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        state.filter = btn.getAttribute('data-filter');
        renderTasks();
      });
    });

    // Category Filter Dropdown
    elements.filterCategorySelect.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      renderTasks();
    });

    // Sort Dropdown
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderTasks();
    });

    // Clear Completed
    elements.clearCompletedBtn.addEventListener('click', clearCompleted);
  }

  // =========================================================================
  // 13. Initialization
  // =========================================================================
  function init() {
    loadThemeAndSound();
    loadTasks();
    setupEventDelegation();
    setupDragAndDrop();
    setupModalListeners();
    setupGlobalHotkeys();
    setupFormAndControlListeners();
    render();

    elements.taskInput.focus();
  }

  init();
});
