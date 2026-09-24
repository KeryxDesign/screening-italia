/* Iniziative vere: le legge da WordPress e sostituisce quelle di esempio.

   Cosa fa, in una riga: chiede le iniziative pubblicate all'API REST pubblica
   di WordPress, in anonimo e senza nessuna credenziale, le controlla una per una
   e mette in window.INIZIATIVE solo quelle che passano, nella stessa forma di
   iniziative.js.

   Perche i controlli stanno qui: WordPress e usato solo come pannello e non
   possiamo aggiungergli codice. Tutto quello che il pannello non verifica
   (liste chiuse, telefono, data) lo verifica questo file, prima che il dato
   arrivi alla pagina. Ogni valore e trattato come TESTO, mai come HTML.

   Riserva: se la rete cade, WordPress risponde male o non ha iniziative valide,
   window.INIZIATIVE resta quella di esempio, com'e (vedi CFG.riservaEsempi).

   Comportamento deciso: appena WordPress ha ALMENO UNA iniziativa valida, si
   mostrano SOLO quelle vere. Esempi e dati veri non si mescolano mai: un
   numero finto accanto a uno vero e un cittadino che chiama il numero sbagliato.

   Si carica DOPO iniziative.js. La pagina si accorge del cambio tramite
   window.__siIniziativeVer (vedi logica-classe.js, il giro del "tick").

   Nessuna stringa di questo file finisce sotto gli occhi di un cittadino. */

