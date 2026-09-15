/* Sorgente degli articoli: legge i post da WordPress e li consegna
   nella forma che il portale usa gia.

   WordPress serve solo come pannello: Angelo scrive li, il sito legge qui.
   L'indirizzo si imposta una volta sola, nella riga qui sotto.
   Finche e vuoto il sito usa gli articoli scritti a mano nel prototipo. */

window.ARTICOLI_SORGENTE = "";   // es. "https://pannello.screeningitalia.it"

(function () {
  "use strict";

  /* Toglie i tag HTML e riporta le entita ai caratteri veri.
     WordPress consegna titoli e sommari gia avvolti in <p>. */
  function testoSemplice(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }

  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
              "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

  /* "2026-08-28T09:00:00" diventa "28 agosto 2026". */
  function dataItaliana(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.getDate() + " " + MESI[d.getMonth()] + " " + d.getFullYear();
  }

  /* Il corpo dell'articolo e una sola stringa HTML.
     Qui diventa l'elenco di sezioni { h, p[] } che la pagina sa disegnare:
     ogni h2 apre una sezione, ogni p le si attacca sotto. */
  function sezioni(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    var fuori = [];
    var elenco = [];
    var corrente = null;

    Array.prototype.forEach.call(d.children, function (n) {
      var tag = n.tagName.toLowerCase();
      if (tag === "h1" || tag === "h2" || tag === "h3") {
        corrente = { h: testoSemplice(n.innerHTML), p: [] };
        elenco.push(corrente);
        return;
      }
      var t = testoSemplice(n.innerHTML);
      if (!t) return;
      if (corrente) corrente.p.push(t);
      else fuori.push(t);
    });

    /* Un articolo senza sottotitoli resta un articolo: i paragrafi
       finiscono in una sezione senza titolo, non si perdono. */
    if (fuori.length) elenco.unshift({ h: "", p: fuori });
    return elenco;
  }

  /* Un post di WordPress diventa una scheda del portale.
     _embed porta dentro la stessa risposta la foto, la categoria e i tag,
     cosi basta una chiamata sola invece di quattro. */
  function scheda(post) {
    var emb = post._embedded || {};
    var media = (emb["wp:featuredmedia"] || [])[0] || null;
    var gruppi = emb["wp:term"] || [];
    var categorie = (gruppi[0] || []).map(function (t) { return t.name; });
    var tag = (gruppi[1] || []).map(function (t) { return t.name; });

    return {
      id: post.slug,
      foto: media ? (media.source_url || "") : "",
      sommario: testoSemplice(post.excerpt && post.excerpt.rendered),
      cat: categorie[0] || "",
      data: dataItaliana(post.date),
      titolo: testoSemplice(post.title && post.title.rendered),
      href: "#/articolo/" + post.slug,
      chiavi: tag.join(" ").toLowerCase(),
      corpo: sezioni(post.content && post.content.rendered)
    };
  }

  /* Chiede gli articoli al pannello.
     Torna sempre un elenco: se il pannello non risponde torna vuoto,
     e il sito continua a mostrare quello che ha gia. */
  function caricaArticoli(base, quanti) {
    var indirizzo = base || window.ARTICOLI_SORGENTE;
    if (!indirizzo) return Promise.resolve([]);

    var url = indirizzo.replace(/\/+$/, "") +
              "/wp-json/wp/v2/posts?_embed&per_page=" + (quanti || 20);

    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("Il pannello ha risposto " + r.status);
        return r.json();
      })
      .then(function (posts) { return posts.map(scheda); })
      .catch(function (e) {
        console.warn("Articoli non caricati dal pannello:", e.message);
        return [];
      });
  }

  window.ARTICOLI = {
    carica: caricaArticoli,
    scheda: scheda,
    sezioni: sezioni,
    dataItaliana: dataItaliana,
    testoSemplice: testoSemplice
  };
})();
