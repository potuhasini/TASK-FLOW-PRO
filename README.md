# 🚀 TaskFlow Pro Max

A modern, production-quality To-Do List web application built strictly with **HTML5, CSS3, and Vanilla JavaScript (ES6+)**. No external frameworks or runtime dependencies required.

![TaskFlow Pro Max](https://img.shields.io/badge/Vanilla-JS%20HTML5%20CSS3-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🌟 Key Features

- 📝 **Full Task CRUD**: Add, edit (inline double-click or button), toggle completion, delete with confirmation modal, and batch clear finished tasks.
- 📋 **Subtask Checklists**: Break down tasks into sub-items with real-time checklist progress tracking.
- 🏷️ **Category Management**: Organize and filter tasks by categories (💼 Work, 👤 Personal, 🏋️ Health, 🛒 Shopping, 📁 General).
- 🏷️ **Priority & Due Date Badges**: Visual priority badges (High, Medium, Low) and overdue status tags.
- 💾 **LocalStorage Persistence**: Auto-saves state after every change and restores tasks + theme preference on reload.
- 🔍 **Filtering & Instant Search**: Real-time search input alongside *All*, *Active*, and *Completed* tabs.
- 🔀 **Sorting Engine**: Sort by *Newest*, *Oldest*, *Due Date*, or *Priority*.
- 🖐️ **Drag-and-Drop Reordering**: HTML5 Drag and Drop API support with drag handle and visual feedback.
- 🌙 **Dark & Light Mode**: Dynamic theme switcher with glowing ambient glob background and CSS custom variable design tokens.
- 🔊 **Synthesized Web Audio Effects**: Audio feedback when adding, checking off, or deleting tasks (includes mute toggle).
- 📥 **JSON Backup & Restore**: Export all task data to JSON backup files and import back anytime.
- ⌨️ **Keyboard Hotkeys & Shortcuts**:
  - `/` or `Ctrl+N`: Focus task input
  - `Ctrl+K`: Focus search bar
  - `?`: Open Shortcuts Cheat Sheet modal
  - `Esc`: Clear search / close modals / cancel inline editing

---

## 🛠️ Project Structure

```
todo-app/
├── index.html   # Semantic HTML5 markup, ARIA accessibility, Modal & Toast containers
├── style.css    # Responsive design system, CSS Variables (Light/Dark themes), Animations
├── script.js    # ES6+ State management, Event Delegation, LocalStorage, Subtasks, Audio API
└── README.md    # Documentation
```

---

## 🚀 How to Run Locally

### Option 1: Direct Browser Opening
Simply double-click or open `index.html` in any modern web browser.

### Option 2: Local HTTP Server (Python)
```bash
python -m http.server 3000
```
Then navigate to `http://localhost:3000` in your browser.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
