'use strict';
/* =====================================================================
   EDIT HERE: contact details, reviews and prices
   ===================================================================== */
const CONFIG = {
  contact: {
    email: ['harshal', 'elev1stitch.com'].join('@'), // assembled in the browser so simple scrapers can't harvest it
    instagram: '@elev1stitch'
  },
  // Optional free spam shield: paste your Cloudflare Turnstile site key here (see SECURITY.md).
  turnstileSiteKey: '',
  // Real client reviews only. Paste each client's exact words, for example:
  // { text: 'The DST ran perfectly on our Tajima first time.', name: 'Client name', role: 'Shop name', place: 'Brazil', stars: 5 },
  reviews: [
  ],
  // Starting prices. EUR set separately so the numbers stay round.
  tiers: [
    { id: 'small',  name: 'Small',  size: 'Up to 4 in (10 cm)',  use: 'Left chest, cap front, sleeve', USD: 12, EUR: 11, stitches: '3k to 9k stitches' },
    { id: 'medium', name: 'Medium', size: '4 to 8 in (10 to 20 cm)', use: 'Full front, bags, towels', USD: 22, EUR: 20, stitches: '9k to 25k stitches', feat: true },
    { id: 'large',  name: 'Large',  size: '8 to 12 in (20 to 30 cm)', use: 'Jacket back, hoodie front', USD: 38, EUR: 35, stitches: '25k to 60k stitches' },
    { id: 'xl',     name: 'XL',     size: 'Over 12 in (30 cm)', use: 'Full backs, banners, big patches', USD: 55, EUR: 50, stitches: '60k+ stitches' }
  ],
  styles: [
    { id: 'flat',   name: 'Flat',      USD: 0,  EUR: 0 },
    { id: 'puff',   name: '3D puff',   USD: 6,  EUR: 5 },
    { id: 'appl',   name: 'Applique',  USD: 8,  EUR: 7 },
    { id: 'patch',  name: 'Patch',     USD: 5,  EUR: 5 }
  ],
  detail: [
    { id: 'simple',   name: 'Simple',   mult: 1,    hint: 'Text or bold shapes' },
    { id: 'standard', name: 'Standard', mult: 1.25, hint: 'Logo with a few colours' },
    { id: 'detailed', name: 'Detailed', mult: 1.6,  hint: 'Small text, gradients, shading' }
  ],
  addons: [
    { name: '3D puff foam', note: 'Raised letters for caps and fronts, up to 6 in', USD: '+$6', EUR: '+€5' },
    { name: 'Applique', note: 'Fabric cut-out with placement, tack-down and satin cover', USD: '+$8', EUR: '+€7' },
    { name: 'Patch border', note: 'Merrow-ready edge or satin border with cut line', USD: '+$5', EUR: '+€5' },
    { name: 'Vector artwork', note: 'Redraw a blurry logo into clean AI, SVG or PDF', USD: 'from $10', EUR: 'from €9' },
    { name: 'Format conversion', note: 'Your existing file converted to another machine format', USD: '$5', EUR: '€5' },
    { name: 'Edit an existing file', note: 'Fix density, underlay or text in a file you already have', USD: 'from $6', EUR: 'from €5' },
    { name: 'Resize beyond 20%', note: 'Re-digitized for the new size, not just scaled', USD: '50% of size price', EUR: '50% of size price' },
    { name: 'Rush delivery', note: 'File delivered within 12 hours', USD: '+50%', EUR: '+50%' }
  ]
};


/* Real sew-out photos. Edit titles and notes here. */
const WORK = [
  { id: 'tiger-pine', title: 'Tiger & pine', cat: 'Jacket back', garment: 'Black cotton twill', tech: 'Directional fills for the fur, layered satin clouds and radial needle-leaf stitches for the pine.' },
  { id: 'leopard-monstera', title: 'Leopard cub', cat: 'Detailed artwork', garment: 'White cotton, hooped', tech: 'Fur-direction fills, crisp satin outlines on the leaves and running-stitch whiskers.' },
  { id: 'dad-mom-portraits', title: 'Dad & Mom', cat: 'Custom portrait', garment: 'Black sweatshirt fleece', tech: 'Tone-on-tone varsity outline letters with small portrait fills and fine detail runs.' },
  { id: 'kalp-deep-logo', title: 'Kalp-Deep', cat: 'Logo', garment: 'White cotton', tech: 'Satin lettering, a tatami-filled gear and spark details in running stitch.' },
  { id: 'harlow-bow', title: 'Harlow bow', cat: 'Name & monogram', garment: 'White cotton, hooped', tech: 'Satin script name, double satin ribbon outline and small fill motifs.' },
  { id: 'sunglasses-girl', title: 'Bun & shades', cat: 'Apparel front', garment: 'Grey melange jersey', tech: 'Sparkle-thread fills, satin frames and clean-edged circle fills on stretch knit.' },
  { id: 'mickey-character', title: 'Classic character', cat: 'Character', garment: 'Cream ottoman rib knit', tech: 'Fills that sit flat on ribbed knit, satin outlines and a running-stitch tail.' }
];
window.E1_WORK = WORK;

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const hasGSAP = !!(window.gsap && window.ScrollTrigger);
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => n.toLocaleString('en-US');
const currency = 'USD'; // all prices and payments in US dollars
const sym = () => '$';

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis && hasGSAP) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollToEl(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -10, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
function scrollTop() { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); }

/* ---------- routing (hash views) ---------- */
const VIEWS = ['home', 'pricing', 'terms', 'contact'];
function show(view, section) {
  if (!VIEWS.includes(view)) view = 'home';
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
  $$('[data-view-link]').forEach(a => { if (a.dataset.viewLink === view && a.closest('#navList')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#navList').classList.remove('open'); $('#menuToggle').setAttribute('aria-expanded', 'false');
  if (!section) scrollTop();
  requestAnimationFrame(() => {
    if (hasGSAP) ScrollTrigger.refresh();
    if (!section) scrollTop();
    if (view === 'home') buildThread();
    window.dispatchEvent(new Event('e1:view'));
    if (section) scrollToEl(document.getElementById(section));
    onScroll();
    const ph = $(`#view-${view} .phead h1`);
    if (ph && hasGSAP && !reduce) {
      gsap.fromTo(ph, { clipPath: 'inset(0 100% 0 0)', x: -30 }, { clipPath: 'inset(0 -10% 0 0)', x: 0, duration: 1.4, ease: 'expo.out' });
      gsap.fromTo(`#view-${view} .phead p, #view-${view} .phead .kicker`, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .1, ease: 'expo.out', delay: .2 });
    }
  });
}
function route() { show((location.hash || '').replace('#', '') || 'home'); }
addEventListener('hashchange', route);
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (!go) return;
  e.preventDefault();
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  const already = $('#view-home').classList.contains('active');
  if (already && go.dataset.section) { scrollToEl(document.getElementById(go.dataset.section)); $('#navList').classList.remove('open'); return; }
  show('home', go.dataset.section);
});
$('#menuToggle').addEventListener('click', () => {
  const o = $('#navList').classList.toggle('open');
  $('#menuToggle').setAttribute('aria-expanded', String(o));
});

