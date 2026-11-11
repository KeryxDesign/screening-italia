/* Esperienze: Buone pratiche e Difficolta e disservizi, lette da WordPress.

   Stesso schema di testimonianze-wp.js, di cui riusa pulizia e dialogo
   (window.TestimonianzeWP: va caricato DOPO quel file). Due categorie:
     bp   -> slug «buone-pratiche»
     diff -> slug «difficolta-disservizi»
   SENTINEL 13/10/2026, brief esperienze.

   Dove sta cosa, in WordPress:
     titolo    -> il fatto in una riga
     riassunto -> «Regione · Screening» (SCRITTO a mano: quello generato da
                  WordPress dal testo non vale, il post si scarta)
     contenuto -> il racconto riscritto dalla redazione (<= 500 battute)
     data      -> mostrata come «mese anno»

   Tutto TESTO, mai HTML: il contenuto passa da DOMParser (documento inerte).
   Categoria assente, zero post o WordPress che non risponde = elenchi vuoti:
   la pagina toglie bande, pagine e voci di menu.

   Schede di prova: in src/prove/esperienze-esempi.js, mai in deploy.
   In produzione provaEsempi() non fa niente.

   La pagina si accorge del cambio tramite window.__siEspVer
   (logica-classe.js, il giro del "tick"). */

(function () {
  "use strict";

  var CAT = { bp: "buone-pratiche", diff: "difficolta-disservizi" };
  var riservaEsempi = !/^(www\.)?screeningitalia\.it$/.test(location.hostname);

  window.__siEsperienze = { stato: "attesa", bp: [], diff: [], fonte: "" };

  var T = window.TestimonianzeWP;

  /* «ottobre 2026», ora di Roma. */
  function meseAnno(iso) {
    if (!iso) { return ""; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return ""; }
    try {
      return new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(d);
    } catch (e) {
      return "";
    }
  }

  function componi(post, chi) {
    if (!T || !post || typeof post !== "object") { return null; }
    if (post.content && post.content.protected) { return null; }
    var par = T.paragrafi((post.content && post.content.rendered) || "");
    var riga = T.soloTesto(post.excerpt && post.excerpt.rendered);
    if (T.riassuntoAutomatico(riga, par.join(" "))) { riga = ""; }
    var dataIso = post.date_gmt ? post.date_gmt + "Z" : "";
    var x = {
      id: typeof post.id === "number" ? post.id : 0,
      tipo: chi,
      titolo: T.soloTesto(post.title && post.title.rendered),
      riga: riga,
      meseAnno: meseAnno(dataIso),
      paragrafi: par,
      dataIso: dataIso
    };
    var manca = [];
    if (!x.id) { manca.push("id"); }
    if (!x.titolo) { manca.push("titolo (il fatto)"); }
    if (!x.riga) { manca.push("riassunto (Regione · Screening)"); }
    if (!x.paragrafi.length) { manca.push("contenuto"); }
    if (manca.length) {
      console.warn("Esperienza scartata (" + chi + ", " + (post.id || "?") + "): manca " + manca.join(", "));
      return null;
    }
    return x;
  }

  function filtra(lista, chi) {
    var buone = [];
    (lista || []).forEach(function (p) { var x = componi(p, chi); if (x) { buone.push(x); } });
    return buone;
  }

  /* Schede di prova (solo fuori produzione), dal file in src/prove/. */
  var inProva = false;
  function provaEsempi(dati) {
    if (!riservaEsempi || !dati || typeof dati !== "object") { return false; }
    inProva = true;
    var ok = function (l, chi) {
      return (Array.isArray(l) ? l : []).filter(function (x) {
        return x && x.titolo && x.riga && Array.isArray(x.paragrafi) && x.paragrafi.length;
      }).map(function (x) {
        return { id: x.id, tipo: chi, titolo: x.titolo, riga: x.riga, meseAnno: x.meseAnno || meseAnno(x.dataIso), paragrafi: x.paragrafi, dataIso: x.dataIso || "" };
      });
    };
    consegna(ok(dati.bp, "bp"), ok(dati.diff, "diff"), "esempi");
    return true;
  }

  function consegna(bp, diff, fonte) {
    window.__siEsperienze = { stato: "fatto", bp: bp, diff: diff, fonte: fonte };
    window.__siEspVer = (window.__siEspVer || 0) + 1;
  }

  /* Modulo #/racconta: la mail precompilata (copy MUSE §6). Niente fetch,
     niente salvataggi: il testo esce solo dalla posta di chi scrive.
     La frase del consenso in fondo e LETTERALE (LEX): e la prova del consenso. */
  var CONSENSO = "Ho letto l'informativa e acconsento esplicitamente al trattamento dei dati sulla salute contenuti nel mio racconto e alla sua pubblicazione in forma anonima.";
  function mailto(d) {
    d = d || {};
    var corpo = [
      "Tipo: " + (d.tipo || ""),
      "Regione: " + (d.regione || "non indicata"),
      "Screening: " + (d.screening || "non indicato"),
      "",
      String(d.racconto || "").replace(/\r\n?/g, "\n").trim().replace(/\n/g, "\r\n"),
      "",
      "---",
      CONSENSO
    ].join("\r\n");
    return "mailto:info@screeningitalia.it?subject=" + encodeURIComponent("Racconto dal sito: " + (d.tipo || "")) +
      "&body=" + encodeURIComponent(corpo);
  }
  function apri(url) {
    /* Solo fuori produzione: le prove leggono l'indirizzo costruito. */
    if (riservaEsempi) { window.__siUltimoMailto = url; }
    try { window.location.href = url; } catch (e) {}
  }

  window.EsperienzeWP = { CAT: CAT, componi: componi, meseAnno: meseAnno, provaEsempi: provaEsempi, mailto: mailto, apri: apri, CONSENSO: CONSENSO };

  if (window.__siEspProva) { provaEsempi(window.__siEspProva); }

  if (!T || typeof T.chiediCategoria !== "function") {
    if (!inProva) { consegna([], [], "testimonianze-wp.js assente"); }
    return;
  }

  Promise.all([T.chiediCategoria(CAT.bp), T.chiediCategoria(CAT.diff)]).then(function (r) {
    if (inProva) { return; }
    var bp = filtra(r[0], "bp"), diff = filtra(r[1], "diff");
    var fonte = (r[0] || r[1]) ? "wordpress" : "wordpress non raggiungibile";
    consegna(bp, diff, fonte);
  }, function () {
    if (inProva) { return; }
    consegna([], [], "errore imprevisto");
  });
})();
