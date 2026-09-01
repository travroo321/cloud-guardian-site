#!/usr/bin/env python3
"""Generate a private, per-prospect interactive estimate page.

    python3 build_estimate.py deal.json

`deal.json` describes the offer. The page is written to
`quote/<slug>/index.html`, noindex, absent from the sitemap, and linked from
nowhere — reachable only from the URL you send the prospect.

Nav, footer and the shared stylesheet are lifted from the live pricing page at
build time, so a generated estimate always matches the current site rather than
a snapshot of it.

Minimal deal.json:

    {
      "client": "Acme Corp",
      "slug": "acme-corp",
      "intro": "These are the rates we discussed...",
      "support": {
        "title": "Unlimited IT support",
        "blurb": "Flat monthly number...",
        "tiers": [
          {"id": "ft",  "label": "Full-time users",  "short": "full-time",
           "rate": 100, "default": 3, "hint": "The people who lean on IT."},
          {"id": "pt",  "label": "Part-time users",  "short": "part-time",
           "rate": 50,  "default": 5, "hint": "Full security, support if needed."},
          {"id": "sec", "label": "Security only",    "short": "security only",
           "rate": 25,  "default": 0, "hint": "Security stack, no support."}
        ],
        "note": "Support scales down, security does not...",
        "escalation": "Bill that visit hourly, or move them up..."
      },
      "hourly": {"onsite": 125, "onsiteMin": 1, "remote": 125, "remoteStep": 0.5},
      "packages": {
        "title": "Gold or Platinum, our published plans",
        "blurb": "One flat number, every user gets everything...",
        "seatsDefault": 8, "defaultIndex": 0,
        "options": [
          {"name": "Gold Managed IT", "short": "Gold", "rate": 110,
           "note": "Full suite, unlimited help desk."},
          {"name": "Platinum Managed IT + SOC", "short": "Platinum", "rate": 130,
           "note": "Gold plus 24/7 security operations."}
        ]
      },
      "projects": [
        {"id": "mig", "label": "Migrate Microsoft 365 to Google Workspace",
         "short": "migration",
         "price": 1000, "scope": "up to 10 mailboxes", "blurb": "Mail, contacts..."}
      ],
      "onboarding": {"fee": 200, "creditedBy": "mig",
                     "creditNote": "Standing the environment up and moving mail overlap."},
      "licensing": {
        "title": "Google Workspace licensing", "payee": "paid to Google, not to us",
        "payeeShort": "Google licensing", "seatsDefault": 8, "defaultIndex": 2,
        "blurb": "Our pricing excludes email licensing...",
        "plans": [
          {"name": "Business Starter",  "price": 7,  "flex": 8.40,  "note": "30 GB pooled per user."},
          {"name": "Business Standard", "price": 14, "flex": 16.80, "note": "2 TB per user."},
          {"name": "Business Plus",     "price": 22, "flex": 26.40, "note": "5 TB per user, Vault."}
        ]
      },
      "compare": {"currentMonthly": 0, "label": "current provider",
                  "includeLicensing": false},
      "chrome": "minimal"
    }

"chrome" defaults to "minimal": logo and phone number only, and a footer with
just the address and contact details. A prospect on a quote page should not be
one click from the blog. Set it to "full" to keep the whole site nav and footer.

Omit any block to leave that section off the page.
"""

import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(SKILL, "..", "..", ".."))
PRICING = os.path.join(ROOT, "pricing", "index.html")
TEMPLATE = os.path.join(SKILL, "template", "estimate.html")

MINIMAL_HEADER = """
<header class="cg-head">
  <img src="/assets/cg-logo-nav.png?v=20260831d" alt="Cloud Guardian" />
  <a class="cg-head-tel" href="tel:+17327435472">(732) 743-5472</a>
</header>
"""

MINIMAL_FOOTER = """
<footer class="cg-foot">
  <div>
    <strong>Cloud Guardian LLC</strong><br />
    643 Georges Rd, North Brunswick, NJ 08902
  </div>
  <div class="cg-foot-r">
    <a href="tel:+17327435472">(732) 743-5472</a><br />
    <a href="mailto:sales@cloud-guardian.com">sales@cloud-guardian.com</a>
  </div>
</footer>
"""

