# GNR

Project page for **Generative Neural Retargeting for Human-to-Robot Dexterous Manipulation**.

This repository hosts the public preview of the site. Open `index.html` locally, or serve it with GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root).

The opening grid uses only static WebP images: four frames per tile, with gentle crossfades every 4.2 seconds. Hover or keyboard focus reveals task metrics and holds the current frame; on touchscreens, tap a tile. The slideshow pauses when the page is hidden or the hero leaves view, and starts paused for reduced-motion and data-saving preferences. A Play/Pause control is always available.

All 24 stills total about 305 KiB; the six initial frames total about 74 KiB. Later frames load only as needed. NIST uses a native 960 × 720 crop of the robot view; ShapeFilter uses the original 640 × 480 frames without upscaling. No videos are served or fetched.

To regenerate the stills from the original research demo files, install FFmpeg and run `python3 scripts/build_hero_stills.py /path/to/paper-workspace`. The source timestamps and crops are recorded in `assets/hero/stills/sources.json`; original videos stay outside this repository.
