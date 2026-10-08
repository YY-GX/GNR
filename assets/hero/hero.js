/* Start with the still image. Load video only after an explicit Play request. */
(function () {
  var hero = document.querySelector('.hero');
  var video = document.getElementById('hero-video');
  var button = document.getElementById('hero-toggle');
  if (!hero || !video || !button) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection;
  var requested = false;
  var visible = true;
  var ready = false;
  var pausedByUser = true;
  var optedIn = false;
  function saveData() {
    return connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType));
  }
  function allowed() { return optedIn || (!motion.matches && !saveData()); }
  function label() {
    button.dataset.state = video.paused ? 'paused' : 'playing';
    var action = video.paused ? 'Play background video' : 'Pause background video';
    button.setAttribute('aria-label', action);
    button.setAttribute('title', action);
  }
  function sync() {
    if (!ready || !visible || document.hidden || pausedByUser || !allowed()) {
      video.pause();
      return;
    }
    if (!requested) {
      video.src = window.matchMedia('(max-width: 760px)').matches
        ? 'assets/hero/montage-mobile.mp4' : 'assets/hero/montage.mp4';
      requested = true;
    }
    video.play().catch(function () { label(); });
  }
  video.addEventListener('playing', function () { video.classList.add('is-playing'); label(); });
  video.addEventListener('pause', label);
  video.addEventListener('error', function () {
    video.classList.remove('is-playing');
    button.hidden = true;
  });
  button.addEventListener('click', function () {
    if (!video.paused) { pausedByUser = true; video.pause(); }
    else { pausedByUser = false; optedIn = true; ready = true; sync(); }
    label();
  });
  button.hidden = false;
  label();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', function () { optedIn = false; sync(); });
  if (connection && connection.addEventListener) connection.addEventListener('change', sync);
  function start() {
    var run = function () { ready = true; sync(); };
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1500 });
    else window.setTimeout(run, 250);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
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
