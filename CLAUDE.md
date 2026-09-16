# ojas-aviation-dashboard — React frontend

React 19, Vite, HashRouter, TanStack Query, Recharts, Tailwind; the Edit Data grid is jspreadsheet-ce. Deployed to GitHub Pages under `/ojas-aviation-dashboard/`. The workspace-level guide (data flow, business rules, local tooling) is `../CLAUDE.md`, which exists only on the developer machine.

## Commands
- `npm run dev`: API from `.env.development` (http://127.0.0.1:8000). Point elsewhere with `VITE_API_BASE_URL=... npx vite`, e.g. the mock backend on :8765 (`../dev_tools/mock_api.py`).
- `npm run build`, `npm run lint` (oxlint). Known pre-existing warnings: `only-export-components` in the three contexts and `SpreadsheetGrid.jsx`, and an unused `interactive` in `StandardPriorityBarChart.jsx`. Don't add new ones: keep non-component exports out of files that export components.
- `npm run deploy` (build + gh-pages). Ask the user first.

## Routes (`src/App.jsx`)
`/login`, `/dashboard/executive`, `/dashboard/qc` (QcDashboard), `/dashboard/:dept` (DepartmentDashboard; slug like `sheet-metal`), `/edit-data`. `/` redirects by role: Executive → executive, Admin → cnc, anyone else → their own department (a `QC` user → `/dashboard/qc`).

## Building a new dashboard page: reuse these
- **Layout**: `AppLayout` (TopNav + toasts). Dashboards fill the viewport and scroll inside their table; pages taller than the viewport (Executive, Edit Data) use `<AppLayout scrollable>`, which adds side padding and a scrolling content area. Give a dashboard root the id `department-dashboard-fullscreen` so TopNav fullscreen works. Structure: heading row, a grid of `ChartCard`s (290px tall), then a table card.
- **Laptop fit**: below 1700px wide (which covers 1920×1080 laptops at 125% scaling), table cells use `px-2 py-3` (`min-[1700px]:px-3` above that) and long text goes through `renderTruncated` (full text on hover). The Flags column is `sticky`: it stays pinned to the table's right edge when narrow screens scroll the table sideways. Chart axis labels shorten a word with "…" only when it would overlap a neighbour (`fitTickWords` in `utils/chartScale.js`). Check with `../dev_tools/ui_tour.py`.
- **Refresh time**: every dashboard header shows `<DataRefreshed timestamp=…>` (the latest `last_refreshed`, re-rendered each minute). Use `latestTimestamp` from `utils/formatters.js` to pick it from rows or summaries.
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

## Executive dashboard files
`pages/ExecutiveDashboard.jsx`; `components/executive/` (`DepartmentCardStrip`, `OverdueByDepartmentChart`, `MiPendingAgeingChart`, `PendingWatchlistTable`, `TrendCard` + `LossTrendChart`/`DelayOverdueTrendChart`, `DataReminderBanner`, `KpiPlaceholder`); `components/charts/StandardLineChart.jsx` (the one line-chart primitive, shared by the two trend charts); `utils/executiveFilters.js`; `api/executive.js`; `hooks/useExecutiveData.js`. Filter keys: `department`, `status`, `flaggedOnly` (each chart applies only the dimensions it has; department dims non-matching bars/lines on charts that have a department axis, but genuinely filters the underlying rows for KPI 2, which has no department bar to dim instead). `DataReminderBanner` renders from `AppLayout`, not the page itself, because the Admin lands on `/dashboard/cnc`, not Executive. Department line colors are `DEPARTMENT_COLORS` in `utils/constants.js` — a fixed, dataviz-skill-validated assignment; re-run the skill's `validate_palette.js` before changing any of them.

## Edit Data
`EDIT_SHEETS` in `utils/constants.js` (key, group, label, required) drives everything: the grouped sheet selector, the commit status chips, and the queries (`hooks/useEditData.js` → `GET /api/edit-data/sheet/{key}`). A sheet is fetched only when its tab is first opened, and `SheetLoader` copies each payload into page state, so adding a sheet needs only an `EDIT_SHEETS` entry. Post Data needs every `required` sheet (WOS, OWS) committed and no unsaved changes; the report sheets are optional. Loading and error states are per active sheet.
