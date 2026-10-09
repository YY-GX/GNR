/* Predecode real still-image keyframes, then swap the visible image every second.
   One image per tile avoids layered-image and stale-style rendering problems. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  var media = document.querySelector('.hero__media');
  var tiles = Array.from(document.querySelectorAll('.hero__tile'));
  var details = Array.from(document.querySelectorAll('.hero__media button'));
  if (!hero || !media || !tiles.length) return;
  var visible = true;
  var states = tiles.map(function (tile) {
    var image = tile.querySelector('img');
    var count = Number(tile.dataset.frameCount) || 4;
    var frames = Array.from({length: count}, function (_, i) {
      var preloaded = new Image();
      var frame = {image: preloaded, ready: false};
      preloaded.src = 'assets/hero/stills/' + tile.dataset.slides + '-' + (i + 1) + '.webp?v=' + media.dataset.version;
      // Each tile loads independently; one slow image cannot freeze the whole grid.
      preloaded.decode().then(function () { frame.ready = true; }, function () {});
      return frame;
    });
    tile.dataset.frame = '1';
    return {tile: tile, image: image, frames: frames, frame: 0};
  });
  function advance() {
    if (!visible || document.hidden) return;
    states.forEach(function (state) {
      var next = (state.frame + 1) % state.frames.length;
      if (!state.frames[next].ready) return;
      state.image.src = state.frames[next].image.src;
      state.frame = next;
      state.tile.dataset.frame = String(next + 1);
    });
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
