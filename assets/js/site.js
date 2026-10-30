/* GNR project page behaviour. No dependencies. Media and switches come from site-config.js.
   Components: opening background video, film player (inline + modal) (chapters, quality, PiP, mini player, keyboard), method stepper,
   HOT3D MPC-vs-GNR comparison, ShapeFilter/NIST sync + wipe studio, dataset wall + lightbox, nav, reveals. */
(function () {
  'use strict';
  var C = window.GNR_SITE || {};
  var M = C.media || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || {};
  function reduced() { return motionQ.matches; }
  function saveData() { return !!(conn.saveData || /(^|-)2g$|^3g$/.test(conn.effectiveType || '')); }
  function canAuto() { return !reduced() && !saveData(); }
  function fmt(t) { t = Math.max(0, Math.floor(t || 0)); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); return p; }
  function onIdle(fn) { if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 1800 }); else setTimeout(fn, 300); }
  function afterLoad(fn) { if (document.readyState === 'complete') onIdle(fn); else addEventListener('load', function () { onIdle(fn); }, { once: true }); }
  function io(target, cb, opts) {
    if (!('IntersectionObserver' in window)) { cb(true); return null; }
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e); }); }, opts || { threshold: 0.25 });
    o.observe(target); return o;
  }
  // Content-hash cache busting for media (assets/js/asset-versions.js, written by scripts/stamp_assets.py).
  var AV = window.GNR_ASSET_V || {};
  function ver(u) { var h = AV[u]; return h ? u + '?v=' + h : u; }
  var probe = document.createElement('video');
  var AV1 = !!probe.canPlayType && probe.canPlayType('video/webm; codecs="av01.0.08M.08, opus"') === 'probably';
  var MP4 = !!probe.canPlayType && probe.canPlayType('video/mp4; codecs="avc1.640028, mp4a.40.2"') !== '';
  // Pick one rendition: q = 'auto' | '1080' | '720'.
  function pick(stem, q) {
    if (q === 'auto') {
      var small = Math.min(screen.width, innerWidth) * (window.devicePixelRatio || 1) < 1100;
      q = (small || saveData()) ? '720' : '1080';
    }
    if (q === '720') return { src: ver(stem + '-720.mp4'), q: '720' };
    if (AV1) return { src: ver(stem + '-1080.webm'), q: '1080' };
    return { src: ver(stem + '-1080.mp4'), q: '1080' };
  }
  var LAB = { egocentric: ['Egocentric', 'human'], human_sim: ['Real-to-sim', 'human'], human_mpc: ['Real-to-sim + MPC', 'human'],
    ik: ['IK', 'ik'], mpc: ['MPC', 'mpc'], gnr: ['GNR', 'gnr'], gnr_mpc: ['GNR + MPC', 'gnr'] };
  var GROUP = { gnr: ['GNR retargeting', 'GNR'], mpc: ['DIAL-MPC', 'DIAL-MPC'], pair: ['MPC fails, GNR succeeds', 'MPC ✗ · GNR ✓'], human: ['Human real-to-sim', 'Real-to-sim'], precision: ['Precision task', 'Precision'] };
  var SETS = { hot3d: ['HOT3D egocentric recording', 'Tesollo DG-5F hand, SuperDex Physics'], shapefilter: ['ShapeFilter: motion capture with a wearable exoskeleton', 'Tesollo DG-5F hand on a Franka FR3 arm, SuperDex Physics'], nist: ['NIST: motion capture with a wearable exoskeleton', 'Tesollo DG-5F hand on a Franka FR3 arm, SuperDex Physics'] };
  function grp(d) { return d.group || 'precision'; }
  function labHTML(k) { var l = LAB[k] || [k, 'ik']; return '<span class="lab lab--' + l[1] + '">' + l[0] + '</span>'; }
  function resHTML(r) { return r === 'ok' ? '<span class="res res--ok"><span aria-hidden="true">&#10003;</span> success</span>' : r === 'no' ? '<span class="res res--no"><span aria-hidden="true">&#10007;</span> fail</span>' : ''; }
  function speedHTML(sp) { return sp ? '<span class="view__speed" title="Playback speed">' + sp + '</span>' : ''; }
  function listJoin(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  // AV1 WebM when the slot has one and the browser plays AV1, else H.264 (a failed WebM falls back below).
  function clipSrc(slot) { var w = 'assets/video/' + slot + '.webm'; return AV1 && AV[w] ? ver(w) : ver('assets/video/' + slot + '.mp4'); }
  document.addEventListener('error', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO' || !v.closest('.view,.tile,.wipe,.lb')) return;
    var src = v.getAttribute('src') || ''; if (!/\.webm(\?|$)/.test(src)) return;
    v.src = ver(src.replace(/\.webm(\?.*)?$/, '.mp4')); if (v.dataset) v.dataset.src = v.src; play(v);
  }, true);
  function clipPoster(slot) { return ver('assets/video/' + slot + '.jpg'); }
  var DEMOS = [];
  try { var dj = $('#demo-data'); if (dj) DEMOS = JSON.parse(dj.textContent); } catch (e) { DEMOS = []; }
  var full = !!C.fullSite;

  /* ---------------- film player: cinematic pinned reveal + muted autoplay in view ---------------- */
  var film = null;
  function Film(root, cfg) {
    var self = this;
    var player = $('[data-player]', root), box = $('.player__box', root), video = $('.player__video', root);
    var stage = $('.film__stage', root), poster = $('.player__poster', root), big = $('.player__big', root), soundBtn = $('.player__sound', root);
    var segsBox = $('[data-segs]', root), track = $('[data-track]', root), tip = $('[data-tip]', root);
    var list = $('[data-chapters]', root), chapLabel = $('[data-chap]', root), cur = $('[data-cur]', root), dur = $('[data-dur]', root);
    var toast = $('.player__toast', root), keys = $('.player__keys', root), qBtn = $('[data-act="quality"]', root), qList = $('.player__qlist', root);
    var D = cfg.duration || 0, chapters = (cfg.chapters || []).map(function (c, i, a) { return { t: c[0], title: c[1], end: i + 1 < a.length ? a[i + 1][0] : D }; });
    var quality = 'auto', started = false, userPaused = false, autoMode = false, everUnmuted = false, idleT = 0, toastT = 0, curChap = -1, visible = false;
    poster.src = ver(cfg.poster + '.webp');
    poster.onerror = function () { poster.onerror = null; poster.src = ver(cfg.poster + '.jpg'); };
    $$('[data-film-duration]').forEach(function (n) { n.textContent = fmt(D); });
    dur.textContent = fmt(D);
    var tr = document.createElement('track'); tr.kind = 'chapters'; tr.label = 'Chapters'; tr.srclang = 'en'; tr.src = ver(cfg.stem + '-chapters.vtt'); video.appendChild(tr);
    var segs = chapters.map(function (c) { var s = el('div', 'player__seg', '<b></b><i></i>'); s.style.setProperty('--w', Math.max(0.5, c.end - c.t)); segsBox.appendChild(s); return s; });
    var items = chapters.map(function (c) {
      var li = el('li'), b = el('button'); b.type = 'button';
      b.innerHTML = '<time>' + fmt(c.t) + '</time><span>' + c.title + '</span>';
      b.setAttribute('aria-label', 'Play from ' + fmt(c.t) + ': ' + c.title);
      b.addEventListener('click', function (e) { e.stopPropagation(); self.start(c.t, true); });
      li.appendChild(b); list.appendChild(li); return b;
    });
    var dl = $('[data-downloads]', root);
    if (dl) dl.innerHTML = 'Download <a href="' + ver(cfg.stem + '-1080.mp4') + '" download>MP4 1080p</a>' + (cfg.sizes ? ' (' + cfg.sizes['1080'] + ')' : '') +
      ' · <a href="' + ver(cfg.stem + '-720.mp4') + '" download>720p</a>' + (cfg.sizes ? ' (' + cfg.sizes['720'] + ')' : '') + '.';
    function setSrc(q, keepTime, preload) {
      var t = keepTime ? video.currentTime : 0, wasPlaying = !video.paused;
      var r = pick(cfg.stem, q);
      if (video.getAttribute('src') === r.src) { if (preload === 'auto') video.preload = 'auto'; return; }
      video.preload = preload || 'auto'; video.src = r.src; video.dataset.q = r.q;
      if (keepTime) video.addEventListener('loadedmetadata', function f() { video.removeEventListener('loadedmetadata', f); video.currentTime = t; if (wasPlaying) play(video); });
      video.onerror = function () { if (/\.webm(\?|$)/.test(video.src)) { video.onerror = null; video.src = ver(cfg.stem + '-1080.mp4'); if (wasPlaying || started) play(video); } };
    }
    function chapAt(t) { for (var i = chapters.length - 1; i >= 0; i--) if (t >= chapters[i].t - 0.05) return i; return 0; }
    function update() {
      var t = video.currentTime, d = video.duration || D;
      cur.textContent = fmt(t);
      track.setAttribute('aria-valuenow', Math.round(t / d * 100)); track.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(d));
      var buf = 0; try { if (video.buffered.length) buf = video.buffered.end(video.buffered.length - 1); } catch (e) {}
      chapters.forEach(function (c, i) {
        var len = Math.max(0.01, c.end - c.t);
        segs[i].style.setProperty('--p', Math.min(1, Math.max(0, (t - c.t) / len)));
        segs[i].style.setProperty('--b', Math.min(1, Math.max(0, (buf - c.t) / len)));
      });
      var k = chapAt(t);
      if (k !== curChap) { curChap = k; items.forEach(function (b, i) { b.setAttribute('aria-current', String(i === k)); }); chapLabel.textContent = chapters[k] ? chapters[k].title : ''; }
    }
    function flash(msg) { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 700); }
    function wake() {
      player.classList.add('is-awake'); player.classList.remove('is-idle'); clearTimeout(idleT);
      idleT = setTimeout(function () { if (!video.paused && qList.hidden && keys.hidden) { player.classList.add('is-idle'); player.classList.remove('is-awake'); } }, 2600);
    }
    function soundUI() { soundBtn.hidden = !(started && video.muted); }
    // Start playback. sound=true: user intent (unmute); sound=false: muted autoplay.
    this.start = function (t, sound) {
      if (cfg.youtube) return facade(t);
      // Bandwidth: muted autoplay streams the 720p file; the chosen quality (auto = 1080p on large screens) loads once the viewer opts in.
      if (!started) { started = true; setSrc(!sound && quality === 'auto' ? '720' : quality, false); player.classList.add('is-started'); }
      if (sound) { video.muted = false; everUnmuted = true; autoMode = false; userPaused = false; upgrade(); }
      if (t != null) {
        if (video.readyState >= 1) video.currentTime = t;
        else video.addEventListener('loadedmetadata', function f() { video.removeEventListener('loadedmetadata', f); video.currentTime = t; });
      }
      var pr = video.play();
      // Autoplay blocked (e.g. Low Power Mode): fall back to the poster and the big play button.
      if (pr && pr.catch) pr.catch(function (err) {
        if (!err || err.name !== 'NotAllowedError' || sound) return;
        started = false; autoMode = false; allowAuto = false;
        player.classList.remove('is-started', 'is-auto'); soundUI();
      });
      soundUI();
      if (sound) { player.focus({ preventScroll: true }); wake(); }
    };
    function upgrade() { if (quality === 'auto' && video.dataset.q === '720' && pick(cfg.stem, 'auto').q !== '720') setSrc('auto', true); }
    this.toggle = function () { if (!started) return self.start(0, true); if (video.paused) { userPaused = false; play(video); } else { userPaused = true; video.pause(); } };
    this.seekBy = function (d) { if (!started) return; video.currentTime = Math.max(0, Math.min((video.duration || D) - 0.1, video.currentTime + d)); flash((d > 0 ? '+' : '−') + Math.abs(d) + ' s'); update(); };
    this.chapter = function (d) { if (!started) return self.start(0, true); var k = chapAt(video.currentTime); if (d < 0 && video.currentTime - chapters[k].t > 3) d = 0; var n = Math.max(0, Math.min(chapters.length - 1, k + d)); video.currentTime = chapters[n].t; flash(chapters[n].title); update(); };
    this.fullscreen = function () {
      var fe = document.fullscreenElement || document.webkitFullscreenElement;
      if (fe) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      upgrade();
      if (player.requestFullscreen) player.requestFullscreen().catch(function () {});
      else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    };
    // From elsewhere on the page (method stepper): bring the film into view and play with sound.
    this.playFrom = function (t) {
      var target = root.classList.contains('is-cinematic') ? root.offsetTop + root.offsetHeight - innerHeight : root.getBoundingClientRect().top + scrollY - 80;
      scrollTo({ top: Math.max(0, target), behavior: reduced() ? 'auto' : 'smooth' });
      self.start(t, true);
    };
    function facade(t) {
      if (player.classList.contains('is-facade')) return;
      player.classList.add('is-started', 'is-facade');
      var f = document.createElement('iframe'); f.className = 'facade';
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(cfg.youtube) + '?autoplay=1&rel=0&start=' + Math.floor(t || 0);
      f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = 'GNR explainer video';
      box.appendChild(f); $('.player__bar', root).hidden = true;
    }
    big.addEventListener('click', function () { self.start(0, true); });
    soundBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      // First unmute restarts from the beginning, since a muted autoplay viewer has likely missed the opening.
      var restart = !everUnmuted; self.start(restart ? 0 : null, true); flash('Sound on');
    });
    video.addEventListener('click', function () { if (video.muted && autoMode) { soundBtn.click(); return; } self.toggle(); });
    video.addEventListener('dblclick', function () { self.fullscreen(); });
    video.addEventListener('playing', function () { player.classList.add('has-frames'); });
    video.addEventListener('play', function () { player.classList.add('is-playing'); $('[data-act="play"]', player).setAttribute('aria-label', 'Pause'); });
    video.addEventListener('pause', function () { player.classList.remove('is-playing', 'is-idle'); $('[data-act="play"]', player).setAttribute('aria-label', 'Play'); });
    video.addEventListener('timeupdate', update);
    video.addEventListener('progress', update);
    video.addEventListener('volumechange', function () { player.classList.toggle('is-muted', video.muted); $('[data-act="mute"]', player).setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute'); soundUI(); });
    player.classList.add('is-muted');
    player.addEventListener('mousemove', wake);
    player.addEventListener('touchstart', wake, { passive: true });
    player.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b || !player.contains(b)) return;
      var a = b.dataset.act;
      if (a === 'play') self.toggle();
      else if (a === 'back') self.seekBy(-10);
      else if (a === 'fwd') self.seekBy(10);
      else if (a === 'mute') { video.muted = !video.muted; if (!video.muted) { everUnmuted = true; autoMode = false; upgrade(); } }
      else if (a === 'fs') self.fullscreen();
      else if (a === 'keys') keys.hidden = !keys.hidden;
      else if (a === 'pip') { if (document.pictureInPictureElement) document.exitPictureInPicture(); else if (video.requestPictureInPicture) video.requestPictureInPicture().catch(function () {}); }
      else if (a === 'quality') { var open = qList.hidden; qList.hidden = !open; qBtn.setAttribute('aria-expanded', String(open)); if (open) { var f = $('[aria-checked="true"]', qList); if (f) f.focus(); } }
    });
    if (document.pictureInPictureEnabled && video.requestPictureInPicture) $('[data-act="pip"]', player).hidden = false;
    qList.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b) return;
      quality = b.dataset.q;
      $$('[data-q]', qList).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      $('[data-q]', qBtn).textContent = quality === 'auto' ? 'Auto' : quality + 'p';
      qList.hidden = true; qBtn.setAttribute('aria-expanded', 'false'); qBtn.focus();
      if (started) setSrc(quality, true);
    });
    document.addEventListener('click', function (e) { if (!qList.hidden && !e.target.closest('.player__menu')) { qList.hidden = true; qBtn.setAttribute('aria-expanded', 'false'); } });
    function frac(e) { var r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); }
    var dragging = false;
    track.addEventListener('pointerdown', function (e) { if (!started) self.start(0, true); dragging = true; track.setPointerCapture(e.pointerId); video.currentTime = frac(e) * (video.duration || D); update(); });
    track.addEventListener('pointermove', function (e) {
      var f = frac(e), t = f * (video.duration || D), c = chapters[chapAt(t)];
      tip.hidden = false; tip.style.left = (f * 100) + '%'; tip.innerHTML = '<time>' + fmt(t) + '</time>' + (c ? c.title : '');
      if (dragging) { video.currentTime = t; update(); }
    });
    track.addEventListener('pointerup', function () { dragging = false; });
    track.addEventListener('pointerleave', function () { tip.hidden = true; });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); self.seekBy(5); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); self.seekBy(-5); }
      else if (e.key === 'Home') { e.preventDefault(); video.currentTime = 0; }
      else if (e.key === 'End') { e.preventDefault(); video.currentTime = (video.duration || D) - 1; }
    });
    player.addEventListener('keydown', function (e) {
      if (e.target.closest('.player__qlist') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target === track && /Arrow|Home|End/.test(e.key)) return;
      var k = e.key.toLowerCase(), handled = true;
      if (k === ' ' || k === 'k') { if (e.target.tagName === 'BUTTON' && k === ' ') return; self.toggle(); }
      else if (k === 'arrowright') self.seekBy(5);
      else if (k === 'arrowleft') self.seekBy(-5);
      else if (k === 'l') self.seekBy(10);
      else if (k === 'j') self.seekBy(-10);
      else if (k === 'm') { video.muted = !video.muted; if (!video.muted) { everUnmuted = true; autoMode = false; upgrade(); } flash(video.muted ? 'Muted' : 'Sound on'); }
      else if (k === 'f') self.fullscreen();
      else if (k === 'n') self.chapter(1);
      else if (k === 'p') self.chapter(-1);
      else if (k === '?') keys.hidden = !keys.hidden;
      else if (k === 'escape' && !keys.hidden) keys.hidden = true;
      else if (/^[0-9]$/.test(k) && started) { video.currentTime = (video.duration || D) * Number(k) / 10; update(); }
      else handled = false;
      if (handled) { e.preventDefault(); wake(); }
    });
    // Muted autoplay when at least half visible; pause when it leaves (resume only if it was not paused by the user).
    var allowAuto = canAuto() && !cfg.youtube;
    if (allowAuto) player.classList.add('is-auto');
    // Start fetching the film about one viewport before it is reached, so the first frame is ready when it autoplays.
    var near = io(root, function (vis) { if (vis && allowAuto && !video.getAttribute('src')) { setSrc(quality === 'auto' ? '720' : quality, false, 'metadata'); if (near) near.disconnect(); } }, { rootMargin: '100% 0px 100% 0px', threshold: 0 });
    io(stage, function (vis) {
      visible = vis;
      if (vis) { if (allowAuto && !userPaused) { if (!started) autoMode = true; self.start(null, false); } }
      else if (!video.paused) video.pause();
    }, { threshold: 0.5 });
    document.addEventListener('visibilitychange', function () { if (document.hidden && !video.paused) video.pause(); else if (!document.hidden && visible && started && !userPaused) play(video); });
    // Cinematic pinned reveal: the card scales from an inset to full-bleed as the section scrolls (desktop, motion allowed).
    var cine = matchMedia('(min-width: 761px)');
    function setupCine() {
      var on = !reduced() && cine.matches;
      root.classList.toggle('is-cinematic', on);
      if (!on) { stage.style.removeProperty('--s'); stage.style.removeProperty('--p'); stage.style.removeProperty('--ty'); document.documentElement.classList.remove('is-film-pinned'); }
      onScroll();
    }
    var ticking = false, s0 = 0.72;
    function frame() {
      ticking = false;
      if (!root.classList.contains('is-cinematic')) return;
      var r = root.getBoundingClientRect(), span = root.offsetHeight - innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, -r.top / (span * 0.7))) : 1;
      var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var s = s0 + (1 - s0) * e;
      stage.style.setProperty('--s', s.toFixed(4)); stage.style.setProperty('--p', e.toFixed(4)); stage.style.setProperty('--ty', (48 * (1 - e)).toFixed(1));
      root.style.setProperty('--p', e.toFixed(4));
      // While the film fills the screen, the fixed nav steps aside so it never covers the frame.
      var pinned = e > 0.6 && r.bottom > innerHeight * 0.5;
      document.documentElement.classList.toggle('is-film-pinned', pinned);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
    cine.addEventListener && cine.addEventListener('change', setupCine);
    motionQ.addEventListener && motionQ.addEventListener('change', function () { setupCine(); allowAuto = canAuto(); if (!allowAuto && autoMode) { video.pause(); } });
    setupCine();
    update();
  }

  /* ---------------- method stepper ---------------- */
  function Stepper(root, steps) {
    var btns = $$('.stepper__btn', root), video = $('.stepper__video', root), poster = $('.stepper__poster', root), prog = $('.stepper__prog i', root);
    var panel = $('.stepper__panel', root), i = 0, manual = false, visible = false, raf = 0;
    root.setAttribute('data-ready', '');
    function show(k, user) {
      i = (k + btns.length) % btns.length; if (user) manual = true;
      btns.forEach(function (b, j) { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
      panel.setAttribute('aria-labelledby', btns[i].id);
      var s = steps[i]; if (!s) return;
      poster.src = ver(s.clip + '.webp');
      root.classList.remove('is-playing');
      video.loop = manual;
      if (visible && canAuto() || user) { video.src = ver(s.clip + '.mp4'); play(video); }
      else { video.removeAttribute('src'); video.load(); }
    }
    function tick() { if (video.duration) prog.parentNode.style.setProperty('--p', video.currentTime / video.duration); prog.style.transform = 'scaleX(' + (video.duration ? video.currentTime / video.duration : 0) + ')'; if (!video.paused) raf = requestAnimationFrame(tick); }
    video.addEventListener('playing', function () { root.classList.add('is-playing'); cancelAnimationFrame(raf); tick(); });
    video.addEventListener('ended', function () { if (!manual) show(i + 1, false); });
    btns.forEach(function (b, j) {
      b.addEventListener('click', function () { show(j, true); });
      b.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
        if (d) { e.preventDefault(); show(j + d, true); btns[i].focus(); }
      });
    });
    $('.stepper__screen', root).addEventListener('click', function () { if (video.paused) { if (!video.getAttribute('src')) video.src = ver(steps[i].clip + '.mp4'); play(video); } else video.pause(); });
    var fb = $('[data-act="step-film"]', root);
    if (fb) fb.addEventListener('click', function () { video.pause(); if (film) film.playFrom(steps[i].t); });
    io(panel, function (vis) {
      visible = vis;
      if (vis && canAuto()) { if (!video.getAttribute('src')) video.src = ver(steps[i].clip + '.mp4'); play(video); }
      else if (!vis) video.pause();
    }, { threshold: 0.4 });
    show(0, false);
  }

  /* ---------------- shared clip views ---------------- */
  function pairOK(d) {
    var m = d.views.filter(function (v) { return v.k === 'mpc'; })[0], g = d.views.filter(function (v) { return v.k === 'gnr'; })[0];
    return d.set === 'hot3d' && !!(m && g && m.res === 'no' && g.res === 'ok');
  }
  function viewEl(v, opts) {
    opts = opts || {};
    var f = el('figure', 'view'), m = el('div', 'view__media r-' + (v.r || '1x1'));
    var img = el('img'); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.src = clipPoster(v.slot);
    var vid = document.createElement('video'); vid.muted = true; vid.loop = opts.loop !== false; vid.playsInline = true; vid.preload = 'none';
    vid.setAttribute('playsinline', ''); vid.dataset.src = clipSrc(v.slot); vid.setAttribute('aria-label', (opts.title ? opts.title + ': ' : '') + (LAB[v.k] ? LAB[v.k][0] : v.k));
    vid.addEventListener('playing', function () { img.style.opacity = 0; });
    m.appendChild(img); m.appendChild(vid); f.appendChild(m);
    var cap = el('figcaption', '', labHTML(v.k) + (v.budget ? '<span class="view__budget">' + v.budget + '</span>' : '') + resHTML(v.res) + speedHTML(opts.speed)); f.appendChild(cap);
    return { el: f, video: vid };
  }
  function arm(v) { if (!v.getAttribute('src')) v.src = v.dataset.src; return v; }

  /* HOT3D MPC vs GNR: three views that start together. */
  function Compare(root, demos) {
    var chips = $('[data-chips]', root), views = $('[data-views]', root), tg = $('[data-act="toggle"]', root);
    var vids = [], k = 0, visible = false, userPaused = !canAuto();
    demos.forEach(function (d, j) {
      var b = el('button', '', d.title); b.type = 'button'; b.setAttribute('aria-pressed', String(j === 0));
      b.addEventListener('click', function () { set(j); userPaused = false; run(); }); chips.appendChild(b);
    });
    function set(j) {
      k = j; $$('button', chips).forEach(function (b, x) { b.setAttribute('aria-pressed', String(x === j)); });
      vids.forEach(function (v) { v.pause(); v.removeAttribute('src'); v.load(); });
      views.innerHTML = ''; vids = [];
      demos[j].views.forEach(function (v) { var o = viewEl(v, { title: demos[j].title, speed: demos[j].speed }); views.appendChild(o.el); vids.push(o.video); });
    }
    // Keep every view on the first view's clock (same 0.04 s threshold as the studio).
    var raf = 0;
    function syncLoop() {
      cancelAnimationFrame(raf);
      (function step() {
        var m = vids[0]; if (!m || m.paused) return;
        var t = m.currentTime;
        vids.forEach(function (v) { if (v !== m && v.readyState >= 2 && Math.abs(v.currentTime - t) > 0.04) v.currentTime = t; });
        raf = requestAnimationFrame(step);
      })();
    }
    function icon() { var p = !vids.length || vids[0].paused; tg.firstElementChild.classList.toggle('is-pause', !p); tg.setAttribute('aria-label', p ? 'Play' : 'Pause'); }
    function run() { if (!visible || userPaused) { vids.forEach(function (v) { v.pause(); }); icon(); return; } vids.forEach(function (v) { play(arm(v)); }); if (vids[0]) vids[0].addEventListener('playing', syncLoop, { once: true }); syncLoop(); setTimeout(icon, 50); }
    tg.addEventListener('click', function () { userPaused = !(vids[0] && vids[0].paused) ? true : false; if (!userPaused) visible = true; run(); });
    $('[data-act="restart"]', root).addEventListener('click', function () { userPaused = false; vids.forEach(function (v) { arm(v); v.currentTime = 0; }); run(); });
    set(0); icon();
    io(root, function (vis) { visible = vis; run(); }, { threshold: 0.15 });
  }

  /* ShapeFilter / NIST: four synced views, or a draggable wipe between two of them. */
  function Studio(root, demos) {
    var KEYS = (root.dataset.keys || 'ik,mpc,gnr,gnr_mpc').split(',');
    demos = demos.map(function (d) { var c = {}; for (var x in d) c[x] = d[x]; c.views = d.views.filter(function (v) { return KEYS.indexOf(v.k) >= 0; }); return c; });
    var chips = $('[data-chips]', root), stage = $('[data-stage]', root), range = $('[data-scrub]', root), time = $('[data-time]', root);
    var tg = $('[data-act="toggle"]', root), wo = $('[data-wipeopts]', root), selL = $('[data-left]', root), selR = $('[data-right]', root);
    var vids = [], master = null, k = 0, mode = 'grid', visible = false, userPaused = !canAuto(), scrubbing = false, raf = 0;
    demos.forEach(function (d, j) {
      var b = el('button', '', d.title.replace(' · demo ', ' ')); b.type = 'button'; b.setAttribute('aria-pressed', String(j === 0));
      b.addEventListener('click', function () { k = j; $$('button', chips).forEach(function (x, y) { x.setAttribute('aria-pressed', String(y === j)); }); options(); build(); userPaused = false; run(); });
      chips.appendChild(b);
    });
    var titleEl = $('[data-studio-title]', root);
    // Wipe options and the title list only the views this demonstration has.
    function options() {
      var ks = demos[k].views.map(function (v) { return v.k; }), keepL = selL.value, keepR = selR.value;
      [selL, selR].forEach(function (s) { s.innerHTML = ''; ks.forEach(function (key) { var o = el('option', '', LAB[key][0]); o.value = key; s.appendChild(o); }); });
      selL.value = ks.indexOf(keepL) >= 0 ? keepL : ks[0];
      selR.value = ks.indexOf(keepR) >= 0 && keepR !== selL.value ? keepR : (ks.indexOf('gnr_mpc') >= 0 ? 'gnr_mpc' : ks[ks.length - 1]);
      if (titleEl) titleEl.textContent = listJoin(demos[k].views.map(function (v) { return v.k === 'gnr' ? 'open-loop GNR' : LAB[v.k][0]; })) + ' on the same demonstration';
      exclusive();
    }
    function exclusive() { [[selL, selR], [selR, selL]].forEach(function (pr) { $$('option', pr[0]).forEach(function (o) { o.disabled = o.value === pr[1].value; }); }); }
    options();
    function clear() { vids.forEach(function (v) { v.pause(); v.removeAttribute('src'); v.load(); }); vids = []; master = null; stage.innerHTML = ''; }
    function build() {
      clear(); var d = demos[k];
      stage.className = 'studio__stage' + (d.views.length === 4 ? ' is-four' : '') + (mode === 'wipe' ? ' is-wipe' : '');
      if (mode === 'grid') {
        d.views.forEach(function (v) { var o = viewEl(v, { title: d.title, speed: d.speed }); stage.appendChild(o.el); vids.push(o.video); });
      } else {
        var byK = {}; d.views.forEach(function (v) { byK[v.k] = v; });
        var L = byK[selL.value] || d.views[0], R = byK[selR.value] || d.views[d.views.length - 1];
        var w = el('div', 'wipe r-' + (L.r || '4x3'));
        var vb = document.createElement('video'), vt = document.createElement('video');
        [vb, vt].forEach(function (v, x) { var s = x ? R : L; v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'none'; v.dataset.src = clipSrc(s.slot); v.poster = clipPoster(s.slot); v.setAttribute('aria-hidden', 'true'); });
        vt.className = 'wipe__top';
        var inp = el('input'); inp.type = 'range'; inp.min = 0; inp.max = 100; inp.value = 50; inp.setAttribute('aria-label', 'Wipe position: ' + LAB[L.k][0] + ' left, ' + LAB[R.k][0] + ' right');
        inp.addEventListener('input', function () { w.style.setProperty('--x', inp.value + '%'); });
        w.appendChild(vb); w.appendChild(vt);
        w.appendChild(el('span', 'wipe__lab wipe__lab--l', LAB[L.k][0] + ' ' + resHTML(L.res)));
        w.appendChild(el('span', 'wipe__lab wipe__lab--r', LAB[R.k][0] + ' ' + resHTML(R.res)));
        w.appendChild(el('div', 'wipe__handle')); w.appendChild(inp);
        if (d.speed) w.appendChild(el('span', 'wipe__speed', d.speed));
        stage.appendChild(w); vids = [vb, vt];
      }
      master = vids[0]; range.value = 0; time.textContent = '0.0 s';
      master.addEventListener('timeupdate', function () { if (!scrubbing && master.duration) { range.value = Math.round(master.currentTime / master.duration * 1000); time.textContent = master.currentTime.toFixed(1) + ' s'; } });
    }
    function syncLoop() {
      cancelAnimationFrame(raf);
      (function step() {
        if (master && !master.paused) {
          var t = master.currentTime;
          vids.forEach(function (v) { if (v !== master && v.readyState >= 2 && Math.abs(v.currentTime - t) > 0.04) v.currentTime = t; });
          raf = requestAnimationFrame(step);
        }
      })();
    }
    function icon() { var p = !master || master.paused; tg.firstElementChild.classList.toggle('is-pause', !p); tg.setAttribute('aria-label', p ? 'Play' : 'Pause'); }
    function run() {
      if (!visible || userPaused) { vids.forEach(function (v) { v.pause(); }); icon(); return; }
      var t = master && master.currentTime || 0;
      vids.forEach(function (v) { arm(v); if (v !== master && v.readyState >= 1) v.currentTime = t; play(v); });
      syncLoop(); setTimeout(icon, 60);
    }
    tg.addEventListener('click', function () { userPaused = master && !master.paused; if (!userPaused) visible = true; run(); });
    range.addEventListener('input', function () {
      scrubbing = true; userPaused = true; vids.forEach(function (v) { arm(v); v.pause(); if (v.readyState === 0) { v.preload = 'auto'; v.load(); } });
      var go = function () { var t = range.value / 1000 * (master.duration || 0); vids.forEach(function (v) { v.currentTime = t; }); time.textContent = t.toFixed(1) + ' s'; };
      if (master.readyState >= 1) go(); else master.addEventListener('loadedmetadata', go, { once: true });
      icon();
    });
    range.addEventListener('change', function () { scrubbing = false; });
    $$('[data-mode]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.dataset.mode; $$('[data-mode]', root).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        wo.hidden = mode !== 'wipe'; build(); userPaused = false; run();
      });
    });
    [selL, selR].forEach(function (s) { s.addEventListener('change', function () { exclusive(); build(); userPaused = false; run(); }); });
    build(); icon();
    io(root, function (vis) { visible = vis; run(); }, { threshold: 0.15 });
  }

  /* ---------------- dataset wall + lightbox ---------------- */
  function Wall(root, demos) {
    var wall = $('[data-wall]', root);
    var ctl = [];
    function lbOpen() { return document.documentElement.classList.contains('lb-open'); }
    var tiles = demos.map(function (d, j) {
      var g = grp(d), mk = d.main || 'gnr_mpc';
      var main = d.views.filter(function (v) { return v.k === mk; })[0] || d.views[d.views.length - 1];
      var ego = d.views.filter(function (v) { return v.k === 'egocentric'; })[0];
      var li = el('li', 'tile' + (d.feature ? ' tile--feature' : '') + (d.wide ? ' tile--wide' : '')); li.dataset.group = g; li.dataset.set = d.set;
      var b = el('button', 'tile__btn'); b.type = 'button'; b.setAttribute('aria-haspopup', 'dialog');
      b.setAttribute('aria-label', 'Open ' + d.title + ' (' + GROUP[g][0] + ')');
      var img = el('img'); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.src = clipPoster(d.tile || main.slot); b.appendChild(img);
      var vid = null;
      if (ego) { var pip = el('span', 'tile__pip'), pi = el('img'); pi.alt = ''; pi.loading = 'lazy'; pi.src = clipPoster(ego.slot); pip.appendChild(pi); b.appendChild(pip); }
      // Tag = the method of the tile's clip (every wall tile is a GNR result) plus the playback speed.
      var tag = LAB[mk][0] + (d.speed ? ' · ' + d.speed : '');
      var name = d.title;
      b.appendChild(el('span', 'tile__meta', '<b>' + name + '</b><span>' + tag + '</span>'));
      // Autoplay (muted, looping) while the tile is in view: the robot clip and the egocentric inset, the inset on the main clip's clock.
      // Off screen: pause; more than a viewport away: release both decoders. Reduced motion / Save-Data: posters only.
      var pv = null, pipEl = b.querySelector('.tile__pip'), inView = false;
      function makeVid(slot) { var v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.setAttribute('aria-hidden', 'true'); v.src = clipSrc(slot); return v; }
      function start() {
        if (!vid) { vid = makeVid(main.slot); b.insertBefore(vid, b.children[1]); vid.addEventListener('playing', function () { li.classList.add('is-playing'); if (pv && pv.readyState >= 2) pv.currentTime = vid.currentTime; });
          vid.addEventListener('timeupdate', function () { if (pv && pv.readyState >= 2 && Math.abs(pv.currentTime - vid.currentTime) > 0.12) pv.currentTime = vid.currentTime; }); }
        if (ego && pipEl && !pv) { pv = makeVid(ego.slot); pipEl.appendChild(pv); pv.addEventListener('playing', function () { pipEl.classList.add('is-playing'); if (vid && Math.abs(pv.currentTime - vid.currentTime) > 0.06) pv.currentTime = vid.currentTime; }); }
        play(vid); if (pv) play(pv);
      }
      function pause() { if (vid) vid.pause(); if (pv) pv.pause(); }
      function release() {
        [vid, pv].forEach(function (v) { if (v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); } });
        vid = pv = null; li.classList.remove('is-playing'); if (pipEl) pipEl.classList.remove('is-playing');
      }
      function stop() { pause(); }
      if (canAuto()) {
        io(b, function (vis) { inView = vis; if (vis && !lbOpen()) start(); else pause(); }, { threshold: 0.25 });
        io(b, function (near) { if (!near) release(); }, { rootMargin: '100% 0px 100% 0px', threshold: 0 });
      }
      ctl.push({ resume: function () { if (inView) start(); }, pause: pause });
      b.addEventListener('click', function () { ctl.forEach(function (c) { c.pause(); }); openLB(j); });
      li.appendChild(b); wall.appendChild(li);
      return li;
    });
    // One filter along the paper's two axes: diversity (HOT3D) and difficulty (ShapeFilter, NIST). Long lists show a first page.
    var sel = 'all', expanded = false, PAGE = matchMedia('(max-width: 640px)').matches ? 8 : 12;
    var more = $('[data-more]', root), moreBtn = more && $('button', more), fbox = $('[data-fgroup="axis"]', root);
    function axis(d) { return d.set === 'hot3d' ? 'div' : 'dif'; }
    function match(j) { return sel === 'all' || axis(demos[j]) === sel; }
    if (fbox) fbox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]'); if (!b) return;
      sel = b.dataset.filter; $$('[data-filter]', fbox).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      apply();
    });
    function apply() {
      var shown = 0, total = 0, idx = demos.map(function (d, j) { return j; }).filter(match), all = idx.length, page = all <= PAGE + 3 ? all : PAGE;
      // First page = whole grid rows (4 rows at the current column count), counting 2x2 feature and 2x1 wide tiles.
      if (page < all) {
        var cols = getComputedStyle(wall).gridTemplateColumns.split(' ').length, cells = 0;
        for (var q = 0; q < all; q++) {
          var d = demos[idx[q]]; cells += cols >= 3 ? (d.feature ? 4 : d.wide ? 2 : 1) : 1;
          if (cells >= 4 * cols) { page = q + 1; break; }
        }
      }
      tiles.forEach(function (t, j) {
        var ok = match(j);
        if (ok) total++;
        t.hidden = !ok || (!expanded && ++shown > page && ok);
      });
      if (more) { more.hidden = expanded || total <= page; moreBtn.textContent = 'Show all ' + total + ' demonstrations'; }
    }
    if (moreBtn) moreBtn.addEventListener('click', function () { expanded = true; apply(); });
    apply();
    // Lightbox
    var dlg = el('dialog', 'lb'); dlg.setAttribute('aria-labelledby', 'lb-title');
    dlg.innerHTML = '<div class="lb__head"><div><h3 id="lb-title">Demonstration</h3><p data-sub></p></div><div class="lb__acts">' +
      '<button class="cbtn" type="button" data-lb="prev" aria-label="Previous demonstration">&larr;</button><button class="cbtn" type="button" data-lb="next" aria-label="Next demonstration">&rarr;</button>' +
      '<button class="cbtn" type="button" data-lb="close" aria-label="Close" autofocus>&times;</button></div></div><div class="lb__body"><div class="lb__views" data-views></div><dl class="lb__meta" data-meta></dl></div>';
    document.body.appendChild(dlg);
    var cur = 0, opener = null, lbVids = [], lbRaf = 0;
    // Keep every lightbox view on the first view's clock; a view still buffering holds the others back.
    function lbSync() {
      cancelAnimationFrame(lbRaf);
      (function step() {
        if (!dlg.open || !lbVids.length) return;
        var m = lbVids[0], waiting = lbVids.some(function (v) { return v.readyState < 3; });
        lbVids.forEach(function (v) { if (waiting && !v.paused && v.readyState >= 3) v.pause(); });
        if (!waiting) {
          lbVids.forEach(function (v) { if (v.paused) play(v); });
          var t = m.currentTime;
          lbVids.forEach(function (v) { if (v !== m && Math.abs(v.currentTime - t) > 0.04) v.currentTime = t; });
        }
        lbRaf = requestAnimationFrame(step);
      })();
    }
    function fill(j) {
      var step = j > cur ? 1 : -1, n = demos.length; j = (j + n) % n;
      // Arrow navigation stays inside the active filters.
      for (var g = 0; g < n && !match(j); g++) j = (j + step + n) % n;
      cur = j; var d = demos[cur];
      lbVids.forEach(function (v) { v.pause(); v.removeAttribute('src'); v.load(); }); lbVids = [];
      $('#lb-title', dlg).textContent = d.title;
      var views = d.lb ? d.views.filter(function (v) { return d.lb.indexOf(v.k) >= 0; }) : d.views;
      var g = grp(d), st = SETS[d.set] || SETS.hot3d;
      var spd = d.speed === '0.5×' ? 'half speed' : d.speed ? d.speed + ' speed' : 'real time';
      $('[data-sub]', dlg).textContent = g === 'precision' ? listJoin(views.map(function (v) { return v.k === 'gnr' ? 'open-loop GNR' : LAB[v.k][0]; })) + ' · held-out test demonstration · ' + spd
        : g === 'pair' ? 'HOT3D test demonstration · DIAL-MPC with 3,000 samples fails; GNR succeeds within S = 256 (shown: the first sample to pass) · ' + spd
        : d.ds ? 'HOT3D dataset demonstration · ' + (g === 'mpc' ? 'DIAL-MPC' : 'GNR') + ' · ' + spd
        : GROUP[g][0] + ' · HOT3D · GNR with S = 256 · ' + spd;
      var box = $('[data-views]', dlg); box.innerHTML = ''; box.style.setProperty('--n', d.views.length);
      box.style.setProperty('--n', views.length);
      views.forEach(function (v) { var o = viewEl(v, { title: d.title, speed: d.speed }); box.appendChild(o.el); lbVids.push(o.video); });
      lbVids.forEach(function (v) { arm(v); v.currentTime = 0; play(v); });
      lbSync();
      var hand = views.some(function (v) { return /^human_/.test(v.k); });
      $('[data-meta]', dlg).innerHTML =
        (d.obj ? '<div><dt>Object</dt><dd>' + d.obj + '</dd></div>' : '') +
        '<div><dt>Source</dt><dd>' + st[0] + '</dd></div>' +
        '<div><dt>' + (hand ? 'Hand' : 'Robot') + '</dt><dd>' + (hand ? 'Simulated human hand, SuperDex Physics' : st[1]) + '</dd></div>' +
        '<div><dt>Views</dt><dd>' + views.map(function (v) { return LAB[v.k][0] + (v.budget ? ' (' + v.budget + ')' : ''); }).join(', ') + '</dd></div>' +
        (d.ds ? '<div><dt>Method</dt><dd>' + (g === 'mpc' ? 'DIAL-MPC' : 'GNR') + '</dd></div>' : '') +
        '<div><dt>Playback</dt><dd>' + (d.speed ? d.speed + ' real time' : 'Real time') + (d.frames ? ' · ' + d.frames + ' frames at ' + d.fps + ' fps (' + (d.frames / d.fps).toFixed(1) + ' s)' : '') + '</dd></div>' +
        (g === 'pair' ? '<div><dt>Rollouts</dt><dd>Re-simulated from stored controls in SuperDex (open loop)</dd></div>' : '');
    }
    function openLB(j) { opener = document.activeElement; fill(j); document.documentElement.classList.add('lb-open'); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); lbSync(); }
    dlg.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lb]'); if (a) { if (a.dataset.lb === 'close') dlg.close(); else fill(cur + (a.dataset.lb === 'next' ? 1 : -1)); return; }
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); fill(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); fill(cur - 1); } });
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('lb-open'); ctl.forEach(function (c) { c.resume(); }); lbVids.forEach(function (v) { v.pause(); v.removeAttribute('src'); v.load(); }); lbVids = []; if (opener) opener.focus({ preventScroll: true }); });
  }

  /* ---------------- nav, reveals, misc ---------------- */
  function Nav() {
    var nav = $('.nav'); if (!nav || !full) return;
    var hero = $('.hero'), toggle = $('.nav__toggle', nav), links = $$('.nav__links a', nav), box = $('.nav__links', nav);
    io(hero, function (vis, e) { nav.classList.toggle('is-shown', !vis); }, { threshold: 0, rootMargin: '-120px 0px 0px 0px' });
    var sched = false;
    function prog() { var r = document.documentElement.scrollHeight - innerHeight; nav.style.setProperty('--progress', r > 0 ? Math.min(1, scrollY / r) : 0); sched = false; }
    addEventListener('scroll', function () { if (!sched) { sched = true; requestAnimationFrame(prog); } }, { passive: true });
    prog();
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (!e.isIntersecting) return; links.forEach(function (a) { a.classList.toggle('on', a === map[e.target.id]); }); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) o.observe(s); });
    }
    function close() { nav.classList.remove('nav--open'); toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', function () { var op = nav.classList.toggle('nav--open'); toggle.setAttribute('aria-expanded', String(op)); });
    box.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('nav--open')) { close(); toggle.focus(); } });
  }
  function Reveal() {
    var targets = $$('.sec__head,.pfig,.tbl,.stats,.kpis,.claim__head,.studio,.stepper,.axes,.eq,.wall,.intro__text,.chart');
    var anim = $$('.bars,.cost,.chart');
    if (reduced() || !('IntersectionObserver' in window)) { anim.forEach(function (a) { a.classList.add('is-in'); }); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; e.target.classList.add('is-in'); o.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (t) { if (t.getBoundingClientRect().top > innerHeight) t.classList.add('reveal'); o.observe(t); });
    anim.forEach(function (a) { o.observe(a); });
  }
  function Bib() {
    var b = $('#copybib'), t = $('#bibtext'); if (!b || !t) return;
    if (!navigator.clipboard) { b.hidden = true; return; }
    b.addEventListener('click', function () { navigator.clipboard.writeText(t.textContent).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); }); });
  }


  /* ---------------- axis labels: placed on the label anchors of the background render (object-fit: cover aware) ---------------- */
  (function () {
    var hero = $('.hero'), stage = $('.hero__stage'), l = $('[data-axis="l"]'), r = $('[data-axis="r"]'), inner = $('.hero__in');
    if (!hero || !stage || !l || !r) return;
    var mq = matchMedia('(max-width: 760px)');
    // Label anchors in % of the render frame per background variant (html[data-hero]; b is the site default): [x, y, h-align, v-align].
    // a: difficulty band on top, diversity wall below. b: precision tasks left, diversity wall right.
    var HV = {
      // a: the diversity label sits at the top of the wall when that is clear of the text column, else at its bottom (rf).
      // band: the zone boundary (fraction of the frame height) that is moved into the gap between the eyebrow and the title.
      a: { d: { fw: 1920, fh: 1080, band: 0.3315, l: [2.0, 6.0, 'left', 'top'], r: [2.0, 38.9, 'left', 'top'], rf: [2.0, 96.0, 'left', 'bottom'] },
           m: { fw: 1080, fh: 1920, l: [4.0, 3.0, 'left', 'top'], r: [4.0, 36.5, 'left', 'top'] } },
      b: { d: { fw: 1920, fh: 1080, l: [2.0, 6.0, 'left', 'top'], r: [52.1, 6.0, 'left', 'top'] },
           m: { fw: 1080, fh: 1920, l: [4.0, 3.0, 'left', 'top'], r: [4.0, 36.5, 'left', 'top'] } },
      // c: band below the title (B composition, 21:9 crop); d: split hero, portrait composition top-aligned in the right panel.
      // inside: the labels sit inside the band, so they never need to avoid the text column.
      c: { inside: true, d: { fw: 1920, fh: 1080, l: [2.0, 6.0, 'left', 'top'], r: [52.1, 6.0, 'left', 'top'] },
           m: { fw: 1080, fh: 1920, py: 0, l: [4.0, 3.0, 'left', 'top'], r: [4.0, 36.5, 'left', 'top'] } },
      d: { inside: true, d: { fw: 1080, fh: 1920, py: 0, l: [7.0, 3.0, 'left', 'top'], r: [7.0, 36.5, 'left', 'top'] },
           m: { fw: 1080, fh: 1920, py: 0, l: [4.0, 3.0, 'left', 'top'], r: [4.0, 36.5, 'left', 'top'] } } };
    var wide = matchMedia('(min-width: 1101px)');
    function place() {
      // d is a split hero only from 1101px; narrower it falls back to c (title block, then the band).
      var hv = document.documentElement.dataset.hero || 'b', A = HV[hv === 'd' && !wide.matches ? 'c' : hv] || HV.b;
      var a = mq.matches ? A.m : A.d, W = stage.clientWidth, H = stage.clientHeight, m = mq.matches ? 14 : 24;
      if (A.inside) m = mq.matches ? 14 : 20;
      var sc = Math.max(W / a.fw, H / a.fh), ox = (W - a.fw * sc) / 2, oy = (H - a.fh * sc) * (a.py == null ? 0.5 : a.py);
      var hr = stage.getBoundingClientRect();
      // Variant A: scale the background a little (from its bottom or top edge) so the band/wall boundary falls in the
      // gap between the eyebrow and the title instead of crossing the title.
      var media = $('.hero__media', stage), k = 1;
      if (media) { media.style.transform = ''; media.style.transformOrigin = ''; }
      if (a.band && media && inner) {
        var eb = $('.eyebrow--hero', inner), h1 = $('.hero__title', inner);
        if (eb && h1) {
          var yd = ((eb.getBoundingClientRect().bottom + h1.getBoundingClientRect().top) / 2) - hr.top, yn = oy + a.band * a.fh * sc;
          if (yd < yn) { k = (H - yd) / (H - yn); if (k <= 1.35) { media.style.transformOrigin = '50% 100%'; oy = H - (H - oy) * k; } else k = 1; }
          else if (yd > yn && yn > 0) { k = yd / yn; if (k <= 1.35) { media.style.transformOrigin = '50% 0'; oy = oy * k; } else k = 1; }
          if (k > 1) { media.style.transform = 'scale(' + k.toFixed(4) + ')'; sc *= k; ox = (W - a.fw * sc) / 2; }
        }
      }
      var blocks = inner ? Array.prototype.slice.call(inner.children).filter(function (c) { return c.offsetHeight; }).map(function (c) { var b = c.getBoundingClientRect(); return [b.left - hr.left, b.top - hr.top, b.right - hr.left, b.bottom - hr.top]; }) : [];
      function put(el, p) {
        var x = ox + p[0] / 100 * a.fw * sc, y = oy + p[1] / 100 * a.fh * sc;
        if (p[3] === 'bottom') y -= el.offsetHeight;
        y = Math.max(m, Math.min(y, H - el.offsetHeight - m));
        // Phones: the hero is taller than the portrait frame, so keep the labels clear of the text column
        // (difficulty above it, diversity below it, still over the precision band / the HOT3D wall).
        if (mq.matches && inner && !A.inside) {
          var ir = inner.getBoundingClientRect();
          if (el === l) y = Math.max(m, Math.min(y, ir.top - hr.top - el.offsetHeight - 14));
          else y = Math.max(y, ir.bottom - hr.top + 22);
        }
        el.style.top = Math.round(y) + 'px';
        el.classList.toggle('is-right', p[2] === 'right');
        if (p[2] === 'right') { el.style.left = 'auto'; el.style.right = Math.round(Math.max(m, W - x)) + 'px'; }
        else { el.style.right = 'auto'; el.style.left = Math.round(Math.max(m, x)) + 'px'; }
      }
      function hits(el) {
        var b = el.getBoundingClientRect(), r = [b.left - hr.left - 12, b.top - hr.top - 12, b.right - hr.left + 12, b.bottom - hr.top + 12];
        return blocks.some(function (q) { return r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]; });
      }
      put(l, a.l); put(r, a.r);
      if (a.rf && hits(r)) put(r, a.rf);
    }
    place(); var axesBox = l.parentNode; if (axesBox) axesBox.classList.add('is-placed');
    addEventListener('resize', place);
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(place); ro.observe(hero); ro.observe(stage); }
  })();

  /* ---------------- opening background video: muted autoplay; poster only for reduced motion / Save-Data ---------------- */
  (function () {
    var hero = $('.hero'), video = $('#hero-video'), pause = $('#hero-pause');
    if (!hero || !video) return;
    var requested = false, visible = true, userPaused = false;
    function allowed() { return canAuto() && !userPaused; }
    function sync() {
      if (!visible || document.hidden || !allowed()) { video.pause(); return; }
      if (!requested) {
        // Variants differ only on desktop; the portrait (phone) loop is shared.
        var mob = matchMedia('(max-width: 760px)').matches;
        // Default (b): left/right render on desktop, the portrait render on phones. Preview-only alternates:
        // a = its own desktop render; c = the default render in a band; d = the portrait render in a tall right panel.
        var hv = document.documentElement.dataset.hero || 'b';
        if (hv === 'd' && !matchMedia('(min-width: 1101px)').matches) hv = 'c';
        var base = 'assets/hero/gnr-hero-' + (mob || hv === 'd' ? 'mobile' : hv === 'a' ? 'a-desktop' : 'desktop');
        video.src = ver(base + (AV1 ? '.webm' : '.mp4')); requested = true;
        video.addEventListener('error', function f() { if (/\.webm(\?|$)/.test(video.src)) { video.removeEventListener('error', f); video.src = ver(base + '.mp4'); play(video); } });
      }
      play(video);
    }
    video.addEventListener('playing', function () { video.classList.add('is-playing'); });
    video.addEventListener('error', function () { video.classList.remove('is-playing'); });
    if (pause) {
      pause.addEventListener('click', function () {
        userPaused = !userPaused; pause.textContent = userPaused ? 'Play background video' : 'Pause background video'; sync();
      });
      if (!canAuto()) pause.hidden = true;
    }
    io(hero, function (vis) { visible = vis; if (requested || vis) sync(); }, { threshold: 0 });
    document.addEventListener('visibilitychange', sync);
    motionQ.addEventListener && motionQ.addEventListener('change', sync);
    afterLoad(sync);
  })();

  /* ---------------- scrollable tables: edge fade + hint when they overflow ---------------- */
  function TableHints() {
    $$('.tbl .scroll').forEach(function (sc) {
      if (!sc.querySelector('table')) return;
      var hint = el('p', 'scroll__hint', 'Swipe to see all columns <span aria-hidden="true">&rarr;</span>'); hint.hidden = true;
      sc.parentNode.insertBefore(hint, sc.nextSibling);
      function upd() {
        var over = sc.scrollWidth > sc.clientWidth + 2;
        sc.classList.toggle('is-overflow', over); hint.hidden = !over;
        sc.classList.toggle('at-end', sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 2);
      }
      sc.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    });
  }
  /* Canonical / og:url follow site.url in site-config.js at runtime (static tags: scripts/set_site_url.py). */
  if (C.site && C.site.url) {
    var cl = $('link[rel="canonical"]'); if (cl) cl.href = C.site.url;
    var ou = $('meta[property="og:url"]'); if (ou) ou.content = C.site.url;
  }

  /* ---------------- boot ---------------- */
  if (full) {
    var fr = $('[data-film]'); if (fr && M.film) film = new Film(fr, M.film);
    var st = $('[data-stepper]'); if (st && M.film && M.film.steps) Stepper(st, M.film.steps);
    var cp = $('[data-compare="hot3d"]'), pairs = DEMOS.filter(pairOK);
    if (cp && pairs.length) { cp.hidden = false; Compare(cp, pairs); }
    var sd = $('[data-studio]'); if (sd) Studio(sd, DEMOS.filter(function (d) { return d.set === 'shapefilter' || d.set === 'nist'; }));
    var wl = $('#dataset'); if (wl) Wall(wl, DEMOS.filter(function (d) { return d.wall !== false; }).sort(function (a, b) { return (b.feature ? 1 : 0) - (a.feature ? 1 : 0); }));
    Nav(); Reveal(); Bib(); TableHints();
  }
})();
