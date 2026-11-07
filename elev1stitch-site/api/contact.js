// Vercel serverless function: POST /api/contact
// Sends website enquiries to your inbox through your own mailbox (free, no third-party form service).
// Configuration lives in environment variables only. See DEPLOY.md and SECURITY.md.

const nodemailer = require('nodemailer');

const MAX_BODY = 4.4 * 1024 * 1024;           // Vercel rejects bodies above ~4.5 MB anyway
const MAX_FILE = 3 * 1024 * 1024;             // decoded artwork size
const MIN_FILL_MS = 2500;                     // humans need more than 2.5 s to fill the form
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;                         // per warm instance; add Turnstile for stronger protection
const hitsByIp = new Map();
const replyByAddress = new Map();             // limits confirmation emails per recipient (anti email-bombing)

// ---------- helpers ----------
const CTRL = /[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g; // control + bidi spoofing chars
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const line = (v, max = 200) => String(v ?? '').replace(CTRL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const text = (v, max = 5000) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g, '').trim().slice(0, max);
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const ALLOWED_SELECT = {
  service: ['Logo / left chest', 'Cap / 3D puff', 'Jacket back', 'Patch', 'Detailed artwork', 'Custom portrait', 'Name / monogram', 'Applique', 'Vector artwork', 'Edit an existing file', 'Other'],
  format: ['DST (Tajima)', 'PES (Brother)', 'EMB (Wilcom)', 'EXP (Melco)', 'JEF (Janome)', 'VP3 (Husqvarna)', 'DSB (Barudan)', 'Not sure'],
  deadline: ['Standard, 24 hours', 'Rush, 12 hours (+50%)', 'No rush']
};
const pick = (key, v) => (ALLOWED_SELECT[key].includes(v) ? v : '');

// Identify the file from its first bytes, never from what the browser claims.
function sniff(buf, name) {
  const ext = (String(name).toLowerCase().match(/\.([a-z0-9]{1,5})$/) || [])[1] || '';
  const h = buf.subarray(0, 16);
  const hex = h.toString('hex');
  const head = buf.subarray(0, 512).toString('utf8');
  if (hex.startsWith('89504e470d0a1a0a')) return { type: 'image/png', ext: 'png' };
  if (hex.startsWith('ffd8ff')) return { type: 'image/jpeg', ext: 'jpg' };
  if (hex.startsWith('47494638')) return { type: 'image/gif', ext: 'gif' };
  if (hex.startsWith('52494646') && h.subarray(8, 12).toString() === 'WEBP') return { type: 'image/webp', ext: 'webp' };
  if (head.startsWith('%PDF-')) return ext === 'ai' ? { type: 'application/pdf', ext: 'ai' } : { type: 'application/pdf', ext: 'pdf' };
  if (head.startsWith('%!PS')) return { type: 'application/postscript', ext: ext === 'ai' ? 'ai' : 'eps' };
  if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return { type: 'image/svg+xml', ext: 'svg' };
  return null;
}

function allowedOrigins() {
  const list = (process.env.ALLOWED_ORIGINS || 'https://elev1stitch.com,https://www.elev1stitch.com')
    .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
  if (process.env.VERCEL_URL) list.push('https://' + process.env.VERCEL_URL);               // this deployment's own URL
  if (process.env.VERCEL_BRANCH_URL) list.push('https://' + process.env.VERCEL_BRANCH_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) list.push('https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL);
  return list;
}

function rateLimited(map, key, max, windowMs) {
  const now = Date.now();
  const recent = (map.get(key) || []).filter(t => now - t < windowMs);
  if (recent.length >= max) { map.set(key, recent); return true; }
  recent.push(now); map.set(key, recent);
  if (map.size > 5000) map.clear(); // bound memory
  return false;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // optional: enable by setting TURNSTILE_SECRET and the site key in index.html
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000)
    });
    const d = await r.json();
    return d.success === true;
  } catch (e) { return false; }
}

function transporter() {
  if (process.env.MAIL_DRY_RUN === '1') return nodemailer.createTransport({ jsonTransport: true });
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000,
    disableFileAccess: true, disableUrlAccess: true
  });
}

const send = (res, code, body) => res.status(code).json(body);

