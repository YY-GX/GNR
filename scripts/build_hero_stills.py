"""Export four static WebP slides per hero tile from local research demos.

Usage: python3 scripts/build_hero_stills.py /path/to/paper-workspace
Requires FFmpeg. Only still images are written to the public site.
"""
import argparse
import json
import subprocess
from pathlib import Path

# Order matches the original 3-by-2 hero: human, robot, NIST / human, robot, ShapeFilter.
SOURCES = {
    'dino-human': ('demos/appendix/hot3d/replacements_v1/dino_carry/egocentric.mp4', [0.6, 1.8, 3.2, 4.8], None),
    'dino-robot': ('demos/appendix/hot3d/replacements_v1/dino_carry/gnr.mp4', [1.6, 2.8, 4.2, 5.8], None),
    'nist': ('demos/latest/nist/episode_25/gnr_mpc.mp4', [8, 12, 17, 22], 'crop=960:720:0:720'),
    'coffee-human': ('demos/appendix/hot3d/pi31_final_v1/coffee_pot_lift/egocentric.mp4', [0.6, 1.8, 3.2, 4.8], None),
    'coffee-robot': ('demos/appendix/hot3d/pi31_final_v1/coffee_pot_lift/gnr_coffee_occ.mp4', [0.3, 1, 1.8, 2.8], None),
    'shapefilter': ('demos/latest/shapefilter/episode_124/gnr_mpc.mp4', [4, 6, 8, 10], None),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workspace', type=Path)
    args = parser.parse_args()
    out = Path(__file__).resolve().parents[1] / 'assets/hero/stills'
    out.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name, (source, times, crop) in SOURCES.items():
        files = []
        for i, time in enumerate(times):
            target = out / f'{name}-{i + 1}.webp'
            command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(time), '-i', str(args.workspace / source), '-frames:v', '1']
            if crop:
                command += ['-vf', crop]
            subprocess.run(command + ['-c:v', 'libwebp', '-quality', '85', '-compression_level', '6', '-map_metadata', '-1', str(target)], check=True)
            files.append(target.name)
        manifest[name] = {'source': source, 'seconds': times, 'crop': crop, 'files': files}
    (out / 'sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
    images = list(out.glob('*.webp'))
    print(f'{len(images)} stills, {sum(p.stat().st_size for p in images) / 1024:.0f} KiB total')
    print(f'First screen: {sum(p.stat().st_size for p in images if p.name.endswith("-1.webp")) / 1024:.0f} KiB')


if __name__ == '__main__':
    main()
