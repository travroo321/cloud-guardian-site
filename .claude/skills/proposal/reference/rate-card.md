# Rate card rules

Prices themselves come from `scripts/rates.py`, which reads `/pricing/`. This
file holds the things the page markup cannot tell you: what is negotiable, what
is fixed, and what must never appear in a proposal.

## The published plans

| Plan | What it is | Who it suits |
|---|---|---|
| Small Business Plan | Security on the email they already have. Nothing migrates. | Under 10 users, tight budget, mostly just needs email protected |
| Silver (Pay As You Go) | Hosted and run by us, billed hourly, no monthly fee | Few problems, does not want a retainer |
| Gold (Managed IT) | Flat monthly, we run everything | Most clients. The default recommendation |
| Platinum (Managed IT + SOC) | Gold plus 24/7 security operations | Regulated, high-exposure, or carrying cyber insurance requirements |
| Business Technology | vCIO and digital presence, quoted per engagement | Wants the technology run, not just kept alive |

Read the exact prices, feature lists and exclusions with `rates.py`. Do not
retype them into a proposal from memory — the Gold price moved from $65 to $110
in one afternoon, and a proposal quoting the old number is worse than no
proposal.

## Hourly and project rates

These are not on the pricing page's plan cards, so they are recorded here.
Confirm any of them with the team before using them in a proposal for a
prospect whose deal was not built on them.

| Item | Rate | Notes |
|---|---|---|
| Onsite support | $125/hr | One-hour minimum per visit, then hourly |
| Remote break/fix | $125/hr | Billed in 30-minute increments ($62.50) |
| Silver hourly | $90/hr | The published pay-as-you-go rate, 15-minute increments |
| Incident response outside a managed plan | $90/hr | From the pricing page footnote |
| Email migration to Google Workspace | $1,000 flat | Covers up to 10 mailboxes; past that, requote |
| Onboarding | $200 one time | Any ongoing plan except pay as you go. Credited off in full when we are also doing the email migration |

## Custom tiered support

Some deals are priced per person by how much support they actually consume
rather than by a published plan. The tiers used for these:

| Tier | Price | What it covers |
|---|---|---|
| Full-time user | $100/user/mo | Full unlimited support |
| Part-time user | $50/user/mo | Full security, support if they ever need it |
| Security only | $25/user/mo | The security stack, no support included |

**The security floor is $25 and it is not optional.** Anyone with an account
that can reach company mail or company data carries the same protection. You
can scale a person's *support* down; you cannot scale their *security* down.
Securing four of eight machines is not securing eight.

If a $25 user needs help: bill that visit hourly, or move them to part-time at
$50 starting the first of the following month.

## What is always excluded

State these plainly in every proposal. They are the lines that cause arguments
later if left implied.

- Third-party licensing — Microsoft 365, Google Workspace — unless bought
  through us. It is billed by the vendor.
- Hardware.
- Project work: cabling, wireless surveys, and anything outside the scope
  quoted.
- On Silver, after-hours and emergency work is a separate agreed rate.

## Rules that do not bend

1. **Never invent a price.** If a number was not given to you and is not
   published, write `TBD` or "quoted after the assessment". A made-up number
   that reaches a prospect is a real problem.
2. **Volume above 50 users is quoted individually.** Do not extend a per-user
   rate past 50 seats without asking.
3. **No three-year lock, no exit fee, no minimum seat count.** This is a
   deliberate contrast with legacy MSPs. Never write a proposal that implies a
   multi-year commitment.
4. **The assessment is free and the findings are the prospect's** whether they
   hire us or not. Say so.
5. **Prices are published on the website.** A prospect can check the proposal
   against `/pricing/`, so the two must agree.
