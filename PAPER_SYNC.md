# Paper synchronization

Last checked against the arXiv source of 2610.12440 on 2026-10-29.
Figure PDF paths and SHA-256 hashes are recorded in `assets/paper/sources.json`.

| Website content | Paper source | Values / interpretation |
| --- | --- | --- |
| HOT3D highlights and baseline table | `contents/3_exp.tex`, `contents/d4_baselines.tex` | 1,000 OOD demos; 256 vs. 3,000 samples; 56.2% vs. 27.2% success; 7.6× lower CPU cost. Table 1 keeps the paper's two-decimal success rates. |
| Precision-task costs | `contents/difficulty_marginal_cost.tex` | 14.9× ShapeFilter and 3.0× NIST per-trajectory CPU savings; retain the corresponding success rates. |
| Dataset-generation costs | `contents/3_exp.tex` | Includes seed generation, excludes GPU training: 11.2× ShapeFilter, 1.8× NIST, 2.62× HOT3D. |
| HOT3D practical cost estimate | `contents/3_exp.tex` | 28k seeds; 148.7k core-h; 215k generated trajectories. Distinct from the collected 223k dataset that retains all MPC successes. |
| Large-scale evaluation figure | `contents/appendix_v2/appendix_hot3d_scaling.tex` | 360,150 demos; 58.94% overall, 89.30% MPC-success, 48.01% MPC-failure at 256 samples. Overall includes training examples. Distinct from the 1,000-demo OOD benchmark. |
| Multi-embodiment | `contents/appendix_v2/appendix_multi_embodiment.tex` | 147 training trajectories; five hands; 93% at 256 and 95% at 384 samples; SPIDER 96% on the same 100 test trajectories. |

CPU ratios are compute savings, not measured wall-clock speedups. Sample budgets
count complete trajectories for GNR and samples per iteration × iterations for MPC.

To refresh all eight displayed figures, install `pymupdf` and `Pillow` in a Python
environment, then run:

```sh
python scripts/sync_paper_figures.py /path/to/paper
```

This exports the current PDFs, updates image dimensions, and records source hashes.
Captions and numbers still need to be checked against the accompanying paper text.

## Policy (2026-10-28): the site mirrors the paper verbatim

The paper is the single source of truth for this site.
- Every number, table value and figure on the page is copied exactly from the current paper source (`arxiv.tex` and `contents/`; Table 1 keeps its two-decimal success rates). Nothing is hidden or reworded to a different value, and the abstract is reproduced verbatim.
- When the camera-ready version changes any number, re-sync the page to it: text, tables, the figures through `scripts/sync_paper_figures.py`, and this file.
- Where each number on the page comes from:
  - Table 1 and the 7.6× CPU saving: `d4_baselines.tex`, `3_exp.tex`.
  - OOD subsets: `appendix_hot3d.tex`.
  - 360k expansion, the large-scale figure, and the 2.62× / 148.7k / 215k deployment estimate: `3_exp.tex`, `appendix_hot3d_scaling.tex`.
  - Dataset-generation table: `appendix.tex` (`tab:corpus-build-cost`).
  - ShapeFilter, NIST, 14.9× / 3.0× / 11.2× / 1.8×: `3_exp.tex`, `difficulty_marginal_cost.tex`.
  - Multi-embodiment: `appendix_multi_embodiment.tex`.