/* ---------- marquee ---------- */
(() => {
  const items = ['DST Tajima', 'PES Brother', 'EMB Wilcom', 'EXP Melco', 'JEF Janome', 'VP3 Husqvarna', 'XXX Singer', 'HUS Viking', 'DSB Barudan', 'Left chest', '3D puff', 'Jacket backs', 'Patches', 'Custom portraits'];
  const html = items.map(t => `<span>${t}</span>`).join('');
  $('#marquee').innerHTML = html + html;
})();

/* ---------- work grid (real photos) ---------- */
function renderGrid() {
  $('#wgrid').innerHTML = WORK.map((w, i) => `
    <button class="wcard" type="button" data-i="${i}" data-cursor="View">
      <div class="ph"><img src="assets/real/${w.id}-sm.webp" alt="${w.title}: ${w.cat.toLowerCase()} embroidery on ${w.garment.toLowerCase()}" loading="lazy"></div>
      <div class="cap"><strong>${w.title}</strong><span>${w.cat}</span></div>
      <div class="glare"></div>
    </button>`).join('');
}
$('#wgrid').addEventListener('click', e => { const c = e.target.closest('.wcard'); if (c) openLB(+c.dataset.i); });
$('#wgrid').addEventListener('pointermove', e => {
  if (reduce || !finePointer) return;
  const c = e.target.closest('.wcard'); if (!c) return;
  const r = c.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  c.style.setProperty('--gx', x * 100 + '%'); c.style.setProperty('--gy', y * 100 + '%');
  c.style.transform = `perspective(1000px) rotateY(${(x - .5) * 9}deg) rotateX(${-(y - .5) * 9}deg)`;
});
$('#wgrid').addEventListener('pointerout', e => { const c = e.target.closest('.wcard'); if (c && !c.contains(e.relatedTarget)) { c.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)'; c.style.transform = ''; setTimeout(() => c.style.transition = '', 600); } });

/* ---------- lightbox ---------- */
let lbIndex = 0, lbReturn = null;
function openLB(i) {
  lbIndex = (i + WORK.length) % WORK.length;
  const w = WORK[lbIndex];
  $('#lbImg').src = `assets/real/${w.id}.webp`; $('#lbImg').alt = `${w.title} embroidery sew-out`;
  $('#lbCat').textContent = w.cat; $('#lbTitle').textContent = w.title;
  $('#lbSpec').innerHTML = [['Category', w.cat], ['Garment', w.garment]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') + `<dt style="grid-column:1/-1">Techniques</dt><dd style="grid-column:1/-1;text-align:left;font-family:var(--body);font-size:15px;color:#c6c6ca">${w.tech}</dd>`;
  const wasOpen = $('#lb').classList.contains('open');
  if (!wasOpen) lbReturn = document.activeElement;
  $('#lb').classList.add('open'); $('#lbClose').focus();
  if (lenis) lenis.stop();
  if (hasGSAP && !reduce) {
    if (!wasOpen) gsap.fromTo('.lb-card', { scale: .88, rotateX: 10, opacity: 0 }, { scale: 1, rotateX: 0, opacity: 1, duration: .8, ease: 'expo.out' });
    gsap.fromTo('#lbImg', { scale: 1.12, opacity: .3 }, { scale: 1, opacity: 1, duration: .9, ease: 'expo.out' });
    gsap.fromTo('.lb-side > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .7, ease: 'expo.out' });
  }
}
window.E1_openLB = openLB;
function closeLB() { $('#lb').classList.remove('open'); if (lenis) lenis.start(); lbReturn?.focus(); }
$('#lbClose').addEventListener('click', closeLB);
$('#lbPrev').addEventListener('click', () => openLB(lbIndex - 1));
$('#lbNext').addEventListener('click', () => openLB(lbIndex + 1));
$('#lb').addEventListener('click', e => { if (e.target.id === 'lb') closeLB(); });
addEventListener('keydown', e => {
  if (!$('#lb').classList.contains('open')) return;
  if (e.key === 'Escape') closeLB();
  if (e.key === 'ArrowRight') openLB(lbIndex + 1);
  if (e.key === 'ArrowLeft') openLB(lbIndex - 1);
});

/* ---------- 3D ring captions ---------- */
window.E1_ringActive = (i) => {
  const w = WORK[i];
  $('#ringIdx').textContent = String(i + 1).padStart(2, '0');
  $('#ringTotal').textContent = String(WORK.length).padStart(2, '0');
  const swap = (el, txt) => {
    if (!hasGSAP || reduce) { el.textContent = txt; return; }
    gsap.to(el, { yPercent: -110, duration: .25, ease: 'power2.in', onComplete: () => { el.textContent = txt; gsap.fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: .6, ease: 'expo.out' }); } });
  };
  swap($('#ringTitle'), w.title); swap($('#ringCat'), w.cat);
  $('#ringTech').textContent = w.tech;
  if (hasGSAP && !reduce) gsap.fromTo('#ringTech', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6 });
};

/* ---------- services list with floating preview ---------- */
function renderServices() {
  const rows = [
    ['Logos & left chest', 'Small lettering held crisp at 5 mm, cap-ready pathing from the centre out.', 0, null, 'kalp-deep-logo'],
    ['Detailed artwork', 'Animals, florals and illustrations with fur and shading built from directional fills.', 1, null, 'leopard-monstera'],
    ['Jacket backs', 'Large designs split into sections with layered underlay, so they stay flat.', 2, null, 'tiger-pine'],
    ['Custom portraits', 'Family and pet portraits simplified into clean stitchable shapes.', 1, null, 'dad-mom-portraits'],
    ['Names & monograms', 'Script names and monograms in smooth satin that never gaps.', 0, null, 'harlow-bow'],
    ['3D puff & patches', 'Dense capped satin for foam, and merrow-ready or satin-border patches.', 0, 'puff', 'sunglasses-girl']
  ];
  $('#svc').innerHTML = rows.map(([t, d, tier, style, img]) => {
    const base = CONFIG.tiers[tier][currency] + (style ? CONFIG.styles.find(s => s.id === style)[currency] : 0);
    return `<a class="svc-row" href="#pricing" data-view-link="pricing" data-img="${img}"><h3>${t}</h3><p>${d}</p><div class="from">from ${sym()}${base}<small>per design</small></div><span class="arr" aria-hidden="true">↗</span></a>`;
  }).join('');
}
const svcPrev = document.createElement('div');
svcPrev.className = 'svc-prev'; svcPrev.setAttribute('aria-hidden', 'true');
svcPrev.innerHTML = '<img alt="">';
document.body.appendChild(svcPrev);
if (hasGSAP && finePointer && !reduce) {
  const qx = gsap.quickTo(svcPrev, 'x', { duration: .55, ease: 'power3' });
  const qy = gsap.quickTo(svcPrev, 'y', { duration: .55, ease: 'power3' });
  let lastX = 0;
  $('#svc').addEventListener('pointermove', e => {
    qx(e.clientX + 30); qy(e.clientY - 160);
    gsap.to(svcPrev, { rotate: gsap.utils.clamp(-14, 14, (e.clientX - lastX) * .8), duration: .5 });
    lastX = e.clientX;
  });
  $('#svc').addEventListener('pointerover', e => {
    const r = e.target.closest('.svc-row'); if (!r) return;
    const img = svcPrev.querySelector('img');
    const src = `assets/real/${r.dataset.img}-sm.webp`;
    if (!img.src.endsWith(src)) { img.src = src; gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: .7, ease: 'expo.out' }); }
    gsap.to(svcPrev, { opacity: 1, scale: 1, duration: .45, ease: 'back.out(1.6)' });
  });
  $('#svc').addEventListener('pointerleave', () => gsap.to(svcPrev, { opacity: 0, scale: .6, duration: .35 }));
}

