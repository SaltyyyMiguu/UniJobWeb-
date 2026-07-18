# UniJobLink — Autonomous UI/UX & QA Audit — Bug Report

**Date:** 2026-07-09
**Scope:** Live click-through audit against `http://localhost:5173`, covering Company, Student, and Admin roles, at both desktop and mobile (390px) widths, in light and dark mode. No code was changed as part of this audit — findings only.

**Method:** Each finding below was reproduced and confirmed live in-browser (not inferred from reading code alone) — via screenshots, DOM/computed-style inspection (`getBoundingClientRect`, `getComputedStyle`, `elementFromPoint` hit-testing), and browser console monitoring. Everything not listed below (ATS Kanban mobile stacking, PDF viewer popout, Student Job Search grid/list toggle, Student Applications Active/History cards, Admin tag-card left-alignment, Admin Deactivate confirmation, dark mode on Company/Student/Admin dashboards) was checked and found working correctly — see the Clean / No Issues Found section at the bottom.

---

## Bug #1 — Z-index clash: leftover "Save Changes" bar floats on top of the Applicant Pipeline panel

**Severity:** Medium (visual + potential click-blocking; requires a specific sequence to trigger, but that sequence is an easy real-world mistake — HR staff routinely go Edit → (get distracted) → View Applicants)

**Component:** `frontend/src/pages/company/CompanyManageJobs.jsx`, interacting with `frontend/src/components/ApplicantPipelinePanel.jsx`, mobile only (≤768px).

**Repro steps:**
1. Log in as a Company, go to Manage Jobs, tap "Edit job" on any listing (this reveals the inline edit form + Danger Zone with a sticky `.mobile-form-actions` "Save Changes / Cancel" bar).
2. **Without** tapping Cancel or Save, tap "View Applicants" on any job card (same job or a different one).
3. The Applicant Pipeline panel opens as a full-screen overlay as expected — but the edit form's "Save Changes / Cancel" bar is still mounted underneath and renders **on top of** the pipeline panel's own action buttons (Edit Slots / Extend Offer / Reject), because both happen to win/lose a z-index tie.

**Root cause (confirmed via `getComputedStyle`):**
- `editingJob` state in `CompanyManageJobs.jsx` is never cleared when `viewingApplicantsJob` is set — both modals can be open simultaneously.
- `.mobile-form-actions button` has `z-index: 99999 !important` (added in an earlier round specifically to fix a different "tap does nothing" bug).
- `ApplicantPipelinePanel`'s `.layer-overlay` **also** resolves to `z-index: 99999` on mobile (the shared Table-to-Card/modal rule).
- On a tie, the later element in DOM order wins the paint order. `CompanyManageJobs.jsx` renders `ApplicantPipelinePanel` near the top of its JSX tree, and the job grid (containing the edit form) after it — so the edit form's action bar, being later in the DOM, wins and paints over the panel.

**Fix — Option A (correct UX fix, recommended primary fix):** don't allow both to be open at once. In `CompanyManageJobs.jsx`:

```jsx
// Before
const handleViewApplicants = (job) => {
  setViewingApplicantsJob(job);
};

// After
const handleViewApplicants = (job) => {
  setViewingApplicantsJob(job);
  setEditingJob(null);
  setShowCreate(false);
};
```

**Fix — Option B (defensive hardening, recommended in addition to A):** give the Applicant Pipeline panel's overlay an unambiguously higher z-index than any in-page sticky bar, the same fix already applied to `PdfViewerModal` earlier in this project for the identical class of bug. In `frontend/src/index.css`, inside the `@media (max-width: 768px)` block, add a rule scoped to the pipeline panel specifically (don't raise the shared `.layer-overlay` rule globally — that risks new ties elsewhere):

