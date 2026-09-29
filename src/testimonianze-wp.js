/* Testimonianze vere: le legge da WordPress, categoria «Testimonianze».

   Cosa fa, in una riga: chiede all'API REST pubblica di WordPress, in anonimo
   e senza nessuna credenziale, gli articoli pubblicati nella categoria con slug
   «testimonianze», li controlla uno per uno e mette in window.__siTesti.storie
   solo quelli che passano. Blocco 3, SENTINEL 29/09/2026.

   Dove sta cosa, in WordPress:
     titolo    -> nome o pseudonimo
     riassunto -> fascia d'eta e regione (riassunto SCRITTO a mano: quello che
                  WordPress genera da solo dal testo non vale, la storia si scarta)
     contenuto -> la storia

   La regola che regge il file: tutto e TESTO, mai HTML. Il contenuto passa da
   DOMParser (documento inerte: niente script, niente immagini scaricate) e ne
   esce solo il testo, a paragrafi. Link, immagini, stili: spariscono.

   Zero storie (o WordPress che non risponde) = storie vuote: la pagina toglie
   la fascia in home, la pagina #/testimonianze e le voci di menu.
   Schede di prova: NON stanno qui. Stanno nella cartella src/prove/,
   che nessun file del sito carica e che quindi non va in deploy (LORI, giro 1
   blocco 3). Quel file, caricato a mano in locale, chiama provaEsempi() qui
   sotto; fuori da screeningitalia.it le sue schede prendono il posto di
   WordPress. In produzione provaEsempi() non fa niente.

   La pagina si accorge del cambio tramite window.__siTestiVer
   (logica-classe.js, il giro del "tick").

   Nessuna stringa di questo file finisce sotto gli occhi di un cittadino,
   a parte le schede di prova, che in produzione non esistono. */

