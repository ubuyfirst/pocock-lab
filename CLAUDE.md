# pocock-end-to-end-js

Template for the agentic SDLC lab. A static site in `site/` with tested ES
modules; deploys to GitHub Pages on every push to `main`.

## Commands

- Test: `npm test` (Node's built-in runner; tests live in `tests/*.test.js`)
- Serve locally: `npm start` -> http://localhost:8080
- There is no typecheck or linter, so `/implement`'s typecheck step means `npm test`, the whole local check. CI also runs it in two non-UTC time zones, since `TZ` has no effect on Windows.

## Layout

- `site/*.html`, `site/style.css` - the pages; `index.html` is the home page and holds the nav
- `site/src/*.js` - ES modules imported by the pages and by the tests; computation goes here
- `site/data/rides.csv` - sample data (date, city, rides)
- `tests/*.test.js` - one test file per module, using `node:test` and `node:assert/strict`; `docs.test.js` instead checks that README names every page and module
- `.github/workflows/publish.yml` - runs tests on pull requests and pushes to `main`; a push to `main` also deploys `site/` to Pages
- `docs/agents/*.md` - configuration the skills read (see Agent skills below), plus the lab brief
- `CODING_STANDARDS.md` - how `/code-review` judges the Conventions below

## Conventions

- Computation lives in `site/src` modules and gets a test; pages only load data and display it.
- Vanilla HTML, CSS and ES modules. No framework, bundler, or npm dependencies.
- New pages are new HTML files in `site/`, linked from the nav in `index.html`, using relative paths (`./...`) so they work under a Pages subpath.
- Charts are CSS bars or inline SVG, drawn from data returned by a tested function.
- A page that fetches `site/data/rides.csv` must be served over http (`npm start`); opening the file directly will not work.

## The lab workflow

`/grill-with-docs` -> `/to-spec` -> `/to-tickets` -> `/implement` -> `/code-review` -> PR -> merge (which deploys).
The feature being built is described in `FEATURE.md`. One ticket at a time, on a branch, small commits.

- **Design on disk**: `/grill-with-docs` ends by writing the settled design to `docs/design/<feature>.md` (decisions, scope, what was rejected). `/to-spec` in a later session builds from that file; the conversation it ran in is gone.
- **Tickets obey Conventions**: when a ticket or spec places code against the Conventions above, follow the Conventions and say so in the PR.
- **Lab deliverables**: what "done" and "per Andy" mean for this repo is in `docs/agents/lab-brief.md`.

## Agent skills

### Issue tracker

Issues, specs and tickets live in this repo's GitHub Issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

The five triage roles use their default label names: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
