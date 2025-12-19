/**
 * Shared State - CommonJS version
 */

// Global shared state
let sharedState = {
  status: 'active',
  lastAction: 'Initialized',
  improvementsToday: 0,
  tasksCompleted: 0,
  suggestions: [],
  currentTask: null,
};

function getSharedState() {
  return JSON.parse(JSON.stringify(sharedState)); // Deep copy
}

function setSharedState(updates) {
  sharedState = { ...sharedState, ...updates };
}

module.exports = {
  getSharedState,
  setSharedState,
};

