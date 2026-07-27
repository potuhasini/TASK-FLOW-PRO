/**
 * Main Application Entry Point (app.js)
 * Initializes state, storage persistence, theme settings, subscribers, and UI.
 */

import { appState } from './state.js';
import { storage } from './storage.js';
import { ui } from './ui.js';
import { setupEventListeners } from './events.js';

document.addEventListener('DOMContentLoaded', () => {

  // 1. Initialize Theme from Storage or OS preference
  const initialTheme = storage.loadTheme();
  appState.setTheme(initialTheme);
  ui.updateThemeUI(initialTheme);

  // 2. Load Tasks from LocalStorage into State
  const savedTasks = storage.loadTasks();
  appState.setTasks(savedTasks);

  // 3. Register State Change Subscribers
  appState.subscribe((state, changeType) => {
    // Re-render task list
    const visibleTasks = appState.getFilteredAndSortedTasks();
    ui.renderTaskList(visibleTasks, state);

    // Update Statistics Dashboard
    const stats = appState.getStatistics();
    ui.updateStatistics(stats);

    // Auto-save tasks to LocalStorage on task mutations
    if (['addTask', 'updateTask', 'deleteTask', 'undoDelete', 'deleteCompleted', 'deleteAll', 'reorder'].includes(changeType)) {
      storage.saveTasks(state.tasks);
    }
  });

  // 4. Setup Event Controllers (Delegation, Shortcuts, Drag & Drop)
  setupEventListeners();

  // 5. Initial Render Pass
  const initialTasks = appState.getFilteredAndSortedTasks();
  ui.renderTaskList(initialTasks, appState.getState());
  ui.updateStatistics(appState.getStatistics());

  console.log('🚀 TaskFlow Vanilla JS App Initialized Successfully!');
});
