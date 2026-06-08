# Kilo Club

A web-based training platform for Olympic weightlifting. Manages multi-week macrocycles with daily workout tracking, nutrition logging, 1RM management, and session journaling. Built as a flat-file single-origin app — no build step, no backend, no dependencies beyond Google Fonts. Runs entirely in the browser with localStorage for persistence.

---

## Running Locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`. The app must be served over HTTP — opening `index.html` directly as a file will break the JSON fetch calls.

---

## File Structure

```
/
├── index.html              # HTML shell
├── style.css               # All styles
├── auth.js                 # Login, roles, theme, view switching
├── log.js                  # 1RM panel, workout logging, notes, feeling scale
├── program.js              # Cycle renderer, warmup/cooldown, wave log, volume chart
├── nutrition.js            # Nutrition tracker, food picker, cookbook
├── journal.js              # Session notes journal, CSV export, add-workout modal
├── foods.json              # Food database (name, calories, protein, carbs, fat)
├── lifts.json              # Lift database for exercise autocomplete
├── crumville_logo.png      # Logo asset
├── platform.png            # Login background image
└── cycles/
    ├── admin_2025-spring.json   # Spring 2025 admin program (starts 3/16/2026)
    ├── admin_2025-summer.json   # Summer 2025 admin program (starts 6/8/2026)
    ├── 2025-spring.json         # Spring 2025 member-facing program
    └── 2025-fall.json           # Fall 2025 member-facing program
```

---

## Source Files

### `index.html`
Pure HTML skeleton. No inline JS or CSS. Contains the login gate, admin/member nav bars, hero section with program metadata, the 1RM input panel, the program body container, the nutrition panel, and the footer. All behavior and styles are in the external files below. Script load order matters — auth.js must come before log.js, which must come before program.js.

### `style.css`
All visual styles. Built around CSS custom properties for light/dark theming — the `[data-theme="dark"]` and `[data-theme="light"]` blocks at the top define every color. Key layout classes: `.days-grid` (CSS grid, `repeat(auto-fit,minmax(300px,1fr))` — days flow side by side and stack only when space runs out), `.day-card`, `.ex-table`, `.week-content`, `.week-nav`. Also contains superset indicator styles (colored left-border groups), log button states (logged/missed/mixed), wave entry styles, the warmup/cooldown collapsible section styles, and responsive breakpoints.

### `auth.js`
Handles everything before the app is usable. Manages login (password-gated, role-based — admin vs member), theme selection (dark/light/system), the member name modal, logout, and the `switchView` function that toggles between Admin, Class Program, Competitor Lifts, and Nutrition tabs. Defines the `userKey()` helper that namespaces all localStorage keys per role so admin and member data never collide. `initApp()` is called on page load and determines which view to restore.

### `log.js`
Two major responsibilities:

**1RM Panel** — input fields for all tracked lifts (Snatch, Clean & Jerk, Back Squat, Front Squat, Clean Deadlift, Bench Press, Strict Press). Maxes are saved to localStorage and used by the renderer to calculate target weights from percentages. `getMaxForExercise(name)` is the key lookup function used throughout the renderer.

**Log Modal** — the bottom-sheet that opens when you tap LOG on any exercise. Handles per-set weight input, made/missed outcome buttons, set add/remove controls, and a 1–5 feeling scale for rating the session. Also contains the wave log variant for multi-percentage wave entries. Saves to localStorage under `kc_log_{role}_{awKey}_e{N}` keys.

**Day Metrics + Notes** — daily body weight, session duration, and free-text notes per training day. Feeling ratings, notes, and metrics are stored separately from workout logs so they can be read independently by the journal.

### `program.js`
The cycle renderer. Reads a loaded cycle JSON and builds all the HTML for mesocycle headers, week tabs, day cards, and exercise tables. Key responsibilities:

- **`renderCycle(cycle)`** — entry point. Parses `cycle.startDate`, sets `CYCLE_ADMIN_START` / `CYCLE_MEMBER_START` globals, then builds the full program HTML and injects it into `#program-body`.
- **Date math** — `CYCLE_ADMIN_START` and `CYCLE_MEMBER_START` are `let` globals initialized from the cycle JSON's `startDate` field. All pill dates, week visibility logic, and scroll-to-today use these globals. Switching cycles re-sets them automatically.
- **Warmup/cooldown** — `dayWarmupExercises(day)` generates a context-aware barbell complex + mobility block based on the day's `focus` field (snatch days get a snatch complex, C&J days get a clean complex, etc.). `dayCooldownExercises()` returns a fixed stretching routine. Both render as collapsible sections, collapsed by default, via `toggleWU()`.
- **Wave loading** — days with `— Wave N` exercise names are grouped into a single table row with stacked sets/loads and a unified LOG button.
- **Volume chart** — `renderVolumeChart()` draws an SVG bar chart of estimated session volume (sets × reps × load%) per week, shown in the phase overview.
- **Superset grouping** — exercises with `superset: true` / `supersetEnd: true` flags are visually grouped with a colored left border and SUPERSET badge.

### `nutrition.js`
Full nutrition tracking panel. Organized around daily meal cards (Breakfast, Lunch, Dinner, Snacks) with per-entry food logging.

- **Food picker** — searchable autocomplete against `foods.json`. Supports a three-state custom entry flow: type a name not in the database → "Add custom" option appears → fill in macros → saves to localStorage with a SAVED badge in future searches.
- **Macro targets** — daily calorie and macro goals (protein/carbs/fat) with preset buttons (Cut / Maintain / Bulk / Performance). Progress rings per meal and a daily summary bar.
- **Cookbook** — save any meal as a named template and re-apply it to any day with one tap.
- **Copy meal** — copies a full meal from one day to another within the same log week.
- **Confetti** — fires when you hit your daily calorie target.

### `journal.js`
Three main features:

**Session Notes Journal** — collects all days where you wrote notes, logged a feeling rating, or saved an add-workout entry, and presents them chronologically in a slide-out panel. Each entry is expandable. Exportable as a printable HTML report (`downloadNotesPDF()`).

**Add Workout Modal** — bottom-sheet for logging workouts that aren't in the program (personal records, extra work, conditioning). Supports strength sets (per-set weight/reps), AMRAP, and cardio types. Saved entries appear on the day card above the day notes section.

**CSV Import/Export** — `exportCSV()` dumps all workout logs and notes to a flat CSV. `importCSV()` reads it back in. Useful for backups or transferring data between devices since localStorage doesn't sync across browsers.

Also owns `onAdminCycleChange()` (the handler for the admin cycle selector dropdown) and `updateOlympicTotal()` / `updatePowerTotal()` which recalculate displayed totals when maxes change.

---

## Cycle JSON Format

Cycles live in `cycles/` and are loaded by `fetch()` at runtime. The admin cycle selector maps option values like `admin_2025-summer` to `cycles/admin_2025-summer.json`.

### Top-level fields

```json
{
  "id": "admin_2025-summer",
  "name": "My Program",
  "startDate": "2026-06-08",
  "dates": "6/8 – 8/28",
  "days": "Mon / Tue / Wed / Fri / Sat",
  "goal": "Max Snatch + C&J · Squat + Deadlift Build",
  "phases": [ ... ]
}
```

`startDate` is critical — the renderer reads it to set date globals. Format must be `YYYY-MM-DD`. Admin cycles start on Monday; member cycles shift +3 days to Thursday automatically.

### Phase

```json
{
  "id": "a1",
  "number": "01",
  "colorClass": "m1",
  "title": "MESOCYCLE 1 — STRENGTH BASE",
  "subtitle": "Weeks 1–4 · 6/8–7/3 · ...",
  "weeks": [ ... ]
}
```

`colorClass` controls the meso accent color: `m1` = teal, `m2` = yellow.

### Week

```json
{
  "number": 1,
  "label": "Week 1",
  "intent": {
    "colorClass": "m1",
    "title": "Week 1 · 6/8–6/12",
    "text": "Coaching intent paragraph shown above the day grid."
  },
  "days": [ ... ]
}
```

### Day

```json
{
  "label": "MONDAY",
  "colorClass": "mon",
  "focus": "PULL STRENGTH / TOP-END BACK",
  "exercises": [ ... ]
}
```

`colorClass` is `mon` (teal) or `thu` (yellow). `focus` appears in the day card header.

### Exercise

```json
{
  "name": "Snatch Pull (3s to knee, accelerate)",
  "sets": "5×3",
  "load": "103%",
  "note": "Slow off floor, explode knee to extension · 1 set / 75s",
  "tag": "hard",
  "tagText": "PR",
  "superset": true,
  "supersetEnd": true
}
```

