# Nexplan — Webflow custom code

Agent instructions for this repository. Codex, Cursor and similar tools read
this file directly; Claude Code reads it through `CLAUDE.md`. It is the single
source of agent rules — edit this file, never a copy of it.

This is a **hosting migration of inherited studio code**, not a project built
from `brandvm/wf-template`. The CSS and JavaScript came from a CodeSandbox
setup (Blankboard Studio); this repo builds them with esbuild and serves them
from pinned jsDelivr tags. There is no loader, no GitHub Pages staging bundle
and no dev/prod switcher.

## Project facts

- Client / site: Nexplan Institute
- GitHub: `brandvm/nexplan`, default branch `main`
- Webflow site ID: `69822d94488e3d29d81220a5` (from the Webflow CDN paths in
  `originals/page-inventory.json`)
- Staging site: unknown — fill in (`*.webflow.io` not recorded in the repo)
- Bundles (production, pinned):
  `https://cdn.jsdelivr.net/gh/brandvm/nexplan@v1.0.0/dist/nexplan.min.js`,
  `https://cdn.jsdelivr.net/gh/brandvm/nexplan@v1.0.0/dist/nexplan.min.css`
  (`swiper.min.js` / `swiper.min.css` load from the same tag on slider pages)
- Production domain: `https://www.nexplaninstitute.com/`
- Production release: `v1.0.0`
- Node 24 (`.nvmrc`), npm (`package-lock.json`); Lenis 1.1.5 and Swiper
  12.1.2 are bundled. Webflow supplies GSAP, ScrollTrigger, SplitText, Flip,
  jQuery.

## Who owns what

Webflow owns markup, layout, classes, components, CMS content, interactions
**and styling by default**. This repo owns JavaScript behaviour and only the
CSS the Designer cannot express.

That split is deliberate. Repo CSS loads from the shared Embed after
`webflow.css`, so it wins every specificity tie against the Designer. Any
rule written here that the Designer could have expressed becomes a hidden
override: the next person changes that style in the Designer, nothing
happens, and the only fix is edit `src/` → build → tag a release → update the
Embed link in Webflow → reload the Designer. Every project has lost time to
that loop.

## CSS policy — Designer first

Before writing any CSS, decide where it belongs.

1. **Can the Designer do it?** A class or combo class style, a variable, a
   breakpoint style, a state (hover/focus/current), an interaction. If yes:
   - With the Webflow MCP connected, apply it in Webflow (styles and
     variables tools), then tell the user what was changed.
   - Without the MCP, give the user exact Designer steps: class, breakpoint,
     property, value.
   - Do **not** add it to `src/styles.css`.
2. **Repo CSS needs a reason.** Every rule — or the section header comment
   covering a group of rules — carries one tag from this list:

   ```css
   /* repo-css: <tag> — <short why> */
   ```

   | Tag | Use for |
   | --- | --- |
   | `js-state` | Classes/attributes a module toggles (`.is-open`, `.is-loading`, `[data-state]`) |
   | `designer-cant` | Name the feature: `:has()`, complex combinators, `@keyframes`, `@supports`, container queries, `::marker`, `color-mix()`, masks |
   | `third-party` | Swiper, Lenis, Finsweet or other library markup |
   | `canvas-preview` | `.w-editor`, `.wf-design-mode`, `html:not([data-wf-domain])` helpers |
   | `approved-base` | A site-wide base the user explicitly asked to keep in code |
   | `override-webflow` | Overriding a `.w-*` default or a Designer style |

3. **`override-webflow` needs the user's explicit approval** and a
   `GOTCHAS.md` entry explaining why. Ask before writing it.
4. **Never, without that approval:** set `font-size` on `:root`/`html`,
   neutralize `.w-*` defaults, or reference Webflow variable names
   (`--_layout---…`, `--_typography---…`). A renamed variable in Webflow
   silently breaks every rule that reads it — Webflow rewrites its own
   references, never this bundle's.
5. **Ambiguous request?** Say which parts go in the Designer and which go in
   code before editing anything. "Make the heading bigger on mobile" is a
   Designer breakpoint style, not a media query here.

Existing rules predate this policy and are untagged; add a `repo-css` tag to
any rule you touch, and question rules the Designer could own. (The inherited
§01 Token Hub already sets a fluid `:root` font-size, and the Token Hub and
featured-resource rules read `--_colors---*` Webflow variables — see
`GOTCHAS.md`; do not extend either pattern.)

## Inherited code stays behaviour-identical

The CSS and JS in `src/` are inherited studio code. Unless the user asks
otherwise, every change must leave existing behaviour identical:

- No refactors, reformatting, selector rewrites, reordering of rules,
  "cleanups" or library upgrades mixed into another change. If you spot one
  worth doing, propose it separately.
- Keep slider selectors, settings, breakpoints, navigation controls, data
  overrides, near-viewport initialization, reduced-motion behaviour, the
  navbar's 12px shrink threshold, the native-scroll fallback, the editor
  exclusion (`Webflow.env("editor")`) and the duplicate-init guard exactly as
  they are.
