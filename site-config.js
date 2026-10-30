// Site switches and media. This is the only file to edit for routine updates.
//
// fullSite      true shows the complete research page; false shows only the opening screen.
// media.film    the explainer film (the Explainer video section and the method-step loops).
//               To swap in a new cut: encode it with scripts/encode_film.sh, then edit the entry below
//               (stem, poster, duration, sizes, chapters). Files live in assets/media/.
//               stem is the path prefix: the page loads <stem>-1080.webm (AV1), <stem>-1080.mp4 and
//               <stem>-720.mp4 (H.264). A full https:// URL prefix also works (e.g. a release asset host).
// site.url      public URL (canonical / og:url / og:image base). Set it to the final GitHub Pages URL before release.
//               After editing, run: python3 scripts/set_site_url.py  (rewrites the static tags in index.html for crawlers).
window.GNR_SITE = Object.freeze({
  fullSite: true,
  site: { url: 'https://yy-gx.github.io/GNR/' },
  media: {
    film: {
      label: 'Explainer video',
      version: 'v3.9f',
      stem: 'assets/media/gnr-explainer-v39f',
      poster: 'assets/media/gnr-explainer-v39f-poster',   // + .webp and .jpg
      duration: 227.9,
      sizes: { '1080': '36 MB', '720': '20 MB' },
      youtube: '',   // optional later swap: a YouTube video id renders a privacy-friendly facade instead (no request until clicked)
      // Method explainer loops cut from this film by scripts/make_stills_and_steps.sh, which reads this list:
      // start/end = seconds in the film (start is also where "Watch this part with sound" seeks), name = file tag.
      // For a new cut: re-time start/end, bump the version tag in the clip names, re-run the script.
      steps: [
        { name: '1-engine',    t: 82.6,  end: 101.4, clip: 'assets/media/method-1-engine-v39f' },
        { name: '2-reference', t: 101.9, end: 110.7, clip: 'assets/media/method-2-reference-v39f' },
        { name: '3-flow',      t: 110.9, end: 121.5, clip: 'assets/media/method-3-flow-v39f' },
        { name: '4-sample',    t: 123.5, end: 131.1, clip: 'assets/media/method-4-sample-v39f' },
        { name: '5-warmstart', t: 134.8, end: 139.2, clip: 'assets/media/method-5-warmstart-v39f' }
      ],
      chapters: [
        [0, 'Opening'],
        [22.8, 'Why is this hard?'],
        [65.5, 'Why re-solve every demo?'],
        [79.3, 'How does GNR work?'],
        [139.3, 'Does it work?'],
        [212.1, 'The takeaway']
      ]
    }
  }
});
document.documentElement.dataset.siteMode = window.GNR_SITE.fullSite ? 'full' : 'preview';
