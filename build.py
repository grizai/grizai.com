#!/usr/bin/env python3
"""Propagate the shared head, nav and footer into every page.

    python3 build.py            rewrite the pages and sitemap.xml
    python3 build.py --check    exit 1 if anything would change (used by CI)

Python 3 standard library only. Nothing to install, on any machine.

The pages are rewritten IN PLACE rather than generated into a separate output
directory. Each one stays a complete, valid, directly-servable file, so GitHub
Pages keeps serving master as-is and the site does not depend on this script
having been run. Only the region between the @content markers is preserved;
everything around it comes from _templates/.

Each page declares its own metadata in a @page comment at the top:

    <!-- @page
    title: Services | GrizAI
    description: What I do and how engagements work.
    image: assets/img/jonathangrizou.jpg
    nav: services
    -->

Values are plain text and are HTML-escaped on output, so write & not &amp;.
"""

import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://grizai.com/'

# og:title and og:description fall back to these on pages that opt out of
# indexing, where the page's own title ("Page not found") makes a poor share
# card. Every other page uses its own.
SITE_TITLE = 'GrizAI – Fractional AI & Robotics'
SITE_DESCRIPTION = ('Jonathan helps startups and R&D teams deploy AI and robotics '
                    'systems - from prototype to scale. Schedule a free discovery call.')

YEAR = '2026'

MARK_OPEN = '<!-- @content -->'
MARK_CLOSE = '<!-- /@content -->'
PAGE_BLOCK = re.compile(r'<!-- @page\n(.*?)\n-->', re.S)


def pages():
    """Every page in the site, as repo-relative paths.

    Anything starting with _ is a template or a design mockup, not a page.
    """
    found = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in sorted(dirnames)
                       if not d.startswith(('.', '_')) and d not in ('Z_resources', 'assets')]
        for name in sorted(filenames):
            if name.endswith('.html') and not name.startswith('_'):
                found.append(os.path.relpath(os.path.join(dirpath, name), ROOT))
    return sorted(found)


def read_meta(source, path):
    m = PAGE_BLOCK.search(source)
    if not m:
        sys.exit('%s: no <!-- @page --> block' % path)
    meta = {}
    for line in m.group(1).split('\n'):
        if not line.strip():
            continue
        if ':' not in line:
            sys.exit('%s: cannot parse @page line: %s' % (path, line))
        key, value = line.split(':', 1)
        meta[key.strip()] = value.strip()
    return meta, m.group(0)


def url_for(path):
    """The canonical URL, always with the trailing slash the server serves.

    GitHub Pages 301s /services to /services/, so the tags must name the
    second form or every canonical points at a redirect.
    """
    d = os.path.dirname(path)
    return SITE + (d + '/' if d else '')


def bases(path, meta):
    """Relative prefixes for this page's depth.

    base  prefixes assets and section links
    home  the link back to the home page, which is ./ rather than empty
    """
    if meta.get('base'):                 # 404.html: served from arbitrary URLs
        return meta['base'], meta['base']
    depth = path.count('/')
    base = '../' * depth
    return base, base or './'


def apply_active(markup, active):
    """Mark the current section in a nav rendered from data-nav attributes.

    Project detail pages underline Projects (.projects-nav) instead of using
    aria-current, since they are not the projects page itself.
    """
    def one(m):
        tag, key = m.group(0), m.group(1)
        tag = re.sub(r'\s*data-nav="[^"]*"', '', tag)
        if key != active and not (active == 'projects-detail' and key == 'projects'):
            return tag
        if active == 'projects-detail':
            # Only the top nav carries this variant; the footer has no such class.
            return tag.replace('class="navigation-link ', 'class="navigation-link projects-nav ')
        tag = tag.replace('<a ', '<a aria-current="page" ', 1)
        return re.sub(r'class="([^"]*)"', lambda c: 'class="%s w--current"' % c.group(1), tag, count=1)

    return re.sub(r'<a [^>]*data-nav="([^"]+)"[^>]*>', one, markup)


def render(path, source, templates):
    meta, page_block = read_meta(source, path)

    start = source.find(MARK_OPEN)
    end = source.find(MARK_CLOSE)
    if start < 0 or end < 0:
        sys.exit('%s: missing %s / %s markers' % (path, MARK_OPEN, MARK_CLOSE))
    content = source[start + len(MARK_OPEN):end]

    base, home = bases(path, meta)
    indexed = meta.get('index', 'true') != 'false'
    esc = html.escape

    title = meta['title']
    description = meta['description']
    url = url_for(path)

    head = templates['head']
    for key, value in (
        ('{{page}}', page_block),
        ('{{title}}', esc(title)),
        ('{{description}}', esc(description)),
        ('{{canonical}}', '<link href="%s" rel="canonical"/>' % url if indexed else ''),
        ('{{og_title}}', esc(title if indexed else SITE_TITLE)),
        ('{{og_description}}', esc(description if indexed else SITE_DESCRIPTION)),
        ('{{image}}', SITE + meta['image']),
        ('{{og_url}}', '<meta content="%s" property="og:url"/>' % url if indexed else ''),
        ('{{base}}', base),
    ):
        head = head.replace(key, value)
    # canonical and og:url render empty on unindexed pages; drop the blank lines
    head = re.sub(r'\n\n+', '\n', head)

    nav = meta.get('nav', 'none')
    header = apply_active(templates['header'], nav).replace('{{base}}', base).replace('{{home}}', home)
    footer = apply_active(templates['footer'], nav).replace('{{base}}', base) \
                                                   .replace('{{home}}', home) \
                                                   .replace('{{year}}', YEAR)

    return (head + header + '\n' + MARK_OPEN + content + MARK_CLOSE + '\n'
            + footer + '\n</body>\n</html>\n')


def write_sitemap(metas):
    """The indexable URLs, straight from each page's canonical.

    No <lastmod>. It would have to come from git, and the date changes between
    building (before the commit) and CI re-checking (after it), so --check
    would fail on every commit that touched a page. Google ignores lastmod it
    cannot trust anyway, and leaving it out keeps this script free of git.
    """
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<!-- Written by build.py from each page\'s canonical URL. Do not edit by',
           '     hand; add the page and run the script instead. -->',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, meta in metas:
        if meta.get('index', 'true') == 'false':
            continue
        out.append('  <url><loc>%s</loc></url>' % url_for(path))
    out.append('</urlset>')
    return '\n'.join(out) + '\n'


def main():
    check = '--check' in sys.argv
    templates = {name: open(os.path.join(ROOT, '_templates', name + '.html')).read()
                 for name in ('head', 'header', 'footer')}

    changed, metas = [], []
    for path in pages():
        full = os.path.join(ROOT, path)
        source = open(full).read()
        metas.append((path, read_meta(source, path)[0]))
        rendered = render(path, source, templates)
        if rendered != source:
            changed.append(path)
            if not check:
                open(full, 'w').write(rendered)

    # The home page sorts first; the rest alphabetically, as before.
    metas.sort(key=lambda pm: (url_for(pm[0]) != SITE, url_for(pm[0])))
    sitemap = write_sitemap(metas)
    sitemap_path = os.path.join(ROOT, 'sitemap.xml')
    if open(sitemap_path).read() != sitemap:
        changed.append('sitemap.xml')
        if not check:
            open(sitemap_path, 'w').write(sitemap)

    if check and changed:
        print('out of date, run python3 build.py:')
        for c in changed:
            print('  ' + c)
        return 1
    print('%d pages, %d rewritten' % (len(metas), len(changed)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
