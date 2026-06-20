// ui.js — all DOM manipulation and event handling.
// Organised into clear sections: navigation, form, records (M4),
// stats/dashboard (M5), and settings/data (M6).

import * as state from './state.js';
import { compileRegex, highlight, escapeHtml } from './search.js';
import { validate, validateRecord, hasDuplicateWords, validateImport, TAG_FILTER_RE } from './validators.js';

// ---- Module-level UI state ----
let sortField = 'dueDate';
let sortDir   = 'asc';
let searchRegex = null;
let editingId   = null;

// ============================================================
// Init
// ============================================================

export function init() {
  setupNavigation();
  setupMobileNav();
  setupForm();
  setupRecords();
  setupSettings();

  renderTagOptions();
  renderRecords();
  renderAll();
}

// ============================================================
// M4 — Navigation
// ============================================================

function setupNavigation() {
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-section]');
    if (!trigger) return;
    e.preventDefault();
    const id = trigger.dataset.section;

    // If leaving the edit form mid-edit, reset it silently
    if (id !== 'add-edit' && editingId !== null) resetForm();

    // Entering add-edit fresh means "add new"
    if (id === 'add-edit' && editingId === null) openAddForm();

    showSection(id);
  });
}

function showSection(id) {
  document.querySelectorAll('.page-section').forEach(s => {
    s.classList.toggle('active', s.id === id);
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    const match = link.dataset.section === id;
    link.classList.toggle('active', match);
    link.setAttribute('aria-current', match ? 'page' : 'false');
  });

  // Move focus to the section heading so screen readers announce the page change
  const heading = document.querySelector(`#${id} h1`);
  if (heading) {
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: false });
  }

  closeMobileNav();

  if (id === 'dashboard') renderAll();
  if (id === 'records')   renderRecords();
  if (id === 'settings')  renderSettings();
}

// ============================================================
// M4 — Mobile nav
// ============================================================

function setupMobileNav() {
  const toggle  = document.querySelector('.menu-toggle');
  const closeBtn = document.querySelector('.nav-close');

  toggle?.addEventListener('click', () => {
    const isOpen = document.getElementById('main-nav').classList.contains('is-open');
    isOpen ? closeMobileNav() : openMobileNav();
  });

  closeBtn?.addEventListener('click', () => {
    closeMobileNav();
    document.querySelector('.menu-toggle')?.focus();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('main-nav').classList.contains('is-open')) {
      closeMobileNav();
      document.querySelector('.menu-toggle')?.focus();
    }
  });
}

function openMobileNav() {
  const nav = document.getElementById('main-nav');
  const toggle = document.querySelector('.menu-toggle');
  const closeBtn = document.querySelector('.nav-close');
  nav.classList.add('is-open');
  toggle?.setAttribute('aria-expanded', 'true');
  toggle?.setAttribute('aria-label', 'Close navigation menu');
  closeBtn?.removeAttribute('hidden');
  closeBtn?.focus();
}

function closeMobileNav() {
  const nav = document.getElementById('main-nav');
  const toggle = document.querySelector('.menu-toggle');
  const closeBtn = document.querySelector('.nav-close');
  nav.classList.remove('is-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Open navigation menu');
  closeBtn?.setAttribute('hidden', '');
}

// ============================================================
// M4 — Add / Edit form
// ============================================================

function setupForm() {
  document.getElementById('task-form')?.addEventListener('submit', handleFormSubmit);

  document.getElementById('form-cancel-btn')?.addEventListener('click', () => {
    resetForm();
    showSection('records');
  });

  // Per-field blur validation for immediate feedback
  ['input-title', 'input-due-date', 'input-duration'].forEach(id => {
    document.getElementById(id)?.addEventListener('blur', e => validateFormField(e.target));
  });

  // Duplicate-word warning on title (non-blocking — just advisory)
  document.getElementById('input-title')?.addEventListener('blur', e => {
    if (e.target.value && hasDuplicateWords(e.target.value)) {
      const errEl = document.getElementById('title-error');
      if (errEl && !errEl.textContent) {
        errEl.textContent = 'Heads up: this title contains a repeated word.';
        errEl.style.color = 'var(--color-warning)';
        errEl.removeAttribute('hidden');
      }
    }
  });
}

