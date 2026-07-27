/**
 * Event Controller Module (events.js)
 * Implements Event Delegation, debounced search, drag-and-drop reordering,
 * keyboard shortcuts, inline editing, and modal/toast handlers.
 */

import { appState } from './state.js';
import { storage } from './storage.js';
import { ui } from './ui.js';

export function setupEventListeners() {
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-title-input');
  const prioritySelect = document.getElementById('task-priority-input');
  const categorySelect = document.getElementById('task-category-input');
  const dueDateInput = document.getElementById('task-duedate-input');
  const taskList = document.getElementById('task-list');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const themeToggleBtn = document.getElementById('theme-toggle');

  // Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  const categoryChips = document.querySelectorAll('.category-chip');
  const priorityFilterSelect = document.getElementById('priority-filter-select');

  // Bulk Action Buttons
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');

  // Modal Elements
  const confirmModal = document.getElementById('confirm-modal');
  const confirmModalClose = document.getElementById('modal-cancel-btn');
  const confirmModalOk = document.getElementById('modal-confirm-btn');

  // Export / Import
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFileInput = document.getElementById('import-file-input');

  /* ==========================================================================
     1. CREATE TASK FORM SUBMISSION
     ========================================================================== */
  if (taskForm && taskInput) {
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = taskInput.value.trim();
      if (!title) {
        ui.showToast('Please enter a task title!', 'warning');
        taskInput.focus();
        return;
      }

      const priority = prioritySelect ? prioritySelect.value : 'medium';
      const category = categorySelect ? categorySelect.value : 'personal';
      const dueDate = dueDateInput ? dueDateInput.value : '';

      appState.addTask({ title, priority, category, dueDate });
      taskInput.value = '';
      if (dueDateInput) dueDateInput.value = '';
      taskInput.focus();

      ui.showToast('Task added successfully!', 'success');
    });
  }

  /* ==========================================================================
     2. EVENT DELEGATION ON TASK LIST (CLICK & SUBMIT)
     ========================================================================== */
  if (taskList) {
    // Handle Clicks
    taskList.addEventListener('click', (e) => {
      const target = e.target;
      const card = target.closest('.task-card');
      if (!card) return;

      const taskId = card.dataset.id;
      const actionElement = target.closest('[data-action]');
      if (!actionElement) return;

      const action = actionElement.dataset.action;

      if (action === 'toggle') {
        const updated = appState.toggleTask(taskId);
        if (updated) {
          if (updated.completed) {
            ui.showToast('Task marked as completed!', 'success');
            // Check if all tasks are completed
            const stats = appState.getStatistics();
            if (stats.total > 0 && stats.completed === stats.total) {
              ui.triggerConfetti();
              ui.showToast('🎉 All tasks completed! Amazing work!', 'success');
            }
          }
        }
      } else if (action === 'delete') {
        const deletedTask = appState.deleteTask(taskId);
        if (deletedTask) {
          ui.showToast(`Deleted "${deletedTask.title}"`, 'danger', 'Undo', () => {
            appState.undoDelete();
            ui.showToast('Task restored!', 'info');
          });
        }
      } else if (action === 'edit') {
        ui.setEditingTask(taskId);
        appState.notify('edit');
      } else if (action === 'cancel-edit') {
        ui.setEditingTask(null);
        appState.notify('edit');
      }
    });

    // Handle Inline Edit Form Submit
    taskList.addEventListener('submit', (e) => {
      if (e.target.classList.contains('inline-edit-form')) {
        e.preventDefault();
        const card = e.target.closest('.task-card');
        if (!card) return;

        const taskId = card.dataset.id;
        const input = e.target.querySelector('.inline-edit-input');
        if (input) {
          const newTitle = input.value.trim();
          if (newTitle) {
            appState.updateTask(taskId, { title: newTitle });
            ui.setEditingTask(null);
            ui.showToast('Task title updated!', 'info');
          } else {
            ui.showToast('Task title cannot be empty!', 'warning');
          }
        }
      }
    });
  }

  /* ==========================================================================
     3. LIVE SEARCH WITH DEBOUNCE
     ========================================================================== */
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        appState.setSearch(e.target.value);
      }, 200);
    });
  }

  /* ==========================================================================
     4. FILTERS & SORTING
     ========================================================================== */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
      appState.setFilter(btn.dataset.filter || 'all');
    });
  });

  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      appState.setCategoryFilter(chip.dataset.category || 'all');
    });
  });

  if (priorityFilterSelect) {
    priorityFilterSelect.addEventListener('change', (e) => {
      appState.setPriorityFilter(e.target.value);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      appState.setSort(e.target.value);
    });
  }

  /* ==========================================================================
     5. BULK ACTIONS & MODAL CONFIRMATION
     ========================================================================== */
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
      const count = appState.deleteCompletedTasks();
      if (count > 0) {
        ui.showToast(`Cleared ${count} completed task(s)!`, 'info');
      } else {
        ui.showToast('No completed tasks to clear.', 'warning');
      }
    });
  }

  if (clearAllBtn && confirmModal) {
    clearAllBtn.addEventListener('click', () => {
      if (appState.getState().tasks.length === 0) {
        ui.showToast('Task list is already empty.', 'warning');
        return;
      }
      confirmModal.classList.add('active');
    });
  }

  if (confirmModalClose && confirmModal) {
    confirmModalClose.addEventListener('click', () => {
      confirmModal.classList.remove('active');
    });
  }

  if (confirmModalOk && confirmModal) {
    confirmModalOk.addEventListener('click', () => {
      const count = appState.deleteAllTasks();
      confirmModal.classList.remove('active');
      ui.showToast(`Deleted all ${count} task(s).`, 'danger');
    });
  }

  /* ==========================================================================
     6. DRAG AND DROP TASK REORDERING
     ========================================================================== */
  let draggedCard = null;
  let draggedIndex = null;

  if (taskList) {
    taskList.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.task-card');
      if (!card) return;

      draggedCard = card;
      draggedIndex = parseInt(card.dataset.index, 10);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    taskList.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const card = e.target.closest('.task-card');
      if (card && card !== draggedCard) {
        const rect = card.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        taskList.insertBefore(draggedCard, next ? card.nextSibling : card);
      }
    });

    taskList.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedCard) return;

      const newCards = Array.from(taskList.querySelectorAll('.task-card'));
      const targetIndex = newCards.indexOf(draggedCard);

      if (draggedIndex !== null && targetIndex !== -1 && draggedIndex !== targetIndex) {
        appState.reorderTasks(draggedIndex, targetIndex);
        ui.showToast('Task list order updated!', 'info');
      }
    });

    taskList.addEventListener('dragend', () => {
      if (draggedCard) {
        draggedCard.classList.remove('dragging');
        draggedCard = null;
        draggedIndex = null;
      }
    });
  }

  /* ==========================================================================
     7. EXPORT & IMPORT TASKS
     ========================================================================== */
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const tasks = appState.getState().tasks;
      if (tasks.length === 0) {
        ui.showToast('No tasks to export.', 'warning');
        return;
      }
      storage.exportJSON(tasks);
      ui.showToast('Exported tasks to JSON file!', 'success');
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => importFileInput.click());

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const importedTasks = storage.importJSON(event.target.result);
        if (importedTasks) {
          appState.setTasks(importedTasks);
          ui.showToast(`Successfully imported ${importedTasks.length} tasks!`, 'success');
        } else {
          ui.showToast('Failed to import JSON file. Invalid format.', 'danger');
        }
        importFileInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  /* ==========================================================================
     8. THEME TOGGLE
     ========================================================================== */
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = appState.getState().theme;
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      appState.setTheme(nextTheme);
      storage.saveTheme(nextTheme);
      ui.updateThemeUI(nextTheme);
    });
  }

  /* ==========================================================================
     9. KEYBOARD SHORTCUTS
     ========================================================================== */
  document.addEventListener('keydown', (e) => {
    // Ctrl + N or Cmd + N -> Focus New Task Input
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      if (taskInput) taskInput.focus();
    }

    // Escape -> Cancel editing or close modal
    if (e.key === 'Escape') {
      if (ui.editingTaskId) {
        ui.setEditingTask(null);
        appState.notify('edit');
      }
      if (confirmModal && confirmModal.classList.contains('active')) {
        confirmModal.classList.remove('active');
      }
    }

    // Ctrl + Shift + D -> Toggle Theme
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      if (themeToggleBtn) themeToggleBtn.click();
    }
  });
}
