# ELEV1STITCH: from GitHub to a live site on Vercel

## What's in this repository

```
public/            The website (the only folder Vercel serves to visitors)
  index.html       Page markup and styles
  app.js           Site logic, prices, reviews, contact form (edit CONFIG at the top)
  boot.js          Tiny start-up script (intro screen)
  hero3d.js        Animated 3D hero
  bg3d.js          Background
  ring.js          3D work ring
  vendor/          Three.js, GSAP, Lenis (self-hosted)
  assets/          Images, work photos, fonts
  404.html  robots.txt  .well-known/security.txt
api/contact.js     Email function (runs on Vercel, never served as a file)
vercel.json        Security headers and settings
package.json       nodemailer 10.3.1 (pinned) + package-lock.json
SECURITY.md        Security review and checklist
.env.example       The settings you add in Vercel (no real secrets)
```

## 1. Push to GitHub

```bash
cd elev1stitch-site
git init
git add .
git commit -m "ELEV1STITCH website"
git branch -M main
git remote add origin https://github.com/<your-username>/elev1stitch-site.git
git push -u origin main
```

Before pushing, run `git status` and make sure no `.env` file or password appears in the list. A private repository is recommended.

## 2. Import into Vercel

1. vercel.com: **Add New → Project**, then import the repository.
2. Framework preset: **Other**. Vercel reads `vercel.json`, which serves `public/` and runs `api/contact.js`.
3. Click **Deploy**.

## 3. Connect your mailbox (makes the form send email)

**Project → Settings → Environment Variables**, for Production:

| Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `harshal@elev1stitch.com` |
| `SMTP_PASS` | your mailbox password |
| `MAIL_TO` | the inbox that receives enquiries (e.g. `harshal@elev1stitch.com`) |
| `ALLOWED_ORIGINS` | `https://elev1stitch.com,https://www.elev1stitch.com` |

Optional: `TURNSTILE_SECRET` (see SECURITY.md) and `AUTO_REPLY=0` to stop the confirmation email.

Then **Deployments → latest → Redeploy**.

## 4. Use your domain

1. Vercel: **Settings → Domains**, then add `elev1stitch.com` and `www.elev1stitch.com`.
2. Hostinger hPanel: **Domains → DNS**. Add the A / CNAME records exactly as Vercel shows them.
3. **Do not touch the MX, SPF (TXT) or DKIM records.** Those keep your email working.

The form only accepts requests from the domains in `ALLOWED_ORIGINS` plus the Vercel deployment URL, so test on the real domain.

## 5. Test

1. Open the live site → Contact → fill the form (take a few seconds; very fast submits are treated as bots) → attach a small image → Send.
2. The enquiry arrives in your inbox, and Reply goes straight to the client.
3. Nothing arrived? Check **Vercel → Project → Logs** for `contact:` messages: usually a wrong password or variables not redeployed.

## 6. Phone notifications

Add the mailbox to Gmail or iPhone Mail as IMAP: incoming `imap.hostinger.com` port 993 SSL, outgoing `smtp.hostinger.com` port 465 SSL, username = full email address.

## Editing later

At the top of `public/app.js`, `CONFIG` holds contact details, reviews (real client words only), prices (USD) and the optional Turnstile site key. Work photos are in `public/assets/real/`, and their titles are in the `WORK` list in the same file.

## Plan note

Vercel's free Hobby plan is meant for personal, non-commercial projects. Check Vercel's current terms for a business site before relying on it long term.
