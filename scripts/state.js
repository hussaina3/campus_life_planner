import { load, save, loadSettings, saveSettings, clearAll } from './storage.js';

const DEFAULT_SETTINGS = {
  dailyCap: 240,
  displayUnit: 'minutes',
  tags: ['Study', 'Assignment', 'Event', 'Meeting', 'Exam', 'Other']
};

let records = [];
let settings = { ...DEFAULT_SETTINGS };

export function init() {
  records = load();
  const saved = loadSettings();
  settings = { ...DEFAULT_SETTINGS, ...saved };
  // Guard against corrupted/empty tag lists from old data
  if (!Array.isArray(settings.tags) || settings.tags.length === 0) {
    settings.tags = [...DEFAULT_SETTINGS.tags];
  }
}

// Return copies so callers can't mutate internal state directly
export const getRecords = () => [...records];
export const getSettings = () => ({ ...settings, tags: [...settings.tags] });

export function addRecord(data) {
  const now = new Date().toISOString();
  const record = {
    id: generateId(),
    title: data.title,
    dueDate: data.dueDate,
    duration: Number(data.duration),
    tag: data.tag,
    createdAt: now,
    updatedAt: now
  };
  records.push(record);
  save(records);
  return record;
}

export function updateRecord(id, data) {
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  records[idx] = {
    ...records[idx],
    title: data.title,
    dueDate: data.dueDate,
    duration: Number(data.duration),
    tag: data.tag,
    updatedAt: new Date().toISOString()
  };
  save(records);
  return records[idx];
}

export function deleteRecord(id) {
  const before = records.length;
  records = records.filter(r => r.id !== id);
  if (records.length !== before) {
    save(records);
    return true;
  }
  return false;
}

export function updateSettings(changes) {
  settings = { ...settings, ...changes };
  if (Array.isArray(changes.tags)) settings.tags = [...changes.tags];
  saveSettings(settings);
}

export function importRecords(newRecords) {
  records = newRecords.map(r => ({ ...r, duration: Number(r.duration) }));
  save(records);
}

export function resetAll() {
  records = [];
  settings = { ...DEFAULT_SETTINGS };
  clearAll();
}

function generateId() {
  // Padding the count keeps IDs sortable by insertion order
  return `rec_${String(records.length + 1).padStart(4, '0')}_${Date.now()}`;
}
