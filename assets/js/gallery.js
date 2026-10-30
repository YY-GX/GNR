/* Native dialog provides modal focus containment and Escape handling.
   Gallery images reuse the page assets; no dependencies or initial thumbnail requests. */
(function () {
  'use strict';
  if (!window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;
  // Figures marked data-gallery.
  var sources = Array.from(document.querySelectorAll('img[data-gallery]'));
  if (!sources.length) return;
  var items = sources.map(function (img) {
    var figure = img.closest('.pfig');
    var caption = figure.querySelector('figcaption');
    var group = figure.closest('.pair');
    var shared = group && group.querySelector('.figcap');
    return { src: img.getAttribute('src'), alt: img.alt, width: Number(img.getAttribute('width')), title: img.dataset.title || 'Research figure', caption: ((caption || shared || img).textContent || img.alt).replace(/^Figure \d+\.\s*/, '') };
  });
  var dialog = document.createElement('dialog');
  dialog.className = 'gallery';
  dialog.setAttribute('aria-labelledby', 'gallery-title');
  dialog.innerHTML = '<header class="gallery__header"><div class="gallery__heading"><p class="gallery__eyebrow">GNR / Research gallery</p><h2 class="gallery__title" id="gallery-title">Figure</h2></div><div class="gallery__actions"><button class="gallery__control" type="button" data-action="zoom" aria-label="Zoom in" aria-pressed="false"><span aria-hidden="true">＋</span><span class="gallery__zoom-label">Zoom</span></button><button class="gallery__control" type="button" data-action="close" aria-label="Close gallery" autofocus>✕</button></div></header><div class="gallery__stage" tabindex="0" aria-label="Figure; use arrow keys to browse, or zoom to inspect"><img class="gallery__image" alt=""></div><footer class="gallery__footer"><p class="gallery__caption"></p><div class="gallery__navigation"><div class="gallery__thumbnails" role="group" aria-label="Choose a figure"></div><div class="gallery__paging"><button class="gallery__control" type="button" data-action="prev" aria-label="Previous figure">←</button><span class="gallery__count" role="status" aria-live="polite" aria-atomic="true"></span><button class="gallery__control" type="button" data-action="next" aria-label="Next figure">→</button></div></div></footer>';
  document.body.appendChild(dialog);
  var stage = dialog.querySelector('.gallery__stage');
  var image = dialog.querySelector('.gallery__image');
  var title = dialog.querySelector('.gallery__title');
  var caption = dialog.querySelector('.gallery__caption');
  var counter = dialog.querySelector('.gallery__count');
  var thumbs = dialog.querySelector('.gallery__thumbnails');
  var zoomButton = dialog.querySelector('[data-action="zoom"]');
  var active = 0, opener = null, thumbnailsReady = false;
  function zoom(value) {
    var zoomed = typeof value === 'boolean' ? value : !stage.classList.contains('is-zoomed');
    stage.classList.toggle('is-zoomed', zoomed);
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.setAttribute('aria-label', zoomed ? 'Fit figure to screen' : 'Zoom in');
    zoomButton.firstElementChild.textContent = zoomed ? '−' : '＋';
    zoomButton.lastElementChild.textContent = zoomed ? 'Fit' : 'Zoom';
    image.style.setProperty('--image-width', Math.max(items[active].width, stage.clientWidth * 1.6) + 'px');
    stage.scrollTop = stage.scrollLeft = 0;
  }
  function show(index) {
    active = (index + items.length) % items.length;
    var item = items[active];
    zoom(false);
    image.classList.remove('is-entering');
    image.src = item.src; image.alt = item.alt;
    title.textContent = item.title; caption.textContent = item.caption;
    caption.scrollTop = 0;
    counter.textContent = (active + 1) + ' / ' + items.length;
    Array.from(thumbs.children).forEach(function (thumb, i) { thumb.setAttribute('aria-current', String(i === active)); });
    var current = thumbs.children[active];
    if (current) thumbs.scrollLeft = current.offsetLeft - thumbs.offsetLeft - (thumbs.clientWidth - current.clientWidth) / 2;
    // Re-trigger a brief transition even when the image is already cached.
    void image.offsetWidth;
    image.classList.add('is-entering');
  }
  function open(index, button) {
    opener = button;
    if (!thumbnailsReady) {
      items.forEach(function (item, i) {
        var thumb = document.createElement('button');
        thumb.className = 'gallery__thumb'; thumb.type = 'button';
        thumb.setAttribute('aria-label', 'View figure ' + (i + 1) + ': ' + item.title);
        var preview = document.createElement('img'); preview.src = item.src; preview.alt = '';
        thumb.appendChild(preview); thumb.addEventListener('click', function () { show(i); });
        thumbs.appendChild(thumb);
      });
      thumbnailsReady = true;
    }
    document.documentElement.classList.add('gallery-open');
    dialog.showModal();
    show(index);
  }
  sources.forEach(function (img, i) {
    var button = document.createElement('button');
    button.className = 'figure-link'; button.type = 'button';
    button.setAttribute('aria-label', 'Expand figure: ' + items[i].title);
    button.setAttribute('aria-haspopup', 'dialog');
    // Wrap the whole <picture> (if any) so its WebP <source> stays attached to the image.
    var target = img.parentNode && img.parentNode.tagName === 'PICTURE' ? img.parentNode : img;
    target.parentNode.insertBefore(button, target); button.appendChild(target);
    var hint = document.createElement('span'); hint.className = 'figure-link__hint'; hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/></svg><span>View figure</span>';
    button.appendChild(hint); button.addEventListener('click', function () { open(i, button); });
  });
  dialog.querySelector('[data-action="close"]').addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('[data-action="prev"]').addEventListener('click', function () { show(active - 1); });
  dialog.querySelector('[data-action="next"]').addEventListener('click', function () { show(active + 1); });
  zoomButton.addEventListener('click', function () { zoom(); });
  image.addEventListener('click', function () { zoom(); });
  dialog.addEventListener('keydown', function (e) {
    if (stage.classList.contains('is-zoomed') && e.target === stage) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(active + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
  var startedOnBackdrop = false;
  dialog.addEventListener('pointerdown', function (e) { startedOnBackdrop = e.target === dialog; });
  dialog.addEventListener('click', function (e) {
    if (!startedOnBackdrop || e.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('gallery-open');
    zoom(false);
    if (opener) opener.focus({ preventScroll: true });
  });
})();
