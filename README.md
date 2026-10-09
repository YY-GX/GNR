# GNR

Project page for **Generative Neural Retargeting for Human-to-Robot Dexterous Manipulation**.

This repository hosts the public preview of the site. Open `index.html` locally, or serve it with GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root).

The opening grid uses only static WebP images: four frames per tile, advancing automatically every second, including during hover or focus. The four human/robot panels share one dataset caption; the two precision demos each show their precision and duration. Hover, keyboard focus, or tap reveals the metrics. There are no playback controls or progress bars. Frame changes continue with reduced motion enabled, but decorative transitions are disabled. The slideshow pauses while the page is hidden or the hero leaves view.

All 24 stills total about 305 KiB; the six initial frames total about 74 KiB. The next frame is decoded ahead of each change. NIST uses a native 960 × 720 crop of the robot view; ShapeFilter uses the original 640 × 480 frames without upscaling. No videos are served or fetched.

To regenerate the stills from the original research demo files, install FFmpeg and run `python3 scripts/build_hero_stills.py /path/to/paper-workspace`. The source timestamps and crops are recorded in `assets/hero/stills/sources.json`; original videos stay outside this repository.
