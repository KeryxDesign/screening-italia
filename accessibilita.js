/* Pannello di accessibilita: ingrandimento del testo e contrasto elevato.
   Vive fuori dai componenti della pagina: si attacca da solo al documento
   e ricorda la scelta in localStorage. */
(function () {
  var CHIAVE = "screening-italia:accessibilita";
  var stato = { testo: 0, contrasto: false };

  try {
    var salvato = JSON.parse(localStorage.getItem(CHIAVE) || "null");
    if (salvato && typeof salvato === "object") {
      stato.testo = Number(salvato.testo) || 0;
      stato.contrasto = !!salvato.contrasto;
    }
  } catch (e) {}

  function applica() {
    var h = document.documentElement;
    h.classList.remove("txt-g", "txt-xg");
    if (stato.testo === 1) { h.classList.add("txt-g"); }
    if (stato.testo === 2) { h.classList.add("txt-xg"); }
    h.classList.toggle("contrasto", stato.contrasto);
    try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); } catch (e) {}
    aggiorna();
  }

  var nodi = {};

  function aggiorna() {
    if (!nodi.testo) { return; }
    nodi.testo.forEach(function (b, i) {
      var on = i === stato.testo;
      b.className = on ? "a11y-scelta on" : "a11y-scelta";
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    nodi.contrasto.className = stato.contrasto ? "a11y-scelta larga on" : "a11y-scelta larga";
    nodi.contrasto.setAttribute("aria-pressed", stato.contrasto ? "true" : "false");
  }

  function bottone(testo, etichetta, classe) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = classe || "a11y-scelta";
    b.innerHTML = testo;
    if (etichetta) { b.setAttribute("aria-label", etichetta); }
    return b;
  }

  function costruisci() {
    if (document.querySelector(".a11y")) { return; }

    var box = document.createElement("div");
    box.className = "a11y";

    var pannello = document.createElement("div");
    pannello.className = "a11y-pannello";
    pannello.id = "a11y-pannello";
    pannello.hidden = true;

    var t1 = document.createElement("p");
    t1.className = "a11y-tit";
    t1.textContent = "Dimensione del testo";
    var riga = document.createElement("div");
    riga.className = "a11y-riga";
    nodi.testo = [
      bottone("A", "Testo normale"),
      bottone("A", "Testo grande"),
      bottone("A", "Testo molto grande")
    ];
    nodi.testo[1].style.fontSize = "23px";
    nodi.testo[2].style.fontSize = "28px";
    nodi.testo.forEach(function (b, i) {
      b.addEventListener("click", function () { stato.testo = i; applica(); });
      riga.appendChild(b);
    });

    var t2 = document.createElement("p");
    t2.className = "a11y-tit";
    t2.textContent = "Contrasto";
    nodi.contrasto = bottone("Contrasto elevato", null, "a11y-scelta larga");
    nodi.contrasto.addEventListener("click", function () {
      stato.contrasto = !stato.contrasto; applica();
    });

    var chiudi = bottone("Chiudi", null, "a11y-chiudi");

    pannello.appendChild(t1);
    pannello.appendChild(riga);
    pannello.appendChild(t2);
    pannello.appendChild(nodi.contrasto);
    pannello.appendChild(chiudi);

    var apri = document.createElement("button");
    apri.type = "button";
    apri.className = "a11y-apri";
    apri.setAttribute("aria-label", "Accessibilit\u00e0: testo e contrasto");
    apri.setAttribute("aria-expanded", "false");
    apri.setAttribute("aria-controls", "a11y-pannello");
    apri.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="7.2" r="1.4" fill="currentColor" stroke="none"></circle><path d="M6.8 10.2h10.4"></path><path d="M12 10.6v4.2"></path><path d="M12 14.8l-2.2 4"></path><path d="M12 14.8l2.2 4"></path></svg>';

    function mostra(v) {
      pannello.hidden = !v;
      apri.setAttribute("aria-expanded", v ? "true" : "false");
      box.classList.toggle("aperto", v);
    }
    apri.addEventListener("click", function () { mostra(pannello.hidden); });
    chiudi.addEventListener("click", function () { mostra(false); apri.focus(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !pannello.hidden) { mostra(false); apri.focus(); }
    });

    box.appendChild(pannello);
    box.appendChild(apri);
    document.body.appendChild(box);
    aggiorna();
  }

  function avvia() {
    applica();
    costruisci();
    // La pagina si ricostruisce dopo il montaggio: si ricontrolla per un po'.
    var n = 0;
    var t = setInterval(function () {
      if (!document.querySelector(".a11y")) { costruisci(); }
      if (++n > 40) { clearInterval(t); }
    }, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avvia);
  } else {
    avvia();
  }
})();