STYLES = """
  .cg-head{display:flex;align-items:center;justify-content:space-between;gap:20px;
    padding:18px 6vw;border-bottom:1px solid rgba(255,255,255,.10);background:var(--black)}
  .cg-head img{height:64px;width:auto;display:block}
  .cg-head-tel{font-family:'IBM Plex Mono',monospace;font-size:1rem;color:var(--cyan);
    text-decoration:none;border:1px solid rgba(0,212,255,.45);border-radius:8px;padding:9px 16px;white-space:nowrap}
  .cg-head-tel:hover{background:rgba(0,212,255,.10)}
  .cg-foot{display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;
    padding:26px 6vw;border-top:1px solid rgba(255,255,255,.10);
    color:#7a9bbf;font-size:.85rem;line-height:1.7;background:var(--black)}
  .cg-foot strong{color:#c3ced9}
  .cg-foot a{color:var(--cyan);text-decoration:none}
  .cg-foot-r{text-align:right}
  @media (max-width:560px){
    .cg-head{padding:14px 5vw}
    .cg-head img{height:48px}
    .cg-head-tel{font-size:.85rem;padding:7px 11px}
    .cg-foot-r{text-align:left}
  }
  .cg-opt{display:block;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:16px 18px;margin-bottom:12px;cursor:pointer;transition:border-color .18s,background .18s}
  .cg-opt:hover{border-color:rgba(0,212,255,.45)}
  .cg-opt.on{border-color:var(--cyan);background:rgba(0,212,255,.06)}
  .cg-opt-head{display:flex;align-items:flex-start;gap:12px}
  .cg-opt-head input{margin-top:5px;flex:0 0 auto;accent-color:var(--cyan);width:17px;height:17px}
  .cg-opt-t{font-weight:700;font-size:1.02rem;display:block}
  .cg-opt-p{color:var(--cyan);font-family:'IBM Plex Mono',monospace;font-size:.9rem;display:block;margin-top:3px}
  .cg-opt-d{color:#93a3b8;font-size:.88rem;display:block;margin-top:6px;line-height:1.5}
  .cg-sub{margin:14px 0 2px;padding:14px 0 2px 29px;border-top:1px dashed rgba(255,255,255,.14)}
  .cg-sub[hidden]{display:none}
  .cg-note{color:#93a3b8;font-size:.85rem;line-height:1.6;margin:10px 0 0}
  .cg-cov{margin:16px 0 0;padding:11px 14px;border-radius:9px;font-size:.88rem;line-height:1.5;border:1px solid rgba(255,255,255,.12);color:#93a3b8}
  .cg-cov:empty{display:none}
  .cg-cov b{color:#c3ced9}
  .cg-cov.ok{border-color:rgba(0,212,255,.4);background:rgba(0,212,255,.07);color:#a9c4d4}
  .cg-cov.ok b{color:var(--cyan)}
  .cg-cov.warn{border-color:rgba(232,163,61,.45);background:rgba(232,163,61,.09);color:#e8d5b5}
  .cg-cov.warn b{color:#e8a33d}
  .cg-excl{border:1px solid rgba(232,163,61,.35);background:rgba(232,163,61,.07);border-radius:12px;padding:14px 16px;margin:18px 0 0;color:#e8d5b5;font-size:.9rem;line-height:1.6}
  .cg-excl b{color:#e8a33d}
  .cg-tot{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.1)}
  .cg-tot:last-of-type{border-bottom:0}
  .cg-tot span:first-child{color:#c3ced9;font-size:.93rem}
  .cg-tot b{font-family:'IBM Plex Mono',monospace;font-size:1.15rem;color:#fff;white-space:nowrap}
  .cg-tot.big b{font-size:1.5rem;color:var(--cyan)}
  .cg-tot.lic b{color:#e8a33d}
  .cg-tot.save b{color:#c3ced9}
  .cg-tot.save.good b{color:#00e676}
  .cg-lic-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:12px 0 4px}
  .cg-lic{border:1px solid rgba(255,255,255,.13);border-radius:10px;padding:12px;text-align:left;background:none;color:inherit;font:inherit;cursor:pointer}
  .cg-lic:hover{border-color:rgba(0,212,255,.45)}
  .cg-lic.on{border-color:var(--cyan);background:rgba(0,212,255,.07)}
  .cg-lic b{display:block;font-size:.95rem}
  .cg-lic i{display:block;font-style:normal;color:var(--cyan);font-family:'IBM Plex Mono',monospace;font-size:1.05rem;margin:5px 0 3px}
  .cg-lic small{display:block;color:#8fa0b4;font-size:.78rem;line-height:1.45}
  .calc-flag.warn{border-color:rgba(232,163,61,.4)!important;background:rgba(232,163,61,.08)!important;color:#e8d5b5!important}
  @media print{
    nav,.mobile-menu,footer,.fab-wrap,.cgc,.crumbs,.cg-noprint{display:none!important}
    body{background:#fff!important;color:#111!important}
    .sq-out,.sq-form,.cg-opt,.cg-excl{background:#fff!important;color:#111!important;border-color:#bbb!important}
    .cg-opt-d,.cg-note,.sq-note{color:#444!important}
  }
"""


