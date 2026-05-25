# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server on port 3000
bun build        # Type-check + Vite build
bun build-only   # Vite build only (skips type-check)
bun type-check   # Run vue-tsc type checking
bun lint         # ESLint validation
bun lint:fix     # ESLint auto-fix
bun preview      # Preview production build
```

## Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vuetify 4** (Material Design UI)
- **Pinia** (state management)
- **Vue Router** with file-based routing from `src/pages/`
- **Vite** with TypeScript
- **Bun** as package manager and script runner

## Architecture

**File-based routing**: Any `.vue` file added to `src/pages/` automatically becomes a route (no manual router config needed).

**Auto-imports**: Components placed in `src/components/` are globally available in templates without explicit imports.

**Plugin registration**: `src/plugins/index.ts` wires together Vuetify, Pinia, and Router — add new plugins here.

**Vuetify theming**: Theme customization lives in `src/plugins/vuetify.ts`; SASS variable overrides go in `src/styles/settings.scss`.

**Path alias**: `@/` resolves to `src/`.

**MCP integration**: A Vuetify MCP server (`https://mcp.vuetifyjs.com/mcp`) is configured via `.ruler/ruler.toml`. Run `bun mcp` to apply and `bun mcp:revert` to undo.

## Data Layer

No backend — all data persists to **localStorage** under two keys: `calendar.events` (array of `CalendarEvent`) and `calendar.preferences` (`AppPreferences`). Data types are defined in `src/types/calendar.ts`.

**Two Pinia stores**:
- `useCalendarStore` (`src/stores/calendar.ts`) — persisted state: events CRUD, people management, preferences (view, sleep schedule, person filters). Watches and auto-saves to localStorage.
- `useAppStore` (`src/stores/app.ts`) — ephemeral UI state: which dialog is open, currently selected hour/column in the time grid, subtask completions (in-memory only, reset on refresh).

## View Architecture

`src/pages/index.vue` is the main route. It conditionally renders one of five view components based on `calendarStore.preferences.view`: `CalendarDayView`, `CalendarWeekView`, `CalendarMonthView`, `CalendarYearView`, or `UpNextView`. `EventDialog`, `SettingsDialog`, and `TaskView` are always mounted as overlays on this page.

The toolbar (`CalendarToolbar`) and global overlays (`CountdownBanner`, `PersonFilterBar`) live in `App.vue`.

## Recurrence & Date Handling

**All dates are ISO strings** (`YYYY-MM-DD`). Always use `parseLocalDate()` from `src/utils/dateUtils.ts` instead of `new Date(isoString)` to avoid timezone shifts.

`src/composables/useRecurrence.ts` contains `eventOccursOnDate(event, dateString)` — the single source of truth for recurrence logic. Views call `getEventsForDate()` or `getEventsForWeek()` to filter events. Supported recurrence types: `none`, `daily`, `weekly`, `yearly`, `monthly-ordinal`.

## Sleep Schedule

The time grid (day/week views) compresses sleep hours visually using `HOUR_HEIGHT_SLEEP = 20` vs `HOUR_HEIGHT_NORMAL = 80` (defined in `src/constants.ts`). `calendarStore.getSleepTimesForDate(dateString)` resolves sleep times with priority: date override → weekday config → default.

## Keyboard Shortcuts

`useKeyboardShortcuts` is mounted once in `App.vue`. Shortcuts are suppressed when focus is in an input element or when `appStore.dialogEventIsOpen` is true (except Escape). Key bindings: `d/w/u` switch views, `t` jumps to today, `n` opens new event dialog, arrow keys navigate dates, `?` shows help, `s` / `Alt+,` open settings.
