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
})();