export function openAddForm() {
  editingId = null;
  document.getElementById('form-heading').textContent = 'Add Task';
  document.getElementById('form-submit-btn').textContent = 'Add Task';
  document.getElementById('form-cancel-btn').setAttribute('hidden', '');
  document.getElementById('edit-id').value = '';
  document.getElementById('task-form').reset();
  clearAllFormErrors();
  hideStatusEl('form-status');
  renderTagOptions();
}

export function openEditForm(record) {
  editingId = record.id;
  document.getElementById('form-heading').textContent = 'Edit Task';
  document.getElementById('form-submit-btn').textContent = 'Save Changes';
  document.getElementById('form-cancel-btn').removeAttribute('hidden');
  document.getElementById('edit-id').value = record.id;

  document.getElementById('input-title').value    = record.title;
  document.getElementById('input-due-date').value  = record.dueDate;
  document.getElementById('input-duration').value  = record.duration;

  renderTagOptions();
  document.getElementById('input-tag').value = record.tag;

  clearAllFormErrors();
  hideStatusEl('form-status');
}

function resetForm() {
  editingId = null;
  document.getElementById('task-form').reset();
  document.getElementById('form-heading').textContent = 'Add Task';
  document.getElementById('form-submit-btn').textContent = 'Add Task';
  document.getElementById('form-cancel-btn').setAttribute('hidden', '');
  document.getElementById('edit-id').value = '';
  clearAllFormErrors();
  hideStatusEl('form-status');
}

function handleFormSubmit(e) {
  e.preventDefault();

  const data = {
    title:    document.getElementById('input-title').value,
    dueDate:  document.getElementById('input-due-date').value,
    duration: document.getElementById('input-duration').value,
    tag:      document.getElementById('input-tag').value
  };

  const errors = validateRecord(data);

  if (Object.keys(errors).length > 0) {
    // Map rule keys ('date') to element IDs ('due-date')
    const idMap = { title: 'title', date: 'due-date', duration: 'duration', tag: 'tag' };
    let firstEl = null;
    for (const [field, msg] of Object.entries(errors)) {
      const suffix = idMap[field];
      showFieldError(`input-${suffix}`, `${suffix}-error`, msg);
      if (!firstEl) firstEl = document.getElementById(`input-${suffix}`);
    }
    firstEl?.focus();
    return;
  }

  clearAllFormErrors();

  if (editingId) {
    state.updateRecord(editingId, data);
    showStatusEl('form-status', 'Task updated successfully.', 'is-success');
    announce('Task updated.');
    editingId = null;
  } else {
    const rec = state.addRecord(data);
    showStatusEl('form-status', 'Task added successfully.', 'is-success');
    announce('Task added.');
    editingId = null;
    // Flag the new row for a brief highlight when the table renders
    window._newRecordId = rec.id;
  }

  setTimeout(() => showSection('records'), 500);
}

function validateFormField(input) {
  const fieldMap = {
    'input-title':    ['title',    'title-error'],
    'input-due-date': ['date',     'due-date-error'],
    'input-duration': ['duration', 'duration-error'],
    'input-tag':      ['tag',      'tag-error']
  };
  const entry = fieldMap[input.id];
  if (!entry) return;
  const [ruleKey, errorId] = entry;
  const msg = validate(ruleKey, input.value);
  if (msg) {
    showFieldError(input.id, errorId, msg);
  } else {
    clearFieldError(input.id, errorId);
  }
}

function showFieldError(inputId, errorId, msg) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  input?.classList.add('is-invalid');
  input?.classList.remove('is-valid');
  if (error) {
    error.textContent = msg;
    error.style.color = '';
    error.removeAttribute('hidden');
  }
}

function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  input?.classList.remove('is-invalid');
  if (input?.value) input.classList.add('is-valid');
  if (error) {
    error.textContent = '';
    error.style.color = '';
    error.setAttribute('hidden', '');
  }
}

function clearAllFormErrors() {
  [
    ['input-title',    'title-error'],
    ['input-due-date', 'due-date-error'],
    ['input-duration', 'duration-error'],
    ['input-tag',      'tag-error']
  ].forEach(([a, b]) => clearFieldError(a, b));
}

// ============================================================
// M4 — Records (render, sort, search, delete)
// ============================================================

