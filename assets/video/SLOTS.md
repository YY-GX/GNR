# Demo clip slots

Every demonstration clip on the page is a *slot*: `assets/video/<slot>.mp4` plus its poster `assets/video/<slot>.jpg`, listed in the `demo-data` JSON block at the end of `index.html` (one demonstration per line).
The JSON drives the HOT3D "MPC fails, GNR succeeds" block, the ShapeFilter/NIST studio, and the dataset wall + lightbox.

## Fields
- `res` (`ok` / `no`) sets the success or failure mark; `budget` is the sample-budget text shown under the view, in the paper's units.
- `speed` is the playback-speed tag (e.g. `0.5×`, `3×`); omit it for real time.
- `main` picks the wall-tile view, `tile` an optional separate wall poster, and `feature` (2×2) / `wide` (2×1) the tile size.
- The pairs block renders only HOT3D entries whose `mpc` view is `no` and `gnr` view is `ok`.

## Replacing a clip
Overwrite the `.mp4` and `.jpg` (H.264 High, yuv420p, `+faststart`, no audio). Keep all views of one demonstration at the same length, frame rate and camera so sync and wipe stay aligned.

## Current clips
All robot clips are simulated in SuperDex Physics and rendered in the explainer film's studio look; the HOT3D clips include a rendered tabletop at the simulated support plane and fingertip trails (0.7 s tail; blue GNR, grey MPC). HOT3D robot rollouts open with a grasp-initialization step (the object is held fixed while the fingers close); every clip on the page starts near its end, after the grasp has formed.

| Demo | Set | Speed | Views (outcome, budget) |
|---|---|---|---|
| Toy dinosaur | HOT3D, GNR card | 0.5× | egocentric; GNR (S = 256) |
| Cheese can | HOT3D, GNR card | 0.5× | egocentric; GNR (S = 256) |
| Juice carton | HOT3D test, pair | 0.5× | egocentric; DIAL-MPC (fail, 3,000 samples); GNR (success, first of S = 256 to pass) |
| Cheese can | HOT3D test, pair | 0.5× | egocentric; DIAL-MPC (fail, 3,000 samples); GNR (success, first of S = 256 to pass) |
| ShapeFilter demo 184 | held-out test | 2× | IK (fail, open loop); GNR (success, 1 sample); GNR + MPC (success, 1 + 500 MPC samples) |
| NIST demo 208 | held-out test | 3× | IK (fail, open loop); GNR (fail, 1 sample, open loop); GNR + MPC (success); MPC (success) |

Dataset demonstrations (`dataset/NN_object_method/{egocentric,robot}`): more HOT3D GNR results (0.5×), each with an AV1 `.webm` (used where supported) and an H.264 `.mp4` fallback, listed with `ds: true` and ordered by object displacement. The dataset wall shows GNR results only: the MPC-vs-GNR pairs (`wall: false`) appear only in the Results section, and the precision tiles open only their GNR views (`lb`).

Pair rollouts are re-simulated open loop from stored controls. NIST sample budgets are compared in the page's efficiency chart (2,296 vs. 3,440 samples to reach 92.2%), so the NIST GNR + MPC and MPC views carry no per-clip count.