/* ---------- split text helper ---------- */
function splitText(el, mode) {
  if (el._parts) return el._parts;
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.trim());
  const parts = [];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'sw'; w.setAttribute('aria-hidden', 'true');
          const i = document.createElement('span'); i.className = 'si';
          if (mode === 'chars') [...tok].forEach(ch => { const c = document.createElement('span'); c.className = 'sc'; c.textContent = ch; i.appendChild(c); parts.push(c); });
          else { i.textContent = tok; parts.push(i); }
          w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('roller')) walk(n);
    });
  };
  walk(el);
  el._parts = parts;
  return parts;
}

/* ---------- reviews (real client words only) ---------- */
const escHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderReviews() {
  const list = (CONFIG.reviews || []).filter(r => r.text);
  const mail = CONFIG.contact.email;
  if (!list.length) {
    $('#reviewList').innerHTML = `<figure class="review review-cta" style="margin:0"><span class="q" aria-hidden="true">“</span>
      <blockquote>Reviews from our clients are being collected and will appear here.</blockquote>
      <footer><span>Worked with us? Send your review to <a href="mailto:${mail}">${mail}</a></span></footer></figure>`;
    return;
  }
  $('#reviewList').innerHTML = list.map(r => {
    const ini = (r.name || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
    return `<figure class="review" style="margin:0"><span class="q" aria-hidden="true">“</span><span class="stars" aria-label="${r.stars || 5} out of 5 stars">${'★'.repeat(r.stars || 5)}</span><blockquote>${escHTML(r.text)}</blockquote><footer><span class="av">${escHTML(ini)}</span><span><strong style="color:var(--text);display:block">${escHTML(r.name)}</strong>${escHTML(r.role || '')}${r.place ? ', ' + escHTML(r.place) : ''}</span></footer></figure>`;
  }).join('');
}

/* ---------- contact cards ---------- */
function renderContact() {
  const c = CONFIG.contact;
  const ig = (c.instagram || '').replace('@', '');
  $('#contactCards').innerHTML = `
    <div class="ccard"><h3>Email</h3><a class="val" href="mailto:${c.email}">${c.email}</a><p class="cnote">Quotes, files and questions. Replies within 24 hours.</p></div>
    <div class="ccard"><h3>Instagram</h3><a class="val" href="https://instagram.com/${encodeURIComponent(ig)}" rel="noopener noreferrer">@${escHTML(ig)}</a><p class="cnote">Recent sew-outs and work in progress.</p></div>
    <div class="ccard"><h3>Payments</h3><span class="val">USD via Wise</span><p class="cnote">Watermarked preview first, final file after payment.</p></div>`;
  $$('[data-mail]').forEach(a => { a.href = 'mailto:' + c.email; a.textContent = c.email; });
}

/* ---------- quote form: posts to /api/contact (Vercel function) ---------- */
const qForm = $('#quoteForm');
let formShownAt = 0;
new IntersectionObserver(es => { if (es[0].isIntersecting && !formShownAt) formShownAt = Date.now(); }).observe(qForm);
qForm.addEventListener('focusin', () => { if (!formShownAt) formShownAt = Date.now(); });
// Optional Cloudflare Turnstile (free human check). Set CONFIG.turnstileSiteKey and TURNSTILE_SECRET on Vercel.
let tsToken = '';
if (CONFIG.turnstileSiteKey) {
  window.onTurnstileLoad = () => window.turnstile.render('#turnstile', { sitekey: CONFIG.turnstileSiteKey, theme: 'dark', callback: t => { tsToken = t; }, 'expired-callback': () => { tsToken = ''; } });
  const sc = document.createElement('script');
  sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit'; sc.async = true; sc.defer = true;
  document.head.appendChild(sc);
}
const qFile = $('#qFile');
function fileLabel() {
  const f = qFile.files[0];
  $('#dropText').textContent = f ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(2)} MB` : 'Drop artwork here or browse';
  $('#drop').classList.toggle('has', !!f);
}
qFile.addEventListener('change', fileLabel);
['dragenter', 'dragover'].forEach(ev => $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.remove('over'); }));
$('#drop').addEventListener('drop', e => { if (e.dataTransfer.files[0]) { qFile.files = e.dataTransfer.files; fileLabel(); } });
const toB64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(f); });
function qStatus(msg, bad) { const s = $('#qStatus'); s.textContent = msg; s.classList.toggle('bad', !!bad); }
qForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(qForm).entries());
  delete fd.artwork;
  $$('.fld', qForm).forEach(f => f.classList.remove('err'));
  const miss = [];
  if (!fd.name.trim()) miss.push('qName');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fd.email.trim())) miss.push('qEmail');
  if (fd.message.trim().length < 5) miss.push('qMsg');
  if (miss.length) { miss.forEach(id => $('#' + id).closest('.fld').classList.add('err')); $('#' + miss[0]).focus(); qStatus('Add your name, a valid email and a short message.', true); return; }
  const f = qFile.files[0];
  if (f && f.size > 3 * 1024 * 1024) { qStatus('Artwork is larger than 3 MB. Attach a smaller file or email it to us.', true); return; }
  const btn = $('#qSend'); btn.disabled = true; btn.classList.add('busy'); qStatus('Sending…');
  try {
    if (CONFIG.turnstileSiteKey && !tsToken) throw new Error('Please complete the human check first.');
    fd.elapsed = formShownAt ? Date.now() - formShownAt : 0;
    fd.turnstile = tsToken;
    if (f) fd.file = { name: f.name, type: f.type || 'application/octet-stream', data: await toB64(f) };
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fd) });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.ok) throw new Error(out.error || 'send failed');
    $('#sentEmail').textContent = fd.email;
    qForm.classList.add('done');
    $('#sentPanel').hidden = false;
    if (window.gsap && !reduce) {
      gsap.fromTo('#sentPanel', { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .8, ease: 'expo.out' });
      gsap.fromTo('#sentCheck path', { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 1, ease: 'power3.out', delay: .2 });
    }
    qStatus('');
  } catch (err) {
    qStatus(err.message && err.message !== 'send failed' && !/fetch|JSON|network/i.test(err.message)
      ? err.message + ` You can also email ${CONFIG.contact.email}.`
      : `Couldn't send from here. Email ${CONFIG.contact.email} and attach your artwork.`, true);
  } finally { btn.disabled = false; btn.classList.remove('busy'); if (window.turnstile && CONFIG.turnstileSiteKey) { window.turnstile.reset('#turnstile'); tsToken = ''; } }
});
$('#sentAgain').addEventListener('click', () => { qForm.reset(); fileLabel(); qForm.classList.remove('done'); $('#sentPanel').hidden = true; $('#qName').focus(); });
function briefText() { return ''; }