(function () {
  "use strict";

  var CFG = {
    /* Radice dell'API REST. Solo lettura, solo endpoint pubblici. */
    base: "https://pannello.screeningitalia.it/wp-json/wp/v2",
    percorso: "/iniziative",
    perPagina: 100,
    /* Tetto alle pagine: 20 x 100 = 2000 iniziative. Oltre, si ferma:
       una risposta che dichiara pagine infinite non ci tiene in giro. */
    pagineMax: 20,
    /* Stesso tetto di articoli.js. */
    attesaMax: 12000,
    /* Quanto aspettare che iniziative.js abbia scritto gli esempi, prima di
       sostituirli. Gli script del prototipo si caricano in ordine sparso. */
    attesaEsempiMax: 5000,
    /* Decisione di Davide, 24/09/2026: in produzione zero iniziative,
       gli esempi solo in prova. Produzione = il dominio pubblico. */
    riservaEsempi: !/^(www\.)?screeningitalia\.it$/.test(location.hostname)
  };

  /* Liste chiuse. Fuori da qui l'iniziativa si scarta.
     tipo: regola del brand, sei voci, non una di piu. */
  var TIPI = ["Mammografico", "Cervice uterina", "Colon-retto", "Prostata",
              "Neonatale", "Diabete e celiachia pediatrici"];
  var REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
                 "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
                 "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
                 "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];
  var STATI = ["gratuito", "a pagamento", "su invito"];

  /* La pagina guarda questo valore per non dichiarare «non trovata»
     un'iniziativa vera mentre la risposta e ancora in viaggio. */
  window.__siIniziativeStato = "attesa";

  /* ---------------------------------------------------------------
     1. Pulizia dei valori
     --------------------------------------------------------------- */

  /* Da HTML (o testo con entita) a testo semplice.
     DOMParser costruisce un documento INERTE: niente script, niente
     immagini scaricate, nessun <img onerror> che parte mentre leggiamo.
     Mai document.createElement + innerHTML: quello NON e inerte. */
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

  /* Campo di testo ACF: una stringa, senza a-capo e senza spazi doppi.
     Qualsiasi altra cosa (numero, oggetto, null) diventa stringa vuota. */
  function testo(v) {
    if (typeof v !== "string") { return ""; }
    return soloTesto(v);
  }

  /* textarea con new_lines "br": ACF in REST restituisce il valore grezzo
     (a-capo veri), ma se un giorno arrivasse con <br> li riportiamo a-capo
     prima di togliere la marcatura. Resta testo: la pagina lo stampa come testo. */
  function testoLungo(v) {
    if (typeof v !== "string" || !v) { return ""; }
    var s = v.replace(/<br\s*\/?>/gi, "\n");
    var righe = s.split(/\r?\n/).map(soloTesto).filter(function (r) { return r !== ""; });
    return righe.join("\n");
  }

  /* Solo valori della lista, confronto esatto. */
  function inLista(v, lista) {
    return typeof v === "string" && lista.indexOf(v) !== -1 ? v : "";
  }

  /* Telefono: restano cifre, spazi e un "+" solo in testa.
     Il sito fa x.tel.split(" ") per costruire il link tel:, quindi
     gli spazi multipli si riducono a uno. */
  function telefono(v) {
    if (typeof v !== "string" && typeof v !== "number") { return ""; }
    var s = String(v).trim();
    var piu = s.charAt(0) === "+";
    s = s.replace(/[^0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (!/[0-9]/.test(s)) { return ""; }
    return (piu ? "+" : "") + s;
  }

  /* Data di chiusura. ACF in REST la manda come AAAAMMGG ("20260930"),
     qualunque sia il formato scelto nel pannello. Accettiamo anche
     AAAA-MM-GG. Esce sempre AAAA-MM-GG, oppure "" se la data non esiste
     (31 febbraio, mese 13, testo qualunque). */
  function data(v) {
    var s = String(v == null ? "" : v).trim();
    var m = /^(\d{4})-?(\d{2})-?(\d{2})$/.exec(s);
    if (!m) { return ""; }
    var a = Number(m[1]), me = Number(m[2]), g = Number(m[3]);
    var d = new Date(a, me - 1, g);
    if (d.getFullYear() !== a || d.getMonth() !== me - 1 || d.getDate() !== g) { return ""; }
    return m[1] + "-" + m[2] + "-" + m[3];
  }

  /* Slug di WordPress: e gia minuscolo e senza spazi, ma lo stringiamo
     comunque ai soli caratteri sicuri in un indirizzo #/iniziativa/<id>.
     WordPress puo codificare in %xx le lettere non latine: le togliamo. */
  function identificativo(v) {
    var s = String(v == null ? "" : v).toLowerCase();
    return /^[a-z0-9-]{1,200}$/.test(s) ? s : "";
  }

  /* ---------------------------------------------------------------
     2. Da post di WordPress a iniziativa
     --------------------------------------------------------------- */

  /* Torna l'oggetto nella forma di iniziative.js, oppure null se
     l'iniziativa non passa i controlli. Motivo dello scarto in console,
     cosi chi lavora sul pannello puo capire perche non la vede. */
  function componi(post) {
    if (!post || typeof post !== "object") { return null; }
    var f = (post.acf && typeof post.acf === "object") ? post.acf : {};

    var x = {
      id: identificativo(post.slug),
      reg: inLista(f.reg, REGIONI),
      tipo: inLista(f.tipo, TIPI),
      titolo: soloTesto(post.title && post.title.rendered),
      ente: testo(f.ente),
      dove: testo(f.dove),
      quando: testo(f.quando),
      chi: testo(f.chi),
      tel: telefono(f.tel),
      stato: inLista(f.stato, STATI),
      chiude: data(f.chiude)
    };

    var manca = [];
    ["id", "reg", "tipo", "titolo", "ente", "dove", "quando", "chi", "tel", "stato", "chiude"]
      .forEach(function (k) { if (!x[k]) { manca.push(k); } });
    if (manca.length) {
      console.warn("Iniziativa scartata (" + (post.slug || post.id) + "): campi non validi -> " + manca.join(", "));
      return null;
    }

    /* Facoltativi: presenti solo quando servono, come negli esempi. */
    if (f.posti === true) { x.posti = "ultimi posti"; }
    var descr = testoLungo(f.descrizione);
    if (descr) { x.descrizione = descr; }

    return x;
  }

  /* ---------------------------------------------------------------
     3. Dialogo con WordPress (stessa porta di articoli.js)
     --------------------------------------------------------------- */

  /* Una pagina di risultati. Non viene mai rifiutata:
     torna { ok, dati, pagine }. */
  function chiediPagina(n) {
    var q = [
      "per_page=" + CFG.perPagina,
      "page=" + n,
      "status=publish",
      "orderby=date",
      "order=desc",
      /* Solo i campi che servono: meno byte, meno dati esposti. */
      "_fields=id,slug,title,acf",
      /* WordPress e la CDN di Hostinger rispondono con 7 giorni di cache:
         senza questo marcatore un'iniziativa appena pubblicata arriverebbe
         giorni dopo. Cambia ogni 5 minuti, come in articoli.js. */
      "_f=" + Math.floor(Date.now() / 300000)
    ];
    var url = CFG.base + CFG.percorso + "?" + q.join("&");

    if (typeof fetch !== "function") { return Promise.resolve({ ok: false }); }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return Promise.resolve({ ok: false });
    }

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
      if (!r.ok) { return { ok: false, stato: r.status }; }
      return r.json().then(function (dati) {
        if (!Array.isArray(dati)) { return { ok: false }; }
        return { ok: true, dati: dati, pagine: parseInt(r.headers.get("X-WP-TotalPages"), 10) || 1 };
      }, function () {
        /* 200 ma non JSON: pagina di errore dell'hosting. */
        return { ok: false };
      });
    }, function () {
      if (sveglia) { clearTimeout(sveglia); }
      return { ok: false };
    });
  }

  /* Tutte le pagine, una dopo l'altra. Se una pagina fallisce a meta
     strada, fallisce tutto: meglio gli esempi che mezzo elenco vero
     spacciato per completo. */
  function chiediTutte() {
    var raccolti = [];
    function giro(n) {
      return chiediPagina(n).then(function (r) {
        if (!r.ok) { return null; }
        raccolti = raccolti.concat(r.dati);
        var ultima = Math.min(r.pagine, CFG.pagineMax);
        return n < ultima ? giro(n + 1) : raccolti;
      });
    }
    return giro(1);
  }

  /* ---------------------------------------------------------------
     4. Consegna alla pagina
     --------------------------------------------------------------- */

  /* Aspetta che iniziative.js abbia scritto gli esempi, cosi un suo arrivo
     in ritardo non cancella i dati veri. Se non arriva entro il tetto,
     si procede lo stesso. */
  function quandoEsempiPronti(fatto) {
    var inizio = Date.now();
    (function prova() {
      if (Array.isArray(window.INIZIATIVE) || Date.now() - inizio > CFG.attesaEsempiMax) {
        fatto();
        return;
      }
      setTimeout(prova, 100);
    })();
  }

  function consegna(elenco, fonte) {
    quandoEsempiPronti(function () {
      if (elenco) {
        window.INIZIATIVE = elenco;
        window.__siIniziativeWP = elenco;
      } else if (!CFG.riservaEsempi) {
        window.INIZIATIVE = [];
        window.__siIniziativeWP = window.INIZIATIVE;
      }
      window.__siIniziativeFonte = fonte;
      window.__siIniziativeStato = "fatto";
      /* Il segnale per la pagina: logica-classe.js confronta questo numero
         a ogni giro e ridisegna quando cambia. */
      window.__siIniziativeVer = (window.__siIniziativeVer || 0) + 1;
    });
  }

  /* In produzione gli esempi non si vedono nemmeno mentre la risposta arriva. */
  if (!CFG.riservaEsempi) {
    quandoEsempiPronti(function () {
      if (window.__siIniziativeWP) { return; }
      window.INIZIATIVE = [];
      window.__siIniziativeVer = (window.__siIniziativeVer || 0) + 1;
    });
  }

  chiediTutte().then(function (posts) {
    if (!posts) { consegna(null, "esempi: pannello non raggiungibile"); return; }
    var visti = {};
    var buone = [];
    for (var i = 0; i < posts.length; i++) {
      var x = componi(posts[i]);
      if (!x || visti[x.id]) { continue; }   /* niente doppioni sulla stessa rotta */
      visti[x.id] = true;
      buone.push(x);
    }
    if (!buone.length) { consegna(null, "esempi: nessuna iniziativa valida sul pannello"); return; }
    consegna(buone, "wordpress");
  }, function () {
    consegna(null, "esempi: errore imprevisto");
  });

  /* Esposto solo per le prove in console. */
  window.IniziativeWP = { CFG: CFG, componi: componi, data: data, telefono: telefono };
})();
