# Supabase backend (Level Evaluation)

The candidate test (`index.html`) and admin panel (`admin.html`) talk to Supabase
Edge Functions in project `ymaxtkaqfspsjaunfmuq`. This folder is the **source of
truth / version-controlled copy** of that backend. The functions are currently
managed by pasting into the Supabase Dashboard → Edge Functions.

## Layout
```
supabase/
  schema.sql                       -- DB columns/tables (run in SQL Editor)
  functions/
    _shared/questions.ts           -- the question bank (single canonical copy)
    get-questions/index.ts         -- returns the test for a token (section-filtered)
    submit-assessment/index.ts     -- grades MCQ, stores/merges results
    create-retest/index.ts         -- re-issues selected sections (new link)
    get-results/index.ts           -- admin: results + attempt history
    create-employee/index.ts       -- admin: create employee, return token
    list-employees/index.ts        -- admin: list employees + status
    preview-questions/index.ts     -- admin: full bank incl. answer keys + scripts
    save-manual-scores/index.ts    -- admin: save 0-5 manual scores
```

`get-questions`, `submit-assessment`, and `preview-questions` import the shared bank.

## ⚠️ Two things to know when pasting into the Dashboard
1. **Shared file path.** In the Dashboard, each function carries its **own copy** of
   the shared bank at `<function>/_shared/questions.ts`, and imports it as
   `./_shared/questions.ts`. In this repo the bank lives **once** at
   `functions/_shared/questions.ts`, so the repo's `index.ts` files import
   `../_shared/questions.ts`. When pasting an `index.ts` into the Dashboard, change
   `../_shared/questions.ts` back to `./_shared/questions.ts`, and make sure that
   function's `_shared/questions.ts` matches `functions/_shared/questions.ts` here.
   (Only `get-questions` and `submit-assessment` import it.)
2. **Editing prompts/questions** means updating `functions/_shared/questions.ts`
   here **and** the `_shared/questions.ts` inside every Dashboard function that uses it.

## Environment variables (set in Supabase)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — used by all functions.
- `ADMIN_PASSWORD` — gate for admin functions (`get-results`, `create-retest`,
  `list-employees`, `create-employee`, `preview-questions`, `save-manual-scores`).

## Storage
- Bucket `dispatch-test-audio` holds speaking recordings at `<token>/speaking_<i>.webm`,
  served to the admin via 1-year signed URLs.

## Coverage
All eight Edge Functions and the schema are now mirrored here. This is a
reference/backup copy — editing files here does **not** auto-deploy; changes are
applied by pasting into the Dashboard (or via the CLI).

## Deploying (optional, via CLI)
With the Supabase CLI authenticated (`supabase login`) you could deploy from this
folder, e.g. `supabase functions deploy get-questions --project-ref ymaxtkaqfspsjaunfmuq`.
Note the `_shared` import-path difference above if you mix CLI and Dashboard edits.
