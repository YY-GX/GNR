#!/bin/bash
# Web encodes for the site films (needs an ffmpeg with libx264, libaom-av1, libopus; set FFMPEG=/path/to/ffmpeg).
# Usage, from the repo root:
#   scripts/encode_film.sh <master_with_music.mp4> assets/media/gnr-explainer-v39f 1150 650 850   # full film (~36/21/24 MB)
#   scripts/encode_film.sh <short_with_music.mp4>  assets/media/gnr-teaser-v6     2000 1000 1300  # teaser (~12/6/7 MB)
# Writes <prefix>-1080.mp4 and <prefix>-720.mp4 (H.264 High + AAC, faststart, 2 s GOP for quick seeking) and
# <prefix>-1080.webm (AV1 + Opus). Then point media.film / media.teaser in site-config.js at the new prefix.
set -euo pipefail
FF=${FFMPEG:-ffmpeg}
IN="$1"; OUT="$2"; B1080="$3"; B720="$4"; BAV1="$5"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -g 60 -keyint_min 30 -sc_threshold 0"
COLOR="-colorspace bt709 -color_primaries bt709 -color_trc bt709"
enc264 () { # $1=height $2=kbps $3=out $4=audio kbps
  local vf="scale=-2:$1:flags=lanczos"
  $FF -nostdin -hide_banner -loglevel error -y -i "$IN" -vf "$vf" $X264 $COLOR -b:v ${2}k -maxrate $(( $2 * 2 ))k -bufsize $(( $2 * 4 ))k -pass 1 -passlogfile "$TMP/p$1" -an -f mp4 /dev/null
  $FF -nostdin -hide_banner -loglevel error -y -i "$IN" -vf "$vf" $X264 $COLOR -b:v ${2}k -maxrate $(( $2 * 2 ))k -bufsize $(( $2 * 4 ))k -pass 2 -passlogfile "$TMP/p$1" \
     -c:a aac -b:a ${4}k -ar 48000 -ac 2 -map_metadata -1 -movflags +faststart "$3"
}
enc264 1080 "$B1080" "${OUT}-1080.mp4" 128
enc264 720 "$B720" "${OUT}-720.mp4" 96
AOM="-c:v libaom-av1 -cpu-used 5 -row-mt 1 -tiles 2x2 -g 60 -pix_fmt yuv420p -b:v ${BAV1}k"
$FF -nostdin -hide_banner -loglevel error -y -i "$IN" $AOM $COLOR -pass 1 -passlogfile "$TMP/av1" -an -f webm /dev/null
$FF -nostdin -hide_banner -loglevel error -y -i "$IN" $AOM $COLOR -pass 2 -passlogfile "$TMP/av1" -c:a libopus -b:a 112k -ar 48000 -map_metadata -1 "${OUT}-1080.webm"
ls -l "${OUT}"-1080.mp4 "${OUT}"-720.mp4 "${OUT}"-1080.webm
