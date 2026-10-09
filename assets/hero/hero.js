/* Static images advance together every second, including during hover.
   Decode the next frame in advance so network latency does not set the cadence. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  var tiles = Array.from(document.querySelectorAll('.hero__tile'));
  var details = Array.from(document.querySelectorAll('.hero__media button'));
  if (!hero || !tiles.length) return;
  var visible = true, loading = false;
  function prepare(state) {
    var next = state.images[1 - state.front];
    next.src = 'assets/hero/stills/' + state.tile.dataset.slides + '-' + ((state.frame + 1) % 4 + 1) + '.webp';
    return next.decode().then(function () { return true; }, function () { return false; });
  }
  var states = tiles.map(function (tile) {
    var first = tile.querySelector('img');
    var second = document.createElement('img');
    second.className = 'hero__slide'; second.alt = ''; second.setAttribute('aria-hidden', 'true'); second.decoding = 'async';
    second.width = first.width; second.height = first.height;
    tile.insertBefore(second, first.nextSibling);
    tile.dataset.frame = '1';
    var state = {tile: tile, images: [first, second], front: 0, frame: 0};
    state.ready = prepare(state);
    return state;
  });
  function canPlay() { return visible && !document.hidden; }
  async function advance() {
    if (!canPlay() || loading) return;
    loading = true;
    await Promise.all(states.map(async function (state) {
      if (!await state.ready) { state.ready = prepare(state); return; }
      if (!canPlay()) return;
      var current = state.images[state.front], next = state.images[1 - state.front];
      current.classList.remove('is-current'); next.classList.add('is-current');
      next.alt = current.alt; next.removeAttribute('aria-hidden'); current.setAttribute('aria-hidden', 'true');
      state.front = 1 - state.front; state.frame = (state.frame + 1) % 4;
      state.tile.dataset.frame = String(state.frame + 1);
      // Let the short crossfade finish before replacing the hidden image.
      state.ready = new Promise(function (resolve) { setTimeout(resolve, 250); }).then(function () { return prepare(state); });
    }));
    loading = false;
  }
  function closeDetails() { details.forEach(function (el) { el.classList.remove('is-open'); el.setAttribute('aria-pressed', 'false'); }); }
  details.forEach(function (el) {
    el.addEventListener('click', function () {
      var wasOpen = el.classList.contains('is-open'); closeDetails();
      if (!wasOpen) { el.classList.add('is-open'); el.setAttribute('aria-pressed', 'true'); }
    });
    el.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') { el.classList.remove('is-open'); el.setAttribute('aria-pressed', 'false'); }
    });
    el.addEventListener('blur', function () { el.classList.remove('is-open'); el.setAttribute('aria-pressed', 'false'); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDetails(); if (details.includes(document.activeElement)) document.activeElement.blur(); } });
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.hero__media button')) closeDetails(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  setInterval(advance, 1000);
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
