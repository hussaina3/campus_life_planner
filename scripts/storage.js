// Thin localStorage wrapper. Nothing here makes decisions about data —
// it just reads and writes. Error handling on load is important because
// localStorage can be corrupted or blocked in certain browser contexts.

const RECORDS_KEY = 'campus:records';
const SETTINGS_KEY = 'campus:settings';

export function load() {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function save(data) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(data));
}

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function clearAll() {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