function setupRecords() {
  document.getElementById('search-input')?.addEventListener('input', handleSearch);
  document.getElementById('search-case-insensitive')?.addEventListener('change', handleSearch);

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => handleSortClick(btn));
  });

  // Event delegation — edit and delete buttons are added dynamically
  document.getElementById('table-wrapper')?.addEventListener('click', e => {
    const editBtn   = e.target.closest('[data-edit]');
    const deleteBtn = e.target.closest('[data-delete]');
    if (editBtn)   handleEditClick(editBtn.dataset.edit);
    if (deleteBtn) handleDeleteClick(deleteBtn.dataset.delete);
  });
}

function handleSearch() {
  const input   = document.getElementById('search-input');
  const ciCheck = document.getElementById('search-case-insensitive');
  const errorEl = document.getElementById('search-error');
  const value   = input.value.trim();

  if (!value) {
    searchRegex = null;
    errorEl?.setAttribute('hidden', '');
    renderRecords();
    return;
  }

  // @tag: filter is handled separately — no regex compile needed
  if (TAG_FILTER_RE.test(value)) {
    searchRegex = null;
    errorEl?.setAttribute('hidden', '');
    renderRecords();
    return;
  }

  const re = compileRegex(value, ciCheck?.checked !== false);
  if (re === 'invalid') {
    if (errorEl) {
      errorEl.textContent = 'Invalid regex pattern.';
      errorEl.removeAttribute('hidden');
    }
    searchRegex = null;
    renderRecords();
    return;
  }

  if (errorEl) errorEl.setAttribute('hidden', '');
  searchRegex = re;
  renderRecords();
}

function handleSortClick(btn) {
  const field = btn.dataset.sort;
  if (sortField === field) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDir   = 'asc';
  }

  document.querySelectorAll('.sort-btn').forEach(b => {
    const active = b.dataset.sort === sortField;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
    const arrow = b.querySelector('.sort-arrow');
    if (arrow) arrow.textContent = active ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
  });

  renderRecords();
}

function handleEditClick(id) {
  const record = state.getRecords().find(r => r.id === id);
  if (!record) return;
  openEditForm(record);
  showSection('add-edit');
}

function handleDeleteClick(id) {
  const record = state.getRecords().find(r => r.id === id);
  if (!record) return;

  const ok = window.confirm(`Delete "${record.title}"?\n\nThis cannot be undone.`);
  if (!ok) return;

  state.deleteRecord(id);
  announce(`Task deleted: ${record.title}`);
  renderRecords();
  renderStats();
}

