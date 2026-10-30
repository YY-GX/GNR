#!/bin/bash
# Posters (first-frame / title stills) and the silent method-step loops cut from the film.
# Usage, from the repo root (set FFMPEG=/path/to/ffmpeg if needed):
#   scripts/make_stills_and_steps.sh <film_master.mp4> <poster_time_s> <film_tag>
#   e.g. scripts/make_stills_and_steps.sh gnr_explainer_v39f.mp4 21.2 v39f
# Step start/end times and names are read from media.film.steps in site-config.js; re-time them there for a new cut.
set -euo pipefail
FF=${FFMPEG:-ffmpeg}
M=assets/media
FILM="$1"; FT="$2"; FTAG="$3"
poster () {
  $FF -nostdin -hide_banner -loglevel error -y -ss "$2" -i "$1" -frames:v 1 -vf scale=1280:-2:flags=lanczos -c:v libwebp -quality 78 "$3.webp"
  $FF -nostdin -hide_banner -loglevel error -y -ss "$2" -i "$1" -frames:v 1 -vf scale=1280:-2:flags=lanczos -q:v 4 "$3.jpg"
}
poster "$FILM" "$FT" "$M/gnr-explainer-$FTAG-poster"
# Step list comes from media.film.steps in site-config.js (single source).
STEPS=$(node -e "const fs=require('fs'),vm=require('vm');const c={window:{},document:{documentElement:{dataset:{}}}};vm.runInNewContext(fs.readFileSync('site-config.js','utf8'),c);for(const s of c.window.GNR_SITE.media.film.steps)console.log(s.t,s.end,s.name)")
while read -r S E N; do
  D=$(python3 -c "print(round($E-$S,3))")
  $FF -nostdin -hide_banner -loglevel error -y -ss "$S" -i "$FILM" -t "$D" -an -vf "scale=1280:-2:flags=lanczos,fps=30" \
     -c:v libx264 -preset slow -crf 27 -profile:v high -pix_fmt yuv420p -g 60 -movflags +faststart -map_metadata -1 "$M/method-$N-$FTAG.mp4"
  $FF -nostdin -hide_banner -loglevel error -y -ss "$S" -i "$FILM" -frames:v 1 -vf scale=1280:-2:flags=lanczos -c:v libwebp -quality 75 "$M/method-$N-$FTAG.webp"
done <<< "$STEPS"
