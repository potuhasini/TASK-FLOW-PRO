/**
 * Storage Module (storage.js)
 * Manages LocalStorage data persistence, JSON validation, and file Export/Import.
 */

const STORAGE_KEYS = {
  TASKS: 'todo_app_tasks_v1',
  THEME: 'todo_app_theme_v1'
};

export const storage = {

  /**
   * Load tasks safely from LocalStorage
   * @returns {Array} List of validated task objects
   */
  loadTasks() {
    try {
      const rawData = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!rawData) return [];

      const parsed = JSON.parse(rawData);
      if (!Array.isArray(parsed)) return [];

      // Validate required task properties
      return parsed.filter(item => (
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string'
      )).map(item => ({
        id: item.id,
        title: item.title,
        completed: Boolean(item.completed),
        priority: item.priority || 'medium',
        category: item.category || 'personal',
        dueDate: item.dueDate || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Storage Error: Failed to parse tasks from LocalStorage', error);
      return [];
    }
  },

  /**
   * Save tasks array to LocalStorage
   * @param {Array} tasks 
   */
  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('Storage Error: Failed to save tasks to LocalStorage', error);
      return false;
    }
  },

  /**
   * Load user preferred theme
   * @returns {string} 'dark' | 'light'
   */
  loadTheme() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  },

  /**
   * Save user preferred theme
   * @param {string} theme 
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('Storage Error: Failed to save theme preference', e);
    }
  },

  /**
   * Export tasks as a JSON file download
   * @param {Array} tasks 
   */
  exportJSON(tasks) {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `todo-backup-${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      return true;
    } catch (error) {
      console.error('Export Error:', error);
      return false;
    }
  },

  /**
   * Parse and validate imported JSON string
   * @param {string} jsonString 
   * @returns {Array|null} Array of tasks or null if invalid
   */
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return null;

      const validTasks = parsed.filter(item => item && typeof item.title === 'string').map(item => ({
        id: item.id || ('task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
        title: item.title.trim(),
        completed: Boolean(item.completed),
        priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
        category: item.category || 'personal',
        dueDate: item.dueDate || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }));

      return validTasks.length > 0 ? validTasks : null;
    } catch (error) {
      console.error('Import Error: Invalid JSON file', error);
      return null;
    }
  }
};