/* ---------- pricing ---------- */
function renderPricing() {
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cur === currency)));
  $('#tiers').innerHTML = CONFIG.tiers.map(t => `
    <div class="tier${t.feat ? ' feat' : ''}">${t.feat ? '<span class="badge">Most ordered</span>' : ''}
      <h3>${t.name}</h3><div class="size">${t.size}</div>
      <div class="price">from <strong>${sym()}${t[currency]}</strong></div>
      <ul><li>${t.use}</li><li>${t.stitches}</li><li>All machine formats</li><li>Stitch-out preview</li><li>Free minor edits for 7 days</li></ul>
      <a class="btn ${t.feat ? 'btn-copper' : 'btn-ghost'}" href="#contact" data-view-link="contact">Quote a ${t.name.toLowerCase()} design</a>
    </div>`).join('');
  const rows = CONFIG.tiers.map(t => `<tr><td><strong>${t.name}</strong><small>${t.size}</small></td>${CONFIG.styles.map(s => `<td class="num">${sym()}${t[currency] + s[currency]}</td>`).join('')}<td class="num">24 h</td></tr>`).join('');
  $('#chart').innerHTML = `<caption class="sr">Starting price by size and stitch style</caption><thead><tr><th scope="col">Size</th>${CONFIG.styles.map(s => `<th class="num" scope="col">${s.name}</th>`).join('')}<th class="num" scope="col">Turnaround</th></tr></thead><tbody>${rows}</tbody>`;
  $('#addons').innerHTML = `<caption class="sr">Add-ons and services</caption><thead><tr><th scope="col">Service</th><th scope="col">What you get</th><th class="num" scope="col">Price</th></tr></thead><tbody>${CONFIG.addons.map(a => `<tr><td><strong>${a.name}</strong></td><td style="color:var(--muted)">${a.note}</td><td class="num">${a[currency]}</td></tr>`).join('')}</tbody>`;
  if (!$('#estStyle').children.length) {
    $('#estStyle').innerHTML = CONFIG.styles.map((s, i) => `<input type="radio" name="style" id="st-${s.id}" value="${s.id}" ${i === 0 ? 'checked' : ''}><label for="st-${s.id}">${s.name}</label>`).join('');
    $('#estDetail').innerHTML = CONFIG.detail.map((d, i) => `<input type="radio" name="detail" id="dt-${d.id}" value="${d.id}" ${i === 1 ? 'checked' : ''}><label for="dt-${d.id}" title="${d.hint}">${d.name}</label>`).join('');
  }
  estimate(); renderServices();
}
function estimate() {
  const size = +$('#estSize').value, qty = +$('#estQty').value;
  const tier = size <= 4 ? 0 : size <= 8 ? 1 : size <= 12 ? 2 : 3;
  const t = CONFIG.tiers[tier];
  const st = CONFIG.styles.find(s => s.id === ($('input[name=style]:checked') || {}).value) || CONFIG.styles[0];
  const dt = CONFIG.detail.find(d => d.id === ($('input[name=detail]:checked') || {}).value) || CONFIG.detail[1];
  const rush = $('#estRush').checked;
  let each = (t[currency] * dt.mult + st[currency]) * (rush ? 1.5 : 1);
  const disc = qty >= 6 ? .15 : qty >= 3 ? .10 : 0;
  const total = Math.round(each * qty * (1 - disc));
  $('#estSizeOut').textContent = `${size} in (${(size * 2.54).toFixed(1)} cm)`;
  $('#estQtyOut').textContent = `${qty} design${qty > 1 ? 's' : ''}`;
  const el = $('#estAmt'); const from = +(el.dataset.v || total); el.dataset.v = total;
  if (window.gsap && !reduce) { const o = { v: from }; gsap.to(o, { v: total, duration: .6, ease: 'power3.out', onUpdate: () => el.textContent = `${sym()}${fmt(Math.round(o.v))}` }); gsap.fromTo(el, { scale: 1.08 }, { scale: 1, duration: .5, ease: 'back.out(2)' }); }
  else el.textContent = `${sym()}${fmt(total)}`;
  $('#estBreak').innerHTML = [
    `${t.name} size, from ${sym()}${t[currency]}`,
    `${dt.name} detail ×${dt.mult}`,
    st[currency] ? `${st.name} +${sym()}${st[currency]}` : `${st.name} stitching`,
    rush ? 'Rush 12 h ×1.5' : 'Standard 24 h',
    disc ? `Bulk discount −${disc * 100}%` : `${qty} × ${sym()}${Math.round(each)}`
  ].map(x => `<span>${x}</span>`).join('');
}
$('#estForm').addEventListener('input', estimate);
$('#estForm').addEventListener('change', estimate);
$$('.seg button').forEach(b => b.addEventListener('click', () => {
  currency = b.dataset.cur; try { localStorage.setItem('e1-cur', currency); } catch (e) {}
  renderPricing();
}));

/* ---------- terms TOC ---------- */
$('#toc').innerHTML = $$('#legal h2').map(h => `<a href="#terms" data-t="${h.id}">${h.textContent.replace(/^\d+\.\s*/, '')}</a>`).join('');
$('#toc').addEventListener('click', e => { const a = e.target.closest('[data-t]'); if (!a) return; e.preventDefault(); document.getElementById(a.dataset.t).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });

