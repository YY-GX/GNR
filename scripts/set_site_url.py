"""Rewrite the static canonical / og:url / og:image / twitter:image tags in index.html from site.url in site-config.js.
Crawlers (X, LinkedIn, Facebook) do not run JavaScript, so these tags must be correct in the HTML itself.
Usage: python3 scripts/set_site_url.py
"""
import re, pathlib, subprocess, json
root = pathlib.Path(__file__).resolve().parents[1]
js = ("const fs=require('fs'),vm=require('vm');const c={window:{},document:{documentElement:{dataset:{}}}};"
      "vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),c);console.log(JSON.stringify(c.window.GNR_SITE.site))")
site = json.loads(subprocess.check_output(["node", "-e", js, str(root / "site-config.js")]))
url = site["url"].rstrip("/") + "/"
p = root / "index.html"; s = p.read_text()
s = re.sub(r'(<link rel="canonical" href=")[^"]*(")', rf'\g<1>{url}\2', s)
s = re.sub(r'(<meta property="og:url" content=")[^"]*(")', rf'\g<1>{url}\2', s)
s = re.sub(r'(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*?(assets/social/og-card\.jpg")', rf'\g<1>{url}\2', s)
p.write_text(s); print("site url ->", url)
