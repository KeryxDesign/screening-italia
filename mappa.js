/* Disegna la mappa cliccabile delle regioni dentro un contenitore.
   Nessuna libreria: usa la geometria gia proiettata di regioni-italia.js. */
window.MappaItalia = {
  pronta: function () { return !!window.REGIONI_ITALIA; },

  disegna: function (el, opz) {
    if (!el || !window.REGIONI_ITALIA) { return false; }
    var dati = window.REGIONI_ITALIA;
    var conteggi = (opz && opz.conteggi) || {};
    var attiva = (opz && opz.attiva) || null;
    var href = (opz && opz.href) || function () { return "#"; };
    var etichetta = (opz && opz.etichetta) || function (nome) {
      var q = conteggi[nome] || 0;
      if (q === 0) { return "nessuna iniziativa, per ora"; }
      if (q === 1) { return "1 iniziativa aperta"; }
      return q + " iniziative aperte";
    };

    var NS = "http://www.w3.org/2000/svg";
    el.innerHTML = "";
    el.style.display = "block";

    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", dati.viewBox);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "Mappa dell\u2019Italia divisa per regione");

    Object.keys(dati.regioni).forEach(function (nome) {
      var p = document.createElementNS(NS, "path");
      var cls = (conteggi[nome] || 0) > 0 ? "piena" : "vuota";
      if (attiva && attiva === nome) { cls += " attiva"; }
      p.setAttribute("d", dati.regioni[nome]);
      p.setAttribute("class", cls);
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "link");
      p.setAttribute("aria-label", nome + ", " + etichetta(nome) + (attiva === nome ? ", regione mostrata adesso" : ""));
      if (attiva === nome) { p.setAttribute("aria-current", "true"); }
      var t = document.createElementNS(NS, "title");
      t.textContent = nome + " \u2014 " + etichetta(nome);
      p.appendChild(t);
      var vai = function () {
        if (opz && typeof opz.vai === "function") { opz.vai(nome); return; }
        window.location.href = href(nome);
      };
      p.addEventListener("click", vai);
      p.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); vai(); }
      });
      svg.appendChild(p);
    });

    el.appendChild(svg);

    /* Regioni troppo piccole da toccare col dito (Valle d'Aosta, Molise): attorno alla regione
       un cerchio tratteggiato largo almeno 48px sullo schermo, che apre la stessa pagina. */
    var larg = svg.getBoundingClientRect().width || 340;
    var scala = larg / (parseFloat(dati.viewBox.split(" ")[2]) || 620);
    ["Valle d\u2019Aosta", "Valle d'Aosta", "Molise"].forEach(function (nome) {
      var base = svg.querySelector('path[aria-label^="' + nome + ',"]');
      if (!base) { return; }
      var bb = base.getBBox();
      var r = Math.max(24 / scala, Math.max(bb.width, bb.height) / 2 + 3 / scala);
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", bb.x + bb.width / 2);
      c.setAttribute("cy", bb.y + bb.height / 2);
      c.setAttribute("r", r);
      c.setAttribute("class", "tocco");
      c.setAttribute("aria-hidden", "true");
      c.addEventListener("click", function () { base.dispatchEvent(new MouseEvent("click")); });
      svg.appendChild(c);
    });
    return true;
  }
};
