/* Centri screening delle ASL: li legge da WordPress (tipo di contenuto «centro»).

   Note di Angelo, 17/10/2026: una sezione con le schede dei centri screening
   delle ASL, regione per regione. I dati li inserisce Angelo dal pannello.

   Cosa fa, in una riga: chiede i centri pubblicati all'API REST pubblica di
   WordPress, in anonimo, li controlla uno per uno e mette in
   window.__siCentri.lista solo quelli che passano. Ogni valore e TESTO, mai HTML.

   Obbligatori: nome (titolo del post) e regione. Tutto il resto e facoltativo
   e la scheda mostra solo le righe che ci sono.

   Nessun esempio: un recapito finto di un centro vero e un cittadino che
   chiama il numero sbagliato. Zero centri, o WordPress che non risponde =
   lista vuota: la voce di menu non esce e la pagina mostra lo stato vuoto.

   La pagina si accorge del cambio tramite window.__siCentriVer
   (logica-classe.js, il giro del "tick"). */

(function () {
  "use strict";

  var CFG = {
    base: "https://pannello.screeningitalia.it/wp-json/wp/v2",
    percorso: "/centri",
    perPagina: 100,
    pagineMax: 10,
    attesaMax: 12000
  };

  var REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
                 "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
                 "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
                 "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];
  /* Valori salvati nel pannello => nome a schermo (nomi di Angelo). */
  var SCREENING = {
    "Mammografico": "Mammografico", "Colon-retto": "Colon-retto", "Cervice uterina": "Cervice uterina",
    "Polmonare": "Polmonare", "Prostata": "Prostatico (PSA)", "Nutrizionale": "Nutrizionale",
    "Neonatale": "Neonatale", "Epatite C (HCV)": "HCV (Epatite C)",
    "Diabete e celiachia pediatrici": "Diabete", "Cardiovascolare": "Cardiovascolare"
  };

  window.__siCentri = { stato: "attesa", lista: [] };

  function soloTesto(valore) {
    var s = String(valore == null ? "" : valore);
    if (!s) { return ""; }
    if (typeof DOMParser === "undefined") {
      return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    }
    try {
      var doc = new DOMParser().parseFromString("<body>" + s + "</body>", "text/html");
      return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    } catch (e) {
      return "";
    }
  }
  function testo(v) { return typeof v === "string" ? soloTesto(v) : ""; }
  function testoLungo(v) {
    if (typeof v !== "string" || !v) { return ""; }
    var s = v.replace(/<br\s*\/?>/gi, "\n");
    return s.split(/\r?\n/).map(soloTesto).filter(function (r) { return r !== ""; }).join("\n");
  }
  function telefono(v) {
    if (typeof v !== "string" && typeof v !== "number") { return ""; }
    var s = String(v).trim();
    var piu = s.charAt(0) === "+";
    s = s.replace(/[^0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (!/[0-9]/.test(s)) { return ""; }
    return (piu ? "+" : "") + s;
  }
  function email(v) {
    var s = testo(v);
    return /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(s) ? s : "";
  }
  /* Solo indirizzi https: niente javascript:, niente http in chiaro. */
  function sito(v) {
    var s = testo(v);
    try {
      var u = new URL(s);
      return u.protocol === "https:" ? u.href : "";
    } catch (e) {
      return "";
    }
  }
  function elencoScreening(v) {
    var l = Array.isArray(v) ? v : (typeof v === "string" && v ? [v] : []);
    var out = [];
    l.forEach(function (t) { if (SCREENING[t] && out.indexOf(SCREENING[t]) === -1) { out.push(SCREENING[t]); } });
    return out;
  }

  function componi(post) {
    if (!post || typeof post !== "object") { return null; }
    var f = (post.acf && typeof post.acf === "object") ? post.acf : {};
    var x = {
      id: String(post.id || ""),
      nome: soloTesto(post.title && post.title.rendered),
      reg: REGIONI.indexOf(f.reg) !== -1 ? f.reg : "",
      asl: testo(f.asl),
      screening: elencoScreening(f.screening),
      indirizzo: testo(f.indirizzo),
      orari: testoLungo(f.orari),
      tel: telefono(f.tel),
      email: email(f.email),
      sito: sito(f.sito),
      note: testoLungo(f.note)
    };
    if (!x.nome || !x.reg) {
      console.warn("Centro scartato (" + (post.slug || post.id) + "): servono nome e regione");
      return null;
    }
    return x;
  }

  function chiediPagina(n) {
    var q = [
      "per_page=" + CFG.perPagina, "page=" + n, "status=publish",
      "orderby=title", "order=asc", "_fields=id,slug,title,acf",
      "_f=" + Math.floor(Date.now() / 300000)
    ];
    var url = CFG.base + CFG.percorso + "?" + q.join("&");
    if (typeof fetch !== "function") { return Promise.resolve({ ok: false }); }
    var stop = null, sveglia = null;
    if (typeof AbortController === "function") {
      stop = new AbortController();
      sveglia = setTimeout(function () { stop.abort(); }, CFG.attesaMax);
    }
    return fetch(url, {
      method: "GET", credentials: "omit", mode: "cors", cache: "no-store",
      headers: { "Accept": "application/json" }, signal: stop ? stop.signal : undefined
    }).then(function (r) {
      if (sveglia) { clearTimeout(sveglia); }
      if (!r.ok) { return { ok: false }; }
      return r.json().then(function (dati) {
        if (!Array.isArray(dati)) { return { ok: false }; }
        return { ok: true, dati: dati, pagine: parseInt(r.headers.get("X-WP-TotalPages"), 10) || 1 };
      }, function () { return { ok: false }; });
    }, function () {
      if (sveglia) { clearTimeout(sveglia); }
      return { ok: false };
    });
  }

  function chiediTutte() {
    var raccolti = [];
    function giro(n) {
      return chiediPagina(n).then(function (r) {
        if (!r.ok) { return null; }
        raccolti = raccolti.concat(r.dati);
        return n < Math.min(r.pagine, CFG.pagineMax) ? giro(n + 1) : raccolti;
      });
    }
    return giro(1);
  }

  function consegna(lista) {
    window.__siCentri = { stato: "fatto", lista: lista };
    window.__siCentriVer = (window.__siCentriVer || 0) + 1;
  }

  chiediTutte().then(function (dati) {
    var lista = [];
    (dati || []).forEach(function (p) { var x = componi(p); if (x) { lista.push(x); } });
    lista.sort(function (a, b) {
      return a.reg.localeCompare(b.reg, "it") || a.nome.localeCompare(b.nome, "it");
    });
    consegna(lista);
  }, function () { consegna([]); });
})();
