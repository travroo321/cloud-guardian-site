---
name: proposal
description: Build a branded Cloud Guardian PDF proposal for a prospect from their website and user count. Use when asked to write, build, make or spin up a proposal, pitch, quote document or estimate for a named prospect or company — "proposal for acmecorp.com, 42 users", "make a pitch for this prospect", "quote document for [company]". Prices come from the live pricing page, never from memory.
---

# Cloud Guardian proposal builder

Turns a prospect's website and user count into a four-page branded PDF:
cover, program, security, pricing. A few minutes, no design work.

**The rates are read out of `/pricing/` every time.** Never type a price from
memory into a proposal. Gold moved from $65 to $110 in a single afternoon; a
proposal that disagrees with the website is worse than no proposal.

## What you need from the salesperson

Two things:

| Input | Example |
|---|---|
| Prospect's website | `rivertownhealth.com` |
| User count | 33 users |

Everything else has a default. If a plan is not named, recommend **Gold** —
most clients land there. If something you need is genuinely missing, ask for
that one piece rather than guessing.

Optional, only when it applies: a non-standard rate for this deal, a one-time
onboarding or migration figure, who is preparing it, or a specific plan.

## Steps

### 1. Read the live rate card

```bash
python3 .claude/skills/proposal/scripts/rates.py --json
```

This is the source of truth for plan names, prices, unit labels, feature lists
and exclusions. If it fails or returns zero plans, **stop and fix it** — do not
fall back on remembered prices.

Then read `reference/rate-card.md` for the rules the page cannot express:
hourly rates, the custom $100/$50/$25 support tiers, the $25 security floor,
what is always excluded, and the never-bend rules.

### 2. Learn what the prospect actually does

Fetch their website. Work out their industry, roughly how they operate, and
what obligations they carry. Use `reference/voice.md` to pick the framing —
HIPAA for healthcare, WISP for accounting, PCI for retail, and so on.

If the site is unreachable, say so and ask the salesperson what the prospect
does. Do not invent a vertical.

### 3. Write the copy in the company's voice

Read `reference/voice.md` first and follow it. Plain, direct, mechanism over
adjective, no marketing filler, US spelling, no implication of a long contract.

Every placeholder in `template/proposal.html` needs real content written for
this prospect. Do not leave a `{{PLACEHOLDER}}` in the output.

### 4. Fill the template and check the arithmetic

Copy `template/proposal.html`, replace every placeholder, and point
`{{LOGO_PATH}}` at the absolute path of `assets/cg-logo.png` in this repo.

Do the pricing math and state it: users × rate = monthly. Show one-time items
on their own lines. If an onboarding fee is credited off by a migration, show
the credit as its own negative line rather than quietly dropping the fee — the
prospect should see the concession.

Anything you were not given and cannot read off the pricing page is `TBD` or
"quoted after the assessment". Never a made-up number.

### 5. Render and look at it

```bash
bash .claude/skills/proposal/scripts/render.sh filled.html Client_Name_IT_Proposal.pdf
```

**Then look at what you produced.** Screenshot each page of the filled HTML —
one image per `section.page` — and read the images:

```bash
node -e '
const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1.4 });
  await p.goto("file://" + process.argv[1], { waitUntil: "networkidle" });
  const n = await p.locator("section.page").count();
  for (let i = 0; i < n; i++)
    await p.locator("section.page").nth(i).screenshot({ path: `pg${i+1}.png` });
  console.log(await p.evaluate(() => [...document.querySelectorAll("section.page")]
    .map((s,i) => ({ pg: i+1, over: s.scrollHeight > s.clientHeight + 2 })).filter(x => x.over)));
  await b.close();
})();' /abs/path/to/filled.html
```

The printed array lists any page whose content overflows its box; it must be
empty. Where `pdftoppm` happens to be installed, `pdftoppm -jpeg -r 80 out.pdf
pp` is a quicker path to the same images.

Confirm the PDF has exactly four pages:

```bash
python3 -c "import re,sys;d=open(sys.argv[1],'rb').read();print(len(re.findall(rb'/Type\s*/Page[^s]',d)))" out.pdf
```

Look for text overflowing, an empty section, a placeholder that survived, a
broken logo, or a fifth page. Fix and re-render. Do not hand over a proposal
you have not looked at.

### 6. Hand it over

Name the file `<Client_Name>_IT_Proposal.pdf`. Tell the salesperson the monthly
figure, the plan recommended, and anything left as TBD that they need to fill
before sending.

## Rules

- **Never invent pricing.** Not the plan rate, not an onboarding fee, not a
  project cost. `TBD` is always the correct answer instead.
- **Never promise a term.** No three-year lock, no minimum seats, no exit fee.
- **Never claim a certification, partnership, client or case study** that was
  not given to you.
- **The assessment is free and the report is theirs** whether they hire us or
  not. Say it.
- **State the exclusions** — third-party licensing, hardware, project work.
- **Above 50 users, the deal is quoted individually.** Do not extend a per-user
  rate past 50 seats; flag it for the team instead.

## Files

| Path | What it is |
|---|---|
| `scripts/rates.py` | Reads live pricing out of `/pricing/`. `--json` for parsing |
| `scripts/render.sh` | HTML → PDF via headless Chromium, no dependencies |
| `template/proposal.html` | The four-page branded template |
| `reference/rate-card.md` | Rates, tiers and rules the page cannot express |
| `reference/voice.md` | How Cloud Guardian writes, and industry framing |

## When this is the wrong skill

This builds a first-touch proposal from published rates. It does **not** do a
side-by-side comparison against what a prospect pays their current provider —
that needs real discovery data and is a different job. If someone asks for a
competitive takedown or a savings breakdown, say so rather than half-doing it.