/* ---------- thread that sews the page ---------- */
let threadLen = 0, threadPts = [], homeH = 1, lastThreadP = -1;
function buildThread() {
  const home = $('#view-home'); if (!home.classList.contains('active')) return;
  const W = home.clientWidth, H = home.scrollHeight;
  const svg = $('#threadSvg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.style.height = H + 'px';
  const secs = ['#gallery-sec', '#process', '#services', '#reviews'].map(s => $(s)).filter(Boolean);
  const hero = $('.hero-media').offsetHeight;
  const mobile = W < 860;
  const pts = [[W * (mobile ? .9 : .855), hero * .16], [W * .5, hero * .62], [W * (mobile ? .03 : .015), hero * 1.25]];
  secs.forEach((s, i) => {
    const box = s.parentElement.classList.contains('pin-spacer') ? s.parentElement : s; const hr = home.getBoundingClientRect(), br = box.getBoundingClientRect(); const top = br.top - hr.top, h = br.height;
    const side = i % 2 === 0 ? (mobile ? .03 : .015) : (mobile ? .97 : .985);
    pts.push([W * side, top + Math.min(160, h * .1)]);
    pts.push([W * side, top + h - Math.min(110, h * .06)]);
  });
  pts.push([W * .5, H - 40]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const dy = (y1 - y0) * .55;
    d += ` C${x0},${y0 + dy} ${x1},${y1 - dy} ${x1},${y1}`;
  }
  ['#threadGlow', '#threadCore', '#threadMaskPath'].forEach(s => $(s).setAttribute('d', d));
  threadLen = $('#threadMaskPath').getTotalLength();
  threadPts = []; const tp = $('#threadMaskPath');
  for (let i = 0; i <= 600; i++) { const q = tp.getPointAtLength(threadLen * i / 600); threadPts.push([q.x, q.y]); }
  homeH = home.scrollHeight; lastThreadP = -1;
  $('#threadMaskPath').style.strokeDasharray = `${threadLen} ${threadLen}`;
}
function drawThread(intro) {
  if (!threadLen) return;
  const home = $('#view-home');
  const rect = home.getBoundingClientRect();
  let p = (innerHeight * .78 - rect.top) / homeH;
  p = Math.max(.055 * intro, Math.min(1, p));
  if (reduce) p = 1;
  if (Math.abs(p - lastThreadP) < 0.0004) return;
  lastThreadP = p;
  const drawn = threadLen * p;
  $('#threadMaskPath').style.strokeDashoffset = threadLen - drawn;
  const k = Math.min(599, Math.floor(p * 600)), f = p * 600 - k;
  const A = threadPts[k], B = threadPts[k + 1];
  const x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f;
  const ang = Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI;
  $('#needle').setAttribute('transform', `translate(${x},${y}) rotate(${ang})`);
}
/* ---------- sew-out simulation ---------- */
const sew = { stitches: [], drawn: 0, ctx: null, size: 0, colors: [] };
function buildSew() {
  const cv = $('#sewCanvas'); const dpr = Math.min(2, devicePixelRatio || 1);
  const size = Math.round(cv.clientWidth * dpr) || 600; cv.width = cv.height = size;
  sew.ctx = cv.getContext('2d'); sew.size = size;
  const S = 360, off = document.createElement('canvas'); off.width = off.height = S;
  const o = off.getContext('2d'); o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
  o.font = `italic 800 ${S * .62}px "Bodoni Moda", Didot, Georgia, serif`; o.fillText('E1', S * .5, S * .52);
  const img = o.getImageData(0, 0, S, S).data;
  const inside = (x, y) => x >= 0 && y >= 0 && x < S && y < S && img[(Math.floor(y) * S + Math.floor(x)) * 4 + 3] > 128;
  const erode = (x, y, r) => inside(x, y) && inside(x + r, y) && inside(x - r, y) && inside(x, y + r) && inside(x, y - r);
  const out = [];
  const hatch = (angle, spacing, step, test, color, w) => {
    const a = angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    let k = 0;
    for (let o2 = -S; o2 < S; o2 += spacing, k++) {
      const runs = []; let cur = null;
      for (let t = -S; t < S; t += 1) {
        const x = S / 2 + t * ca - o2 * sa, y = S / 2 + t * sa + o2 * ca;
        const ins = test(x, y);
        if (ins && !cur) cur = [[x, y]];
        if (!ins && cur) { cur.push([x, y]); runs.push(cur); cur = null; }
      }
      runs.forEach(r => {
        let [p0, p1] = r; if (k % 2) [p0, p1] = [p1, p0];
        const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), n = Math.max(1, Math.round(L / step));
        for (let i = 0; i <= n; i++) out.push({ x: p0[0] + (p1[0] - p0[0]) * i / n, y: p0[1] + (p1[1] - p0[1]) * i / n, c: color, w, jump: i === 0 });
      });
    }
  };
  hatch(100, 9, 12, (x, y) => erode(x, y, 5), 0, 1.1);        // underlay zigzag
  const u = out.length;
  hatch(45, 2.6, 9, inside, 1, 1.6);                          // top tatami
  const f = out.length;
  // edge run in copper
  const edge = [];
  for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (inside(x, y) && !erode(x, y, 2)) edge.push([x, y]);
  // order edge points greedily for a continuous run
  const used = new Uint8Array(edge.length); let cur = 0;
  for (let n = 0; n < edge.length; n++) {
    used[cur] = 1; out.push({ x: edge[cur][0], y: edge[cur][1], c: 2, w: 1.3, jump: false });
    let best = -1, bd = 1e9;
    for (let j = 0; j < edge.length; j++) if (!used[j]) { const d = (edge[j][0] - edge[cur][0]) ** 2 + (edge[j][1] - edge[cur][1]) ** 2; if (d < bd) { bd = d; best = j; if (d <= 8) break; } }
    if (best < 0) break;
    if (bd > 40) out.push({ x: edge[best][0], y: edge[best][1], c: 2, w: 1.3, jump: true });
    cur = best;
  }
  sew.stitches = out.map(s => ({ ...s, x: s.x / S * size, y: s.y / S * size }));
  sew.marks = [u, f, out.length];
  sew.scale = size / S;
  sew.drawn = 0; clearSew();
}
const THREADS = [['#3a4a66', '#5b7096'], ['#9ea3ad', '#ffffff'], ['#b3592a', '#ffd3a0']];
function clearSew() { const c = sew.ctx; if (!c) return; c.clearRect(0, 0, sew.size, sew.size); }
function drawSew(p) {
  if (!sew.ctx || !sew.stitches.length) return;
  const target = Math.floor(sew.stitches.length * Math.max(0, Math.min(1, p)));
  const c = sew.ctx, sc = sew.scale;
  if (target < sew.drawn) {
    const now = performance.now();
    if (now - (sew.lastRedraw || 0) < 90) return;
    sew.lastRedraw = now; clearSew(); sew.drawn = 0;
  }
  c.lineCap = 'round';
  for (let i = Math.max(1, sew.drawn); i < target; i++) {
    const a = sew.stitches[i - 1], b = sew.stitches[i];
    if (b.jump) continue;
    const [dark, light] = THREADS[b.c];
    c.strokeStyle = dark; c.lineWidth = b.w * sc * 1.25; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.strokeStyle = light; c.globalAlpha = b.c === 0 ? .5 : .85; c.lineWidth = b.w * sc * .45;
    c.beginPath(); c.moveTo(a.x - .4 * sc, a.y - .4 * sc); c.lineTo(b.x - .4 * sc, b.y - .4 * sc); c.stroke(); c.globalAlpha = 1;
  }
  sew.drawn = Math.max(sew.drawn, target);
  // needle head overlay
  const ov = $('#hoop'); const s = sew.stitches[Math.max(0, target - 1)];
  ov.style.setProperty('--nx', (s.x / sew.size * 86 + 7) + '%'); ov.style.setProperty('--ny', (s.y / sew.size * 86 + 7) + '%');
  // counters: scale simulated points to a realistic file
  const real = Math.round(target * 11900 / sew.stitches.length);
  $('#cStitch').textContent = fmt(real);
  const col = target < sew.marks[0] ? 1 : target < sew.marks[1] ? 2 : 3;
  $('#cColor').textContent = `${col} / 3`;
  const secs = Math.round(real / 850 * 60);
  $('#cTime').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  $$('#steps li').forEach(li => li.classList.toggle('on', p >= +li.dataset.at));
}
function sewProgress() {
  const s = $('#process'); const r = s.getBoundingClientRect();
  if (innerWidth <= 900) return Math.min(1, Math.max(0, (innerHeight * .9 - r.top) / (r.height * .9)));
  return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
}


