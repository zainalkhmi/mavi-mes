/**
 * AI Coding Activity Tracker
 * Emits and records real-time agent thought/activity steps for UI visualization
 */

export const AI_ACTIVITY_TYPES = {
  READ_REPO: { icon: '🔍', label: 'Reading repository' },
  READ_COMPONENT: { icon: '📄', label: 'Reading component' },
  SEARCH_COMPONENT: { icon: '🔎', label: 'Searching component' },
  SELECT_TEMPLATE: { icon: '🧠', label: 'Selecting UI template' },
  SELECT_GLUESTACK: { icon: '🧩', label: 'Selecting Gluestack component' },
  CREATE_COMPONENT: { icon: '✏️', label: 'Creating component' },
  EDIT_COMPONENT: { icon: '✏️', label: 'Editing component' },
  RUN_TEST: { icon: '▶', label: 'Running test' },
  ERROR: { icon: '❌', label: 'Error' },
  FIXING: { icon: '🔧', label: 'Fixing' },
  COMPLETED: { icon: '✅', label: 'Completed' }
};

class ActivityTracker {
  constructor() {
    this.listeners = new Set();
    this.history = [];
  }

  emit(typeKey, details = '') {
    const meta = AI_ACTIVITY_TYPES[typeKey] || { icon: '⚡', label: typeKey };
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      typeKey,
      icon: meta.icon,
      label: meta.label,
      details
    };
    this.history.unshift(entry);
    if (this.history.length > 50) this.history.pop();
    this.listeners.forEach((listener) => listener(entry, this.history));
    return entry;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHistory() {
    return [...this.history];
  }

  clear() {
    this.history = [];
    this.listeners.forEach((listener) => listener(null, []));
  }
}

export const activityTracker = new ActivityTracker();
