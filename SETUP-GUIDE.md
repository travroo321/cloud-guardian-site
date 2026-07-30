# Cloud Guardian. GitHub Pages Hosting Guide

Your complete site is in this folder. 21 pages, all in the new dark template, all links relative so they work on GitHub Pages with your domain. Follow these steps in order. Total time: about 30 minutes, most of it waiting on DNS.

## Step 1. Create the GitHub repository

1. Go to https://github.com and sign in (or create a free account).
2. Click the + in the top right, then "New repository".
3. Name it `cloud-guardian-site` (any name works). Set it to Public. Do NOT add a README. Click "Create repository".
4. On the new repo page click "uploading an existing file".
5. Drag the ENTIRE CONTENTS of this folder into the upload box: `index.html`, `404.html`, `CNAME`, and the `about`, `services`, `blog`, `contact`, `free-assesment` folders. Folder structure must be preserved, so drag the folders themselves, not just loose files.
6. Click "Commit changes".

Note: the old `iso.html` and `template-iso.html` in your Downloads folder are no longer needed. The ISO page now lives at `services/iso-42001/`. You can delete those two files or just not upload them.

## Step 2. Turn on GitHub Pages

1. In the repo, go to Settings, then Pages (left sidebar).
2. Under "Build and deployment", Source: "Deploy from a branch". Branch: `main`, folder `/ (root)`. Save.
3. Within a minute or two your site is live at `https://YOURUSERNAME.github.io/cloud-guardian-site/`. Check it renders.

## Step 3. Point cloud-guardian.com at GitHub

Your domain is currently managed through Durable. You need access to its DNS records. In Durable: Settings, then Domains. If Durable registered the domain for you, you can either edit DNS there (if they allow custom records) or transfer the domain to a registrar like Cloudflare or Namecheap (recommended long-term, cheaper and no lock-in). Important: do NOT cancel your Durable subscription until the domain is transferred out or DNS is repointed, or you risk losing control of the domain temporarily.

Set these DNS records wherever the domain's DNS is managed:

| Type  | Name | Value               |
|-------|------|---------------------|
| A     | @    | 185.199.108.153     |
| A     | @    | 185.199.109.153     |
| A     | @    | 185.199.110.153     |
| A     | @    | 185.199.111.153     |
| CNAME | www  | YOURUSERNAME.github.io |

Delete any old A/CNAME records pointing at Durable.

## Step 4. Connect the domain in GitHub

1. Repo Settings, then Pages, then Custom domain: enter `cloud-guardian.com`, save. (The `CNAME` file in this folder already contains this, so GitHub may detect it automatically.)
2. Wait for the DNS check to pass (minutes to a few hours depending on propagation).
3. Tick "Enforce HTTPS" once it becomes available.
4. Your site is now live at https://cloud-guardian.com with free SSL. All 13 of your old URLs resolve to the new pages, so existing Google listings keep working.

## Step 5. Activate the contact forms (Formspree, 5 minutes)

The forms on the Contact and Free Assessment pages are wired to Formspree but need your form ID:

1. Go to https://formspree.io, create a free account with travroo321@gmail.com.
2. Click "New form", name it "Cloud Guardian Website". Copy the form endpoint, it looks like `https://formspree.io/f/abcdwxyz`.
3. In `contact/index.html` and `free-assesment/index.html`, replace `YOUR_FORM_ID` with your ID (it appears once in each file). Or paste the ID to me and I'll do it and hand the files back.
4. Re-upload those two files to GitHub (drag onto the repo page, commit). Submissions now arrive in your Gmail. Free tier: 50 submissions/month.

## Step 6. Cancel Durable

Only after the domain resolves to the new site and you've confirmed the forms work: cancel the Durable site subscription. If the domain is registered through Durable, transfer it out FIRST (Cloudflare Registrar is at-cost, ~$10/yr for .com).

## Updating the site later

Edit any HTML file (or ask me), then drag the changed file onto the repo page on GitHub and commit. Pages redeploys automatically in about a minute. For new blog posts, copy an existing folder under `blog/`, edit the text, and add a card to `blog/index.html`, or just ask me and I'll generate it.
