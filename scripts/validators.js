// Validation rules for Campus Life Planner form fields.
// Each RULES entry maps to one field; the key matches what the UI passes to validate().
// 'date' is the rule key for the dueDate field value.

export const RULES = {
  title: {
    pattern: /^\S(?:.*\S)?$/,
    message: 'Title cannot start or end with spaces.'
  },
  duration: {
    // Whole or decimal number, no leading zeros, max 2 decimal places
    pattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    message: 'Duration must be a non-negative number (up to 2 decimal places).'
  },
  date: {
    pattern: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    message: 'Date must be in YYYY-MM-DD format (e.g. 2025-10-15).'
  },
  tag: {
    // Letters only; spaces and hyphens allowed as separators between words
    pattern: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    message: 'Tag must contain only letters, spaces, or hyphens (e.g. "Self-Care").'
  }
};

// Advanced: back-reference - catches duplicate consecutive words in a title.
// e.g. "study study session" or "the The exam" both match.
export const DUPLICATE_WORD_RE = /\b(\w+)\s+\1\b/i;

// Advanced: lookbehind - extracts the tag name from @tag: filter syntax.
// e.g. "@tag:Study" → extracts "Study"
export const TAG_FILTER_RE = /(?<=@tag:)(\w+)/;

/**
 * Validates a single field value against its rule.
 * Returns an error message string on failure, or null on success.
 */
export function validate(field, value) {
  const rule = RULES[field];
  if (!rule) return null;
  return rule.pattern.test(value) ? null : rule.message;
}

/**
 * Validates all fields of a task data object.
 * Returns an object of { fieldName: errorMessage } for every failing field.
 * An empty object means everything is valid.
 */
export function validateRecord(data) {
  const errors = {};
  const fields = ['title', 'date', 'duration', 'tag'];

  for (const field of fields) {
    // dueDate in the data model maps to the 'date' rule key
    const value = field === 'date' ? data.dueDate : data[field];

    if (value === undefined || value === null || String(value).trim() === '') {
      const label = field === 'date' ? 'Due date' : field.charAt(0).toUpperCase() + field.slice(1);
      errors[field] = `${label} is required.`;
    } else {
      const msg = validate(field, String(value));
      if (msg) errors[field] = msg;
    }
  }

  return errors;
}

/**
 * Returns true if the title has a duplicate consecutive word.
 * This is a warning, not a hard block - the caller decides how to surface it.
 */
export function hasDuplicateWords(title) {
  return DUPLICATE_WORD_RE.test(title);
}

/**
 * Validates a parsed JSON import array before loading it into state.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateImport(data) {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Import file must contain a JSON array at the top level.' };
  }
  if (data.length === 0) {
    return { valid: false, error: 'Import file is empty - nothing to load.' };
  }

  const required = ['id', 'title', 'dueDate', 'duration', 'tag', 'createdAt', 'updatedAt'];

  for (let i = 0; i < data.length; i++) {
    const rec = data[i];
    if (typeof rec !== 'object' || rec === null || Array.isArray(rec)) {
      return { valid: false, error: `Record at index ${i} is not an object.` };
    }
    for (const key of required) {
      if (!(key in rec)) {
        return { valid: false, error: `Record at index ${i} is missing required field: "${key}".` };
      }
    }

    const titleErr = validate('title', String(rec.title));
    if (titleErr) return { valid: false, error: `Record ${i} - title: ${titleErr}` };

    const durationErr = validate('duration', String(rec.duration));
    if (durationErr) return { valid: false, error: `Record ${i} - duration: ${durationErr}` };

    const dateErr = validate('date', String(rec.dueDate));
    if (dateErr) return { valid: false, error: `Record ${i} - dueDate: ${dateErr}` };
  }

  return { valid: true };
}