// ---------- handler ----------
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { ok: false, error: 'Use POST.' }); }

  // Same-site browsers only: blocks other websites from using your form as a mail relay.
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  if (!origin || !allowedOrigins().includes(origin)) return send(res, 403, { ok: false, error: 'This form only works on elev1stitch.com.' });

  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return send(res, 415, { ok: false, error: 'Unsupported request.' });
  if (Number(req.headers['content-length'] || 0) > MAX_BODY) return send(res, 413, { ok: false, error: 'The upload is too large. Please email large files.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { return send(res, 400, { ok: false, error: 'Unsupported request.' }); } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { ok: false, error: 'Unsupported request.' });

  // Spam traps: hidden field filled, or form submitted inhumanly fast. Pretend success, send nothing.
  const elapsed = Number(body.elapsed);
  if (body.website || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return send(res, 200, { ok: true });

  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(hitsByIp, ip, MAX_PER_IP, WINDOW_MS)) return send(res, 429, { ok: false, error: 'Too many messages in a short time. Please try again in 10 minutes or email us directly.' });
  if (!(await verifyTurnstile(body.turnstile, ip))) return send(res, 403, { ok: false, error: 'Please complete the human check and try again.' });

  const name = line(body.name, 80).replace(/[<>"@]/g, '');
  const email = line(body.email, 254).toLowerCase();
  const message = text(body.message, 5000);
  if (!name || !EMAIL_RE.test(email) || message.length < 5) return send(res, 400, { ok: false, error: 'Please add your name, a valid email and a short message.' });

  const user = process.env.SMTP_USER;
  if (!user || !EMAIL_RE.test(user) || (!process.env.SMTP_PASS && process.env.MAIL_DRY_RUN !== '1')) {
    console.error('contact: SMTP_USER / SMTP_PASS not configured');
    return send(res, 500, { ok: false, error: 'Email is not set up yet. Please email us directly.' });
  }
  const to = EMAIL_RE.test(process.env.MAIL_TO || '') ? process.env.MAIL_TO : user;

  const fields = [
    ['Name', name], ['Email', email], ['Shop / company', line(body.company, 120)],
    ['Service', pick('service', body.service)], ['Finished size', line(body.size, 60)], ['Garment / fabric', line(body.garment, 80)],
    ['Machine format', pick('format', body.format)], ['Delivery', pick('deadline', body.deadline)]
  ].filter(([, v]) => v);

  const attachments = [];
  if (body.file && typeof body.file === 'object' && body.file.data) {
    const b64 = String(body.file.data);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return send(res, 400, { ok: false, error: 'The artwork file could not be read.' });
    const buf = Buffer.from(b64, 'base64');
    if (buf.length > MAX_FILE) return send(res, 413, { ok: false, error: 'Artwork file is larger than 3 MB. Please email it instead.' });
    const kind = sniff(buf, body.file.name);
    if (!kind) return send(res, 415, { ok: false, error: 'Please attach JPG, PNG, WEBP, GIF, SVG, PDF, AI or EPS artwork.' });
    const base = line(body.file.name, 80).replace(/\.[^.]*$/, '').replace(/[^\w\- ]+/g, '_').trim() || 'artwork';
    attachments.push({ filename: `${base}.${kind.ext}`, content: buf, contentType: kind.type, contentDisposition: 'attachment' });
  }

  const service = pick('service', body.service) || 'General enquiry';
  const rows = fields.map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#6b6f77">${esc(k)}</td><td style="padding:6px 0;color:#111"><b>${esc(v)}</b></td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px">
    <h2 style="margin:0 0 12px;color:#b3592a">New request from your website</h2>
    <table style="border-collapse:collapse;font-size:14px">${rows}</table>
    <h3 style="margin:22px 0 8px">Message</h3>
    <p style="white-space:pre-wrap;font-size:15px;line-height:1.5;color:#111">${esc(message)}</p>
    <p style="color:#6b6f77;font-size:12px;margin-top:24px">${attachments.length ? 'Artwork attached. ' : 'No artwork attached. '}Press Reply to answer ${esc(name)} directly.</p>
  </div>`;
  const plain = fields.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nMessage:\n${message}`;

  try {
    const t = transporter();
    await t.sendMail({
      from: { name: 'ELEV1STITCH Website', address: user },
      to, replyTo: { name, address: email },
      subject: `New quote request: ${service} from ${name}`,
      text: plain, html, attachments
    });
    // Generic confirmation to the client. It never repeats what was typed, so the form
    // can't be used to send someone else's text to strangers. Max one per address per hour.
    if (process.env.AUTO_REPLY !== '0' && !rateLimited(replyByAddress, email, 1, 60 * 60 * 1000)) {
      await t.sendMail({
        from: { name: 'ELEV1STITCH', address: user }, to: email,
        subject: 'We received your request | ELEV1STITCH',
        text: 'Hi,\n\nThanks for contacting ELEV1STITCH. Your request is in and we will reply with a quote within 24 hours.\n\nIf you did not send this, you can ignore this email.\n\nELEV1STITCH\nEmbroidery digitizing\nhttps://elev1stitch.com',
        html: '<div style="font-family:Arial,sans-serif;max-width:560px;color:#111"><p>Hi,</p><p>Thanks for contacting ELEV1STITCH. Your request is in and we will reply with a quote within 24 hours.</p><p style="color:#6b6f77;font-size:13px">If you did not send this, you can ignore this email.</p><p>ELEV1STITCH<br>Embroidery digitizing<br><a href="https://elev1stitch.com">elev1stitch.com</a></p></div>'
      }).catch(() => {});
    }
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error('contact: mail error', err && err.code);
    return send(res, 502, { ok: false, error: 'The message could not be sent right now. Please email us directly.' });
  }
};

