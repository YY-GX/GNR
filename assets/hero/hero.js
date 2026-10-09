/* Image-only slideshows: no video elements, video URLs, or animation formats.
   One next still per tile is fetched only when a visible slideshow advances. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  var tiles = Array.from(document.querySelectorAll('.hero__tile'));
  var toggle = document.querySelector('.hero__slideshow-toggle');
  if (!hero || !tiles.length || !toggle) return;
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection;
  var restricted = function () { return motion.matches || (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType))); };
  var paused = !!restricted(), visible = true, timer = null, loading = false;
  var states = tiles.map(function (tile) {
    var first = tile.querySelector('img');
    var second = document.createElement('img');
    second.className = 'hero__slide'; second.alt = ''; second.setAttribute('aria-hidden', 'true'); second.decoding = 'async';
    second.width = first.width; second.height = first.height;
    tile.insertBefore(second, first.nextSibling);
    return {tile: tile, images: [first, second], front: 0, frame: 0};
  });
  function canPlay() { return !paused && visible && !document.hidden; }
  function label() { toggle.textContent = paused ? 'Play slides' : 'Pause slides'; toggle.setAttribute('aria-pressed', String(paused)); }
  function schedule() {
    clearTimeout(timer);
    if (canPlay() && !loading) timer = setTimeout(advance, 4200);
  }
  async function advance() {
    if (!canPlay()) return;
    loading = true;
    await Promise.all(states.map(async function (state) {
      // Hold a frame still while its task details are being inspected.
      if (state.tile.matches(':hover,:focus-within') || state.tile.classList.contains('is-open')) return;
      var nextFrame = (state.frame + 1) % 4;
      var next = state.images[1 - state.front];
      next.src = 'assets/hero/stills/' + state.tile.dataset.slides + '-' + (nextFrame + 1) + '.webp';
      try { await next.decode(); } catch (_) { return; }
      if (!canPlay() || state.tile.matches(':hover,:focus-within') || state.tile.classList.contains('is-open')) return;
      state.images[state.front].classList.remove('is-current');
      next.classList.add('is-current');
      // Keep the original alt text available on the selected frame only.
      next.alt = state.images[state.front].alt;
      next.removeAttribute('aria-hidden');
      state.images[state.front].setAttribute('aria-hidden', 'true');
      state.front = 1 - state.front; state.frame = nextFrame;
      state.tile.dataset.frame = String(nextFrame + 1);
      state.tile.querySelectorAll('.hero__steps i').forEach(function (step, i) { step.classList.toggle('is-current', i === nextFrame); });
    }));
    loading = false;
    schedule();
  }
  function closeDetails() { tiles.forEach(function (tile) { tile.classList.remove('is-open'); tile.setAttribute('aria-pressed', 'false'); }); }
  tiles.forEach(function (tile) {
    tile.addEventListener('click', function () {
      var wasOpen = tile.classList.contains('is-open'); closeDetails();
      if (!wasOpen) { tile.classList.add('is-open'); tile.setAttribute('aria-pressed', 'true'); }
    });
    tile.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') { tile.classList.remove('is-open'); tile.setAttribute('aria-pressed', 'false'); }
    });
    tile.addEventListener('blur', function () { tile.classList.remove('is-open'); tile.setAttribute('aria-pressed', 'false'); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDetails(); if (document.activeElement && document.activeElement.classList.contains('hero__tile')) document.activeElement.blur(); } });
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.hero__tile')) closeDetails(); });
  toggle.addEventListener('click', function () { paused = !paused; label(); schedule(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; schedule(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', function () { if (restricted()) paused = true; label(); schedule(); });
  if (connection && connection.addEventListener) connection.addEventListener('change', function () { if (restricted()) paused = true; label(); schedule(); });
  toggle.hidden = false; label();
  if (document.readyState === 'complete') schedule();
  else addEventListener('load', schedule, { once: true });
})();

// A compact mobile menu keeps the full capability names readable.
(function () {
  if (!window.GNR_SITE || !window.GNR_SITE.fullSite) return;
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (!nav || !toggle || !links) return;
  nav.classList.add('nav--enhanced');
  function close() {
    nav.classList.remove('nav--open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('nav--open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('nav--open')) { close(); toggle.focus(); }
  });
  window.matchMedia('(max-width: 900px)').addEventListener('change', close);
})();

// Animate only section introductions, once, without delaying demo media.
(function () {
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.replace('reveal-pending', 'reveal-ready');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.sec__head,.precision-heading,.kstats').forEach(function (el) {
    el.classList.add('reveal-pending');
    observer.observe(el);
  });
  motion.addEventListener('change', function () {
    if (motion.matches) {
      observer.disconnect();
      document.querySelectorAll('.reveal-pending').forEach(function (el) { el.classList.remove('reveal-pending'); });
    }
  });
})();
