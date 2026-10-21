# Project instructions — mlovera.dev

Single-page, English-only static portfolio for <https://mlovera.dev>, hand-written
HTML/CSS/JS with no build step, served from the repository root by GitHub Pages.

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
- **A push is a deploy.** There is no CI; GitHub Pages serves whatever is on `main`.
- The commit hook reads every `-m` as a subject line. For a commit with a body, write
  the message to a file and use `git commit -F <file>`.

## Layout

| Path | Role |
| --- | --- |
| `index.html` | The whole site: head/SEO/JSON-LD, header, sections, project modals, footer |
| `assets/site.css` | All styles, one file, tokens on `:root` |
| `assets/site.js` | Progressive enhancement: theme, menu, reveals, modals, carousels, scene loader |
| `assets/scene.js` | Three.js particle background, lazy-loaded; morphs per section's `data-scene` |
| `assets/vendor/` | Vendored `three.module.min.js` and its licence |
| `assets/fonts/` | Self-hosted Geist and Geist Mono (`OFL.txt`) |
| `assets/img/` | Project and lab screenshots |
| `cv.pdf`, `CNAME`, `robots.txt`, `sitemap.xml` | Hand-maintained; bump `lastmod` in the sitemap on content changes |

Sections in `index.html`, in order: hero (`#top`), `#approach`, `#projects`, `#lab`,
`#experience`, `#contact`. Header nav and the mobile `.menu` link to them; keep both in
sync when adding or renaming a section.

## Running and checking

There is no `package.json`, linter config or test suite. `node_modules/` (ignored) may
still hold `playwright` and `@axe-core/playwright`; if not, install them with
`npm i --no-save playwright @axe-core/playwright` and `npx playwright install chromium`.

```bash
python3 -m http.server 4173      # then open http://127.0.0.1:4173/
```

For any change to markup, CSS or JS, verify in a real browser before committing:

- 360, 768 and 1440 px widths; no horizontal scroll at 360 px
  (`document.documentElement.scrollWidth`).
- Both themes, and with `prefers-reduced-motion: reduce`.
- axe with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`: zero violations. Use
  `browser.newContext()` pages; `AxeBuilder` refuses pages from `browser.newPage()`.
- No console errors.

## HTML and security conventions

- Exactly one `<h1>`; sections start at `<h2>`. Element `id`s are unique.
- External links use `target="_blank" rel="noopener noreferrer"` with a trailing
  `<span aria-hidden="true">↗</span>`.
- No `href="#"`, no CDNs, no frameworks, no runtime dependencies. Fonts, images,
  CSS, JS and Three.js are all served locally from `assets/`.
- The site must work without JavaScript; `site.js` only enhances. JS-only controls
  (theme toggle, carousel arrows and Pause) ship with `hidden` and are revealed by JS.
- Project cards open `<dialog class="modal">` via invoker commands
  (`commandfor` / `command="show-modal"`), with a JS fallback in `site.js`.

## Carousels

`#projects` and, at `max-width: 650px` only, `#lab` are `.carousel` wrappers around a
`.cards` track. `setupCarousel()` in `site.js` drives every `.carousel`:

- Appends one `aria-hidden` copy of the cards (links/buttons `tabindex="-1"`) for a
  seamless loop; copies still open the same modals or links on click.
- Slow autoscroll that pauses on mouse hover, keyboard focus, touch, an open modal,
  off-screen, or the Pause button (WCAG 2.2.2).
- Side arrows: a click glides one card, holding moves fast. A vertical wheel over the
  carousel scrolls it sideways; outside it the page scrolls normally.
- `data-media="<query>"` limits a carousel to matching screens and tears it down
  (removes copies, hides controls) when the query stops matching.
- Under reduced motion: no copies, no autoscroll, arrows step one card, Pause hidden.

The `.carousel-controls` (Pause) element must be the carousel's next sibling.

## CSS and accessibility

- Dark and light themes. Colours come from `:root` tokens (`--bg`, `--bg-raised`,
  `--panel`, `--ink`, `--muted`, `--line`, `--line-strong`, `--accent`, `--hover`,
  …), redefined for `[data-theme="light"]` and `prefers-color-scheme: light`. Don't
  add raw colours. The theme follows the system until the user toggles it
  (`localStorage` `theme`).
- Breakpoints in use: `max-width: 959px`, `max-width: 650px`, `min-width: 960px`,
  `min-width: 1260px`, `min-width: 1700px`. Reuse them rather than adding new ones.
- Respect `prefers-reduced-motion`; keep visible `:focus-visible` outlines and keyboard
  support (Escape closes the menu and modals).

## Content and claims

The site is for founders with expensive, slow or unreliable AI products: it pitches
scalable, AI-driven software made cheaper and faster.

- Keep capability copy separate from demonstrated outcomes. **Never invent** metrics,
  benchmarks, accuracy numbers, client names, testimonials, employment dates or
  availability. Only add a measurement with a reproducible source and context.
- Employer names and career history belong in `#experience`, not the hero.
- Avoid dashboards, metric strips or "proof" banners.

## Code style

- Plain browser JS (ES modules for `scene.js`), no bundler. Prettier-style formatting:
  double quotes, trailing commas, 2-space indent in JS/CSS, 4-space in `index.html`.
- Sparse comments that explain *why*, not what. Match the existing terse style.
