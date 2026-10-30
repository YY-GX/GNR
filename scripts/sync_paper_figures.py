"""Export the paper's current PDF figures for the static project page.

Usage: python scripts/sync_paper_figures.py /path/to/paper
Dependencies: pymupdf, Pillow. The website itself has no build dependency.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import pymupdf
from PIL import Image

FIGURES = {
    "fig1": ("figures/fig1_gnr_v3.pdf", 1600),
    "fig2": ("figures/fig2_gnr_v3.pdf", 1600),
    "fig_gnr_axis_outcome_scaling": ("figures/diversity/fig_gnr_axis_outcome_scaling.pdf", 1200),
    "fig_difficulty_results_shapefilter": ("figures/fig_difficulty_results_shapefilter.pdf", 1000),
    "fig_difficulty_results_nist": ("figures/fig_difficulty_results_nist.pdf", 1000),
    "fig_difficulty_efficiency_shapefilter": ("figures/fig_difficulty_efficiency_shapefilter.pdf", 1000),
    "fig_difficulty_efficiency_nist": ("figures/fig_difficulty_efficiency_nist.pdf", 1000),
    "fig_hot3d_large_scale_evaluation": ("figures/appendix/fig_hot3d_large_scale_evaluation.pdf", 1800),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paper", type=Path)
    args = parser.parse_args()
    site = Path(__file__).resolve().parents[1]
    destination = site / "assets/paper"
    html = (site / "index.html").read_text()
    manifest = {}
    for name, (relative, width) in FIGURES.items():
        source = args.paper / relative
        with pymupdf.open(source) as document:
            page = document[0]
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(width / page.rect.width, width / page.rect.width), alpha=False)
            output = destination / f"{name}.png"
            Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples).save(output, optimize=True)
            manifest[name] = {
                "source": relative,
                "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                "width": pixmap.width,
                "height": pixmap.height,
            }
            html, count = re.subn(
                rf'(src="assets/paper/{re.escape(name)}\.png") width="\d+" height="\d+"',
                rf'\1 width="{pixmap.width}" height="{pixmap.height}"', html,
            )
            if count != 1:
                raise ValueError(f"Expected one image element for {name}, found {count}")
            print(f"{name}: {pixmap.width} x {pixmap.height}, {output.stat().st_size // 1024} KiB")
    (destination / "sources.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (site / "index.html").write_text(html)


if __name__ == "__main__":
    main()
