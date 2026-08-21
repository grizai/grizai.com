# grizai.com

The GrizAI website as plain static HTML. No build step, no framework, no
dependencies — what is in this folder is exactly what gets served.

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
.nojekyll                   tells GitHub Pages to serve files as-is
```

## Editing

**Text and links** — edit the HTML directly and refresh the browser.

**A known cost of having no build step:** the header and footer are duplicated
in all 21 HTML files. Changing a nav item or the footer means a find-and-replace
across all of them. That was a deliberate trade for zero tooling; if it starts to
hurt, a small template step is the fix.

**Adding a project:**

1. `cp -r projects/with-entalpic projects/<new-slug>`
2. In the new `index.html`, edit the `<title>`, the `description` and `og:`
   meta tags, the `<link rel="canonical">`, the `<h1 class="heading-12">` title,
   the `.text-block-2` subtitle, the `.key-points` list, the `.project-image`
   (`src` and `srcset`), and the `.project-text` body.
3. Add a matching card to `projects/index.html` — copy an existing
   `.project-list-item` block and change the `href`, image and text.

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

The repo is <https://github.com/grizai/grizai.com>, and GitHub Pages is already
enabled on it. Not pointed at the live domain yet.

When you are ready: add a `CNAME` file containing `www.grizai.com`, then at
DNSimple point the apex `A` records at GitHub's four IPs and `www` at
`grizai.github.io`.

All internal paths are relative to each page's own depth (`assets/...` from the
root, `../assets/...` one level down, and so on), so the site renders correctly
wherever it is mounted: a custom domain, `grizai.github.io/grizai.com/`, a plain
`localhost` root, or even opened straight off disk with `file://`. Nothing needs
configuring for the domain switch.

The one exception is `404.html`, which uses root-absolute paths. GitHub Pages
serves it for *any* unmatched URL, at any depth, so relative paths would resolve
against whatever the mistyped path happened to be. This means the 404 page is
styled correctly on a custom domain but will be unstyled under a `github.io`
subpath — a deliberate trade, since the domain is where it matters.

**Leave the `MX` and `SPF` records alone** — Google Workspace mail runs on this
domain, and it is unrelated to where the website is hosted.

Still worth adding at that point: a `sitemap.xml` and a `robots.txt`. The Webflow
site had neither.

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
