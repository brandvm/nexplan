# Gotchas

A running log of things that cost time on this project. Agents read it at
the start of every session and add to it when they hit something new (see
the Session protocol in `AGENTS.md`). Never delete an entry — update its
`Status` instead.

Entries tagged `Scope: template-candidate` are harvested across all client
repos to improve `brandvm/wf-template`.

## Entry format

```md
### YYYY-MM-DD · Short title
- Area: designer | css | loader | release | mcp | ci | js | perf
- Scope: project | template-candidate
- Symptom: what was observed
- Cause: why it happened
- Fix: what was done, or the workaround
- Status: open | fixed <sha> | upstreamed wf-template <sha>
- Found by: claude | codex | human
```

## This project

<!-- Add new entries here, newest first. -->

### 2026-09-30 · Local CSS edits never reach the Designer canvas
- Area: designer
- Scope: template-candidate
- Symptom: A CSS change made in `src/styles.css` with `npm run dev` running
  does not show in the Designer.
- Cause: The shared Embed links only the pinned jsDelivr release
  (`webflow/global-embed.html`); README: editing `main` "does not update a
  published release or the Designer canvas".
- Fix: none in this repo. Verify locally, then release a new tag and update
  the Embed link — or make the change in the Designer.
- Status: open
- Found by: human

### 2026-09-30 · Old head disabled pinch zoom and preloaded an empty font
- Area: loader
- Scope: project
- Symptom: The supplied head (`originals/head.html`) added a second
  viewport meta with `maximum-scale=1` and a `<link rel="preload" href="">`.
- Cause: Studio boilerplate left in place.
- Fix: `webflow/head.html` drops both; Webflow already supplies the
  viewport tag and pinch zoom stays available (README install step 1).
- Status: fixed a18305c
- Found by: human

### 2026-09-30 · Custom CSS was split across four places
- Area: css
- Scope: project
- Symptom: Rules lived in the head `<style>`, the CodeSandbox stylesheet,
  and two inline `<style>` blocks in the shared Embed
  (`originals/global-embed.html`).
- Cause: Studio added overrides wherever was convenient.
- Fix: consolidated into `src/styles.css` in their original order (README
  install step 2). Remove every old block in Webflow so CSS loads once; do
  not reorder the consolidated sections.
- Status: fixed a18305c
- Found by: human

### 2026-09-30 · Page-specific scripts are not in the bundle
- Area: js
- Scope: project
- Symptom: Behaviour such as the homepage tab-link handler or About page
  scrollbar cannot be found in `src/`.
- Cause: Only the global code was migrated. Tab links, the About
  scrollbar, the booking-form select handler, Finsweet Attributes on
  Resources and the dynamic-year Embed stay in Webflow page code (README
  install step 4; backups in `originals/page-inventory.json`).
- Fix: edit those in Webflow, or ask before migrating one into the bundle.
- Status: documented
- Found by: human

### 2026-09-30 · Floating Swiper 11 URL replaced with pinned 12.1.2
- Area: js
- Scope: project
- Symptom: The original code requested a floating Swiper 11 CDN URL.
- Cause: Unpinned dependency in the inherited code.
- Fix: Swiper 12.1.2 (patched) is bundled, loaded from the same tag only
  when slider markup exists, through one shared promise with error
  handling; near-viewport initialization and all slider settings kept
  (README "Source and installed dependencies").
- Status: fixed a18305c
- Found by: human

## Known from previous projects

Inherited from `wf-template`; only the entries that apply to this
repo's architecture are copied. Found across earlier client repos; listed so
they are not rediscovered. Status refers to the template.

### 2026-10-02 · Root font-size scale drifts from Designer tokens
- Area: css
- Scope: template-candidate
- Symptom: Designer variables named for px values ("Max Width - 1280px")
  render at different sizes; the scale is retuned again and again.
- Cause: The §01 fluid scale sets `:root` font-size, so every rem/em value
  coming out of the Designer scales with it. reformdd retuned it seven times
  (1680 → 1440 → 1680 → clamp → revert → 1920 → 1440); threestars found em
  layout tokens rendering 6.25% short.
- Fix: none general. Agree the scale with the designer before building, or
  drop it and let Webflow variables own sizing.
- Status: open
- Found by: human

### 2026-10-02 · Renaming a Webflow variable silently breaks repo CSS
- Area: css
- Scope: template-candidate
- Symptom: A container cap or token-driven value quietly stops applying.
- Cause: Container/Max Width was renamed to Section/Max Width in Webflow.
  Webflow rewrites its own references but cannot reach this bundle, so
  `var(--_layout---container--max-width, none)` fell back to `none`
  (reformdd 1ca59f6).
- Fix: avoid referencing Webflow variable names in repo CSS; if one is
  needed, log it here so renames get checked.
- Status: open
- Found by: human

### 2026-10-02 · VER lives in two snippets and a placeholder 404s at launch
- Area: release
- Scope: template-candidate
- Symptom: Prod CSS and JS both 404 the moment a custom domain is attached.
- Cause: `VER = "X.Y.Z"` is never exercised on `*.webflow.io`, and a release
  must bump VER in both the Embed and the footer snippet.
- Fix: regenx keeps one `RELEASE` value in the head config (`null` until the
  first tag) that the other snippets read.
- Status: open
- Found by: human
