# Affiliation logo sources

Verified October 8, 2026. These marks identify the authors' affiliations.
All six images have transparent backgrounds and their vector artwork is unchanged.
On the page they are shown in white over the dark opening screen, via a CSS filter
(`brightness(0) invert(1)`, opacity .9); see "Display on the page" below.

| Asset | Official source | Treatment |
| --- | --- | --- |
| `meta.svg` | [Meta corporate SVG](https://static.xx.fbcdn.net/rsrc.php/y9/r/tL_v571NdZ0.svg), from [Meta](https://www.meta.com/about/) | Downloaded unchanged: blue gradient symbol and dark wordmark. |
| `uc-davis.svg` | `ucd-logo` SVG symbol from [UC Davis](https://www.ucdavis.edu/); [wordmark guide](https://marketingtoolbox.ucdavis.edu/brand-guide/logos/uc-davis-wordmark) and [official color specifications](https://communicationsguide.ucdavis.edu/sites/g/files/dgvnsk6246/files/media/documents/UC-Davis-Colors-Palette-Accessibility_1023-2.pdf) | Original vector paths and viewBox; `currentColor` resolved to the specified Aggie Blue `#022851` for a self-contained SVG. |
| `unc.svg` | [University Signature package](https://identity.unc.edu/wp-content/uploads/sites/885/2025/11/University_Signature.zip), linked by the [UNC asset record](https://identity.unc.edu/university_signature/); [signature guide](https://identity.unc.edu/brand/university-logo/) | Unchanged `University Signature/Horizontal/Web/SVG/University_Signature_CarolinaBlue_Navy_rgb_h.svg`: Carolina Blue symbol and navy lettering. |
| `berkeley.svg` | [UC Berkeley homepage SVG](https://www.berkeley.edu/wp-content/themes/berkeleygateway/img/logo-berkeley.svg?v=3); [logo guide](https://brand.berkeley.edu/visual-identity/logos/) | Native `#002676` artwork, unchanged paths; added only `viewBox="0 0 225 42"` to match the original dimensions for responsive sizing. |
| `mit.svg` | Header SVG from [MIT](https://www.mit.edu/); [official color specifications](https://brand.mit.edu/color) and [logo guide](https://brand.mit.edu/logos-marks/mit-logo) | Original current three-line lock-up paths; external color class resolved to the specified MIT Red `#750014`. No brightness amplification. |
| `cmu.svg` | Footer SVG originally retrieved from [Carnegie Mellon](https://www.cmu.edu/) on October 5; checked against the [official wordmark guide](https://brand.cmu.edu/visual-identity/carnegie-mellon-trademarks/wordmarks) and [download portal](https://cmu.widencollective.com/portals/vt1twpbe/UCM-WordmarkStacked) | Retains the original stacked vector wordmark in Carnegie Red `#C41230`. No brightness amplification. |

The custom `*-dark.svg` variants have been removed. Original logo shapes and
aspect ratios are preserved. “Reality Labs Research” remains a separate HTML
caption below the Meta mark.

## Display on the page (2026-10-28)

The SVGs are inlined into `index.html` by `scripts/inline_logos.py`; the artwork paths are unchanged.
- Some hosts serve `.svg` without `image/svg+xml`, and `<img>` then fails, which is why they are inlined.
- On the dark opening screen they are shown in white with a CSS filter.
- Every logo is shown whole, including the full UNC University Signature (horizontal lockup, unchanged file and viewBox). It is set taller than the single-line marks (48 px on desktop) so its three-line wordmark stays legible. No home-made text lockups.