def slab(src, start_re, end_re):
    """Pull a block out of the live pricing page so generated pages track the site."""
    s = src.index(re.search(start_re, src).group(0))
    e = src.index(re.search(end_re, src[s:]).group(0), s) + len(re.search(end_re, src[s:]).group(0))
    return src[s:e]


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as fh:
        deal = json.load(fh)

    for req in ("client", "slug"):
        if not deal.get(req):
            sys.exit('deal.json needs a "%s".' % req)
    slug = deal["slug"]
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        sys.exit("slug must be lowercase letters, digits and hyphens: %r" % slug)

    if not os.path.exists(PRICING):
        sys.exit("Run this from inside the cloud-guardian-site repo (%s missing)." % PRICING)
    live = io.open(PRICING, encoding="utf-8").read()

    css = re.search(r'<link rel="stylesheet" href="[^"]*cg\.css[^"]*" />', live).group(0)
    fonts = re.search(r'<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet" />', live).group(0)
    js = re.search(r'<script src="[^"]*cg\.js[^"]*" defer></script>', live).group(0)

    # A private quote is not a place to advertise the rest of the site. The
    # default strips the site nav and the footer link columns so the only ways
    # off the page are calling us or sending the estimate back. Set
    # "chrome": "full" in the deal to keep the whole site shell instead.
    if deal.get("chrome") == "full":
        nav = slab(live, r"<nav>", r"</div>\s*(?=\n<section)")
        footer = slab(live, r"<footer>", r"</footer>")
    else:
        nav = MINIMAL_HEADER
        footer = MINIMAL_FOOTER

    body = io.open(TEMPLATE, encoding="utf-8").read()
    body = body.replace("{{DEAL_JSON}}", json.dumps(deal, indent=2))
    body = body.replace("{{CLIENT_NAME}}", deal["client"])
    body = body.replace("{{INTRO}}", deal.get("intro",
        "These are the rates we discussed, laid out so you can pick what you actually want and "
        "see the number move. Nothing here is a commitment."))

    page = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Estimate Builder for %(client)s | Cloud Guardian</title>
<meta name="description" content="A private estimate builder prepared for %(client)s." />
<meta name="robots" content="noindex, nofollow" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
%(fonts)s
%(css)s
<style>%(styles)s</style>
</head>
<body>
%(nav)s
%(body)s
%(footer)s
%(js)s
</body>
</html>
""" % dict(client=deal["client"], fonts=fonts, css=css, styles=STYLES,
           nav=nav, body=body, footer=footer, js=js)

    outdir = os.path.join(ROOT, "quote", slug)
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, "index.html")
    io.open(out, "w", encoding="utf-8").write(page)

    if slug in io.open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read():
        print("WARNING: %s appears in sitemap.xml. Private estimates must stay out of it." % slug)

    print("Wrote %s" % os.path.relpath(out, ROOT))
    print("URL:   https://cloud-guardian.com/quote/%s/" % slug)
    print("Private: noindex, not in the sitemap, nothing links to it.")


if __name__ == "__main__":
    main()