- `originals/` is the read-only snapshot of the CodeSandbox assets and the
  snippets as supplied. Never edit it; diff against it when checking that
  behaviour is preserved.
- `npm test` behaviour tests must keep passing; add a test when you change
  behaviour on request.

## Architecture

- `src/index.js` imports Lenis, captures the bundle's own versioned
  directory and starts `src/runtime.js`.
- `src/runtime.js` — the original slider and navigation modules plus the
  migrated Lenis initialization. Swiper is requested from the same release
  directory only when slider markup is present, via one shared load promise.
- `src/vendor/swiper.js` → `dist/swiper.min.{js,css}`.
- `src/styles.css` → `dist/nexplan.min.css`. It consolidates, **in their
  original order**, the old head `<style>`, the CodeSandbox CSS and the two
  inline Embed blocks (disabled button, featured-resource card). Order
  matters for the cascade; do not regroup.
- `build.mjs` (esbuild) writes `dist/` **and regenerates `webflow/*.html`**
  with the version from `package.json`. Never hand-edit `dist/` or the
  generated `webflow/global-embed.html` / `webflow/footer.html`.
- **Not in this repo:** the homepage tab-link handler, About page custom
  scrollbar, booking-form select handler, Finsweet Attributes on Resources,
  the dynamic-year Embed and all Webflow-generated scripts stay in Webflow
  page code. `originals/page-inventory.json` lists them for reference only.

## Where code loads in Webflow (drives the Designer workflow)

| Snippet | Webflow location | Contents |
| --- | --- | --- |
| `webflow/head.html` | Site settings → Custom code → Head | theme-color, jsDelivr preconnect |
| `webflow/global-embed.html` | Shared global-code Embed on every page/template | `<link>` to `nexplan.min.css` |
| `webflow/footer.html` | Site settings → Custom code → Footer | `<script defer>` `nexplan.min.js` |

- CSS loads from an **Embed, so it is visible on the Designer canvas** —
  but only the **pinned release** CSS. `npm run dev` (127.0.0.1:3001) is not
  wired into Webflow, so local CSS edits never appear on the canvas. A CSS
  change is visible in the Designer only after a new tag and an updated
  Embed link.
- **The Designer canvas never runs scripts.** Anything shown only after JS
  runs is invisible there; use a `canvas-preview` rule if the Designer needs
  to see it. No live reload; reload the Designer tab.
- Debug "is my CSS loading?" with `background`, not `outline`.

## Snippets are not versioned

A push or tag changes nothing on the site. The version is pinned in **two**
snippets (Embed and footer); a release means re-pasting both in Webflow and
publishing. Say so in the commit message, and keep `webflow/` identical to
what is installed.

## Commands and release

```sh
npm ci
npm run check  # node --check on sources and build.mjs
npm test       # production build + node:test behaviour tests
npm run build  # regenerate dist/ and webflow/ snippets
npm run dev    # unminified assets + source maps at http://127.0.0.1:3001
```

`dist/` and `webflow/` are committed permanently; CI
(`.github/workflows/check.yml`) runs check + test and fails on
`git diff --exit-code -- dist webflow`, so always commit the rebuilt output
with the source.

Release exactly as the README describes: bump `package.json`, run
`npm install --package-lock-only`, check/test, commit source + lockfile +
`dist/` + `webflow/` together, push a new `vX.Y.Z` tag, verify the jsDelivr
URLs, then update both the Embed and footer links, refresh the Designer and
publish (staging first, then the live domain). Roll back by restoring the
previous CSS and JS URLs together. Never move a pushed tag; cut the next
patch. Never use `@latest`, `@main` or a branch URL in production.

## Webflow MCP limits

Worked around, not fixed — do not rediscover these.

- `custom_value` is rejected for Color and Size variables (`color-mix()`,
  `oklch()`, `calc()`). Create those through the variables JSON import with
  `valueType: "custom"`.
- No variable rename or reorder within a collection. Rename in the Designer
  (preserves ids and aliases; recreating does not).
- The WHTML importer drops `class` attributes. Create the style, then apply
  it.
- `get_all_elements` does not descend into component definitions — pass the
  component scope. An element "missing" from a page is usually inside one.
- Concurrent Designer edits change element ids. Re-query on "Element not
  found" instead of assuming deletion.
- Responsive styles are only returned when breakpoints are requested
  explicitly (`include_breakpoints`).

## Session protocol

1. **Start:** read `GOTCHAS.md`. Do not repeat a mistake already logged.
2. **During:** when something surprising costs time — a Webflow quirk, an
   inherited-code trap, an MCP limitation, a fix that had to be reverted —
   add an entry to `GOTCHAS.md` in the same commit as the fix, using the
   format at the top of that file.
3. **Scope:** tag an entry `template-candidate` when it would recur on other
   client projects (including those built from `wf-template`); those entries
   are collected later to improve the template. Otherwise tag it `project`.
4. Never delete entries. Update `Status` when something is fixed or
   upstreamed.
