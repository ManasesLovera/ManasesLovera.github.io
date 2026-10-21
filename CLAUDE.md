# Project instructions — mlovera.dev

Bilingual (English/Spanish) static portfolio for <https://mlovera.dev>, generated
by a small Node script and hosted from the repository root on GitHub Pages.

## Git workflow

This project overrides the global worktree and PR conventions in
`~/.claude/CLAUDE.md`.

- **One task at a time.** Work on a single task, finish it, then move to the next.
  Don't run parallel tasks or background agents on separate branches.
- **No worktrees.** Work directly in this checkout (`~/dev/mlovera.dev`). Don't create
  worktrees under `~/dev/worktrees/mlovera.dev/` or anywhere else.
- **No feature branches, no PRs.** Always work on `main`. Don't open pull requests.
- **Push directly to `main`, but only after the user confirms.** When a change is ready,
  commit it (Conventional Commits, per the global rules), show what will be pushed, and
  wait for explicit approval before running `git push origin main`. Approval for one push
  doesn't carry over to the next.
- **No AI attribution in commits.** Never add a `Co-Authored-By: Claude …` trailer,
  a "Generated with Claude Code" line, or any other self-attribution to commit
  messages. Commits are authored by the user alone.
- **Commit source and generated output together.** CI fails if `npm run build` changes
  any committed output (see the generated-output section below).

## Commands

Requires Node.js 22.13+ (CI uses Node 24).

```bash
npm ci                         # install dev dependencies
npm run dev                    # build once, then serve http://127.0.0.1:4173/en/
npm run build                  # regenerate all committed HTML, sitemap, robots
npm run check                  # lint + build + node:test unit tests
npx playwright install chromium
npm run test:browser           # Playwright + axe (reuses a running dev server)
```

- `npm run dev` builds **only at startup**. After editing source, run `npm run build`
  and refresh — or restart the server.
- Before proposing a commit, run `npm run check`, then confirm
  `git diff --exit-code -- index.html en es sitemap.xml robots.txt` shows only changes
  you intended. Run `npm run test:browser` for any change to markup, CSS, client JS,
  or copy length.

## Architecture

| Path | Role |
| --- | --- |
| `src/home.mjs` | `homeCopy`: short homepage and page-chrome copy, keyed `en` / `es` |
| `src/content.mjs` | `profile` (links, email, project ids) and `copy`: project details, background, notes agenda, contact |
| `src/render.mjs` | `escapeHtml`, `shell()` (head, SEO, header, footer) and page functions |
| `src/notes.mjs` | Markdown note parsing, validation, rendering (marked + Shiki) |
| `scripts/build.mjs` | Static generator; writes every route, `sitemap.xml`, `robots.txt`, `.nojekyll` |
| `scripts/serve.mjs` | Dev server; serves only public paths (`/src` etc. return 404) |
| `assets/site.css` | All styles, one file, CSS custom properties on `:root` |
| `assets/site.js` | Tiny progressive enhancement: mobile menu, language-switch hash |
| `content/notes/` | Markdown sources for Engineering Notes (currently none published) |
| `tests/site.test.mjs` | `node:test` unit tests for output, notes publishing, escaping |
| `tests/browser/` | Playwright tests at 360/768/1440 px, both locales, axe scans |
| `docs/` | `portfolio-audit.md` (positioning, evidence) and `writing-notes.md` (note contract) |

Pages are pure functions of `lang` that return HTML strings via template literals,
then pass through `shell()`. Copy is merged per page as
`const c = { ...copy[lang], ...homeCopy[lang] }`.

## Generated output

`index.html`, `en/`, `es/`, `sitemap.xml`, `robots.txt` and `.nojekyll` are
**build output that is committed**. Never hand-edit them; change `src/`, `content/`
or `scripts/` and rebuild. The build deletes and regenerates `en|es/work/` and
`en|es/notes/`, so removed projects or unpublished notes disappear automatically.
`cv.pdf`, `CNAME` and `assets/` are hand-maintained and not generated.

