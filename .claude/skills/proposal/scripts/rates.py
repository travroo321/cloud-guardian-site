#!/usr/bin/env python3
"""Read Cloud Guardian's published pricing straight out of the website.

The point of this script is that the proposal skill never carries prices in
its own head. /pricing/ is the published source of truth, so a rate change
there reaches every future proposal with no second edit and no chance of a
proposal quoting a price the website contradicts.

    python3 rates.py            # human-readable
    python3 rates.py --json     # machine-readable

Run it from anywhere; it locates the repo root from its own path.
"""

import argparse
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
PRICING = os.path.join(ROOT, "pricing", "index.html")


def _text(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def read_pricing_page():
    if not os.path.exists(PRICING):
        sys.exit(
            "Cannot find %s.\n"
            "Run this from inside the cloud-guardian-site repo." % PRICING
        )
    with open(PRICING, encoding="utf-8") as fh:
        return fh.read()


def parse_plans(s):
    """Each plan card: metal label, name, tagline, price, unit, one-liner, features."""
    plans = []
    card_re = re.compile(
        r'<span class="pr-metal[^"]*">([^<]*)</span>\s*'
        r"<h3>([^<]*)</h3>\s*"
        r'<p class="pr-tag">([^<]*)</p>\s*'
        r'<div class="pr-price"><span class="pr-amount">([^<]*)</span>'
        r'<span class="pr-unit">([^<]*)</span></div>\s*'
        r'<p class="pr-line">(.*?)</p>\s*'
        r'<ul class="pr-feats">(.*?)</ul>',
        re.S,
    )
    for m in card_re.finditer(s):
        feats, excludes, upgrades = [], [], []
        for li in re.finditer(r'<li(?: class="(\w+)")?>(.*?)</li>', m.group(7), re.S):
            kind, body = li.group(1), _text(li.group(2))
            if kind == "no":
                excludes.append(body)
            elif kind == "up":
                upgrades.append(body)
            else:
                feats.append(body)
        plans.append(
            {
                "tier": _text(m.group(1)),
                "name": _text(m.group(2)),
                "tagline": _text(m.group(3)),
                "price": _text(m.group(4)),
                "unit": _text(m.group(5)),
                "summary": _text(m.group(6)),
                "includes": feats,
                "excludes": excludes,
                "upgrades": upgrades,
            }
        )
    return plans


def parse_addons(s):
    out = []
    for m in re.finditer(
        r"<h3>([^<]*)</h3>\s*<p class=\"pr-addon-price\">([^<]*)</p>\s*<p>(.*?)</p>", s, re.S
    ):
        out.append(
            {"name": _text(m.group(1)), "price": _text(m.group(2)), "note": _text(m.group(3))}
        )
    return out


def parse_footnote(s):
    m = re.search(r'<p class="pr-note reveal">(.*?)</p>', s, re.S)
    return _text(m.group(1)) if m else ""


def collect():
    s = read_pricing_page()
    plans = parse_plans(s)
    if not plans:
        sys.exit(
            "Parsed 0 plans out of pricing/index.html.\n"
            "The page markup changed. Fix this script before writing any proposal:\n"
            "quoting a price from memory is how a proposal ends up contradicting the website."
        )
    return {
        "source": "pricing/index.html",
        "plans": plans,
        "addons": parse_addons(s),
        "footnote": parse_footnote(s),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--json", action="store_true", help="emit JSON")
    args = ap.parse_args()

    data = collect()
    if args.json:
        print(json.dumps(data, indent=2))
        return

    print("Cloud Guardian published pricing (from %s)\n" % data["source"])
    for p in data["plans"]:
        print("  %-22s %-8s %-24s %s" % (p["name"], p["price"], p["unit"], p["tagline"]))
    print("\n  Add-ons:")
    for a in data["addons"]:
        print("    %-32s %s" % (a["name"], a["price"]))
    print("\n  %s" % data["footnote"])


if __name__ == "__main__":
    main()
