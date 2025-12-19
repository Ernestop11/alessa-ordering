/**
 * Shared Alfred State - Centralized state management (CommonJS)
 */

// Global state (in production, use Redis)
let alfredStatus = {
  status: 'active',
  lastAction: 'Initialized',
  improvementsToday: 0,
  tasksCompleted: 0,
  suggestions: [],
  currentTask: null,
};

function getAlfredStatus() {
  return { ...alfredStatus };
}

function setAlfredStatus(updates) {
  alfredStatus = { ...alfredStatus, ...updates };
}

module.exports = {
  getAlfredStatus,
  setAlfredStatus,
};

