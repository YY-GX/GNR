# GNR

Project page for **Generative Neural Retargeting for Human-to-Robot Dexterous Manipulation**.

This repository hosts the public preview of the site. Open `index.html` locally, or serve it with GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root).

The opening grid uses only static WebP images, advancing automatically every second, including during hover or focus. Each human/robot tile has four frames; each precision demo has six deliberately selected keyframes. The four human/robot panels share one dataset caption; the two precision demos each show their precision and duration. Hover, keyboard focus, or tap reveals the metrics. There are no playback controls or progress bars. Frame changes continue with reduced motion enabled, but decorative transitions are disabled. The slideshow pauses while the page is hidden or the hero leaves view.

The small still-image sequences are predecoded so playback does not wait for a new network request each second. The displayed image is swapped directly. Scripts, styles, and images share a cache version in `index.html` so refreshing the page fetches matching assets. NIST uses a native 960 × 720 crop of the robot view; ShapeFilter uses original 640 × 480 frames without upscaling. No videos are served or fetched.

NIST keyframes cover grasping, transport, seating, rotation, and release (4, 6, 10, 12, 14, 23 seconds). ShapeFilter keyframes cover grasping, lifting, alignment, insertion, and release (5–11 seconds, excluding 6). Source timestamps and stage labels are recorded in the still-image manifest.

To regenerate the stills from the original research demo files, install FFmpeg and run `python3 scripts/build_hero_stills.py /path/to/paper-workspace`. The source timestamps and crops are recorded in `assets/hero/stills/sources.json`; original videos stay outside this repository.
