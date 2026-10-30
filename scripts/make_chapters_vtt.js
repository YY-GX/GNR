// Writes <stem>-chapters.vtt for media.film from site-config.js (the single source of chapter times).
// Usage (from the repo root): node scripts/make_chapters_vtt.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = { window: {}, document: { documentElement: { dataset: {} } } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'site-config.js'), 'utf8'), ctx);
const film = ctx.window.GNR_SITE.media.film;
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`; };
let out = 'WEBVTT\n\n';
film.chapters.forEach(([t, title], i, a) => { const end = i + 1 < a.length ? a[i + 1][0] : film.duration; out += `${i + 1}\n${ts(t)} --> ${ts(end)}\n${title}\n\n`; });
const file = path.join(root, film.stem + '-chapters.vtt');
fs.writeFileSync(file, out);
console.log('wrote', path.relative(root, file));
