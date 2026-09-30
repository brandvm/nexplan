# Nexplan Webflow custom code

Custom CSS and JavaScript for https://www.nexplaninstitute.com/, migrated from CodeSandbox to `brandvm/nexplan`. Release: **v1.0.0**.

## Install in Webflow

| File | Location |
| --- | --- |
| [webflow/head.html](webflow/head.html) | Site settings → Custom code → Head |
| [webflow/global-embed.html](webflow/global-embed.html) | Shared global-code Embed, once on every page and CMS template |
| [webflow/footer.html](webflow/footer.html) | Site settings → Custom code → Footer |

1. Replace the supplied global head block with `head.html`. The replacement removes the empty font preload and duplicate viewport tag. Webflow already supplies a responsive viewport; the replacement leaves pinch zoom available.
2. Replace the entire supplied global Embed, including the CodeSandbox link and both inline style blocks, with `global-embed.html`. Its stylesheet link belongs in the Designer Embed so styles can render on the canvas. All original head CSS, CodeSandbox CSS, disabled-button and featured-resource overrides are consolidated in the repository stylesheet in their original order.
3. Replace the supplied global footer block with `footer.html`. Remove the old CodeSandbox script, standalone Lenis script and inline Lenis initializer. Lenis is included in the new bundle.
4. Preserve unrelated integrations and page-specific code. The homepage tab-link handler, About page custom scrollbar, booking form select handler, Finsweet Attributes on Resources, dynamic year Embed, and Webflow-generated scripts remain in Webflow.
5. Refresh the Designer. Publish to the Webflow staging domain and check desktop/mobile pages, sliders, resource tabs/filtering, navigation and booking form UI; then publish to the live domain. This repository migration does not itself publish Webflow.

Keep Webflow's GSAP, ScrollTrigger, SplitText, Flip, jQuery and runtime enabled. Do not add duplicate CSS or JavaScript tags elsewhere.

## Production URLs

- https://cdn.jsdelivr.net/gh/brandvm/nexplan@v1.0.0/dist/nexplan.min.css
- https://cdn.jsdelivr.net/gh/brandvm/nexplan@v1.0.0/dist/nexplan.min.js

The CSS is 7,316 bytes; the main JS is 19,789 bytes, including Lenis. Swiper is loaded from the same versioned directory only when matching slider markup is present. Slider initialization retains the existing near-viewport behavior.

## Source and installed dependencies

- `src/styles.css`: custom styles, including the supplied head and Embed overrides.
- `src/index.js`: imports Lenis and captures the bundle URL for matching vendor asset URLs.
- `src/runtime.js`: original slider and navigation modules plus the migrated Lenis initialization.
- `src/vendor/swiper.js`: separate Swiper bundle and stylesheet.
- `originals/`: unmodified CodeSandbox assets, supplied global snippets as published, and an inventory of the 70 homepage-linked pages inspected on September 30, 2026. Page-specific scripts in the inventory are reference backups and are not included in the global bundle.

Dependencies are pinned in `package.json` and `package-lock.json`: Lenis 1.1.5 preserves the original settings; Swiper 12.1.2 replaces the floating Swiper 11 URL with a patched release; esbuild 0.28.2 produces the minified assets. `node_modules/` is ignored. Third-party license notices are redistributed under `dist/licenses/`.

The migration adds a duplicate-init guard and a shared Swiper loading promise with error handling. Original slider selectors, settings, breakpoints, navigation controls, data overrides, reduced-motion behavior and the navbar's 12px shrink threshold are retained. Missing smooth-scroll dependencies leave native scrolling available.

## Develop and release

Node 24 is recorded in `.nvmrc`.

```sh
npm ci
npm run check
npm test       # build and behavior tests
npm run build # regenerate dist/ and Webflow snippets
npm run dev   # local assets at http://127.0.0.1:3001
```

The development server does not automatically change Webflow's installed URLs. The production links are pinned to an immutable tag: editing `main` does not update a published release or the Designer canvas.

For an update:

1. Edit the source; increment `package.json` and run `npm install --package-lock-only`.
2. Run `npm run check`, `npm test`, and browser checks for the affected behavior.
3. Commit source, lockfile, `dist/` and generated Webflow snippets together.
4. Push a new `vX.Y.Z` tag. Never move an existing published tag.
5. Verify the new jsDelivr URLs; replace the version in both the shared Embed and footer, refresh Designer and publish.

GitHub Actions installs the lockfile, checks syntax, builds and tests, and verifies that committed assets and snippets match the source. To roll back, restore the previous versioned CSS and JS URLs together. The original snippets are retained for the initial migration rollback.

## Validation

Nine behavior tests cover the GSAP/Lenis connection, duplicate inclusion, editor exclusion, missing dependencies, conditional vendor loading, versioned URLs, failed Swiper loading, slider options/navigation and the navbar threshold. All 70 homepage-linked pages returned HTTP 200 when inspected. Local browser validation and CDN verification are recorded in the release notes. No enquiry form was submitted, and no Webflow site was published during this migration.

This repository contains custom code and build assets. Webflow continues to own page layout, generated CSS/JS, CMS content and interactions; this is not a full site export.
