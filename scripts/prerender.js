// Pre-render: scrive in _pre/ una copia di index.html per ogni rotta, con il testo gia dentro.
// Chi non esegue JS (crawler AI, anteprime, lettori) legge titolo, testi e link veri.
// Con JS la pagina va come prima: React monta, il blocco #si-pre sparisce nello stesso istante.
// Uso: node scripts/prerender.js [url-base] [rotta ...]   (serve un server statico che replica .htaccess)
// Richiede playwright-core e Google Chrome. Niente testi scritti a mano: tutto esce dalla pagina vera.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const root = path.join(__dirname, '..');
const base = (process.argv[2] || 'http://localhost:8099').replace(/\/$/, '');
const solo = process.argv.slice(3);

const shell = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const dalSitemap = [...sitemap.matchAll(/<loc>https:\/\/screeningitalia\.it([^<]*)<\/loc>/g)].map(m => m[1] || '/');

// i CSS del helmet (nello <template>): servono nell'head statico perche il blocco sia vestito prima di React
const css = [...shell.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const SCRIPT_SPARISCI = '<script>(function(){var o=new MutationObserver(function(){if(document.querySelector("#dc-root .sc-host")){var p=document.getElementById("si-pre");if(p)p.remove();o.disconnect()}});o.observe(document.documentElement,{childList:true,subtree:true})})();</script>';
const STILE_NASCONDI = '<style>#si-pre~#dc-root{height:0;overflow:hidden}</style>';

function nomeFile(r) { return r === '/' ? 'home.html' : r.replace(/^\//, '') + '.html'; }

async function rotte(b) {
  if (solo.length) return solo;
  const p = await (await b.newContext()).newPage();
  await p.goto(base + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1500);
  const extra = await p.evaluate(async () => {
    const out = { reg: [], art: [] };
    try { out.reg = Object.keys((window.REGIONI_ITALIA || {}).regioni || {}); } catch (e) {}
    try {
      const r = await window.Articoli.lista({ pagina: 1, perPagina: 100 });
      out.art = (r.articoli || []).map(a => a.slug).filter(Boolean);
    } catch (e) {}
    return out;
  });
  await p.context().close();
  const tutte = new Set(dalSitemap);
  extra.reg.forEach(n => tutte.add('/regione/' + encodeURIComponent(n)));
  extra.art.forEach(s => tutte.add('/articolo/' + s));
  return [...tutte];
}

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const lista = await rotte(b);
  fs.mkdirSync(path.join(root, '_pre'), { recursive: true });
  const esiti = [];
  for (const r of lista) {
    const c = await b.newContext();
    const p = await c.newPage();
    await p.goto(base + r, { waitUntil: 'networkidle', timeout: 60000 });
    await p.waitForTimeout(1500);
    const d = await p.evaluate(() => {
      const host = document.querySelector('#dc-root > .sc-host');
      if (!host) return null;
      const cl = host.cloneNode(true);
      cl.querySelectorAll('script,noscript,template,.ck,.ck-pannello').forEach(e => e.remove());
      cl.querySelectorAll('[data-dc-tpl]').forEach(e => e.removeAttribute('data-dc-tpl'));
      const m = s => { const e = document.head.querySelector(s); return e ? e.getAttribute('content') || e.getAttribute('href') : null; };
      return {
        html: cl.outerHTML, title: document.title,
        desc: m('meta[name=description]'), canon: m('link[rel=canonical]'), ogt: m('meta[property="og:title"]'), ogd: m('meta[property="og:description"]'), ogu: m('meta[property="og:url"]')
      };
    });
    await c.close();
    if (!d || d.html.includes('{{')) { esiti.push([r, 'SALTATA (vuota o con segnaposto)']); continue; }
    let out = shell;
    out = out.replace(/<title>[^<]*<\/title>/, '<title>' + esc(d.title).replace(/&quot;/g, '"') + '</title>');
    const setMeta = (re, val, tag) => { if (val != null) out = out.replace(re, tag(esc(val))); };
    setMeta(/<meta name="description" content="[^"]*">/, d.desc, v => '<meta name="description" content="' + v + '">');
    setMeta(/<meta property="og:title" content="[^"]*">/, d.ogt || d.title, v => '<meta property="og:title" content="' + v + '">');
    setMeta(/<meta property="og:description" content="[^"]*">/, d.ogd || d.desc, v => '<meta property="og:description" content="' + v + '">');
    const url = 'https://screeningitalia.it' + (r === '/' ? '/' : r);
    out = out.replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + url + '">');
    if (!/rel="canonical"/.test(out)) out = out.replace('<base href="/">', '<link rel="canonical" href="' + url + '">\n<base href="/">');
    else out = out.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + url + '">');
    const head = css.map(h => '<link rel="stylesheet" href="' + h + '">').join('\n') + '\n' + STILE_NASCONDI + '\n';
    out = out.replace('</head>', head + '</head>');
    out = out.replace('<body>\n<x-dc>', '<body>\n<div id="si-pre">' + d.html + '</div>\n' + SCRIPT_SPARISCI + '\n<x-dc>');
    if (!out.includes('id="si-pre"')) throw new Error('inserimento fallito su ' + r);
    const f = path.join(root, '_pre', nomeFile(r));
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, out);
    esiti.push([r, 'ok ' + (out.length / 1024).toFixed(0) + ' KB']);
  }
  await b.close();
  esiti.forEach(e => console.log(e.join('  ')));
})();