(function () {
  "use strict";

  var CFG = {
    /* Radice dell'API REST. Solo lettura, solo endpoint pubblici. */
    base: "https://pannello.screeningitalia.it/wp-json/wp/v2",
    categoria: "testimonianze",
    /* Una pagina sola: sopra le 20 storie la pagina va ripensata (brief LORI §1.5). */
    perPagina: 100,
    attesaMax: 12000,
    /* Stesso schema di iniziative-wp.js: in produzione niente esempi. */
    riservaEsempi: !/^(www\.)?screeningitalia\.it$/.test(location.hostname)
  };

  window.__siTesti = { stato: "attesa", storie: [], fonte: "" };

  /* ---------------------------------------------------------------
     1. Pulizia
     --------------------------------------------------------------- */

  function documento(html) {
    var s = String(html == null ? "" : html);
    if (!s || typeof DOMParser === "undefined") { return null; }
    try {
      return new DOMParser().parseFromString("<body>" + s + "</body>", "text/html");
    } catch (e) {
      return null;
    }
  }

  function soloTesto(html) {
    var doc = documento(html);
    if (!doc) { return ""; }
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  /* Il contenuto a paragrafi di testo semplice. I blocchi di testo (p, li,
     titoli) danno un paragrafo ciascuno; un <br> spezza il paragrafo.
     Se non ci sono blocchi, vale il testo intero, spezzato agli a-capo. */
  function paragrafi(html) {
    var doc = documento(html);
    if (!doc) { return []; }
    var corpo = doc.body;
    /* Via subito cio che non e testo della persona. */
    Array.prototype.forEach.call(
      corpo.querySelectorAll("script,style,template,noscript,iframe,object,embed,svg,math,figure,img,video,audio,form"),
      function (n) { if (n.parentNode) { n.parentNode.removeChild(n); } }
    );
    Array.prototype.forEach.call(corpo.querySelectorAll("br"), function (n) {
      n.parentNode.replaceChild(doc.createTextNode("\n"), n);
    });
    var blocchi = corpo.querySelectorAll("p,li,h1,h2,h3,h4,h5,h6");
    var grezzi = [];
    if (blocchi.length) {
      Array.prototype.forEach.call(blocchi, function (b) {
        /* Un blocco dentro un altro blocco non si conta due volte. */
        if (b.parentNode && b.parentNode.closest && b.parentNode.closest("p,li,h1,h2,h3,h4,h5,h6")) { return; }
        grezzi.push(b.textContent || "");
      });
    } else {
      grezzi.push(corpo.textContent || "");
    }
    var fuori = [];
    grezzi.forEach(function (g) {
      g.split(/\n+/).forEach(function (r) {
        var t = r.replace(/\s+/g, " ").trim();
        if (t) { fuori.push(t); }
      });
    });
    return fuori;
  }

  /* WordPress, se il riassunto e vuoto, ne fabbrica uno con le prime parole
     del testo. Quello non e la riga «fascia d'eta e regione»: si riconosce
     perche coincide con l'inizio del contenuto. */
  function riassuntoAutomatico(riassunto, testoPieno) {
    var norm = function (s) {
      return String(s || "").replace(/\s*(\[\s*(…|\.\.\.)\s*\]|…)\s*$/, "").replace(/\s+/g, " ").trim().toLowerCase();
    };
    var r = norm(riassunto);
    return !!r && norm(testoPieno).indexOf(r) === 0;
  }

  /* ---------------------------------------------------------------
     2. Da post di WordPress a storia
     --------------------------------------------------------------- */

  function componi(post) {
    if (!post || typeof post !== "object") { return null; }
    if (post.content && post.content.protected) { return null; }
    var html = (post.content && post.content.rendered) || "";
    var par = paragrafi(html);
    var riga = soloTesto(post.excerpt && post.excerpt.rendered);
    if (riassuntoAutomatico(riga, par.join(" "))) { riga = ""; }
    var x = {
      id: typeof post.id === "number" ? post.id : 0,
      nome: soloTesto(post.title && post.title.rendered),
      riga: riga,
      paragrafi: par,
      dataIso: post.date_gmt ? post.date_gmt + "Z" : ""
    };
    var manca = [];
    if (!x.id) { manca.push("id"); }
    if (!x.nome) { manca.push("titolo (nome)"); }
    if (!x.riga) { manca.push("riassunto (fascia d'eta e regione)"); }
    if (!x.paragrafi.length) { manca.push("contenuto"); }
    if (manca.length) {
      console.warn("Testimonianza scartata (" + (post.id || "?") + "): manca " + manca.join(", "));
      return null;
    }
    return x;
  }

  /* ---------------------------------------------------------------
     3. Dialogo con WordPress
     --------------------------------------------------------------- */

  function chiedi(percorso, q) {
    q.push("_f=" + Math.floor(Date.now() / 300000));  /* stessa cache di articoli.js */
    var url = CFG.base + percorso + "?" + q.join("&");
    if (typeof fetch !== "function") { return Promise.resolve(null); }
    if (typeof navigator !== "undefined" && navigator.onLine === false) { return Promise.resolve(null); }
    var stop = null, sveglia = null;
    if (typeof AbortController === "function") {
      stop = new AbortController();
      sveglia = setTimeout(function () { stop.abort(); }, CFG.attesaMax);
    }
    return fetch(url, {
      method: "GET",
      /* Nessuna credenziale parte da qui: la lettura e anonima e deve restarlo. */
      credentials: "omit",
      mode: "cors",
      cache: "no-store",
      headers: { "Accept": "application/json" },
      signal: stop ? stop.signal : undefined
    }).then(function (r) {
      if (sveglia) { clearTimeout(sveglia); }
      if (!r.ok) { return null; }
      return r.json().then(function (d) { return Array.isArray(d) ? d : null; }, function () { return null; });
    }, function () {
      if (sveglia) { clearTimeout(sveglia); }
      return null;
    });
  }

  /* Torna l'elenco dei post (anche vuoto) o null se WordPress non risponde. */
  function chiediStorie() {
    return chiedi("/categories", ["slug=" + CFG.categoria, "_fields=id,slug"]).then(function (cat) {
      if (!cat) { return null; }
      var c = cat.filter(function (x) { return x && x.slug === CFG.categoria && typeof x.id === "number"; })[0];
      if (!c) { return []; }   /* categoria assente: zero storie, non un guasto */
      return chiedi("/posts", [
        "categories=" + c.id,
        "status=publish",
        "per_page=" + CFG.perPagina,
        "orderby=date",
        "order=desc",
        /* Solo i campi che servono: meno byte, meno dati esposti. */
        "_fields=id,date_gmt,title,excerpt,content"
      ]);
    });
  }

  /* ---------------------------------------------------------------
     4. Schede di prova (solo fuori produzione)
     --------------------------------------------------------------- */

  /* Le schede arrivano dal file di prova in src/prove/ (mai in deploy).
     Da quel momento la risposta di WordPress non le sovrascrive piu. */
  var inProva = false;
  function provaEsempi(storie) {
    if (!CFG.riservaEsempi || !Array.isArray(storie)) { return false; }
    inProva = true;
    consegna(storie.filter(function (x) {
      return x && x.nome && x.riga && Array.isArray(x.paragrafi) && x.paragrafi.length;
    }), "esempi");
    return true;
  }

  /* ---------------------------------------------------------------
     5. Consegna alla pagina
     --------------------------------------------------------------- */

  function consegna(storie, fonte) {
    window.__siTesti = { stato: "fatto", storie: storie, fonte: fonte };
    window.__siTestiVer = (window.__siTestiVer || 0) + 1;
  }

  /* Esposto per le prove: provaEsempi lo usa il file di prova in src/prove/. */
  window.TestimonianzeWP = { CFG: CFG, componi: componi, paragrafi: paragrafi, provaEsempi: provaEsempi };

  /* Se il file di prova e stato caricato prima di questo, ha lasciato le schede qui. */
  if (Array.isArray(window.__siTestiProva)) { provaEsempi(window.__siTestiProva); }

  chiediStorie().then(function (posts) {
    if (inProva) { return; }
    var buone = [];
    (posts || []).forEach(function (p) { var x = componi(p); if (x) { buone.push(x); } });
    if (buone.length) { consegna(buone, "wordpress"); return; }
    consegna([], posts ? "wordpress: nessuna storia" : "wordpress non raggiungibile");
  }, function () {
    if (inProva) { return; }
    consegna([], "errore imprevisto");
  });
})();
