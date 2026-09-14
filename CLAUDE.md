# ojas-aviation-dashboard — React frontend

React 19, Vite, HashRouter, TanStack Query, Recharts, Tailwind; the Edit Data grid is jspreadsheet-ce. Deployed to GitHub Pages under `/ojas-aviation-dashboard/`. The workspace-level guide (data flow, business rules, local tooling) is `../CLAUDE.md`, which exists only on the developer machine.

## Commands
- `npm run dev`: API from `.env.development` (http://127.0.0.1:8000). Point elsewhere with `VITE_API_BASE_URL=... npx vite`, e.g. the mock backend on :8765 (`../dev_tools/mock_api.py`).
- `npm run build`, `npm run lint` (oxlint). Known pre-existing warnings: `only-export-components` in the three contexts and `SpreadsheetGrid.jsx`, and an unused `interactive` in `StandardPriorityBarChart.jsx`. Don't add new ones: keep non-component exports out of files that export components.
- `npm run deploy` (build + gh-pages). Ask the user first.

## Routes (`src/App.jsx`)
`/login`, `/dashboard/executive`, `/dashboard/qc` (QcDashboard), `/dashboard/:dept` (DepartmentDashboard; slug like `sheet-metal`), `/edit-data`. `/` redirects by role: Executive → executive, Admin → cnc, anyone else → their own department (a `QC` user → `/dashboard/qc`).

## Building a new dashboard page: reuse these
- **Layout**: `AppLayout` (TopNav + toasts). Give the page root the id `department-dashboard-fullscreen` so TopNav fullscreen works. Structure: heading row, a grid of `ChartCard`s (290px tall), then a table card.
- **Data and TopNav wiring**: key the main query `['dept-data', NAME]` (see `hooks/useQcData.js`). On mount call `db.setCurrentDept(NAME)` and `db.resetDashboardFilters()`, and keep `db.setWorkOrders(rows)` in sync. TopNav's Refresh, Add/Resolve Flag, and optimistic flag-cache updates then work unchanged. Flags come from `useDeptFlags(NAME)`.
- **Filters**: `db.dashboardFilters` accepts any keys; `hasActiveDashboardFilters` drives TopNav's "Reset Filters". Convention: each chart ignores only its own dimension(s), e.g. `filterQcRows(rows, filters, omittedKeys)`.
- **Charts** (`components/charts/`):
  - `ChartCard`: title, subtitle, `metricValue`/`metricLabel`, and either `showPriorityLegend` or `legendSeries`.
  - `StandardSingleBarChart`: `data=[{name, value, color}]`, `activeValue`, `onCategoryClick`.
  - `StandardPriorityBarChart`: stacked bars. `series` defaults to `PRIORITY_SERIES`; build rows with `addStackMeta(row, series)` from `utils/priorityChart.js`. Selection props: `activeCategory`, `activePriority` (the active series label), `onCategoryClick`, `onSegmentClick({category, priority})`. Passing a selection value that matches nothing dims the whole chart (`DIM_ALL` in QcDashboard).
- **Table**: `components/table/WorkOrderTable` gives sorting, pagination, expandable rows, flag selection, overdue row colouring, and fullscreen infinite auto-scroll. Pass `columns` (shape documented in `sharedColumns.jsx`: key, label, className, render, optional sortType and align), `getRowId` (defaults to `wo_id`), `renderExpandedRow`, and `defaultSortField`. Sorting reads `row[key]`, so precompute derived display fields (see `prepareQcRows`). With no `columns` prop it renders the department-dashboard columns.
- **Department selector**: add the name to `DASHBOARD_TARGETS` in `components/layout/DeptSelector.jsx` (currently `[...DEPARTMENTS, QC_DEPARTMENT]`) and add a route in `App.jsx` above `/dashboard/:dept`.
- **Colours**: priority Low/Medium/High = green/amber/red (`CHART_COLORS` in `utils/constants.js`). QC types: Inline `#2a78d6`, Final `#4a3aa7` (colour-blind-safe pair); badges use blue/violet/teal Tailwind classes. Validate any new categorical colours with the dataviz skill's palette validator.

## QC dashboard files
`pages/QcDashboard.jsx`; `utils/qcFilters.js` (types, ageing bands, filters, chart-data builders); `components/qc/` (`qcColumns.jsx`, `QcExpandedRow.jsx`, `QcTypeBadge.jsx`); `api/qc.js`; `hooks/useQcData.js`. Filter keys on this page: `qcType`, `ageingBand`, `sourceDept`, `priority`.

## Edit Data
`EDIT_SHEETS` in `utils/constants.js` drives the sheet tabs, commit status chips, and queries (`hooks/useEditData.js`; URL paths in `api/editData.js`). Post Data needs every `required` sheet (WOS, OWS) committed and no unsaved changes; the QC sheets are optional. Loading and error states are per active sheet. `EditDataPage.jsx` has one explicit load effect per sheet key; add one when adding a sheet.
