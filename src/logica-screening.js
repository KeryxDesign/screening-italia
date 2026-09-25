/* Le sei pagine screening: la logica (SENTINEL, 25/09/2026, brief LORI §1.3, §3.6, §4).
   window.__siScreening.vals(stato, rotta, comp) sceglie la pagina, filtra le iniziative per tipo
   e regione e prepara i valori del modello. renderVals() lo chiama e fonde il risultato.
   Nessuna stringa visibile nasce qui: i testi vengono tutti da screening-pagine.js.
   Uniche eccezioni, gia del sito e non nuove: le etichette di conteggio «iniziativa aperta /
   iniziative aperte» (stessa stringa di #/trova, brief §4.1). */
(function () {
  // Pagine che non esistono ancora (brief §2.1): finche sono null il blocco non entra nel DOM.
  const HREF_HPV = null;     // S5, rimando «/hpv/» (cervicale)
  const HREF_INVITO = null;  // S6, «/invito/»

  const SLUG = ["mammografico", "cervicale", "colon-retto", "prostata", "neonatale", "diabete-celiachia"];
  const TIPO = { "mammografico": "Mammografico", "cervicale": "Cervice uterina", "colon-retto": "Colon-retto", "prostata": "Prostata" };

  // Icone (brief §3.5): SVG inline, tratto 2px, sempre accanto a un'etichetta scritta.
  const PERSONA = "M12 12.6a4.05 4.05 0 100-8.1 4.05 4.05 0 000 8.1M4.5 20.2c0-3.3 3.4-5.2 7.5-5.2s7.5 1.9 7.5 5.2";
  const CALENDARIO = "M7 3v3M17 3v3M3.5 9.5h17M4.5 6h15a1 1 0 011 1v12a1 1 0 01-1 1h-15a1 1 0 01-1-1V7a1 1 0 011-1z";
  const EURO = "M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"; // Lucide euro (ISC)
  const INFO = "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zM12 16v-4M12 8h.01"; // Lucide info (ISC): cerchio r10 scritto come path
  const BABY = "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5M15 12h.01M9 12h.01M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"; // Lucide baby (ISC)
  const DOMANDA = "M7.9 20A9 9 0 1 0 4 16.1L2 22ZM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"; // Lucide message-circle-question (ISC), diabete (LORI giro 1)
  const ICONA_CELLA = { "Fascia di età": PERSONA, "25-29 anni": PERSONA, "30-64 anni": PERSONA, "Cadenza": CALENDARIO, "Costo": EURO, "Casi particolari": INFO };

  const P = () => window.SCREENING_PAGINE || {};
  const M = () => window.SCREENING_MICRO || {};
  // I buchi di dato del copy si mostrano in .finto (brief §2.3), mai nascosti in anteprima.
  const buco = (t) => /\[(DATO MANCANTE|DA DECIDERE)/.test(t || "");
  const cls = (base, t) => (base ? base + (buco(t) ? " finto" : "") : (buco(t) ? "finto" : ""));

  function slugValido(arg) { return SLUG.indexOf(arg) !== -1; }

  // Serie numerate del copy: «<pref> 1<suf>», «<pref> 2<suf>», ... finche esistono.
  function serie(c, pref, suf, sep) {
    const out = [];
    const k = (n) => pref + (sep === undefined ? " " : sep) + n + (suf || "");
    for (let n = 1; c[k(n)] !== undefined; n++) { out.push(c[k(n)]); }
    return out;
  }
  const voci = (c, pref) => serie(c, pref).map((t) => ({ t: t, cls: cls("", t) }));
  const passi = (c, sez, h3, prosa) => serie(c, sez + "·Passo", " · " + h3).map((t, i) => ({ n: String(i + 1), h3: t, p: c[sez + "·Passo " + (i + 1) + " · " + prosa] }));
  // S7 numera «D1/R1» senza spazio, N6 e D7 «Domanda 1/Risposta 1».
  const domande = (c, d, r, sep) => serie(c, d, "", sep).map((t, i) => ({ d: t, r: c[r + (sep === undefined ? " " : sep) + (i + 1)] }));

  // CTA d'apertura (brief §3.6): scroll al blocco, poi fuoco sull'h2 (tabindex -1).
  function scendi(id) {
    const el = document.getElementById(id);
    if (!el) { return; }
    let piano = false;
    try { piano = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    el.scrollIntoView({ behavior: piano ? "auto" : "smooth", block: "start" });
    const h = el.querySelector("h2");
    if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
  }

  // Correzione 6 LORI giro 1 + punto 1 giro 2: dopo il clic su una regione scorre ai risultati
  // (card o avviso), stesso scorrimento di §3.6. Due frame per aspettare il layout; a fine scorrimento
  // (scrollend, una volta sola) se il risultato non sta a 96±2px si riallinea senza animazione.
  function scendiRisultati(id) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const sez = document.getElementById(id);
      const el = sez && sez.querySelector(".scr-ris");
      if (!el) { return; }
      let piano = false;
      try { piano = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
      const fuori = () => Math.abs(el.getBoundingClientRect().top - 96) > 2;
      // Gia a posto: nessuno scorrimento, quindi nessuno scrollend da aspettare.
      if (!fuori()) { return; }
      window.addEventListener("scrollend", () => {
        if (fuori()) { el.scrollIntoView({ block: "start", behavior: "auto" }); }
      }, { once: true });
      el.scrollIntoView({ behavior: piano ? "auto" : "smooth", block: "start" });
    }));
  }

  function griglia(comp, conta, id) {
    const scelta = comp.state.regScr || null;
    return comp.nomiRegioni().map((n) => {
      const q = conta ? (conta[n] || 0) : 0;
      return {
        nome: n, on: scelta === n ? "true" : "false", cls: scelta === n ? "btn-reg on" : "btn-reg",
        haN: q > 0, n: q === 1 ? "1 iniziativa aperta" : q + " iniziative aperte",
        pick: () => comp.setState({ regScr: n }, () => scendiRisultati(id))
      };
    });
  }

  function vals(stato, rotta, comp) {
    const dentro = rotta.vista === "screening" && slugValido(rotta.arg);
    const slug = dentro ? rotta.arg : "";
    const m = M();
    const out = {
      vistaScr: dentro,
      scrAdulti: dentro && ["mammografico", "cervicale", "colon-retto", "prostata"].indexOf(slug) !== -1,
      scrOnco: dentro && ["mammografico", "cervicale", "colon-retto"].indexOf(slug) !== -1,
      scrProstata: slug === "prostata",
      scrGenitori: slug === "neonatale" || slug === "diabete-celiachia",
      scrNeo: slug === "neonatale",
      scrDia: slug === "diabete-celiachia",
      scrHome: {
        h2: m["H·Titolo h2"],
        card: SLUG.map((s, i) => ({
          href: "#/screening/" + s,
          titolo: m["H·Card " + (i + 1) + " · " + s + " · Titolo"],
          riga: m["H·Card " + (i + 1) + " · " + s + " · Riga"],
          icona: TIPO[s] ? comp.icona(TIPO[s]) : (s === "neonatale" ? BABY : DOMANDA)
        }))
      },
      scr: {}
    };
    if (!dentro) { return out; }

    const c = P()[slug] || {};
    const na = window.SI_NON_AFFILIAZIONE || {};
    const v = {
      ritorno: m["R·Link"],
      nonAff: out.scrGenitori ? na.genitori : na.adulti,
      scendiRegione: () => scendi("scr-regione"),
      scendiDir: () => scendi("scr-dir"),
      scendiDomanda: () => scendi("scr-domanda")
    };

    if (!out.scrGenitori) {
      // --- ONCO e PROSTATA ---
      const celle = serie(c, "S2·Cella", " · h3").map((t, i) => {
        const et = c["S2·Cella " + (i + 1) + " · etichetta icona"];
        return { h3: t, p: c["S2·Cella " + (i + 1) + " · prosa"], et: et, icona: ICONA_CELLA[et] || INFO };
      });
      const tipo = TIPO[slug];
      const dati = window.INIZIATIVE || [];
      const conta = {};
      dati.forEach((x) => { if (x.tipo === tipo) { conta[x.reg] = (conta[x.reg] || 0) + 1; } });
      const reg = stato.regScr || null;
      const carte = reg ? dati.filter((x) => x.tipo === tipo && x.reg === reg)
        .slice().sort((a, b) => String(a.chiude || "9").localeCompare(String(b.chiude || "9"))) : [];
      const inAttesa = window.__siIniziativeStato === "attesa";
      Object.assign(v, {
        occhiello: c["S1·Occhiello"], h1: c["S1·Titolo h1"], sommario: c["S1·Sommario"],
        orient: c["S1·Riga di orientamento"], cta: c["S1·Etichetta CTA primaria"],
        s2h2: c["S2·Titolo h2"], s2p: c["S2·Paragrafo"], celle: celle,
        celleCls: celle.length === 4 ? "scr-celle scr-celle-4" : "scr-celle",
        bish2: c["S2-bis·Titolo h2"], bisp: c["S2-bis·Paragrafo"], bisVoci: voci(c, "S2-bis·Voce"),
        s3h2: c["S3·Titolo h2"], passi: passi(c, "S3", "h3", "prosa"),
        s4h2: c["S4·Titolo h2"], s4p: c["S4·Paragrafo"], s4Voci: voci(c, "S4·Voce"),
        s5h2: c["S5·Titolo h2"], s5p: c["S5·Paragrafo"], s5h3: c["S5·Riquadro · h3"], s5prosa: c["S5·Riquadro · prosa"],
        haHpv: !!HREF_HPV && !!c["S5·Etichetta di rimando a /hpv/"], hrefHpv: HREF_HPV || "", hpv: c["S5·Etichetta di rimando a /hpv/"] || "",
        haInvito: !!HREF_INVITO, hrefInvito: HREF_INVITO || "",
        s6h2: c["S6·Titolo h2"], s6p: c["S6·Prosa"], s6btn: c["S6·Etichetta bottone a contorno"],
        s7h2: c["S7·Titolo h2"], domande: domande(c, "S7·D", "S7·R", ""),
        s8h2: c["S8·Titolo h2"], s8p: c["S8·Paragrafo"],
        regioni: griglia(comp, conta, "scr-regione"),
        carte: carte.map((x) => comp.scheda(x)),
        haCarte: carte.length > 0,
        // Esempi attivi (fuori da screeningitalia.it): resta il marcatore .finto gia esistente.
        esempi: carte.length > 0 && window.__siIniziativeFonte !== "wordpress",
        // S8-b: solo con regione scelta, zero carte e dati non piu in attesa (brief §4.1).
        vuoto: !!reg && carte.length === 0 && !inAttesa,
        s8bh2: c["S8-b·Titolo h2"], s8bp: c["S8-b·Prosa"], s8bPiena: c["S8-b·Etichetta piena"], s8bContorno: c["S8-b·Etichetta a contorno"],
        tornaMappa: () => { comp.setState({ regScr: null }); setTimeout(() => scendi("scr-regione"), 0); },
        s9: c["S9·Testo 17"], s11: c["S11·Testo 17"]
      });
      return Object.assign(out, { scr: v });
    }

    // --- GENITORI ---
    const neo = slug === "neonatale";
    const X = neo ? "N" : "D";
    const dir = (window.SI_DIRETTORIO || {})[neo ? "neonatale" : "diabete"] || {};
    const reg = stato.regScr || null;
    const voce = reg ? dir[reg] : null;
    const haDati = Object.keys(dir).some((k) => Array.isArray(dir[k]) ? dir[k].length > 0 : !!dir[k]);
    const tagCls = { "attivo": "tag tag-gratis", "in avvio": "tag tag-paga", "non attivo": "tag" };
    const parole = String(c["D5·Scheda · etichetta di stato"] || "").split(" · ");
    Object.assign(v, {
      occhiello: c[X + "1·Occhiello"], h1: c[X + "1·Titolo h1"], sommario: c[X + "1·Sommario"],
      cta: neo ? c["Microtesti·Etichetta del bottone del direttorio · variante 1"] : c["Microtesti·Etichetta del bottone · variante 1"],
      regioni: griglia(comp, null, "scr-dir"),
      // Risposta 6 LORI giro 1: se nessuna regione ha dati la griglia non si mostra e l'avviso
      // compare subito; se almeno una ne ha, griglia e avviso al clic.
      dirGriglia: haDati,
      dirVuoto: !haDati || (!!reg && !voce),
      dirVuotoH3: neo ? m["N4-b·Titolo h3"] : m["D5-b·Titolo h3"],
      dirVuotoP: neo ? m["N4-b·Prosa"] : m["D5-b·Prosa"],
      n9: c[X + "9"], n8: c[X + "8"]
    });
    if (neo) {
      Object.assign(v, {
        riqH3: c["N1·Riquadro · titolo h3"], riqP: c["N1·Riquadro · prosa"],
        n2h2: c["N2·Titolo h2"], n2p: c["N2·Paragrafo"], n2Voci: voci(c, "N2·Voce puntata"),
        n3h2: c["N3·Titolo h2"], n3p: c["N3·Paragrafo"], n3h3: c["N3·Riquadro · titolo h3"], n3prosa: c["N3·Riquadro · prosa"], n3Voci: voci(c, "N3·Voce puntata"),
        n4h2: c["N4·Titolo h2"], n4p: c["N4·Paragrafo"], n4cosa: c["N4·Scheda · che cos'è, in una riga"], n4lab: c["N4·Scheda · etichetta laboratorio"], n4nota: c["N4·Scheda · nota"],
        telEt: c["Microtesti·Etichetta del recapito telefonico"],
        // Direttorio neonatale: una voce per regione { ente, laboratorio, tel }.
        dirSchede: voce ? [{ ente: voce.ente || "", lab: voce.laboratorio || "", haLab: !!voce.laboratorio,
          haTel: !!voce.tel, href: "tel:" + String(voce.tel || "").split(" ").join("") }] : [],
        n5h2: c["N5·Titolo h2"], passi: passi(c, "N5", "titolo h3", "prosa"),
        n6h2: c["N6·Titolo h2"], domande: domande(c, "N6·Domanda", "N6·Risposta"),
        n7h2: c["N7·Titolo h2"], n7p: c["N7·Paragrafo"], n7Voci: voci(c, "N7·Voce puntata")
      });
    } else {
      const d3p = c["D3·Prosa: a che punto è l'attuazione"], d3n = c["D3·Nota"];
      Object.assign(v, {
        riqP: c["D1·Riquadro · prosa (L. 130/2023)"],
        d2h2: c["D2·Titolo h2"], d2p: c["D2·Paragrafo"], d2Voci: voci(c, "D2·Voce puntata"), d2cautela: c["D2·Riga di cautela"],
        d3h3: c["D3·Titolo h3"], d3data: c["D3·Data di aggiornamento"], d3p: d3p, d3pCls: cls("", d3p), d3nota: d3n, d3notaCls: cls("nota", d3n),
        d4h2: c["D4·Titolo h2"], d4p: c["D4·Paragrafo"], d4frase: c["D4·La frase da ripetere in ambulatorio"], d4nota: c["D4·Nota sotto la frase"],
        d5h2: c["D5·Titolo h2"], d5p: c["D5·Paragrafo"], d5nota: c["D5·Scheda · nota"],
        // Direttorio diabete: per regione un elenco [{ ente, stato: "attivo" | "in avvio" | "non attivo" }].
        // La parola di stato viene dal copy (D5·Scheda · etichetta di stato), mai solo colore.
        dirSchede: (Array.isArray(voce) ? voce : (voce ? [voce] : [])).map((x) => ({
          ente: x.ente || "", stato: parole.indexOf(x.stato) !== -1 ? x.stato : "", tagCls: tagCls[x.stato] || "tag"
        })),
        d6h2: c["D6·Titolo h2"], d6p: c["D6·Paragrafo"], d6h3: c["D6·Riquadro · titolo h3"], d6prosa: c["D6·Riquadro · prosa"],
        d7h2: c["D7·Titolo h2"], domande: domande(c, "D7·Domanda", "D7·Risposta")
      });
      if (Array.isArray(voce) && voce.length === 0) { v.dirVuoto = true; }
      v.haSchede = v.dirSchede.length > 0;
    }
    return Object.assign(out, { scr: v });
  }

  // Titolo della scheda e meta description (brief §1.1): «Titolo per Google», tetto 60,
  // e «Descrizione per Google». Fuori dalle pagine screening si rimette quello di prima.
  function titolo(comp) {
    const r = comp.state.rotta;
    let meta = document.querySelector('meta[name="description"]');
    if (r.vista !== "screening" || !slugValido(r.arg)) {
      if (meta && meta.dataset.scr) {
        if (meta.dataset.scr === "creata") { meta.remove(); } else { meta.setAttribute("content", meta.dataset.scr); delete meta.dataset.scr; }
      }
      return false;
    }
    const c = P()[r.arg] || {};
    let t = c["Microtesti·Titolo per Google"] || "";
    if (Array.from(t).length > 60) { t = Array.from(t).slice(0, 59).join("") + "…"; }
    if (t && document.title !== t) { document.title = t; }
    const d = c["Microtesti·Descrizione per Google"] || "";
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); meta.dataset.scr = "creata"; document.head.appendChild(meta); }
    else if (!meta.dataset.scr) { meta.dataset.scr = meta.getAttribute("content") || " "; }
    if (meta.getAttribute("content") !== d) { meta.setAttribute("content", d); }
    return true;
  }

  window.__siScreening = { vals: vals, titolo: titolo, slugValido: slugValido };
})();