/* ---------- scroll-linked frame ---------- */
let sewVisible = false, marqVisible = false;
const floatEls = $$('[data-float]'); floatEls.forEach(el => el._f = +el.dataset.float);
new IntersectionObserver(es => { sewVisible = es[0].isIntersecting; if (sewVisible) onScroll(); }, { rootMargin: '200px' }).observe($('#process'));
new IntersectionObserver(es => { marqVisible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe($('.vmarq'));
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    $('#nav').classList.toggle('solid', scrollY > 40);
    if (!$('#view-home').classList.contains('active')) return;
    const y = scrollY;
    if (!reduce) {
      if (y < innerHeight * 1.2) $('#heroBg').style.transform = `translate3d(0, ${y * .3}px, 0)`;
      if (sewVisible && innerWidth > 900) { const top = $('#process').getBoundingClientRect().top; floatEls.forEach(el => { el.style.transform = `translate3d(0, ${top * el._f}px, 0)`; }); }
    }
    drawThread(introP);
    if (sewVisible || reduce) drawSew(reduce ? 1 : sewProgress());
  });
}
addEventListener('scroll', onScroll, { passive: true });

/* ---------- custom cursor ---------- */
const cur = document.createElement('div'); cur.className = 'cursor';
const ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.innerHTML = '<span></span>';
document.body.append(cur, ring);
window.E1_cursor = (label) => {
  ring.classList.toggle('big', !!label);
  ring.querySelector('span').textContent = label || '';
};
if (finePointer && !reduce && hasGSAP) {
  document.body.classList.add('has-cursor');
  const cx = gsap.quickTo(cur, 'x', { duration: .08 }), cy = gsap.quickTo(cur, 'y', { duration: .08 });
  const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
  addEventListener('pointermove', e => { document.body.classList.add('cursor-live'); cx(e.clientX); cy(e.clientY); rx(e.clientX); ry(e.clientY); });
  document.addEventListener('pointerleave', () => document.body.classList.remove('cursor-live'));
  document.addEventListener('pointerover', e => {
    const v = e.target.closest('[data-cursor]');
    if (v) { window.E1_cursor(v.dataset.cursor); return; }
    if (e.target.closest('#ringCanvas')) return;
    window.E1_cursor('');
    ring.classList.toggle('link', !!e.target.closest('a, button, label, summary, input'));
  });
  document.addEventListener('pointerdown', () => gsap.to(ring, { scale: .8, duration: .15 }));
  document.addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: .4, ease: 'back.out(2)' }));
}

/* ---------- magnetic buttons ---------- */
function magnetize() {
  if (!finePointer || reduce || !hasGSAP) return;
  $$('[data-magnetic], .nav .btn').forEach(b => {
    if (b._mag) return; b._mag = true;
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .35, y: (e.clientY - r.top - r.height / 2) * .45, duration: .4, ease: 'power3' });
    });
    b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .35)' }));
  });
}

/* ---------- text scramble ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/';
function scramble(el) {
  const final = el.dataset.final || el.textContent;
  el.dataset.final = final;
  const t0 = performance.now(), dur = 650 + final.length * 22;
  (function step(now) {
    const k = Math.min(1, ((now || performance.now()) - t0) / dur);
    const shown = Math.floor(k * final.length);
    el.textContent = [...final].map((ch, i) => (ch === ' ' || i < shown) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
    if (k < 1) requestAnimationFrame(step); else el.textContent = final;
  })();
  setTimeout(() => { el.textContent = final; }, dur + 400);
}

/* ---------- hero intro ---------- */
let introP = 0;
function threadIntro() {
  if (reduce) { introP = 1; drawThread(1); return; }
  const t0 = performance.now();
  (function step(t) { introP = Math.min(1, (t - t0) / 1800); introP = 1 - Math.pow(1 - introP, 3); drawThread(introP); if (introP < 1) requestAnimationFrame(step); })(t0);
}
function heroIntro() {
  threadIntro();
  window.E1_introPlayed = true;
  if (window.E1_hero3d) window.E1_hero3d.intro();
  if (!hasGSAP || reduce) return;
  const chars = splitText($('#heroTitle'), 'chars');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo('#heroBg img', { scale: 1.45, filter: 'brightness(.15) blur(10px)' }, { scale: 1.04, filter: 'brightness(1) blur(0px)', duration: 2.4 }, 0)
    .from(chars, { yPercent: 120, rotateX: -95, opacity: 0, stagger: .022, duration: 1.4 }, .35)
    .from('#heroLine2', { y: 30, opacity: 0, duration: 1 }, .9)
    .from('#heroLede', { y: 30, opacity: 0, duration: 1 }, 1.0)
    .from('#heroCtas > *', { y: 30, opacity: 0, stagger: .08, duration: 1 }, 1.1)
    .from('.hero-chip', { scale: 0, opacity: 0, stagger: .12, duration: 1.2, ease: 'elastic.out(1, .55)' }, 1.2)
    .from('.marquee', { yPercent: 100, duration: 1 }, 1.2)
    .add(() => $$('.hero-spec [data-scramble]').forEach((el, i) => setTimeout(() => scramble(el), i * 140)), 1.3);
  gsap.to('#heroBg img', { scale: 1.12, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.4 });
  $$('.hero-chip').forEach((c, i) => gsap.to(c, { y: '+=16', duration: 2.2 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .3 }));
}
// rolling word
(() => {
  const spans = $$('#roller span'); let i = 0;
  if (reduce || !hasGSAP) return;
  gsap.set(spans, { yPercent: 110 }); gsap.set(spans[0], { yPercent: 0 });
  setInterval(() => {
    const a = spans[i]; i = (i + 1) % spans.length; const b = spans[i];
    gsap.to(a, { yPercent: -110, duration: .7, ease: 'expo.inOut' });
    gsap.fromTo(b, { yPercent: 110 }, { yPercent: 0, duration: .7, ease: 'expo.inOut' });
  }, 2200);
})();
// 3D tilt of the hero stage
if (finePointer && !reduce && hasGSAP) {
  const tilt = $('#heroTilt');
  $$('.hero-chip').forEach(c => gsap.set(c, { z: +c.dataset.depth }));
  $('#heroStage').addEventListener('pointermove', e => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    gsap.to(tilt, { rotateY: x * 5, rotateX: -y * 4, duration: 1.2, ease: 'power3' });
    $('#heroLight').style.setProperty('--mx', ((x + .5) * 100) + '%');
    $('#heroLight').style.setProperty('--my', ((y + .5) * 100) + '%');
  });
  $('#heroStage').addEventListener('pointerleave', () => gsap.to(tilt, { rotateY: 0, rotateX: 0, duration: 1.4, ease: 'power3' }));
}

