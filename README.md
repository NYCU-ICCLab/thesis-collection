# Thesis Collection

A **federated** portal that indexes the lab's theses. Each thesis lives in its
own repository and deploys to its **own** GitHub Pages site; this portal only
**indexes** them and links out. Adding a thesis is a one-line change.

**Live site:** https://nycu-icclab.github.io/thesis-collection/

## How it works

- The page is a pure static site (vanilla HTML/CSS/JS). It renders cards at
  runtime by `fetch`-ing `data/theses.json` — no framework, no bundler.
- `data/theses.json` is a **generated artifact** produced by `scripts/build.mjs`
  from two sources:
  1. **Submodule theses** — `theses/<slug>/thesis.json` (repos you control).
  2. **External theses** — entries in `data/manual.json` (repos you don't).
- A thesis breaking its own build can never break the portal: the portal stores
  only each thesis's URL, never its code.
- Every path the page emits is **relative**, so it works from the project
  subpath `https://nycu-icclab.github.io/thesis-collection/`.

## Repository layout

```
index.html               the portal page (renders cards from data/theses.json)
assets/                  styles.css + app.js (search / filter / render)
data/
  theses.json            GENERATED + committed — never hand-edit
  manual.json            external theses (hand-edited array)
theses/                  submodule theses live here (one dir per slug)
scripts/build.mjs        regenerates data/theses.json
.github/workflows/       deploy.yml (build + deploy to Pages)
```

## Add a thesis

### A — a repo you own (submodule, auto-synced)

The thesis repo must contain a root `thesis.json` (start it from
`thesis-template`).

```bash
git submodule add https://github.com/nycu-icclab/thesis-<slug> theses/<slug>
git commit -am "Add thesis: <slug>"
git push        # CI runs build.mjs -> regenerates theses.json -> redeploys
```

### B — an external thesis you don't own (link-only)

Append one object to `data/manual.json` (shape below), then:

```bash
npm run build                       # regenerate data/theses.json locally
git commit -am "Add thesis: <slug>"
git push
```

No submodule needed.

### Metadata contract

Each `thesis.json` / `manual.json` entry:

```json
{
  "slug": "neurostage-thesis-viz",
  "title": "NeuroStage",
  "subtitle": "A stable, interpretable multidomain EEG model …",
  "authors": ["Yun-Chieh Huang (黃云潔)"],
  "advisor": "Li-Chun Wang (王蒞君)",
  "year": 2025,
  "institution": "NYCU · Institute of AI Innovation",
  "tags": ["EEG", "BCI"],
  "abstract": "…",
  "url": "https://ashurali.github.io/neurostage-thesis-viz/",
  "repo": "https://github.com/ashurali/neurostage-thesis-viz",
  "archive": false
}
```

`slug`, `title`, `url` are required; everything else optional. `url` is the live
external site the card links to. Set `archive: true` (submodule theses only) to
also mirror the static files into `archive/<slug>/` and expose `archiveUrl`.
`source` (`"submodule"` | `"external"`) is added automatically by the build.

## Regenerating `data/theses.json`

`data/theses.json` is **committed** (so local checkouts and GitHub's file view
always show the current list) **and** regenerated in CI before every deploy (so
the live site is never stale even if someone forgets to rebuild locally). To
refresh it locally:

```bash
npm run build      # = node scripts/build.mjs   (needs Node 20+)
git commit -am "rebuild index"
```

You only need to do this locally if you want the committed copy to match
immediately; CI regenerates it on every push regardless.

## Clone

```bash
git clone --recurse-submodules https://github.com/nycu-icclab/thesis-collection
```

Already cloned without submodules? `git submodule update --init --recursive`.

## Notes

- Public submodules work with the default `GITHUB_TOKEN`. If any thesis repo is
  **private**, give the checkout step a PAT: add
  `token: ${{ secrets.SUBMODULE_PAT }}` to `actions/checkout` in
  `.github/workflows/deploy.yml`.
- Archive mirrors (`archive/<slug>/`) are built in CI and served from the Pages
  artifact, but git-ignored — never committed.