CI (`.github/workflows/check.yml`) only verifies; it does not deploy. GitHub Pages
serves whatever is pushed to `main`, so a push is a deploy.

## Bilingual rules

- Every user-facing string exists in **both** `en` and `es`, with identical keys and
  array shapes. Spanish is written natively (Dominican Republic, `es_DO`), not
  machine-translated word for word.
- Arrays are index-aligned across files: `homeCopy[lang].projectSummaries` and
  `projectLabels` line up with `copy[lang].work.projects`, and those line up with
  `profile.projects`. Adding, removing or reordering a project means touching all of
  them, in both languages.
- Each new page needs `path`, `alternatePaths` (use `pagePaths(suffix)`), a localized
  `title` and the route registered in `scripts/build.mjs` so it reaches the sitemap.
- No hardcoded user-visible English in `render.mjs`; a few `aria-label`s use an inline
  `lang === "en" ? … : …` — prefer moving new strings into the copy objects.

## HTML and security conventions

- Escape every interpolated value with `e(...)` (`escapeHtml`). Only pre-built HTML
  fragments from other helpers go in unescaped.
- External links use the `external()` helper (`target="_blank"`,
  `rel="noopener noreferrer"`, `↗` marked `aria-hidden`).
- Exactly one `<h1>` per page; sections start at `<h2>`. Element `id`s are unique.
- No `href="#"`, no CDNs, no frameworks, no runtime dependencies. Everything (fonts,
  images, CSS, JS) is served locally from `assets/`. npm packages are build-time only.
- The site must work without JavaScript; `site.js` only enhances. Keep the
  `<noscript>` fallback for the mobile nav working.

## CSS and accessibility

- Dark-only design (`color-scheme: dark`). Use the `:root` tokens (`--bg`, `--ink`,
  `--muted`, `--line`, `--accent`, `--font`, `--mono`) instead of new raw colours.
- Breakpoints in use: `max-width: 959px`, `max-width: 650px`; JS uses
  `min-width: 960px`. Reuse them rather than adding new ones.
- No horizontal scroll at 360 px; respect `prefers-reduced-motion`.
- Must pass axe WCAG 2.0/2.1 A and AA with zero violations; keep visible
  `:focus-visible` outlines and keyboard support (Escape closes the menu).

## Content and claims

The site is for founders with expensive, slow or unreliable AI products. Follow
`docs/portfolio-audit.md`:

- Plain-language homepage (about 340 words); technical depth goes on project pages
  or inside the `<details>` disclosure.
- Keep capability copy separate from demonstrated outcomes. **Never invent**
  metrics, benchmarks, accuracy numbers, client names, testimonials, employment
  dates or availability. Only add a measurement with a reproducible source and
  context.
- Employer names and career history belong on the About/background page only, not
  the homepage hero (tests assert `Tagshelf` stays out of it).
- Avoid dashboards, metric strips, capability cards or "proof" banners.

## Engineering Notes

Follow `docs/writing-notes.md`. In short: flat `.md` files in `content/notes/`,
required YAML frontmatter, `status: draft | published`, a real `YYYY-MM-DD` `date`,
kebab-case `slug` and `translationKey`, translations share the `translationKey`.
Drafts never render. Raw HTML is escaped and unsafe link protocols dropped. Use a
`pipeline` code fence for simple flow diagrams.

## Code style

- ES modules (`.mjs`), Node built-ins via `node:` imports, async `fs/promises`.
- Prettier-style formatting (double quotes, trailing commas, 2-space indent) and
  ESLint `js.configs.recommended`; `npm run lint` must pass.
- Sparse comments that explain *why*, not what. Match the existing terse style.
- Tests: `node:test` + `node:assert/strict` for build logic, using temp dirs for
  fixture builds; Playwright for anything a browser renders. Add a test when you add
  a validation rule, a route or an interactive behaviour.
