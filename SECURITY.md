# Security review: elev1stitch.com

Reviewed 7 November 2026. Scope: website front end, `/api/contact` email function, Vercel configuration, dependencies and the GitHub repository.

## Findings and fixes

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | High | `nodemailer` 6.x had 16 published vulnerabilities, including SMTP command injection, header injection and mail sent to an unintended domain | Upgraded to `nodemailer` 10.3.1 (0 known vulnerabilities, `npm audit` clean). The version is pinned and `package-lock.json` is committed |
| 2 | High | Any website or script could POST to `/api/contact` and use your mailbox as a relay | The function now accepts only same-site browser requests: Origin must be your domain (or this Vercel deployment) and Content-Type must be JSON (forces a CORS preflight that other sites cannot pass) |
| 3 | High | The auto-reply repeated the visitor's message and name, so attackers could send their own text to any inbox from your domain (spam reflection, hurts your email reputation) | The confirmation is now a fixed text with no user content, limited to 1 per address per hour, and can be turned off with `AUTO_REPLY=0` |
| 4 | Medium | The file type was trusted from the browser, so a renamed `.exe` could be attached | Files are identified by their first bytes (PNG, JPG, GIF, WEBP, PDF, AI, EPS, SVG only). The name and extension are rebuilt server-side and the base64 is validated |
| 5 | Medium | No protection against bots beyond a honeypot | Added a timing trap (forms sent in under 2.5 s are silently dropped), the honeypot, a per-IP limit, and optional Cloudflare Turnstile (free human check, see below) |
| 6 | Medium | Header and recipient tricks via name and email (`\r\nBcc:`, `a@b.com, victim@x.com`, `"x"<victim@x.com>`) | Strict email pattern, control and bidi characters stripped, structured address objects passed to the mailer, dropdown values must match the allowed list |
| 7 | Medium | No HTTP security headers | `vercel.json` now sends a strict Content-Security-Policy, HSTS (2 years, preload-ready), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP and CORP |
| 8 | Medium | Inline `<script>` blocks and an inline `onsubmit` handler meant a strict CSP was impossible | All JavaScript moved to files (`boot.js`, `app.js`, modules). CSP `script-src 'self'` blocks any injected script |
| 9 | Medium (GDPR) | Fonts loaded from Google Fonts send every visitor's IP address to Google; German courts have fined sites for this | Fonts are now self-hosted in `public/assets/fonts`. The site makes no third-party requests at all (unless you switch on Turnstile) |
| 10 | Low (GDPR) | A contact form collecting personal data needs a privacy notice for EU clients | Added a Privacy section (section 13 of the terms) with a footer link |
| 11 | Low | Project files (`package.json`, docs, `.env.example`) would be publicly downloadable from the site root | The website is served only from `public/`. Docs, config and the function source are never served as files |
| 12 | Low | Your email address was plain text in the HTML, easy for spam bots to harvest | The address is assembled in the browser |
| 13 | Low | Review text was inserted as raw HTML | All review fields are escaped. External links use `rel="noopener noreferrer"` |
| 14 | Low | SMTP connection had no timeouts or TLS floor | TLS 1.2 minimum, certificate validation on, 8–12 s timeouts, file and URL access disabled in the mailer |
| 15 | Info | No vulnerability contact | `/.well-known/security.txt` added. `/api/` is excluded from search engines |

Front-end libraries (Three.js 0.160, GSAP 3.12.5, Lenis 1.1.13) are self-hosted from `public/vendor` and have no known vulnerabilities. Nothing loads from a CDN, so a compromised CDN cannot inject code.

## Verified

- 17 automated attack tests against the function all pass: foreign Origin, missing Origin, `text/plain` CSRF-style post, wrong method, oversized body, honeypot, too-fast submit, header injection, multiple recipients, quoted address trick, `.exe` renamed to `.png`, invalid base64, array body, HTML in the message, unknown dropdown values, and the rate limit.
- The site was loaded with the production security headers on desktop and phone: zero CSP violations and zero script errors.

## What you must do

1. **Never commit secrets.** The mailbox password goes only into Vercel's Environment Variables. `.env` is in `.gitignore`.
2. **Turn on two-factor authentication** for GitHub, Vercel and Hostinger. An account takeover is far more likely than a code exploit.
3. **Use a strong, unique mailbox password.** If it is ever exposed, change it in Hostinger and update `SMTP_PASS` in Vercel.
4. Recommended: **switch on Cloudflare Turnstile** (free) if spam ever appears:
   - At dash.cloudflare.com, go to **Turnstile → Add site** and enter `elev1stitch.com`. Choose *Managed*.
   - Paste the **site key** into `turnstileSiteKey` near the top of `public/app.js`.
   - Add the **secret key** in Vercel as `TURNSTILE_SECRET` and redeploy.
5. After going live, submit your domain at hstspreload.org (optional; makes HTTPS permanent in browsers) and run a check at securityheaders.com. It should score A or A+.

## Known limits (accepted)

- The per-IP limit lives in memory, so it resets when Vercel starts a new instance. Turnstile is the durable protection. A shared limit would need a database such as Upstash Redis (free tier).
- `style-src 'unsafe-inline'` remains in the CSP because the page uses inline style attributes. Injected styles cannot run code, and scripts stay locked to your own files.
- SVG artwork is accepted because designers send it. It arrives only as an email attachment; open unknown SVGs in a design app, not a browser.

## Reporting a problem

Email harshal@elev1stitch.com.
