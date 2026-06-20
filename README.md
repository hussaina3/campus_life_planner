# Campus Life Planner

A browser-based task and event tracker for students. Track study sessions, assignments, exams, and campus events - with regex search, a live dashboard, and full import/export. No sign-up, no server, everything stays in your browser.

**Live demo**: https://hussaina3.github.io/campus-life-planner

---

## Chosen Theme

**Campus Life Planner** - records include `title`, `dueDate`, `duration` (minutes), and `tag`.

---

## Data Model

```json
{
  "id": "rec_0001_1727222400000",
  "title": "Study for COMP101 midterm",
  "dueDate": "2025-10-15",
  "duration": 120,
  "tag": "Study",
  "createdAt": "2025-09-25T10:00:00.000Z",
  "updatedAt": "2025-09-25T10:00:00.000Z"
}
```

Fields:
- `id` - unique string, format `rec_NNNN_timestamp`
- `title` - string, no leading/trailing spaces, max 120 chars
- `dueDate` - string, format `YYYY-MM-DD`
- `duration` - number, minutes (non-negative, up to 2 decimal places)
- `tag` - string from the configured tag list
- `createdAt` / `updatedAt` - ISO 8601 timestamps, auto-set

---

## Features

- Add, edit, and delete tasks with inline confirm on delete
- Regex-powered live search with case-insensitive toggle and `<mark>` highlighting
- Sort records by due date, title (A–Z), or duration
- Dashboard with total stats, 7-day trend bar chart, and top tag
- Daily duration cap with ARIA live region alerts (polite when under, assertive when exceeded)
- Duration display in minutes or hours (toggle in Settings)
- Custom tag management - add and remove tags in Settings
- Import / export JSON with full structure validation
- Full keyboard navigation, skip link, visible focus rings, ARIA landmarks and live regions

---

## File Structure

```
index.html          Single-page app shell
tests.html          Inline validator unit tests (run via HTTP)
seed.json           12 sample records for import
README.md
.gitignore
styles/
  base.css          CSS custom properties, reset, typography, utilities
  layout.css        Header, nav, main layout - mobile-first, 3 breakpoints
  components.css    Buttons, inputs, forms, table, stats, chart, badges
  animations.css    Keyframes and transitions
scripts/
  storage.js        localStorage read/write (no logic)
  state.js          In-memory state + CRUD mutations
  validators.js     Regex rules, validateRecord, validateImport
  search.js         Safe regex compiler + highlight helper
  ui.js             All DOM rendering and event handling
  main.js           App entry point - init state then init UI
```

---

## Regex Catalog

| Field / Feature | Pattern | Purpose | Example match |
|---|---|---|---|
| Title | `/^\S(?:.*\S)?$/` | No leading/trailing spaces | `"Study session"` ✓ · `" Study"` ✗ |
| Duration | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Non-negative, max 2 decimal places | `"90"` ✓ · `".5"` ✗ |
| Due date | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | YYYY-MM-DD only | `"2025-10-15"` ✓ · `"25-10-15"` ✗ |
| Tag | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Letters, spaces, hyphens | `"Self-Care"` ✓ · `"tag1"` ✗ |
| Duplicate words *(back-reference)* | `/\b(\w+)\s+\1\b/i` | Warns on repeated consecutive words | `"study study"` → warning |
| Tag filter *(lookbehind)* | `/(?<=@tag:)(\w+)/` | Extracts tag from `@tag:` search prefix | `"@tag:Exam"` → `"Exam"` |
| Time token | `/\b\d{2}:\d{2}\b/` | Finds HH:MM patterns in titles | `"Meet at 09:00"` → match |

---

## Keyboard Map

| Key | Action |
|---|---|
| `Tab` | Move forward through interactive elements |
| `Shift+Tab` | Move backward |
| `Enter` / `Space` | Activate buttons, links, checkboxes, radio buttons |
| `Escape` | Close mobile nav (returns focus to hamburger button) |
| Skip link (first `Tab` on load) | Jump directly to `#main-content` |
| Arrow keys | Navigate within radio groups (display unit setting) |
| `Enter` in new-tag input | Submit the new tag without clicking Add Tag |

All section headings receive programmatic focus on navigation so screen readers announce the page change.

---

## Accessibility Notes

- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` with appropriate roles and labels
- One `<h1>` per section, `<h2>`/`<h3>` for subsections - no skipped levels
- Every `<input>` and `<select>` has an associated `<label>`; the file import uses `<label for="...">` to trigger the hidden input
- Two ARIA live regions in the body: `role="status"` (polite) for general feedback, `role="alert"` (assertive) for cap exceeded
- `aria-current="page"` on the active nav link, updated on every section switch
- `aria-live="polite"` on cap status, `aria-live="assertive"` on cap exceeded alert
- The 7-day bar chart carries `role="img"` + `aria-label` + a visible text description updated by JS
- The records progress bar has `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Skip-to-content link is the first focusable element; visible on focus
- Visible `:focus-visible` rings on all interactive elements (2px solid purple, 2px offset)
- Color contrast: all text/background pairs target WCAG AA (≥ 4.5:1). `<mark>` uses amber background (#FDE68A) with dark text (#1E1B4B)
- `prefers-reduced-motion` media query collapses all animations to 1ms

---

## How to Run Tests

```bash
# from the project root - ES modules require HTTP, not file://
npx serve .
# open http://localhost:3000/tests.html
```

52 assertions across 7 groups. Results render on the page (green = pass, red = fail).

---

## How to Run the App Locally

```bash
npx serve .
# open http://localhost:3000
```

No build step. No dependencies. Just a static file server.

---

## Seed Data

`seed.json` contains 12 diverse records across all 6 default tags, with a range of durations (30–240 min) and dates across a full semester. Load it via **Settings → Data Management → Import Records**.

---

## Demo Video

[Unlisted YouTube link - add before submission]

The video covers: keyboard-only navigation flow, regex search edge cases (including `@tag:` syntax and the duplicate-word warning), import/export round-trip, and the daily cap ARIA live region.

---

## Author

**Hussaina Abubakar**  
[a.hussaina@alustudent.com](mailto:a.hussaina@alustudent.com)  
[github.com/hussaina3](https://github.com/hussaina3)
