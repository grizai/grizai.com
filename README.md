# grizai.com

The GrizAI website as plain static HTML. No framework, no dependencies — what
is in this folder is exactly what gets served.

The one piece of tooling is `build.py`, which copies the shared head, nav and
footer into every page. It needs nothing but Python 3, and the site does not
depend on it having been run: every page is a complete file, so a fresh clone
serves and previews with no setup at all.

## Preview locally

```sh
./serve.sh
```

Then open <http://localhost:8000>. This uses Python's built-in server, which
resolves directory URLs (`/services` → `services/index.html`) the same way
GitHub Pages does, so what you see locally is what will deploy.

## Layout

```
index.html                  /
services/index.html         /services
projects/index.html         /projects          (all 15 project cards)
projects/<slug>/index.html  /projects/<slug>   (15 detail pages)
credentials/index.html      /credentials
testimonials/index.html     /testimonials      (all 40 testimonials)
404.html
assets/css/site.css         the whole stylesheet
assets/js/site.js           mobile nav + FAQ accordion, ~110 lines
assets/img/                 128 images
assets/fonts/               Manrope (variable, self-hosted)
sitemap.xml                 written by build.py
robots.txt
.nojekyll                   tells GitHub Pages to serve files as-is
build.py                    propagates the shared blocks into every page
_templates/                 the shared head, nav and footer
```

## Editing

**Page content** — edit the HTML between the `<!-- @content -->` markers and
refresh the browser. That region is yours; nothing regenerates it.

**The nav, the footer, or anything in `<head>`** — edit the file in
`_templates/`, then:

```sh
python3 build.py
```

That rewrites all 21 pages, fixing up each one's relative paths and marking its
own nav item as current. Do not edit those regions in a page directly; the next
build overwrites them.

**A page's own title, description or share image** live in the `@page` block at
the top of that page:

```html
<!-- @page
title: Mursion | GrizAI – Fractional AI & Robotics
description: Immersive Learning For the Workplace | Mursion was valued at $100M+
image: assets/img/griz-project-1500x750-mursion.jpg
nav: projects-detail
-->
```

Write plain text — `&` not `&amp;`, the script escapes it. `title` and
`description` each feed three tags, and the canonical and `og:url` are derived
from the file's path, so they cannot drift.

**Adding a project:**

1. `cp -r projects/with-entalpic projects/<new-slug>`
2. In the new `index.html`, edit the `@page` block, then the `<h1
   class="heading-12">` title, the `.text-block-2` subtitle, the `.key-points`
   list, the `.project-image` (`src` and `srcset`), and the `.project-text` body.
3. Add a matching card to `projects/index.html` — copy an existing
   `.project-list-item` block and change the `href`, image and text.
4. `python3 build.py` — this also adds the page to `sitemap.xml`.

**Images** go in `assets/img/` and are referenced as `/assets/img/<name>`.
Several are served responsively via `srcset` at `-p-500`, `-p-800` and `-p-1080`
widths; if you add a large image, either provide those sizes or drop the
`srcset` and `sizes` attributes and let the browser use the single file.

## How the JavaScript is used

`assets/js/site.js` is the only script on the site and does exactly two things:

- **Mobile navigation** (below 992px). It recreates the structure the stylesheet
  expects — the menu moves into a generated `.w-nav-overlay` and gets a
  `data-nav-menu-open` attribute — plus outside-click, Escape and keyboard
  handling.
- **The FAQ accordion** on `/services`, animating each panel's height.

If JavaScript fails to load, the FAQ answers render fully expanded rather than
being stuck shut, and every page is otherwise complete: all projects and
testimonials are real HTML, not fetched at runtime.

## Deploying to GitHub Pages

The repo is <https://github.com/grizai/grizai.com>, serving
<https://grizai.com> from `master` via the `CNAME` file. Push and it is live;
there is no build to wait for, because the committed HTML *is* the site.

A GitHub Action (`.github/workflows/build-check.yml`) runs `build.py --check`
on every push and fails if a template was edited without rebuilding. It only
checks — it never blocks the site from being served.

All internal paths are relative to each page's own depth (`assets/...` from the
root, `../assets/...` one level down, and so on), so the site renders correctly
wherever it is mounted: the custom domain, `grizai.github.io/grizai.com/`, a
plain `localhost` root, or even opened straight off disk with `file://`.

The one exception is `404.html`, which uses root-absolute paths — its `@page`
block sets `base: /`. GitHub Pages serves it for *any* unmatched URL, at any
depth, so relative paths would resolve against whatever the mistyped path
happened to be. This means the 404 page is styled correctly on the custom
domain but will be unstyled under a `github.io` subpath — a deliberate trade,
since the domain is where it matters.

**Leave the `MX` and `SPF` records alone** — Google Workspace mail runs on this
domain, and it is unrelated to where the website is hosted.

## Provenance

Built from a Webflow code export plus a targeted fetch of the content the export
could not reach: 9 of the 15 project detail pages, and the paginated remainder of
the projects and testimonials lists, which Webflow served 6 at a time behind a
"load more" button powered by Finsweet Attributes.

Verified against the live Webflow site by comparing computed layout geometry
element by element. The pages match exactly, with two intended differences:

- The client-logo carousel on `/credentials` is now a static CSS grid showing all
  19 logos at once, instead of a JavaScript slider showing one at a time.
- The projects and testimonials lists are complete on page load, so the
  "load more" buttons are gone.
