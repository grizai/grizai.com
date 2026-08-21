#!/bin/sh
# Preview the site exactly the way GitHub Pages will serve it.
exec python3 -m http.server 8000 --directory "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
