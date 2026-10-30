# GNR

Project page for **Generative Neural Retargeting for Human-to-Robot Dexterous Manipulation** (arXiv 2610.12440).

Static site, no build step, no third-party CDN (fonts, scripts and media are self-hosted). Open `index.html`
through any static server, or publish with GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root).

## Layout
- `index.html`: the page. Order: full-bleed opening screen (background video behind the title, authors, affiliations and links) → TL;DR → explainer film (cinematic pinned reveal) → abstract → method → results (six claims) → dataset → BibTeX.
- `site-config.js`: **the only file for routine switches** (see below). After editing it, run `python3 scripts/stamp_assets.py` so CDNs fetch the new copy.
- `assets/css/site.css`, `assets/js/site.js` (players, comparisons, wall, nav), `assets/js/gallery.js` (figure lightbox). After editing any of them, or replacing any clip, poster or film, run `python3 scripts/stamp_assets.py`: it adds content-hash `?v=` queries to every static reference in `index.html` and writes `assets/js/asset-versions.js`, which `site.js` uses for the media it loads by name. CDNs then never serve a stale file under a reused name.
- `assets/media/`: web encodes of the explainer film, its poster, chapter VTT, and the method-step loops.
- `assets/hero/`: the opening-screen background, rendered by the film team: the difficulty axis (ShapeFilter over NIST) on the left and a wall of right-hand HOT3D GNR demos (diversity) on the right, with fingertip trails and no burned-in text. `gnr-hero-desktop` (16:9) and `gnr-hero-mobile` (portrait: difficulty band on top, wall below), each as `.webm` (AV1) and `.mp4` (H.264), plus posters. The two zone labels are HTML, placed by `site.js` on the render's label anchors (moved clear of the text column on phones).
- `assets/social/og-card.jpg`: the 1200×630 share card.
- `assets/video/`: demonstration clips and posters; every clip is a *slot*, see `assets/video/SLOTS.md`.
- `assets/paper/`: figures exported from the paper (`scripts/sync_paper_figures.py`; hashes in `sources.json`).
- `assets/logos/` (provenance in `SOURCES.md`). The logos are **inlined** into `index.html` by `python3 scripts/inline_logos.py`, because some hosts serve `.svg` without `image/svg+xml` and browsers then refuse `<img>`. They are shown in white on the dark opening screen.
- `assets/fonts/`: Inter (OFL license alongside); one font family site-wide.

## Switches in `site-config.js`
- `site.url`: the public URL, used for canonical / og:url / og:image. After changing it, run `python3 scripts/set_site_url.py`, which also rewrites the static tags that crawlers read. Set it to the final GitHub Pages URL before release.
- `fullSite`: `false` (default) shows only the opening screen with a "Stay tuned" note; `true` shows the full page. In preview mode the research content stays in an inert `<template>`, so no players, figures or media load.
- `media.film`: the explainer film. **To swap in a new cut, edit this one entry.** First encode it with `scripts/encode_film.sh`. Then change `stem`, `poster`, `duration`, `sizes`, `chapters` and the method `steps`. The method-step loops are re-cut from the times in `media.film.steps` by `scripts/make_stills_and_steps.sh <film.mp4> <poster_s> <tag>`. Finally run `node scripts/make_chapters_vtt.js` to rewrite the chapter track.
  - `stem` may also be a full `https://` prefix if the films are later hosted outside the repo.
  - Setting `media.film.youtube` to a video id swaps in a click-to-load YouTube facade.

## How the videos are embedded
- **Opening screen:** a muted, seamless 11.4 s background loop (AV1 where supported, else H.264; portrait on phones) that autoplays after page load, under a centre-weighted shade that keeps the title legible.
  - It pauses off-screen and in hidden tabs.
  - Reduced motion or Save-Data shows only the poster.
  - A "Pause background video" control is reachable by keyboard and visible only on focus.
- **Explainer film:** a pinned section in which the film card scales up as you scroll (desktop; transform-only, rAF-throttled) to the largest 16:9 frame that fits the viewport; the fixed nav steps aside while it is pinned.
  - The file starts loading about one viewport before the section; the film autoplays muted once at least 50% visible and pauses when it leaves. The poster stays until the first frame plays, and if the browser blocks autoplay the poster and play button return.
  - "Sound on" unmutes; the first time, it restarts from 0:00.
  - Chapter chips sit below the frame. A chapter-segmented seek bar, quality (Auto / 1080p / 720p), PiP, full screen and keyboard shortcuts (`Space/K`, `←/→`, `J/L`, `P/N`, `M`, `F`, `0–9`, `?`) appear on hover or tap.
  - Phones get a plain full-width card. Reduced motion gets a static poster with a play button and no autoplay.
- **Method:** five silent excerpt loops from the film. "Watch this part with sound" scrolls to the film and plays from that step.
- **Results:** video only where the alternative visibly fails.
  - HOT3D *MPC fails, GNR succeeds* pairs appear only for demo-data entries whose `mpc` view has `res: "no"` and `gnr` view `res: "ok"`; the optional `budget` text is shown on each view.
  - ShapeFilter/NIST: the views of one demonstration play synced, with a wipe between any two of them.
  - Every clip that is not real time carries a speed tag (HOT3D 0.5×, NIST 3×, ShapeFilter 2×). On phones the comparison views stack in one column.
  - Efficiency (MPC also succeeds) is shown as charts.
- **Dataset:** a wall of GNR results (uniform tiles; the two precision tiles are 2×1) that autoplay muted while in view (robot clip plus the egocentric inset; paused off screen, released a viewport away; posters only with reduced motion or Save-Data; AV1 where supported), one filter along the paper's axes (Diversity · HOT3D / Difficulty · ShapeFilter, NIST), a first page plus "Show all", and a lightbox with the egocentric and robot clips in sync plus object and playback details.
- Nothing above downloads video before it is needed. Numbers mirror the paper verbatim; see `PAPER_SYNC.md`.

The Code and Dataset buttons are omitted until release. The arXiv links point to 2610.12440.
