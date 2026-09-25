/* Strato dati degli articoli: legge da WordPress e li consegna puliti alla pagina.

   Cosa fa, in una riga: chiede gli articoli pubblicati all'API REST pubblica di
   WordPress, in anonimo e senza nessuna credenziale, e restituisce oggetti gia
   pronti da mostrare.

   ATTENZIONE, la regola che regge tutto questo file:
   WordPress restituisce HTML gia composto. Quell'HTML lo scrive chi ha accesso
   al pannello, e va trattato come ostile. Prima di uscire da qui ogni pezzo di
   HTML passa da ripulisciHtml(): niente script, niente gestori on*, niente
   javascript: negli href, niente iframe. Chi usa questo file NON deve mai
   prendere il campo "rendered" grezzo dall'API.

   Nessuna stringa di questo file finisce sotto gli occhi di un cittadino:
   i testi visibili li scrive MUSE. Dove serviva un testo c'e un SEGNAPOSTO.

   Stile allineato a iniziative.js e mappa.js: un solo oggetto su window,
   niente librerie, niente build. */

window.Articoli = (function () {
  "use strict";

  /* ---------------------------------------------------------------
     1. Configurazione
     --------------------------------------------------------------- */

  var CFG = {
    /* Radice dell'API REST. Solo lettura, solo endpoint pubblici. */
    base: "https://pannello.screeningitalia.it/wp-json/wp/v2",
    /* Quanti articoli per pagina se la pagina non chiede altro. */
    perPagina: 10,
    /* Oltre questi millisecondi la richiesta si considera persa. */
    attesaMax: 12000
  };

  /* Stati che la pagina deve saper leggere. Sono gli unici valori
     possibili del campo .esito di ogni risposta. */
  var ESITO = {
    OK: "ok",           /* dati validi, almeno un articolo */
    VUOTO: "vuoto",     /* WordPress ha risposto, ma non c'e niente da mostrare */
    OFFLINE: "offline", /* il browser non ha rete, o la rete e caduta */
    ERRORE: "errore"    /* WordPress ha risposto male, o non ha risposto */
  };

  /* ---------------------------------------------------------------
     2. Pulizia dell'HTML che arriva da WordPress
     --------------------------------------------------------------- */

  /* Tag che possono restare. Tutto cio che non e qui dentro sparisce:
     i tag pericolosi con tutto il loro contenuto (vedi TAG_DA_BUTTARE),
     gli altri vengono "scartati" lasciando il testo che contenevano. */
  var TAG_AMMESSI = {
    P: 1, BR: 1, HR: 1, SPAN: 1, DIV: 1,
    STRONG: 1, B: 1, EM: 1, I: 1, U: 1, S: 1, SUP: 1, SUB: 1, MARK: 1,
    H2: 1, H3: 1, H4: 1, H5: 1, H6: 1,
    UL: 1, OL: 1, LI: 1, DL: 1, DT: 1, DD: 1,
    BLOCKQUOTE: 1, CITE: 1, CODE: 1, PRE: 1,
    A: 1, IMG: 1, FIGURE: 1, FIGCAPTION: 1,
    TABLE: 1, THEAD: 1, TBODY: 1, TFOOT: 1, TR: 1, TH: 1, TD: 1, CAPTION: 1
  };

  /* Questi non si scartano: si buttano insieme a tutto quello che hanno
     dentro. Sono i vettori veri: esecuzione di codice, contenuto di terzi
     dentro la nostra pagina, moduli che rubano dati, CSS che copre lo schermo. */
  var TAG_DA_BUTTARE = {
    SCRIPT: 1, STYLE: 1, IFRAME: 1, FRAME: 1, FRAMESET: 1, OBJECT: 1,
    EMBED: 1, APPLET: 1, FORM: 1, INPUT: 1, BUTTON: 1, SELECT: 1,
    TEXTAREA: 1, OPTION: 1, LINK: 1, META: 1, BASE: 1, TEMPLATE: 1,
    NOSCRIPT: 1, SVG: 1, MATH: 1, AUDIO: 1, VIDEO: 1, SOURCE: 1,
    TRACK: 1, CANVAS: 1, DIALOG: 1, PORTAL: 1
  };

  /* Attributi ammessi, tag per tag. Tutto il resto viene tolto.
     Nota: "style" NON e ammesso (si puo usare per coprire la pagina e
     far cliccare il cittadino su altro), "class" NON e ammesso (le classi
     di WordPress non sono le nostre e non devono pescare il nostro CSS),
     e nessun "data-*" passa. */
  var ATTR_AMMESSI = {
    A: { href: 1, title: 1 },
    IMG: { src: 1, alt: 1, width: 1, height: 1, loading: 1 },
    TD: { colspan: 1, rowspan: 1 },
    TH: { colspan: 1, rowspan: 1, scope: 1 },
    OL: { start: 1 }
  };

  /* Protocolli che un link puo usare. Fuori da qui il link viene disinnescato
     (si toglie l'href e resta il testo): cosi muore javascript:, data:, vbscript:. */
  var PROTOCOLLI_AMMESSI = { "http:": 1, "https:": 1, "mailto:": 1, "tel:": 1 };

  /* Toglie spazi, a-capo e caratteri di controllo che servono solo a
     mascherare un protocollo (per esempio "java\tscript:alert(1)"). */
  function normalizzaUrl(valore) {
    return String(valore == null ? "" : valore).replace(new RegExp("[\\s\\u0000-\\u0020\\u007f\\u00a0\\u2028\\u2029]", "g"), "");
  }

  /* Vero se l'URL e sicuro da mettere in un href o in un src. */
  function urlSicuro(valore, soloHttp) {
    var grezzo = normalizzaUrl(valore);
    if (!grezzo) { return false; }
    /* Ancora interna alla pagina: innocua. */
    if (grezzo.charAt(0) === "#") { return !soloHttp; }
    var u;
    try {
      /* La base serve a risolvere i percorsi relativi ("/wp-content/..."). */
      u = new URL(grezzo, CFG.base);
    } catch (e) {
      return false;
    }
    if (soloHttp) { return u.protocol === "http:" || u.protocol === "https:"; }
    return PROTOCOLLI_AMMESSI[u.protocol] === 1;
  }

  /* Ripulisce un frammento di HTML e restituisce HTML di nuovo, ma sicuro.

     Come funziona: DOMParser costruisce un documento INERTE. In un documento
     inerte gli script non partono, le immagini non vengono scaricate e quindi
     un <img onerror> non si attiva mentre lo stiamo esaminando. Camminiamo
     l'albero, buttiamo cio che va buttato, e ricomponiamo l'HTML. */
  function ripulisciHtml(html) {
    var sorgente = String(html == null ? "" : html);
    if (!sorgente) { return ""; }
    if (typeof DOMParser === "undefined") {
      /* Browser senza DOMParser: non sappiamo ripulire, quindi non
         restituiamo HTML. Meglio niente che HTML non controllato. */
      return "";
    }

    var doc;
    try {
      doc = new DOMParser().parseFromString("<body>" + sorgente + "</body>", "text/html");
    } catch (e) {
      return "";
    }
    if (!doc || !doc.body) { return ""; }

    pulisciNodo(doc.body);
    return doc.body.innerHTML;
  }

  /* Cammina i figli di un nodo e li sistema. Si scorre all'indietro perche
     rimuoviamo e sostituiamo elementi mentre andiamo. */
  function pulisciNodo(padre) {
    var figli = padre.childNodes;
    for (var i = figli.length - 1; i >= 0; i--) {
      var n = figli[i];

      /* Commenti e ogni nodo che non sia testo o elemento: via.
         (i commenti di WordPress contengono la struttura dei blocchi,
         non serve a noi e non deve arrivare in pagina) */
      if (n.nodeType === 8) { padre.removeChild(n); continue; }
      if (n.nodeType === 3) { continue; }           /* testo: va bene cosi */
      if (n.nodeType !== 1) { padre.removeChild(n); continue; }

      var tag = n.tagName ? n.tagName.toUpperCase() : "";

      /* 1. Tag pericoloso: si butta con tutto il contenuto. */
      if (TAG_DA_BUTTARE[tag] === 1) { padre.removeChild(n); continue; }

      /* 2. Tag sconosciuto ma non pericoloso: si tiene il testo e si
            butta l'involucro (per esempio un <custom-elem>). */
      if (TAG_AMMESSI[tag] !== 1) {
        pulisciNodo(n);
        while (n.firstChild) { padre.insertBefore(n.firstChild, n); }
        padre.removeChild(n);
        continue;
      }

      /* 3. Tag ammesso: si potano gli attributi. */
      pulisciAttributi(n, tag);

      /* 4. Si scende nei figli. */
      pulisciNodo(n);
    }
  }

  function pulisciAttributi(el, tag) {
    var ammessi = ATTR_AMMESSI[tag] || {};
    var attrs = el.attributes;
    for (var i = attrs.length - 1; i >= 0; i--) {
      var nome = attrs[i].name.toLowerCase();
      var valore = attrs[i].value;

      /* Ogni gestore di evento se ne va, sempre e comunque. */
      if (nome.indexOf("on") === 0) { el.removeAttribute(attrs[i].name); continue; }

      if (ammessi[nome] !== 1) { el.removeAttribute(attrs[i].name); continue; }

      if (nome === "href" && !urlSicuro(valore, false)) {
        el.removeAttribute("href");
        continue;
      }
      if (nome === "src" && !urlSicuro(valore, true)) {
        /* Immagine con sorgente non http(s): l'immagine non ha piu senso,
           si butta l'elemento intero. */
        if (el.parentNode) { el.parentNode.removeChild(el); }
        return;
      }
    }

    /* Un link che resta senza href e solo testo: coerente e innocuo.
       Un link che esce dal nostro dominio non deve poter parlare con
       la pagina che lascia. */
    if (tag === "A" && el.getAttribute("href")) {
      el.setAttribute("rel", "noopener noreferrer");
    }
    /* L'immagine senza alt e un buco di accessibilita: alt vuoto
       la marca come decorativa invece di lasciarla muta. */
    if (tag === "IMG" && el.getAttribute("alt") === null) {
      el.setAttribute("alt", "");
    }
  }

  /* Da HTML a testo semplice: serve per titolo ed estratto, dove non
     vogliamo marcatura ma vogliamo le entita decodificate (&egrave; -> e accentata). */
  function soloTesto(html) {
    var sorgente = String(html == null ? "" : html);
    if (!sorgente) { return ""; }
    if (typeof DOMParser === "undefined") {
      return sorgente.replace(/<[^>]*>/g, "").trim();
    }
    try {
      var doc = new DOMParser().parseFromString("<body>" + sorgente + "</body>", "text/html");
      return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    } catch (e) {
      return "";
    }
  }

  /* ---------------------------------------------------------------
     3. Dialogo con WordPress
     --------------------------------------------------------------- */

  /* Una sola porta verso la rete: passa tutto da qui.
     Restituisce una promessa che NON viene mai rifiutata: torna sempre un
     oggetto con .esito, cosi la pagina non puo rompersi per una eccezione
     non raccolta. */
  function chiediUnaVolta(percorso, parametri) {
    var q = [];
    var chiavi = Object.keys(parametri || {});
    for (var i = 0; i < chiavi.length; i++) {
      var v = parametri[chiavi[i]];
      if (v === undefined || v === null || v === "") { continue; }
      q.push(encodeURIComponent(chiavi[i]) + "=" + encodeURIComponent(v));
    }
    /* Marcatore di freschezza: WordPress risponde con Cache-Control di 7
       giorni, e senza questo il browser servirebbe per giorni la lista
       vecchia dopo che Angelo ha pubblicato. Cambia ogni 5 minuti. */
    q.push("_f=" + Math.floor(Date.now() / 300000));

    var url = CFG.base + percorso + (q.length ? "?" + q.join("&") : "");

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return Promise.resolve({ esito: ESITO.OFFLINE, dati: null, intestazioni: null });
    }
    if (typeof fetch !== "function") {
      return Promise.resolve({ esito: ESITO.ERRORE, dati: null, intestazioni: null });
    }

    var stop = null;
    var sveglia = null;
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
      if (!r.ok) {
        return { esito: ESITO.ERRORE, dati: null, intestazioni: null, stato: r.status };
      }
      return r.json().then(function (dati) {
        return {
          esito: ESITO.OK,
          dati: dati,
          intestazioni: {
            totale: parseInt(r.headers.get("X-WP-Total"), 10) || 0,
            pagine: parseInt(r.headers.get("X-WP-TotalPages"), 10) || 0
          }
        };
      }, function () {
        /* Risposta 200 ma non e JSON: succede quando davanti c'e una
           pagina di errore dell'hosting. */
        return { esito: ESITO.ERRORE, dati: null, intestazioni: null };
      });
    }, function (e) {
      if (sveglia) { clearTimeout(sveglia); }
      var giu = (typeof navigator !== "undefined" && navigator.onLine === false);
      return { esito: giu ? ESITO.OFFLINE : ESITO.ERRORE, dati: null, intestazioni: null,
               scaduta: !!(e && e.name === "AbortError") };
    });
  }

  /* Un secondo tentativo, uno solo. Il WordPress su Hostinger, quando riceve
     molte richieste insieme, risponde 500 «Error establishing a database
     connection» senza intestazioni CORS: il browser la vede come errore di
     rete. Si riprova dopo una breve pausa su errore di rete o 5xx; mai su
     4xx (risposta vera), mai dopo i 12 s di attesa scaduti, mai offline
     (SENTINEL, 25/09/2026). */
  function chiedi(percorso, parametri) {
    return chiediUnaVolta(percorso, parametri).then(function (r) {
      if (r.esito !== ESITO.ERRORE || r.scaduta || (r.stato && r.stato < 500)) { return r; }
      return new Promise(function (ok) {
        setTimeout(ok, 700 + Math.floor(Math.random() * 600));
      }).then(function () { return chiediUnaVolta(percorso, parametri); });
    });
  }

  /* ---------------------------------------------------------------
     4. Da risposta WordPress a oggetto articolo
     --------------------------------------------------------------- */

  /* Estrae l'immagine in evidenza dai dati incorporati (_embed).
     Torna null se l'articolo non ha immagine: e un caso normale,
     non un errore, e la pagina deve saperlo gestire. */
  function leggiImmagine(post) {
    var inc = post && post._embedded;
    var lista = inc && inc["wp:featuredmedia"];
    if (!lista || !lista.length) { return null; }
    var m = lista[0];
    /* Quando l'immagine non e leggibile, WordPress mette qui un oggetto
       di errore invece del media. */
    if (!m || m.code || !m.source_url) { return null; }
    if (!urlSicuro(m.source_url, true)) { return null; }

    var misure = (m.media_details && m.media_details.sizes) || {};
    function taglia(nome) {
      var s = misure[nome];
      if (!s || !s.source_url || !urlSicuro(s.source_url, true)) { return null; }
      return { url: s.source_url, larghezza: s.width || null, altezza: s.height || null };
    }

    return {
      url: m.source_url,
      /* alt come lo ha scritto Angelo, ripulito da qualsiasi marcatura.
         Se e vuoto, resta vuoto: NON inventiamo un testo alternativo. */
      alt: soloTesto(m.alt_text || ""),
      larghezza: (m.media_details && m.media_details.width) || null,
      altezza: (m.media_details && m.media_details.height) || null,
      /* Versioni piu leggere, quando WordPress le ha generate. */
      taglie: {
        piccola: taglia("medium"),
        media: taglia("medium_large") || taglia("large"),
        grande: taglia("large") || taglia("full")
      }
    };
  }

  /* Estrae le categorie dai dati incorporati. Sempre un array, anche vuoto. */
  function leggiCategorie(post) {
    var inc = post && post._embedded;
    var gruppi = inc && inc["wp:term"];
    var fuori = [];
    if (!gruppi || !gruppi.length) { return fuori; }
    for (var g = 0; g < gruppi.length; g++) {
      var gruppo = gruppi[g];
      if (!gruppo || !gruppo.length) { continue; }
      for (var i = 0; i < gruppo.length; i++) {
        var t = gruppo[i];
        if (!t || t.taxonomy !== "category") { continue; }
        fuori.push({ id: t.id, nome: soloTesto(t.name), slug: String(t.slug || "") });
      }
    }
    return fuori;
  }

  /* Trasforma un post grezzo di WordPress nell'oggetto che la pagina usa.
     Da qui in poi nessun campo contiene HTML non controllato. */
  function componiArticolo(post) {
    if (!post || typeof post !== "object") { return null; }
    var contenuto = (post.content && post.content.rendered) || "";
    var estratto = (post.excerpt && post.excerpt.rendered) || "";

    return {
      id: post.id,
      slug: String(post.slug || ""),
      /* Testo semplice, entita gia decodificate: si stampa con textContent. */
      titolo: soloTesto((post.title && post.title.rendered) || ""),
      /* Data grezza in formato ISO. La formattazione in italiano NON la
         faccio qui: e testo che il cittadino legge, quindi e di MUSE/LORI. */
      dataIso: post.date_gmt ? post.date_gmt + "Z" : (post.date || ""),
      dataModificaIso: post.modified_gmt ? post.modified_gmt + "Z" : (post.modified || ""),
      /* Estratto senza marcatura: sta nelle schede di elenco. */
      estratto: soloTesto(estratto),
      /* Testo completo: HTML RIPULITO. Si inserisce con innerHTML solo
         perche e passato da ripulisciHtml(). */
      testoHtml: ripulisciHtml(contenuto),
      /* Lo stesso testo senza marcatura: utile per meta description o ricerca. */
      testoSemplice: soloTesto(contenuto),
      /* null quando non c'e immagine in evidenza. */
      immagine: leggiImmagine(post),
      categorie: leggiCategorie(post),
      /* Vero se l'articolo e protetto da password: il contenuto arriva vuoto
         e la pagina non deve mostrare una scheda muta. */
      protetto: !!(post.content && post.content.protected)
    };
  }

  /* ---------------------------------------------------------------
     5. Quello che la pagina chiama
     --------------------------------------------------------------- */

  /* Elenco degli articoli pubblicati, con paginazione e filtro per categoria.

     opz = {
       pagina: 1,              numero di pagina, parte da 1
       perPagina: 10,          quanti per pagina (max 100, lo impone WordPress)
       categoria: "prevenzione" oppure 3    slug o id della categoria
     }

     Risposta (sempre, anche in errore):
     {
       esito: "ok" | "vuoto" | "offline" | "errore",
       articoli: [ ... ],      array, mai null: vuoto quando esito non e "ok"
       pagina: 1,
       pagine: 3,              totale pagine disponibili
       totale: 27              totale articoli
     } */
  function lista(opz) {
    var o = opz || {};
    var pagina = Math.max(1, parseInt(o.pagina, 10) || 1);
    var perPagina = Math.min(100, Math.max(1, parseInt(o.perPagina, 10) || CFG.perPagina));

    function vuoto(esito) {
      return { esito: esito, articoli: [], pagina: pagina, pagine: 0, totale: 0 };
    }

    return risolviCategoria(o.categoria).then(function (idCategoria) {
      /* Categoria chiesta ma inesistente: non e un errore di rete,
         semplicemente non c'e niente da mostrare. */
      if (o.categoria && idCategoria === null) { return vuoto(ESITO.VUOTO); }

      return chiedi("/posts", {
        page: pagina,
        per_page: perPagina,
        status: "publish",          /* solo pubblicati: le bozze di Angelo restano sue */
        orderby: "date",
        order: "desc",
        categories: idCategoria,
        _embed: "wp:featuredmedia,wp:term"
      }).then(function (r) {
        /* WordPress risponde 400 quando si chiede una pagina che non esiste
           (per esempio pagina 9 su 3). Per il cittadino non e un guasto:
           e una pagina senza articoli. */
        if (r.esito === ESITO.ERRORE && r.stato === 400) { return vuoto(ESITO.VUOTO); }
        if (r.esito !== ESITO.OK) { return vuoto(r.esito); }
        if (!Array.isArray(r.dati)) { return vuoto(ESITO.ERRORE); }
        if (r.dati.length === 0) { return vuoto(ESITO.VUOTO); }

        var fuori = [];
        for (var i = 0; i < r.dati.length; i++) {
          var a = componiArticolo(r.dati[i]);
          if (a) { fuori.push(a); }
        }
        if (!fuori.length) { return vuoto(ESITO.VUOTO); }

        return {
          esito: ESITO.OK,
          articoli: fuori,
          pagina: pagina,
          pagine: r.intestazioni.pagine || 1,
          totale: r.intestazioni.totale || fuori.length
        };
      });
    });
  }

  /* Un solo articolo, cercato per slug (la parte leggibile dell'indirizzo).

     Risposta:
     { esito: "ok" | "vuoto" | "offline" | "errore", articolo: {...} | null }
     "vuoto" significa: WordPress ha risposto, quello slug non esiste
     (e il caso da trattare come 404 di pagina). */
  function perSlug(slug) {
    var s = String(slug == null ? "" : slug).trim();
    if (!s) { return Promise.resolve({ esito: ESITO.VUOTO, articolo: null }); }

    return chiedi("/posts", {
      slug: s,
      status: "publish",
      per_page: 1,
      _embed: "wp:featuredmedia,wp:term"
    }).then(function (r) {
      if (r.esito !== ESITO.OK) { return { esito: r.esito, articolo: null }; }
      if (!Array.isArray(r.dati) || r.dati.length === 0) {
        return { esito: ESITO.VUOTO, articolo: null };
      }
      var a = componiArticolo(r.dati[0]);
      if (!a) { return { esito: ESITO.ERRORE, articolo: null }; }
      return { esito: ESITO.OK, articolo: a };
    });
  }

  /* Elenco delle categorie che hanno almeno un articolo pubblicato.
     Serve a costruire il filtro senza mostrare voci che portano al vuoto.

     Risposta:
     { esito: ..., categorie: [ { id, nome, slug, quanti } ] } */
  function categorie() {
    return chiedi("/categories", {
      per_page: 100,
      orderby: "name",
      order: "asc",
      hide_empty: true
    }).then(function (r) {
      if (r.esito !== ESITO.OK) { return { esito: r.esito, categorie: [] }; }
      if (!Array.isArray(r.dati)) { return { esito: ESITO.ERRORE, categorie: [] }; }
      var fuori = [];
      for (var i = 0; i < r.dati.length; i++) {
        var c = r.dati[i];
        if (!c || !c.slug) { continue; }
        if (!c.count) { continue; }
        fuori.push({
          id: c.id,
          nome: soloTesto(c.name),
          slug: String(c.slug),
          quanti: c.count
        });
      }
      return { esito: fuori.length ? ESITO.OK : ESITO.VUOTO, categorie: fuori };
    });
  }

  /* La categoria puo arrivare come id numerico o come slug. WordPress filtra
     per id, quindi lo slug va tradotto. Il risultato resta in memoria per
     tutta la visita: sono dati che non cambiano durante una lettura. */
  var memoriaCategorie = null;

  function risolviCategoria(categoria) {
    if (categoria === undefined || categoria === null || categoria === "") {
      return Promise.resolve(undefined);
    }
    var n = parseInt(categoria, 10);
    if (!isNaN(n) && String(n) === String(categoria).trim()) {
      return Promise.resolve(n);
    }
    var slug = String(categoria).trim().toLowerCase();

    if (memoriaCategorie) {
      return Promise.resolve(memoriaCategorie[slug] !== undefined ? memoriaCategorie[slug] : null);
    }
    return categorie().then(function (r) {
      if (r.esito === ESITO.OFFLINE || r.esito === ESITO.ERRORE) {
        /* Non sappiamo tradurre: meglio non filtrare per una categoria
           sbagliata. Si propaga l'errore restituendo null. */
        return null;
      }
      memoriaCategorie = {};
      for (var i = 0; i < r.categorie.length; i++) {
        memoriaCategorie[r.categorie[i].slug] = r.categorie[i].id;
      }
      return memoriaCategorie[slug] !== undefined ? memoriaCategorie[slug] : null;
    });
  }

  /* ---------------------------------------------------------------
     6. Superficie pubblica
     --------------------------------------------------------------- */

  return {
    ESITO: ESITO,
    CFG: CFG,
    lista: lista,
    perSlug: perSlug,
    categorie: categorie,
    /* Esposta apposta: se la pagina riceve HTML da qualunque altra
       fonte WordPress, lo fa passare da qui prima di metterlo in innerHTML. */
    ripulisciHtml: ripulisciHtml,
    soloTesto: soloTesto
  };
})();