```css
/* ApplicantPipelinePanel needs to always win over any leftover in-page
   sticky action bar (e.g. the job-edit form's Save/Cancel), not just tie
   with it — mirrors the fix already applied to PdfViewerModal. */
.company-jobs-page .layer-overlay {
  z-index: 999999 !important;
}
```
(This requires adding a `company-jobs-page` wrapper class around the page root in `CompanyManageJobs.jsx`, or — simpler — just add an `id`/class directly to `ApplicantPipelinePanel`'s own overlay div and target that instead of reusing the generic `.layer-overlay` selector.)

---

## Bug #2 — Login page ignores dark mode entirely (white boxes + black-on-black text)

**Severity:** High (the exact "white boxes" / "black-on-black text" failure mode explicitly flagged as a hunt target; hits every user on first impression if they land on `/login` with dark mode already toggled on from a previous session — theme preference persists via `localStorage`)

**Component:** `frontend/src/pages/LoginPage.jsx`

**Confirmed root cause:** this file never imports or calls `useTheme()` — grepped the whole file, zero matches. Every color in it is a hardcoded literal (`#1A2235`, `#F7F7F5`, `#fff`, `#111`, `#333`, `#666`, `#888`, `#aaa`, `#E5E5E3`) instead of the theme CSS variables (`var(--surface)`, `var(--txt-1)`, `var(--bg)`, `var(--border)`, etc.) that every other page in the app uses. `document.documentElement`'s `data-theme` attribute correctly reads `"dark"` — the theme system itself works fine; this one page just never wired into it.

**Three concrete visual breaks, confirmed on-screen and via `getComputedStyle`:**

1. **Hero/left panel doesn't go dark** — background is hardcoded `#1A2235` (a dark navy) regardless of theme, which happens to look plausible in dark mode by coincidence, but the *mobile* hero header (lines ~96–119) hardcodes `color: '#111'` / `color: '#666'` on a `background: '#F7F7F5'` block that also never switches — on mobile this whole block stays light-themed inside an otherwise-dark page.

2. **"Register as Student / Company / Supervisor" links render as solid white boxes with dark text**, confirmed via computed style: `background-color: rgb(255, 255, 255)`, `color: rgb(51, 51, 51)` — hardcoded inline (`LoginPage.jsx` lines 160–189), completely ignoring `data-theme="dark"`.

3. **"Sign in" heading is nearly invisible** — hardcoded `color: '#111'` (line 124) against the dark `.auth-mobile-card` background in dark mode. Near-black text on a near-black card — the literal "black-on-black text" bug.

**Fix:** import `useTheme()` and replace every hardcoded color with the corresponding token. Representative diff (full file needs the same treatment applied throughout — this is one page, not one line):

```jsx
// Add at top of file
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { c } = useTheme();
  // ...
```

```jsx
// Hero panel background (line 31)
- background: '#1A2235',
+ background: c.navy,

// Mobile hero header background/text (lines 92, 107, 108, 113, 116)
- background: '#F7F7F5',
+ background: c.bg,
- color: '#111',
+ color: c.txt1,
- color: '#666',
+ color: c.txt2,

// "Sign in" heading (line 124) + subtitle (line 127)
- color: '#111',
+ color: c.txt1,
- color: '#888',
+ color: c.txt3,

// Divider (line 157)
- background: '#E5E5E3',
+ background: c.border,

// Register links (lines 160-189), all three
- background: '#fff',
+ background: c.surface,
- border: '1px solid #E5E5E3',
+ border: `1px solid ${c.border}`,
- color: '#333',
+ color: c.txt1,
// and their hover handlers currently hardcode '#E5E5E3'/'#C41E3A' — swap the
// non-hover one for c.border too:
  onMouseLeave={e => e.currentTarget.style.borderColor = c.border}

// Footer version text (line 192)
- color: '#aaa',
+ color: c.txt3,
```

Cross-check: `RegisterPage`-family components (`StudentRegisterPage.jsx` etc., reached via the links this bug is about) were spot-checked in dark mode and render correctly — they *do* call `useTheme()`. `LoginPage.jsx` appears to be the one page that was missed when dark mode was rolled out.

---

## Clean / No Issues Found

Confirmed working correctly, live, at 390px mobile width unless noted:

- **Company ATS Danger Zone `ConfirmModal`** (Archive/Delete) — renders on top cleanly, no punch-through, backdrop dims correctly (hit-tested via `elementFromPoint` at the modal's center — resolves inside the modal, not the page behind it).
- **Applicant Pipeline panel, opened cleanly** (without the Bug #1 trigger sequence) — card text wraps normally, no awkward truncation, no horizontal scroll (`scrollWidth === clientWidth`).
- **"View Resume PDF"** — opens as a small popout box (not full-screen), no overlap with surrounding elements. (The specific test applicant's PDF renders blank — confirmed via pixel inspection this is because the underlying fixture file `demo-resume.pdf` is itself a blank placeholder, not a viewer bug; a real resume PDF was verified rendering correctly in an earlier round of this project.)
- **Student Job Search** — Grid and List view both render cleanly at mobile width, no horizontal scroll in either mode.
- **Student "My Applications"** — Active tab (interview-invited card with slot picker) and History tab (Hired/Withdrawn/Not Selected cards) both checked — status badges do not overlap company logos or job titles in either tab.
- **Admin User Management mobile cards** — tag row (`ACTIVE`, `Faculty: FBM (Business)`, `Supervisor: —`) confirmed flush-left with the avatar via `getBoundingClientRect` (`avatarLeft === tagsLeft === 49px`).
- **Admin "Deactivate" button** — correctly opens a `ConfirmModal` ("Are you sure you want to deactivate the account for [Name]?") instead of executing immediately; Cancel aborts with no API call; confirmed on both mobile and desktop widths.
- **Dark mode** — Company Dashboard/Manage Jobs, Student Dashboard, Admin User Management (including its `ConfirmModal`), and the Register pages all correctly re-theme with no white boxes or unreadable text.
- **Console** — zero errors and zero warnings across every page/action in this audit, except one already-known, benign `pdf.js` informational log ("Indexing all PDF objects") when opening the resume viewer — not an error, no React key warnings observed anywhere.

---

## Suggested Priority

1. **Bug #2 (Login dark mode)** — fix first. It's the first thing any returning dark-mode user sees, and "white box + black-on-black text" is a first-impression-breaking visual bug on the single most-trafficked page in the app.
2. **Bug #1 (z-index clash)** — fix second. Lower traffic (requires a specific company-HR workflow mistake to trigger), but Option A is a two-line change with no downside, so there's no reason not to ship it alongside Bug #2.
