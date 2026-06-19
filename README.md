# Campus Life Planner

A browser-based task and event tracker for students. Track study sessions, assignments, exams, and campus events — with regex search, a live dashboard, and full import/export. No sign-up, no server, everything stays in your browser.

**Live demo**: [GitHub Pages URL — add after deployment]

---

## Chosen Theme

**Campus Life Planner** — records include `title`, `dueDate`, `duration` (minutes), and `tag`.

---

## Data Model

```json
{
  "id": "rec_0001_1695600000000",
  "title": "Study for COMP101 midterm",
  "dueDate": "2025-10-15",
  "duration": 120,
  "tag": "Study",
  "createdAt": "2025-09-25T10:00:00.000Z",
  "updatedAt": "2025-09-25T10:00:00.000Z"
}
```

Fields:
- `id` — unique string, format `rec_NNNN_timestamp`
- `title` — string, no leading/trailing spaces
- `dueDate` — string, format `YYYY-MM-DD`
- `duration` — number, minutes (non-negative, up to 2 decimal places)
- `tag` — string from the configured tag list
- `createdAt` / `updatedAt` — ISO 8601 timestamps

---

## Features

- Add, edit, and delete tasks with inline confirmation on delete
- Regex-powered live search with case-insensitive toggle and `<mark>` highlighting
- Sort records by due date, title (A–Z), or duration
- Dashboard with total stats, 7-day trend bar chart, and top tag
- Daily duration cap with ARIA live region alerts (polite when under, assertive when exceeded)
- Duration display in minutes or hours (configurable in Settings)
- Custom tag management in Settings
- Import / export JSON with structure validation
- Full keyboard navigation, skip link, visible focus, ARIA landmarks and live regions

---

## Wireframes

**Dashboard** — 4 stat cards (total tasks, today's minutes, top tag, due this week) + a 7-bar daily trend chart + cap progress bar. Two quick-action buttons (Add Task, View Records) at the bottom.

**Records** — search input + case-insensitive toggle above a sortable table. On mobile the table collapses to stacked cards with labeled fields. Each row has Edit and Delete buttons.

**Add/Edit Form** — four fields (title, due date, duration, tag select) with inline validation errors. Heading and submit label change between "Add Task" and "Edit Task" depending on mode.

**Settings** — three fieldsets: daily cap (number input), display units (radio), custom tags (chips + add input). Below that, a data management panel with import/export/reset.

**About** — app description, feature list, and contact info.

---

## A11y Plan

- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Heading hierarchy: one `<h1>` per section, `<h2>` / `<h3>` for subsections
- Every `<input>` and `<select>` has an associated `<label>`
- Skip-to-content link as the first focusable element in the page
- Two ARIA live regions: `role="status"` (polite) for general feedback, `role="alert"` (assertive) for cap exceeded warnings
- `aria-current="page"` on the active nav link, updated on each section switch
- Focus moves to the section `<h1>` after navigation so screen readers announce the page change
- Visible focus ring on all interactive elements (`:focus-visible` with 2px offset)
- Color contrast: all text/background pairs target WCAG AA (≥ 4.5:1 for normal text)
- `<mark>` elements for search highlights include sufficient contrast
- The bar chart has `role="img"` with an `aria-label` and an adjacent live-updated text description
- Mobile nav overlay traps focus when open

---

## Regex Catalog

| Field / Feature | Pattern | Purpose | Example match |
|---|---|---|---|
| Title | `/^\S(?:.*\S)?$/` | No leading/trailing spaces | `"Study session"` ✓, `" Study"` ✗ |
| Duration | `/^(0|[1-9]\d*)(\.\d{1,2})?$/` | Non-negative number, max 2 decimal places | `"90"` ✓, `"1.5"` ✓, `".5"` ✗ |
| Due date | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | YYYY-MM-DD format | `"2025-10-15"` ✓, `"25-10-15"` ✗ |
| Tag | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Letters, spaces, hyphens only | `"Study"` ✓, `"Self-Care"` ✓, `"study1"` ✗ |
| Duplicate words *(advanced — back-reference)* | `/\b(\w+)\s+\1\b/i` | Catches accidental repeated words in title | `"study study"` ✓ (warns user) |
| Tag filter *(advanced — lookbehind)* | `/(?<=@tag:)\w+/` | Extracts tag name from `@tag:Study` search syntax | `"@tag:Exam"` → extracts `"Exam"` |
| Time token search | `/\b\d{2}:\d{2}\b/` | Finds HH:MM patterns in task titles | `"Meet at 09:00"` matches `"09:00"` |

---

## Keyboard Map

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move focus between interactive elements |
| `Enter` / `Space` | Activate buttons, links, checkboxes |
| `Arrow keys` | Navigate sort buttons (grouped with `role="group"`) |
| `Escape` | Close mobile nav, cancel edit mode |
| Skip link (first `Tab`) | Jump to `#main-content` |
| `Enter` on search input | Triggers live search (also fires on input event) |

---

## How to Run Tests

Open `tests.html` directly in a browser (must be served over HTTP for ES modules):

```bash
# from the project root
npx serve .
# then open http://localhost:3000/tests.html
```

All test results render on the page. Green = pass, red = fail.

---

## How to Run the App

```bash
npx serve .
# open http://localhost:3000
```

Or just open `index.html` in a browser — but ES modules require a server; file:// won't work.

---

## Seed Data

`seed.json` contains 12 diverse records (varied tags, durations, dates including past and future). Use the Import button in Settings to load them.

---

## Author

**Hussaina Abubakar**
[a.hussaina@alustudent.com](mailto:a.hussaina@alustudent.com)
[github.com/hussaina3](https://github.com/hussaina3)
