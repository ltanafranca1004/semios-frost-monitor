# Frost Monitor

A React + TypeScript screen that shows a grower which fields are at frost risk, whether each field is getting colder or warmer, and which stations are coldest or offline.

**Time spent:** about 2 hours

## Run it

Needs Node 20.19+ or 22.12+.

    npm install
    npm run dev        # open the URL Vite prints
    npm test           # all tests
    npm run typecheck
    npm run lint

## How I approached it

- **I led the planning before any code.** I read the brief, wrote down the rules most likely to go wrong (AS_OF_DATE as "today", the inclusive 7-day window, null readings, the offline rule), and had Claude Code turn them into a plan. I reviewed it, cut it down, and approved the build order before anything was built.
- **Cut the plan to fit.** The first plan included a sparkline, a retry counter with a stale-response guard, focus management and an "at-risk only" filter. I cut all four to finish the core items well in the time limit and keep every line something I can explain.
- **Checked the answers first.** I confirmed the expected results from the mock's `FIELDS` table: River Flats and South Slope at risk, Creekside the near miss at 0.5 °C, and the 4 offline stations. The app shows exactly those.
- **Built in small steps.** Logic and its tests first, then the data hook, then the UI, then an integration test. I set the rule that every step had to pass tests, type check and lint, and be reviewed by me, before I approved the commit.

## 1. Architecture

- `src/api/mockApi.ts`: the provided API, unchanged.
- `src/lib/`: plain functions, no React. `frost.ts` holds the rules, `dates.ts` the date window, `format.ts` display text.
- `src/hooks/useFrostData.ts`: fetching, loading, error and retry.
- `src/components/`: display only.
- **Fetching:** fields and stations load in parallel, then one call gets 14 days of readings. Opening a field reuses that data, so it's instant and can't fail.
- **State:** the hook holds one value that is exactly loading, error or success, so the UI can't read data before it exists. The selected field lives in `FrostMonitor`, since both the table and the detail need it.
- **Types:** I reused the API's `Field`, `Station` and `Reading` types, and `frost.ts` adds `FieldSummary`, `StationSummary`, `FrostStatus` and `Trend`, which are exactly what the UI renders.
- **Built first and left out:** see "How I approached it" above.

## 2. Edge cases and assumptions

- **Frost logic lives in `frost.ts`** as pure functions, so it can be tested without React or the random API, and the rules are named constants in one place.
- **"Today" is always `AS_OF_DATE`.** Nothing reads the computer's clock.
- **The last 7 days are Jan 9 to 15, inclusive.** Exactly 0 °C counts as risk.
- **Null is not 0.** Nulls are skipped before any calculation. Every station is null on Jan 12, so counting null as 0 would put every field at risk.
- **Offline** means no reading on `AS_OF_DATE` **and** the day before. One missed day isn't enough, or every station would look offline on Jan 12.
- **"No data", never "No risk".** Telling a grower a field is safe when nothing was reported is the dangerous mistake.
- **Trend** compares this week's average low with last week's, with ±0.5 °C counted as "Steady", because single days are noisy.
- **Slow or failed requests:** a loading message shows immediately, and any failure shows an alert with a Retry button.

## 3. Scale and reuse (500 fields, 20,000 stations)

- **What breaks:** one readings call would return ~280,000 rows, the logic re-filters all readings for every station, and a 500-row table is slow and hard to scan.
- **What I'd change:** group readings by station once; load a field's readings only when it's opened; add a server endpoint that returns each field's summary; paginate or virtualize the table.
- **Shared library candidates:** `FrostBadge` (as a general status badge), `TrendLabel`, `ErrorState`, and the format helpers.

## 4. Testing

- **Unit tests** cover the rules most likely to break silently: 0 °C and -0.5 °C count as risk, null isn't 0, the window edges (Jan 8 out, Jan 9 in), all-null gives "No data", and the offline rule.
- **Integration test:** with a mocked API, the first load fails, Retry is pressed by keyboard, and the at-risk field appears first with the text "Frost risk".
- **Proof they work:** I had Claude Code break the code on purpose seven ways (e.g. `<` instead of `<=`, null as 0, an 8-day window, sort removed, Retry made to do nothing, badge with icon only). A test failed every time.
- **Manual checks:** keyboard only, the page in grayscale, and `FAILURE_RATE = 1` for the error path.
- **Next:** trend tests, Playwright end-to-end tests, and running tests in CI on every push.

## AI usage

- **Tool:** Claude Code. I led the planning before any code was written: I set the rules and constraints from the brief, had Claude Code turn them into a written plan, then cut four features and approved the build order. From there it wrote code from my step-by-step instructions (scaffolding, components, tests and styling), and I reviewed every step before it was committed. I also used Claude (chat) to help draft this README, which I edited.
- **How I directed it:** plan first, then one step at a time; I approved each step only after tests, type check, lint and a review of what changed. This is the same way I work as the web developer at Unify Social.
- **Where it was wrong or not what I wanted:**
  - The first plan was over-built; I cut four features (above).
  - Caught by the checks I required before every commit:
    - A hard-to-read `renderDetail()` declared after `return`. I had it replaced with a plain `selectedSummary` variable before the JSX.
    - A test query that matched the "Frost risk" column header instead of the badge. The test now looks inside the first row only.
    - A lint warning about setting state inside an effect. The loading reset moved into `retry()`, with one documented lint exception, because the linter can't see that `loadData()` only sets state after an `await`.
- **Written by hand:** the -0.5 °C unit test, following the existing pattern, to check I understood the frost rule and the test setup.

## Next steps

- Move focus to the detail when a field opens, and somewhere sensible after Retry.
- Use one always-present status region so all screen readers announce loading.
- Ignore stale responses when a newer load starts.
- Playwright end-to-end tests and CI.