- `load` can be a percentage (`"78%"`), absolute weight (`"135 lbs"`), or descriptive (`"Bar"`, `"BW"`, `"Build"`). The renderer parses percentages against the user's stored 1RM to compute target weights.
- `note` shows as small text under the exercise name in the table.
- `tag` + `tagText`: renders a colored badge. Values: `"hard"` (red), `"peak"` (yellow), `"beginner"` (teal).
- `superset` / `supersetEnd`: mark the start and end of a superset group. Exercises in the middle need neither flag — they're inferred.
- Wave loading: name exercises `"Snatch — Wave 1"`, `"Snatch — Wave 2"` etc. The renderer groups them automatically.

### Special day types

**Rest days** are generated automatically from `ADMIN_OFF_OFFSETS = [3, 6]` (Thursday=3, Sunday=6 from the week's Monday). No entry needed in the JSON.

**Table header override**: add `"tableHeaders": ["Attempt", "Structure", "Target Load"]` to a day to replace the default column headers (used for the Week 12 Olympic Total day).

---

## Summer 2025 Macrocycle

12-week Chinese-style program. Training days: Mon / Tue / Wed / Fri / Sat. Rest: Thu / Sun.

**Design focus areas:**
- Back strength at the top of the pull and through the turnover (high pulls from power position, snatch grip deadlifts, rows)
- Knee-to-extension acceleration in the second pull (tempo pulls, deficit work in Meso 2, block work)
- Snatch lockout (tall snatch, heaving snatch balance climbing to 95%, snatch push press + OHS)
- Squat and deadlift build (daily squatting, Friday RM ladder in Meso 3: 3RM → 2RM → 1RM → test)

| Mesocycle | Weeks | Dates | Focus |
|-----------|-------|-------|-------|
| 1 — Strength Base | 1–4 | 6/8–7/3 | High frequency, daily squat, 5×5 volume, top-of-pull back work |
| 2 — Force & Acceleration | 5–8 | 7/6–7/31 | Deficit/block variations, heavy squat doubles, jerk positioning |
| 3 — Peak & Test | 9–12 | 8/3–8/28 | Wave loading, RM tests, Olympic Total on 8/28–8/29 |

**Weekly day structure:**

| Day | Focus |
|-----|-------|
| Monday | Snatch + snatch pull + high pull from power position + back squat |
| Tuesday | Clean & jerk + clean pull + hang clean + jerk variation + front squat |
| Wednesday | Overhead — snatch balance / heaving snatch balance / tall snatch + back squat |
| Thursday | Rest |
| Friday | Deadlift build — snatch/clean deadlifts + jerk from rack + posterior chain |
| Saturday | Competition lifts at volume + back squat + good mornings + reverse lunge |
| Sunday | Rest |

**Meso 3 Friday RM progression:**
Each Friday builds to a new max with a defined warmup cluster (50%×3 → 65%×2 → 75%×1 → 85%×1 → build to RM). Week 9: 3RM. Week 10: 2RM. Week 11: 1RM. Week 12 Friday: Clean Deadlift 1RM + last light snatch/C&J before the total.

---

## localStorage Key Reference

All keys are namespaced with the user role prefix from `userKey()`.

| Pattern | What it stores |
|---------|----------------|
| `kc_maxes_{role}` | JSON object of all 1RM values by lift name |
| `kc_log_{role}_{phaseId}_w{N}_d{D}_e{E}` | Per-exercise log entry (sets, weights, outcomes) |
| `kc_notes_{role}_{phaseId}_w{N}_d{D}` | Day text notes |
| `kc_feeling_{role}_{phaseId}_w{N}_d{D}` | Feeling rating (1–5) |
| `kc_time_{role}_{phaseId}_w{N}_d{D}` | Session duration |
| `kc_bw_{role}_{phaseId}_w{N}_d{D}` | Bodyweight for that day |
| `kc_nut_{role}_{YYYY-MM-DD}` | Nutrition log for that date |
| `kc_nut_target_{role}` | Daily macro targets |
| `kc_cookbook_{role}` | Saved meal templates |
| `kc_custom_foods_{role}` | User-added foods not in foods.json |
| `kc_aw_{role}_{phaseId}_w{N}_d{D}` | Add-workout entries for that day |
| `kc_unit` | Selected weight unit (lbs/kg) |
| `kc_theme` | Selected theme (dark/light/system) |