/* ---------- preloader ---------- */
function runLoader(done) {
  const root = document.documentElement;
  if (!root.classList.contains('js-loading') || !hasGSAP) { root.classList.remove('js-loading'); done(); return; }
  const letters = $$('.loader .word span');
  const num = $('#loadNum');
  const o = { v: 0 };
  const tl = gsap.timeline();
  tl.from(letters, { yPercent: 120, rotate: 8, stagger: .05, duration: 1, ease: 'expo.out' })
    .to('.loader .bar i', { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, .2)
    .to(o, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => num.textContent = String(Math.round(o.v)).padStart(3, '0') }, .2)
    .to(letters, { yPercent: -120, stagger: .035, duration: .7, ease: 'expo.in' }, '+=.15')
    .to('.loader .meta, .loader .bar', { opacity: 0, duration: .3 }, '<')
    .add(done, '-=.1')
    .to('.loader .panel.top', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '-=.15')
    .to('.loader .panel.bot', { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, '<')
    .add(() => root.classList.remove('js-loading'));
}

/* ---------- scroll animations ---------- */
const IO = 'play reverse play reverse';
function setupScrollFX() {
  if (!hasGSAP || reduce) return;
  // 3D ring pinned scroll
  ScrollTrigger.create({ trigger: '#work', start: 'top top', end: () => '+=' + innerHeight * (innerWidth < 860 ? 1.6 : 2.4), pin: true, refreshPriority: 10, scrub: true, onUpdate: s => window.__ringP = s.progress, onRefresh: () => buildThread() });

  // headings: word mask rise
  $$('[data-split], .h2').forEach(h => {
    if (h.closest('.loader') || h.classList.contains('chrome')) return;
    const parts = splitText(h, 'words');
    gsap.from(parts, { yPercent: 115, rotate: 5, duration: 1.1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 90%', end: 'bottom 4%', toggleActions: IO } });
  });
  $$('[data-scramble]').forEach(el => { if (el.closest('.hero-spec')) return; ScrollTrigger.create({ trigger: el, start: 'top 92%', end: 'bottom 2%', onEnter: () => scramble(el), onEnterBack: () => scramble(el) }); });
  // every other text block comes in and goes back out as it scrolls past
  const inOut = (sel, from) => $$(sel).forEach(el => gsap.from(el, { ...from, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 93%', end: 'bottom 3%', toggleActions: IO } }));
  inOut('.sub, .note, .kicker', { y: 34, opacity: 0 });
  inOut('.ptools, .table-wrap, .est, .checklist li, .ccard, .brief .qwrap, .foot > div, .term, .legal', { y: 50, opacity: 0 });
  inOut('.faq details', { x: -40, opacity: 0 });
  inOut('.legal-body h2, .legal-body p, .legal-body ul', { y: 40, opacity: 0 });
  inOut('.toc a', { x: -20, opacity: 0 });
  inOut('table tbody tr', { x: 40, opacity: 0 });
  inOut('.numbers span', { y: 24, opacity: 0 });

  // manifesto: words light up with scroll
  const m = $('#manifesto');
  if (m && !m._done) {
    m._done = true;
    m.setAttribute('aria-label', m.textContent);
    m.innerHTML = m.textContent.split(' ').map(w => `<span class="mw" aria-hidden="true">${w}</span>`).join(' ');
    const ws = $$('.mw', m);
    ScrollTrigger.create({ trigger: m, start: 'top 85%', end: 'bottom 45%', scrub: true, onUpdate: s => { const k = Math.round(s.progress * ws.length); ws.forEach((w, i) => w.style.opacity = i < k ? 1 : .14); } });
  }

  // velocity marquee
  const rows = $$('.vrow').map(r => ({ el: r, x: 0, dir: +r.dataset.dir, w: r.scrollWidth / 2 || 1 }));
  addEventListener('resize', () => rows.forEach(r => r.w = r.el.scrollWidth / 2 || 1));
  let vel = 0, lastY = scrollY;
  gsap.ticker.add(() => {
    if (!marqVisible) return;
    const v = (lenis ? lenis.velocity : (scrollY - lastY)); lastY = scrollY;
    vel += (v - vel) * .1;
    rows.forEach(r => {
      const w = r.w;
      r.x -= r.dir * (1.1 + Math.min(Math.abs(vel), 40) * (finePointer ? .35 : .12));
      if (r.x <= -w) r.x += w; if (r.x > 0) r.x -= w;
      r.el.style.transform = finePointer ? `translate3d(${r.x}px,0,0) skewX(${gsap.utils.clamp(-10, 10, -vel * .35)}deg)` : `translate3d(${r.x}px,0,0)`;
    });
  });

  gsap.from('.ring-bgtext', { scale: .6, opacity: 0, scrollTrigger: { trigger: '#work', start: 'top 80%', end: 'top top', scrub: true } });

  // work grid: clip reveal + inner parallax
  $$('.wcard').forEach((c, i) => {
    gsap.fromTo(c, { clipPath: 'inset(100% 0% 0% 0%)', y: 80 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.4, ease: 'expo.out', delay: (i % 3) * .08, scrollTrigger: { trigger: c, start: 'top 95%', end: 'bottom 2%', toggleActions: IO } });
    const img = c.querySelector('img');
    gsap.fromTo(img, { scale: 1.22, yPercent: -6 }, { scale: 1.08, yPercent: 6, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true, onToggle: s => c.classList.toggle('inview', s.isActive) } });
  });

  // services rows
  $$('.svc-row').forEach((r, i) => gsap.from(r, { x: -70, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 95%', end: 'bottom 3%', toggleActions: IO } }));

  // counters
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: end, duration: 2, ease: 'expo.out', onUpdate: () => el.textContent = Math.round(o.v) + suf }); } });
    gsap.from(el, { yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 94%', end: 'bottom 3%', toggleActions: IO } });
  });

  // process: line draws, cards flip in
  gsap.to('#procLine', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#procList', start: 'top 85%', end: 'bottom 55%', scrub: true } });
  gsap.from('#procList li', { y: 90, rotateX: 35, opacity: 0, transformOrigin: '50% 0%', stagger: .12, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '#procList', start: 'top 88%', end: 'bottom 5%', toggleActions: IO } });

  // reviews + CTA
  gsap.from('#reviewList > *', { y: 80, opacity: 0, rotate: 2, stagger: .12, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '#reviewList', start: 'top 90%', end: 'bottom 5%', toggleActions: IO } });
  gsap.fromTo('#ctaImg', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#ctaBand', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('#ctaBand', { clipPath: 'inset(12% 8% 12% 8% round 32px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '#ctaBand', start: 'top 88%', end: 'bottom 5%', toggleActions: IO } });

  // sew-out hoop spins in
  gsap.from('#hoop', { rotate: -40, scale: .8, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '#process', start: 'top 70%', toggleActions: 'play none none reverse' } });

  // pricing tiers
  gsap.from('.tier', { y: 80, opacity: 0, rotateY: -12, stagger: .1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#tiers', start: 'top 94%', end: 'bottom 3%', toggleActions: IO } });

  // footer wordmark
  queueMicrotask(() => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
  gsap.from('.bigmark .bl', { yPercent: 110, rotate: 8, stagger: .045, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.fitmark', start: 'top 99%', toggleActions: IO } });
}

/* ---------- tilt + glare on price cards ---------- */
document.addEventListener('pointermove', e => {
  if (reduce || !finePointer) return;
  const t = e.target.closest('.tier, .process li'); if (!t) return;
  const r = t.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  t.style.setProperty('--gx', x * 100 + '%'); t.style.setProperty('--gy', y * 100 + '%');
  t.style.transform = `perspective(900px) rotateY(${(x - .5) * 10}deg) rotateX(${-(y - .5) * 10}deg) translateY(-6px)`;
});
document.addEventListener('pointerout', e => { const t = e.target.closest('.tier, .process li'); if (t && !t.contains(e.relatedTarget)) t.style.transform = ''; });

/* ---------- footer wordmark: fit to width so nothing is cut ---------- */
function fitMark() {
  const box = $('.fitmark'), mark = $('.bigmark'); if (!box || !mark) return;
  mark.style.fontSize = '100px';
  const w = mark.scrollWidth;
  mark.style.fontSize = (100 * box.clientWidth / w * .985) + 'px';
}
if (hasGSAP && !reduce) {
  $('.bigmark').addEventListener('pointerenter', () => gsap.fromTo('.bigmark .bl', { yPercent: 0 }, { yPercent: -18, duration: .35, ease: 'power2.out', stagger: .035, yoyo: true, repeat: 1 }));
}

/* ---------- footer terminal ---------- */
(() => {
  const el = $('#termText'); if (!el) return;
  const lines = [
    'punch --artwork logo.png --size 3.5in --fabric pique',
    'underlay --edge-run --zigzag && pullcomp +0.20mm',
    'export --formats DST,PES,EMB,EXP,JEF',
    'ship --to worldwide',
    'status: <span class="ok">READY ✓</span> files delivered in 24h'
  ];
  if (reduce) { el.innerHTML = lines[3]; return; }
  let li = 0;
  const type = () => {
    const raw = lines[li]; const plain = raw.replace(/<[^>]+>/g, '');
    let i = 0;
    const step = () => {
      i++;
      el.textContent = plain.slice(0, i);
      if (i < plain.length) setTimeout(step, 28 + Math.random() * 45);
      else { el.innerHTML = raw; setTimeout(erase, 1700); }
    };
    const erase = () => {
      const t = el.textContent;
      if (t.length) { el.textContent = t.slice(0, -2); setTimeout(erase, 14); }
      else { li = (li + 1) % lines.length; setTimeout(type, 260); }
    };
    step();
  };
  type();
})();

/* ---------- link label roll ---------- */
$$('.nav ul a:not(.btn), .nav ul button, .foot ul a, .foot ul button').forEach(a => {
  const t = a.textContent.trim();
  a.innerHTML = `<span class="roll"><span data-t="${t}">${t}</span></span>`;
});

/* ---------- keep scroll animations measured as images load ---------- */
let stTimer, lastH = 0;
function softRefresh() {
  clearTimeout(stTimer);
  stTimer = setTimeout(() => {
    const h = document.documentElement.scrollHeight;
    if (Math.abs(h - lastH) < 3) return;
    lastH = h;
    if (hasGSAP) ScrollTrigger.refresh();
    buildThread(); onScroll();
  }, 250);
}
document.addEventListener('load', e => { if (e.target.tagName === 'IMG') softRefresh(); }, true);
if (window.ResizeObserver) new ResizeObserver(softRefresh).observe(document.body);

/* ---------- boot ---------- */
let rz;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { fitMark(); buildSew(); if (hasGSAP) ScrollTrigger.refresh(); buildThread(); onScroll(); }, 180); });
renderGrid(); renderReviews(); renderContact(); renderPricing();
fitMark();
route();
magnetize();
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
fontsReady.then(() => {
  fitMark(); buildSew();
  setupScrollFX();
  runLoader(() => { heroIntro(); if (hasGSAP) ScrollTrigger.refresh(); buildThread(); onScroll(); });
});
addEventListener('load', () => { fitMark(); if (hasGSAP) ScrollTrigger.refresh(); buildThread(); onScroll(); });


/* ---------- adaptive quality: if frames run slow, switch 3D to a lighter mode ---------- */
(() => {
  if (window.E1_lowPower) return;
  const d = []; let last = 0, t0 = 0;
  const probe = now => {
    if (last) d.push(now - last);
    last = now;
    if (!t0) t0 = now;
    if (now - t0 < 4000) return requestAnimationFrame(probe);
    d.sort((x, y) => x - y);
    const med = d[Math.floor(d.length / 2)] || 16;
    if (med > 24) { window.E1_lowPower = true; dispatchEvent(new Event('e1:lowpower')); }
  };
  setTimeout(() => requestAnimationFrame(probe), 3500);
})();