export function renderRecords() {
  const wrapper  = document.getElementById('table-wrapper');
  const countEl  = document.getElementById('records-count');
  if (!wrapper) return;

  const searchInput = document.getElementById('search-input')?.value.trim() || '';
  const settings    = state.getSettings();
  let   records     = state.getRecords();
  const total       = records.length;

  // Apply filter — @tag: syntax takes priority over regex
  let filterTag = null;
  if (searchInput) {
    const tagMatch = searchInput.match(TAG_FILTER_RE);
    if (tagMatch) {
      filterTag = tagMatch[0];
      records = records.filter(r => r.tag.toLowerCase() === filterTag.toLowerCase());
    } else if (searchRegex) {
      records = records.filter(r => searchRegex.test(r.title));
    }
  }

  // Sort
  records = [...records].sort((a, b) => {
    if (sortField === 'duration') {
      return sortDir === 'asc' ? a.duration - b.duration : b.duration - a.duration;
    }
    const av = String(a[sortField]).toLowerCase();
    const bv = String(b[sortField]).toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  // Count label
  if (countEl) {
    if (total === 0) {
      countEl.textContent = '';
    } else if (records.length === total) {
      countEl.textContent = `${total} task${total !== 1 ? 's' : ''}`;
    } else {
      countEl.textContent = `${records.length} of ${total} task${total !== 1 ? 's' : ''} shown`;
    }
  }

  if (records.length === 0) {
    const msg = total === 0
      ? 'No tasks yet. <a href="#" data-section="add-edit">Add your first task</a>.'
      : 'No tasks match your search.';
    wrapper.innerHTML = `<p class="empty-state">${msg}</p>`;
    return;
  }

  const re    = filterTag ? null : searchRegex;
  const newId = window._newRecordId;
  window._newRecordId = null;

  const rows = records.map(r => buildRow(r, re, settings, r.id === newId)).join('');
  wrapper.innerHTML = `
    <table class="records-table">
      <caption class="sr-only">
        Campus tasks — sorted by ${sortField} ${sortDir === 'asc' ? 'ascending' : 'descending'}
      </caption>
      <thead>
        <tr>
          <th scope="col">Title</th>
          <th scope="col">Due Date</th>
          <th scope="col">Duration</th>
          <th scope="col">Tag</th>
          <th scope="col"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildRow(record, re, settings, isNew) {
  const titleHtml = highlight(record.title, re);
  return `
    <tr data-id="${escapeHtml(record.id)}"${isNew ? ' class="is-new"' : ''}>
      <td data-label="Title" class="col-title">${titleHtml}</td>
      <td data-label="Due Date">${escapeHtml(formatDate(record.dueDate))}</td>
      <td data-label="Duration">${escapeHtml(formatDuration(record.duration, settings.displayUnit))}</td>
      <td data-label="Tag"><span class="tag-badge">${escapeHtml(record.tag)}</span></td>
      <td data-label="" class="col-actions">
        <div class="action-wrap">
          <button class="btn btn--outline btn--sm" data-edit="${escapeHtml(record.id)}"
            aria-label="Edit task: ${escapeHtml(record.title)}">Edit</button>
          <button class="btn btn--danger btn--sm" data-delete="${escapeHtml(record.id)}"
            aria-label="Delete task: ${escapeHtml(record.title)}">Delete</button>
        </div>
      </td>
    </tr>`;
}

// ============================================================
// M5 — Stats dashboard (renderAll, renderStats, cap, chart)
// ============================================================

export function renderAll() {
  renderStats();
  renderChart(state.getRecords());
}

export function renderStats() {
  const records  = state.getRecords();
  const settings = state.getSettings();
  const todayStr = todayISO();

  const total = records.length;

  const todayMin = records
    .filter(r => r.dueDate === todayStr)
    .reduce((sum, r) => sum + r.duration, 0);

  const tagCounts = records.reduce((acc, r) => {
    acc[r.tag] = (acc[r.tag] || 0) + 1;
    return acc;
  }, {});
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const weekEnd = dateOffsetISO(6);
  const dueWeek = records.filter(r => r.dueDate >= todayStr && r.dueDate <= weekEnd).length;

  const todayDisplay = formatDuration(todayMin, settings.displayUnit);

  setText('stat-total',    total);
  setText('stat-today',    todayDisplay);
  setText('stat-top-tag',  topTag);
  setText('stat-due-week', dueWeek);

  const todayLabel = document.getElementById('stat-today-label');
  if (todayLabel) todayLabel.textContent = settings.displayUnit === 'hours' ? "Today's Hours" : "Today's Minutes";

  renderCapStatus(todayMin, settings.dailyCap, settings.displayUnit);
}

function renderCapStatus(todayMin, cap, unit) {
  const display      = document.getElementById('cap-display');
  const bar          = document.getElementById('cap-bar-fill');
  const progressbar  = document.getElementById('cap-progressbar');
  const statusMsg    = document.getElementById('cap-status-msg');
  const alertMsg     = document.getElementById('cap-alert-msg');
  if (!display) return;

  // Clear both live regions before setting either, so a change in state is always announced
  if (statusMsg) statusMsg.textContent = '';
  if (alertMsg)  alertMsg.textContent  = '';

  if (!cap || cap <= 0) {
    display.textContent = `${formatDuration(todayMin, unit)} planned today`;
    if (bar) { bar.style.width = '0%'; bar.classList.remove('is-over'); }
    if (progressbar) progressbar.setAttribute('aria-valuenow', '0');
    return;
  }

  const pct   = Math.min(100, Math.round((todayMin / cap) * 100));
  const isOver = todayMin > cap;

  display.textContent = `${formatDuration(todayMin, unit)} / ${formatDuration(cap, unit)}`;
  if (bar) {
    bar.style.width = `${pct}%`;
    bar.classList.toggle('is-over', isOver);
  }
  if (progressbar) progressbar.setAttribute('aria-valuenow', pct);

  // Small delay ensures the live region change is picked up by screen readers
  if (isOver) {
    const over = formatDuration(todayMin - cap, unit);
    setTimeout(() => { if (alertMsg)  alertMsg.textContent  = `Cap exceeded by ${over}!`; }, 80);
  } else {
    const rem = formatDuration(cap - todayMin, unit);
    setTimeout(() => { if (statusMsg) statusMsg.textContent = `${rem} remaining today.`; }, 80);
  }
}

function renderChart(records) {
  const chart = document.getElementById('trend-chart');
  const desc  = document.getElementById('trend-chart-desc');
  if (!chart) return;

  const settings = state.getSettings();
  const todayStr = todayISO();

  // Build an array of the last 7 days (oldest first)
  const days = Array.from({ length: 7 }, (_, i) => dateOffsetISO(-(6 - i)));

  const totals = days.map(d =>
    records.filter(r => r.dueDate === d).reduce((s, r) => s + r.duration, 0)
  );

  const maxVal = Math.max(...totals, 1); // avoid division by zero

  chart.innerHTML = days.map((d, i) => {
    const heightPx = Math.max(2, Math.round((totals[i] / maxVal) * 80));
    const isToday  = d === todayStr;
    const label    = shortDayLabel(d);
    const durStr   = formatDuration(totals[i], settings.displayUnit);
    return `
      <div class="chart-bar-wrap">
        <div class="chart-bar${isToday ? ' is-today' : ''}" style="height:${heightPx}px"
          aria-label="${escapeHtml(label)}: ${escapeHtml(durStr)}"></div>
        <span class="chart-bar-label" aria-hidden="true">${escapeHtml(label)}</span>
      </div>`;
  }).join('');

  if (desc) {
    const totalWeek = totals.reduce((s, t) => s + t, 0);
    const activeDays = totals.filter(t => t > 0).length;
    desc.textContent = totalWeek === 0
      ? 'No tasks planned in the last 7 days.'
      : `${formatDuration(totalWeek, settings.displayUnit)} planned across ${activeDays} day${activeDays !== 1 ? 's' : ''} in the last 7 days.`;
  }
}

// ============================================================
// M6 — Settings, tags, import / export
// ============================================================

function setupSettings() {
  document.getElementById('settings-form')?.addEventListener('submit', handleSettingsSave);

  document.getElementById('add-tag-btn')?.addEventListener('click', handleAddTag);

  document.getElementById('new-tag-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
  });

  document.getElementById('import-file-input')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  });

  document.getElementById('export-btn')?.addEventListener('click', handleExport);
  document.getElementById('reset-btn')?.addEventListener('click', handleReset);
}

export function renderSettings() {
  const settings = state.getSettings();

  const capInput = document.getElementById('setting-daily-cap');
  if (capInput) capInput.value = settings.dailyCap;

  document.querySelectorAll('input[name="displayUnit"]').forEach(r => {
    r.checked = r.value === settings.displayUnit;
  });

  renderTagChips(settings.tags);
  renderTagOptions();
}

export function renderTagOptions() {
  const select = document.getElementById('input-tag');
  if (!select) return;
  const current = select.value;
  const tags    = state.getSettings().tags;
  select.innerHTML =
    '<option value="">— Select a tag —</option>' +
    tags.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  if (current && tags.includes(current)) select.value = current;
}

function renderTagChips(tags) {
  const container = document.getElementById('custom-tags-list');
  if (!container) return;

  if (tags.length === 0) {
    container.innerHTML = '<span style="color:var(--color-text-muted);font-size:.875rem">No tags configured.</span>';
    return;
  }

  container.innerHTML = tags.map(tag => `
    <span class="tag-chip">
      ${escapeHtml(tag)}
      <button class="tag-chip-remove" type="button"
        data-remove-tag="${escapeHtml(tag)}"
        aria-label="Remove tag ${escapeHtml(tag)}">✕</button>
    </span>`).join('');

  container.querySelectorAll('[data-remove-tag]').forEach(btn => {
    btn.addEventListener('click', () => handleRemoveTag(btn.dataset.removeTag));
  });
}

function handleSettingsSave(e) {
  e.preventDefault();
  const cap  = parseInt(document.getElementById('setting-daily-cap').value, 10);
  const unit = document.querySelector('input[name="displayUnit"]:checked')?.value || 'minutes';

  if (isNaN(cap) || cap < 0 || cap > 1440) {
    showStatusEl('settings-status', 'Cap must be between 0 and 1440 minutes.', 'is-error');
    return;
  }

  state.updateSettings({ dailyCap: cap, displayUnit: unit });
  showStatusEl('settings-status', 'Settings saved.', 'is-success');
  announce('Settings saved.');
  renderStats();
  renderTagOptions();
}

function handleAddTag() {
  const input   = document.getElementById('new-tag-input');
  const errorEl = document.getElementById('new-tag-error');
  const value   = input.value.trim();
  if (!value) return;

  const err = validate('tag', value);
  if (err) {
    if (errorEl) { errorEl.textContent = err; errorEl.removeAttribute('hidden'); }
    input.classList.add('is-invalid');
    return;
  }

  const settings = state.getSettings();
  if (settings.tags.some(t => t.toLowerCase() === value.toLowerCase())) {
    if (errorEl) { errorEl.textContent = 'That tag already exists.'; errorEl.removeAttribute('hidden'); }
    return;
  }

  const newTags = [...settings.tags, value];
  state.updateSettings({ tags: newTags });

  input.value = '';
  input.classList.remove('is-invalid');
  if (errorEl) errorEl.setAttribute('hidden', '');

  renderTagChips(newTags);
  renderTagOptions();
  announce(`Tag "${value}" added.`);
}

function handleRemoveTag(tag) {
  const settings = state.getSettings();
  const newTags  = settings.tags.filter(t => t !== tag);
  state.updateSettings({ tags: newTags });
  renderTagChips(newTags);
  renderTagOptions();
  announce(`Tag "${tag}" removed.`);
}

function handleImport(file) {
  const statusEl = document.getElementById('import-status');

  const reader = new FileReader();
  reader.onload = e => {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch {
      setImportStatus(statusEl, 'Import failed: file is not valid JSON.', false);
      return;
    }

    const result = validateImport(data);
    if (!result.valid) {
      setImportStatus(statusEl, `Import failed: ${result.error}`, false);
      return;
    }

    const ok = window.confirm(
      `Import ${data.length} record${data.length !== 1 ? 's' : ''}?\n\nThis will replace all existing tasks.`
    );
    if (!ok) return;

    state.importRecords(data);
    setImportStatus(statusEl, `Imported ${data.length} record${data.length !== 1 ? 's' : ''} successfully.`, true);
    announce(`Imported ${data.length} records.`);
    renderRecords();
    renderAll();
  };

  reader.onerror = () => setImportStatus(statusEl, 'Import failed: could not read the file.', false);
  reader.readAsText(file);
}

function setImportStatus(el, msg, ok) {
  if (!el) return;
  el.textContent = msg;
  el.className   = `import-status ${ok ? 'is-success' : 'is-error'}`;
  el.removeAttribute('hidden');
}

function handleExport() {
  const records = state.getRecords();
  if (records.length === 0) {
    announce('No records to export.');
    return;
  }
  const json = JSON.stringify(records, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `campus-planner-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  announce(`Exported ${records.length} records.`);
}

function handleReset() {
  const ok = window.confirm('Delete ALL tasks permanently?\n\nThis cannot be undone.');
  if (!ok) return;
  state.resetAll();
  renderRecords();
  renderAll();
  renderSettings();
  announce('All data has been reset.');
}

// ============================================================
// Helpers
// ============================================================

function formatDuration(minutes, unit) {
  if (unit === 'hours') return `${(minutes / 60).toFixed(1)} hr`;
  return `${minutes} min`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Construct with local time to avoid UTC-midnight off-by-one in western timezones
  return new Date(y, m - 1, d).toLocaleDateString('en', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dateOffsetISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function shortDayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en', { weekday: 'short' });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showStatusEl(id, msg, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = `form-status ${cls}`;
  el.removeAttribute('hidden');
  setTimeout(() => { el.setAttribute('hidden', ''); el.className = 'form-status'; }, 4000);
}

function hideStatusEl(id) {
  const el = document.getElementById(id);
  if (el) { el.setAttribute('hidden', ''); el.textContent = ''; }
}

function announce(msg) {
  const el = document.getElementById('global-status');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { el.textContent = msg; }, 60);
}
