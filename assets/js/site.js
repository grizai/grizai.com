/* GrizAI — the only three behaviours the site needs.
   Replaces jQuery + Webflow IX2 + Finsweet (~270KB) with ~90 lines. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Mobile navigation.
   *
   * Webflow collapsed the nav below 992px by moving the menu into a
   * generated .w-nav-overlay and tagging it [data-nav-menu-open], which the
   * stylesheet keys off (display: block !important, and the absolute
   * positioning the menu relies on at <=479px). Recreated here, because the
   * stylesheet still expects that structure.
   * ------------------------------------------------------------------ */
  var nav = document.querySelector('.w-nav');
  var navButton = nav && nav.querySelector('.w-nav-button');
  var navMenu = nav && nav.querySelector('.w-nav-menu');

  if (nav && navButton && navMenu) {
    var overlay = document.createElement('div');
    overlay.className = 'w-nav-overlay';
    nav.appendChild(overlay);

    /* Remember where the menu lives so the desktop layout can be restored. */
    var home = navMenu.parentNode;
    var anchor = navMenu.nextSibling;

    var links = Array.prototype.slice.call(navMenu.querySelectorAll('.w-nav-link'));
    if (!navMenu.id) navMenu.id = 'nav-menu';
    navButton.setAttribute('aria-controls', navMenu.id);
    navButton.setAttribute('aria-expanded', 'false');

    function openNav() {
      overlay.appendChild(navMenu);
      navMenu.setAttribute('data-nav-menu-open', '');
      links.forEach(function (a) { a.classList.add('w--nav-link-open'); });
      overlay.style.display = 'block';
      overlay.style.height = navMenu.offsetHeight + 'px';
      navButton.classList.add('w--open');
      navButton.setAttribute('aria-expanded', 'true');
    }

    function closeNav() {
      navMenu.removeAttribute('data-nav-menu-open');
      links.forEach(function (a) { a.classList.remove('w--nav-link-open'); });
      overlay.style.display = '';
      overlay.style.height = '';
      home.insertBefore(navMenu, anchor);
      navButton.classList.remove('w--open');
      navButton.setAttribute('aria-expanded', 'false');
    }

    function toggleNav() {
      navButton.getAttribute('aria-expanded') === 'true' ? closeNav() : openNav();
    }

    navButton.addEventListener('click', toggleNav);
    navButton.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNav(); }
    });

    /* Dismiss on outside click, on Escape, and when following a link. */
    document.addEventListener('click', function (e) {
      if (navButton.getAttribute('aria-expanded') !== 'true') return;
      if (!nav.contains(e.target)) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navButton.getAttribute('aria-expanded') === 'true') closeNav();
    });
    navMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    /* Resizing back to desktop must not leave the menu detached. */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 991 && navButton.getAttribute('aria-expanded') === 'true') closeNav();
    });
  }

  /* ------------------------------------------------------------------ *
   * FAQ accordion. Panels ship collapsed via an inline height:0.
   * ------------------------------------------------------------------ */
  Array.prototype.forEach.call(
    document.querySelectorAll('.accordion-header'),
    function (header) {
      var panel = header.nextElementSibling;
      if (!panel || !panel.classList.contains('accordion-panel')) return;

      header.setAttribute('aria-expanded', 'false');

      function toggle() {
        var open = header.getAttribute('aria-expanded') === 'true';
        if (open) {
          /* Pin the measured height first so the transition has somewhere to go. */
          panel.style.height = panel.scrollHeight + 'px';
          requestAnimationFrame(function () { panel.style.height = '0px'; });
        } else {
          panel.style.height = panel.scrollHeight + 'px';
          panel.addEventListener('transitionend', function once() {
            panel.style.height = 'auto';
            panel.removeEventListener('transitionend', once);
          });
        }
        header.setAttribute('aria-expanded', String(!open));
      }

      header.addEventListener('click', toggle);
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    }
  );
  /* ------------------------------------------------------------------ *
   * Logo strip. Scrolls only when the reader asks: the buttons, a swipe,
   * or the arrow keys. Nothing moves on its own.
   * ------------------------------------------------------------------ */
  var strip = document.querySelector('.logo-strip');
  if (strip) {
    var viewport = strip.querySelector('.logo-viewport');
    var prev = strip.querySelector('.logo-prev');
    var next = strip.querySelector('.logo-next');

    function maxScroll() {
      return viewport.scrollWidth - viewport.clientWidth;
    }

    function sync() {
      var max = maxScroll();
      /* Nothing to scroll: drop the buttons rather than show dead controls. */
      strip.classList.toggle('is-static', max < 2);
      var x = viewport.scrollLeft;
      prev.disabled = x < 2;
      next.disabled = x > max - 2;
    }

    function page(direction) {
      viewport.scrollLeft += direction * Math.round(viewport.clientWidth * 0.8);
    }

    prev.addEventListener('click', function () { page(-1); });
    next.addEventListener('click', function () { page(1); });
    viewport.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);

    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); page(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); page(-1); }
    });

    sync();
    /* Logos load lazily, so the scrollable width is not final at DOM ready. */
    window.addEventListener('load', sync);
  }

  /* ------------------------------------------------------------------ *
   * Copy the email address. mailto: does nothing on a machine with no
   * mail client configured, so the address has to be liftable too.
   * ------------------------------------------------------------------ */
  var copyBtn = document.getElementById('copyEmail');
  if (copyBtn) {
    var copyStatus = document.getElementById('copyStatus');

    function flash(ok, message) {
      /* Only the success state shows the tick: a failed copy that looked
         like a success would send someone away with an empty clipboard. */
      copyBtn.classList.add(ok ? 'copied' : 'copy-failed');
      if (copyStatus) copyStatus.textContent = message;
      setTimeout(function () {
        copyBtn.classList.remove('copied', 'copy-failed');
        if (copyStatus) copyStatus.textContent = '';
      }, 1800);
    }

    /* navigator.clipboard needs a secure context, so it is absent when the
       page is opened over plain file:// or http://. */
    function legacyCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () {
          flash(true, 'Copied');
        }).catch(function () {
          var ok = legacyCopy(email);
          flash(ok, ok ? 'Copied' : 'Could not copy, please select the address');
        });
      } else {
        var ok = legacyCopy(email);
        flash(ok, ok ? 'Copied' : 'Could not copy, please select the address');
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Cal.com booking modal.
   *
   * Every "Book a 30-minute call" button carries data-cal-* attributes and
   * a plain href to the same booking page. The embed turns the click into
   * an in-page modal; if it never loads, the href still works.
   * ------------------------------------------------------------------ */
  (function (C, A, L) {
    var p = function (a, ar) { a.q.push(ar); };
    var d = C.document;
    C.Cal = C.Cal || function () {
      var cal = C.Cal, ar = arguments;
      if (!cal.loaded) {
        cal.ns = {}; cal.q = cal.q || [];
        d.head.appendChild(d.createElement("script")).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        var api = function () { p(api, arguments); };
        var namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === "string") {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], ar);
          p(cal, ["initNamespace", namespace]);
        } else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");

  Cal("init", "grizai", { origin: "https://app.cal.com" });
  Cal.config = Cal.config || {};
  Cal.config.forwardQueryParams = true;
  Cal.ns.grizai("ui", { hideEventTypeDetails: false, layout: "month_view" });

  /* Cal opens the modal but does not preventDefault, so the anchor would also
     follow its href and open a second tab. Suppress that, but only once the
     embed is actually live, so a blocked script falls through to the href
     rather than leaving a dead button. */
  document.addEventListener('click', function (e) {
    var trigger = e.target && e.target.closest && e.target.closest('[data-cal-link]');
    if (!trigger) return;
    if (window.Cal && window.Cal.ns && window.Cal.ns.grizai) e.preventDefault();
  });
})();
