/**
 * State Management Module (state.js)
 * Single source of truth for application state and state mutations.
 */

class StateManager {
  constructor() {
    this.state = {
      tasks: [],
      filter: 'all',          // 'all' | 'active' | 'completed'
      priorityFilter: 'all',  // 'all' | 'high' | 'medium' | 'low'
      categoryFilter: 'all',  // 'all' | 'work' | 'personal' | 'shopping' | 'fitness' | 'ideas'
      search: '',             // search query string
      sort: 'newest',         // 'newest' | 'oldest' | 'priority' | 'dueDate' | 'alphabetical-az' | 'alphabetical-za' | 'completed-first'
      theme: 'dark',          // 'dark' | 'light'
      lastDeletedTask: null,  // { task, index } for Undo functionality
    };

    this.subscribers = [];
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify all subscribers
  notify(changeType) {
    this.subscribers.forEach(callback => callback(this.state, changeType));
  }

  // Get current state snapshot
  getState() {
    return { ...this.state };
  }

  // Set initial tasks from storage
  setTasks(tasks) {
    this.state.tasks = Array.isArray(tasks) ? tasks : [];
    this.notify('tasks');
  }

  // Add a new task
  addTask({ title, priority = 'medium', category = 'personal', dueDate = '' }) {
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: title.trim(),
      completed: false,
      priority,
      category,
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.tasks.unshift(newTask);
    this.notify('addTask');
    return newTask;
  }

  // Update existing task
  updateTask(id, updates) {
    const taskIndex = this.state.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;

    this.state.tasks[taskIndex] = {
      ...this.state.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.notify('updateTask');
    return this.state.tasks[taskIndex];
  }

  // Toggle completion status
  toggleTask(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) return null;

    return this.updateTask(id, { completed: !task.completed });
  }

  // Delete a single task with undo memory
  deleteTask(id) {
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const [deletedTask] = this.state.tasks.splice(index, 1);
    this.state.lastDeletedTask = { task: deletedTask, index };
    this.notify('deleteTask');
    return deletedTask;
  }

  // Restore last deleted task
  undoDelete() {
    if (!this.state.lastDeletedTask) return false;

    const { task, index } = this.state.lastDeletedTask;
    this.state.tasks.splice(index, 0, task);
    this.state.lastDeletedTask = null;
    this.notify('undoDelete');
    return task;
  }

  // Clear all completed tasks
  deleteCompletedTasks() {
    const previousLength = this.state.tasks.length;
    this.state.tasks = this.state.tasks.filter(t => !t.completed);
    const count = previousLength - this.state.tasks.length;
    if (count > 0) {
      this.notify('deleteCompleted');
    }
    return count;
  }

  // Delete all tasks
  deleteAllTasks() {
    const count = this.state.tasks.length;
    this.state.tasks = [];
    this.notify('deleteAll');
    return count;
  }

  // Reorder tasks (Drag and Drop)
  reorderTasks(fromIndex, toIndex) {
    if (
      fromIndex < 0 || fromIndex >= this.state.tasks.length ||
      toIndex < 0 || toIndex >= this.state.tasks.length
    ) {
      return;
    }

    const [movedTask] = this.state.tasks.splice(fromIndex, 1);
    this.state.tasks.splice(toIndex, 0, movedTask);
    this.notify('reorder');
  }

  // Filters & Search
  setFilter(filter) {
    this.state.filter = filter;
    this.notify('filter');
  }

  setPriorityFilter(priority) {
    this.state.priorityFilter = priority;
    this.notify('filter');
  }

  setCategoryFilter(category) {
    this.state.categoryFilter = category;
    this.notify('filter');
  }

  setSearch(query) {
    this.state.search = query.toLowerCase().trim();
    this.notify('search');
  }

  setSort(sortOption) {
    this.state.sort = sortOption;
    this.notify('sort');
  }

  setTheme(theme) {
    this.state.theme = theme;
    this.notify('theme');
  }

  // Get filtered and sorted tasks array
  getFilteredAndSortedTasks() {
    let result = [...this.state.tasks];

    // 1. Filter by Completion Status
    if (this.state.filter === 'active') {
      result = result.filter(t => !t.completed);
    } else if (this.state.filter === 'completed') {
      result = result.filter(t => t.completed);
    }

    // 2. Filter by Priority
    if (this.state.priorityFilter !== 'all') {
      result = result.filter(t => t.priority === this.state.priorityFilter);
    }

    // 3. Filter by Category
    if (this.state.categoryFilter !== 'all') {
      result = result.filter(t => t.category === this.state.categoryFilter);
    }

    // 4. Search Filter
    if (this.state.search) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(this.state.search) ||
        (t.category && t.category.toLowerCase().includes(this.state.search))
      );
    }

    // 5. Sorting
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    result.sort((a, b) => {
      switch (this.state.sort) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);

        case 'alphabetical-az':
          return a.title.localeCompare(b.title);

        case 'alphabetical-za':
          return b.title.localeCompare(a.title);

        case 'priority':
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);

        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);

        case 'completed-first':
          return (b.completed === a.completed) ? 0 : b.completed ? 1 : -1;

        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return result;
  }

  // Get computed statistics
  getStatistics() {
    const total = this.state.tasks.length;
    const completed = this.state.tasks.filter(t => t.completed).length;
    const active = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, active, percentage };
  }
}

export const appState = new StateManager();
