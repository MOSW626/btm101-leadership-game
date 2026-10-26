# Verification record — 2026-10-26

This records the source revision prepared after the first working classroom deployment. It does not certify that these changes have reached the live site.

## Passed in this workspace

- Production compilation, TypeScript validation, prerendering, and route generation with `npm run build -- --webpack`.
- ESLint (the final pass removes an unused test import).
- Scoring: all 7⁶ vectors for each of the three axes, 352,947 axis patterns in total; all 27 L/M/X result patterns; neutral boundaries, direction reversal, invalid input, empty aggregates, midpoint handling, divided-question selection.
- Ownership primitive: a key matches only its own stored hash; another owner, a participant-like token, missing or malformed keys, and an admin-only room do not match.
- Actual result interpretation component rendered to HTML for 27 patterns × 2 languages (54 cases). Checked three axis sections, combination text only for the eight complete profiles, neutral notes for X axes, and no missing values.
- Neutral interpretations distinguish all-midpoint, opposing choices, and weak one-sided choices.
- Repository ignore rules exclude `.env.local`, deployment metadata, dependencies, build output, and Supabase temporary metadata.

## Verified 2026-10-27 (networked workspace)

- `20261026010000_public_hosting.sql` applied to the production Supabase project with `supabase db push`; the first migration was already recorded and no data was reset.
- `node scripts/verify-app.mjs` against a local production build connected to that DB: 60 API checks passed, TEST rooms only, hosting switch restored to closed.
- Headless Chrome, 360 px phone and 1280 px projector: quiz, KO/EN switch keeping answers, LLL result with the reading panels, pre-reveal stats, admin reveal, projector stats. No horizontal scroll.
- Public hosting in the browser: open switch → create room at `/host` → manage with the issued key → restore on a separate browser profile with the key → the same key gets 401 on an admin room → switch restored to closed.

## Class-run tests 2026-10-27 01:00 KST

- 60 simulated students on one network against production: staggered join, rejoin with token reuse, submit, one third edited and resubmitted, 5 s polling by every student and the presenter, three late joiners rejected after close (409), reveal. No errors, no distribution before reveal, no nicknames or raw answers in public stats. Public aggregates equal a local recomputation except last-digit float rounding in per-question variance. Latency from Korea to the iad1 functions: p50 0.85–1.2 s, p95 up to 1.7 s, max 2.1 s.
- Bugs found in the browser and fixed:
  1. **Edited answers were never saved.** With `cacheComponents`, Next kept the result page alive with its earlier state; after "Edit answers" the page showed the new result while the server kept the old one. `cacheComponents` is now off.
  2. Opening `/s/<code>/quiz` before joining bounced back to the landing page and the start button then did nothing (same cause).
  3. After turning that off, a connection drop at the final submit could not reach the result page. The quiz now fully prefetches the result page on the last question; offline submit shows the save-failed message and retry saves once.
  4. The room-code field cut a pasted code with a leading space (maxLength 6 → 12; input is trimmed).
- Function region set to `icn1` (Seoul) in `vercel.json` to sit next to the Seoul database.
- After the fixes, on a local production build against the live DB: 20 browser edge cases (unknown room, lowercase code, direct quiz link, refresh mid-quiz, offline submit and retry, edit and resave count, second tab, reveal and hide reaching participants, closed room for new and saved students), the edit-then-save check, the navigation trace, and the phone/projector flow all pass. The public-room part of `verify-app` was blocked by its own hourly quota during this run.

## Not verified in the first workspace (kept for the record)

- Browser screenshot/layout interaction. Browser tooling failed to initialize in this workspace.
- Live API/DB integration of the new public-hosting feature. Starting the local HTTP server was denied with `listen EPERM`; outbound GitHub DNS and local browser-agent connections were unavailable.
- Applying `20261026010000_public_hosting.sql` to the existing production DB.
- Deploying these changes to Vercel.
- GitHub repository creation/push; it requires a working network and GitHub authentication.

The new public-creation flag defaults to false in the migration. Apply the migration before deploying the new application. After connectivity is available, run the API integration script against a test deployment, verify two real browsers, and only then enable public room creation after class. The integration script temporarily toggles creation and restores the initial setting; do not run it during an active class.

These are software checks. They do not validate the activity as a psychometric instrument.
