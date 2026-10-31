/* Le sei pagine screening: la logica (SENTINEL, 25/09/2026, brief LORI §1.3, §3.6, §4).
   window.__siScreening.vals(stato, rotta, comp) sceglie la pagina, filtra le iniziative per tipo
   e regione e prepara i valori del modello. renderVals() lo chiama e fonde il risultato.
   Nessuna stringa visibile nasce qui: i testi vengono tutti da screening-pagine.js.
   Uniche eccezioni, gia del sito e non nuove: le etichette di conteggio «iniziativa aperta /
   iniziative aperte» (stessa stringa di #/trova, brief §4.1). */
(function () {
  // Pagine che non esistono ancora (brief §2.1): finche sono null il blocco non entra nel DOM.
  // Un'iniziativa puo riguardare piu screening (x.tipi); gli esempi hanno solo x.tipo.
  const haTipo = (x, t) => (x.tipi && x.tipi.length ? x.tipi : [x.tipo]).indexOf(t) !== -1;
  const HREF_HPV = null;     // S5, rimando «/hpv/» (cervicale)
  const HREF_INVITO = null;  // S6, «/invito/»

  const SLUG = ["mammografico", "cervicale", "colon-retto", "prostata", "neonatale", "diabete-celiachia", "cardiovascolare"];
  const TIPO = { "mammografico": "Mammografico", "cervicale": "Cervice uterina", "colon-retto": "Colon-retto", "prostata": "Prostata", "cardiovascolare": "Cardiovascolare", "neonatale": "Neonatale", "diabete-celiachia": "Diabete e celiachia pediatrici" };

  // Icone (brief §3.5): SVG inline, tratto 2px, sempre accanto a un'etichetta scritta.
  const PERSONA = "M12 12.6a4.05 4.05 0 100-8.1 4.05 4.05 0 000 8.1M4.5 20.2c0-3.3 3.4-5.2 7.5-5.2s7.5 1.9 7.5 5.2";
  const CALENDARIO = "M7 3v3M17 3v3M3.5 9.5h17M4.5 6h15a1 1 0 011 1v12a1 1 0 01-1 1h-15a1 1 0 01-1-1V7a1 1 0 011-1z";
  const EURO = "M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"; // Lucide euro (ISC)
  const INFO = "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zM12 16v-4M12 8h.01"; // Lucide info (ISC): cerchio r10 scritto come path
  const BABY = "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5M15 12h.01M9 12h.01M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"; // Lucide baby (ISC)
  const DOMANDA = "M7.9 20A9 9 0 1 0 4 16.1L2 22ZM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"; // Lucide message-circle-question (ISC), diabete (LORI giro 1)
  const ICONA_CELLA = { "Fascia di età": PERSONA, "25-29 anni": PERSONA, "30-64 anni": PERSONA, "Cadenza": CALENDARIO, "Costo": EURO, "Casi particolari": INFO };

  // Icone delle carte in home: tratto 2px come le altre, forme semplici e non cliniche.
  const ICONA_HOME = {
    "mammografico": "M12 4.2c-2.2 0-3.8 1.6-3.8 3.6 0 2.6 2.1 4.4 3.8 6 1.7-1.6 3.8-3.4 3.8-6 0-2-1.6-3.6-3.8-3.6zM10.4 13.6L7.6 20.5l3.1-1.6 1.3 2.1M13.6 13.6l2.8 6.9-3.1-1.6",
    "cervicale": "M12 3.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM12 12.5v8M8.5 17h7",
    "colon-retto": "M4 6h13a3.5 3.5 0 010 7H7a3.5 3.5 0 000 7h13",
    "prostata": "M10.5 9.5a5 5 0 100 10 5 5 0 000-10zM14 12l6-6M15 5.5h5v5",
    "neonatale": BABY,
    "diabete-celiachia": "M12 3.5s6 6.2 6 10.5a6 6 0 01-12 0c0-4.3 6-10.5 6-10.5z",
    "cardiovascolare": "M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.2 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"
  };
  function cartaHome(m, s, i) {
    return {
      href: "/screening/" + s,
      titolo: m["H·Card " + (i + 1) + " · " + s + " · Titolo"],
      riga: m["H·Card " + (i + 1) + " · " + s + " · Riga"],
      icona: ICONA_HOME[s]
    };
  }

  const P = () => window.SCREENING_PAGINE || {};
  const M = () => window.SCREENING_MICRO || {};
  // I buchi di dato del copy si mostrano in .finto (brief §2.3), mai nascosti in anteprima.
  const buco = (t) => /\[(DATO MANCANTE|DA DECIDERE)/.test(t || "");
  const cls = (base, t) => (base ? base + (buco(t) ? " finto" : "") : (buco(t) ? "finto" : ""));


  // Neonatale e diabete-celiachia: i testi esistenti (N1..N9, D1..D9) rimessi nei blocchi del modello
  // comune (S1..S11), senza aggiungere dati clinici. Dove un blocco non ha contenuto resta una frase
  // neutra o il blocco non c'e. I segnaposto [DATO MANCANTE] non si mostrano ai cittadini.
  function comeAdulto(slug, c, m) {
    if (slug === "neonatale") {
      const q = serie(c, "N6·Domanda", "", " ").map((t, i) => ({ d: t, r: c["N6·Risposta " + (i + 1)] }));
      q.push({ d: "Se il bambino deve ancora nascere?", r: c["N7·Paragrafo"] + " " + serie(c, "N7·Voce puntata").join(". ") + "." });
      const o = {
        "S1·Occhiello": c["N1·Occhiello"], "S1·Titolo h1": "Cos'è lo screening neonatale",
        "S1·Sommario": c["N1·Sommario"], "S1·Riga di orientamento": "Cos'è, per chi è e dove farlo.", "S1·Etichetta CTA primaria": "Apri la tua regione",
        "S2·Titolo h2": "Tocca a tutti i nuovi nati", "S2·Paragrafo": c["N2·Paragrafo"],
        "S2·Cella 1 · h3": "Per tutti i neonati", "S2·Cella 1 · prosa": "Non lo decidi tu: fa parte delle cure alla nascita.", "S2·Cella 1 · etichetta icona": "Fascia di età",
        "S2·Cella 2 · h3": "Entro 48-72 ore dalla nascita", "S2·Cella 2 · prosa": "Si fa una sola volta, in ospedale, con una goccia di sangue dal tallone.", "S2·Cella 2 · etichetta icona": "Cadenza",
        "S2·Cella 3 · h3": "Offerto dal Servizio sanitario", "S2·Cella 3 · prosa": "Non si chiede e non si prenota.", "S2·Cella 3 · etichetta icona": "Costo",
        "S3·Titolo h2": c["N5·Titolo h2"],
        "S4·Titolo h2": c["N2·Titolo h2"], "S4·Paragrafo": c["N1·Riquadro · prosa"],
        "S5·Titolo h2": c["N3·Titolo h2"], "S5·Paragrafo": c["N3·Paragrafo"], "S5·Riquadro · h3": c["N3·Riquadro · titolo h3"], "S5·Riquadro · prosa": c["N3·Riquadro · prosa"],
        "S7·Titolo h2": c["N6·Titolo h2"],
        "S8·Titolo h2": "Dove farlo: scegli la tua regione", "S8·Paragrafo": c["N4·Paragrafo"],
        "S8-b·Titolo h2": m["N4-b·Titolo h3"], "S8-b·Prosa": m["N4-b·Prosa"], "S8-b·Etichetta piena": "Segnala un'iniziativa", "S8-b·Etichetta a contorno": "Torna alla mappa",
        "S9·Testo 17": c["N9"], "S11·Testo 17": c["N8"],
        "Microtesti·Titolo per Google": c["Microtesti·Titolo per Google"], "Microtesti·Descrizione per Google": c["Microtesti·Descrizione per Google"]
      };
      for (let i = 1; i <= 4; i++) { o["S3·Passo " + i + " · h3"] = c["N5·Passo " + i + " · titolo h3"]; o["S3·Passo " + i + " · prosa"] = c["N5·Passo " + i + " · prosa"]; }
      serie(c, "N2·Voce puntata").forEach((t, i) => { o["S4·Voce " + (i + 1)] = t; });
      serie(c, "N3·Voce puntata").forEach((t, i) => { o["S5·Voce " + (i + 1)] = t; });
      q.forEach((x, i) => { o["S7·D" + (i + 1)] = x.d; o["S7·R" + (i + 1)] = x.r; });
      return o;
    }
    if (slug === "diabete-celiachia") {
      const o = {
        "S1·Occhiello": c["D1·Occhiello"], "S1·Titolo h1": "Cos'è lo screening di diabete tipo 1 e celiachia",
        "S1·Sommario": c["D1·Sommario"], "S1·Riga di orientamento": "Cos'è, per chi è e dove farlo.", "S1·Etichetta CTA primaria": "Apri la tua regione",
        "S2·Titolo h2": c["D2·Titolo h2"], "S2·Paragrafo": c["D2·Paragrafo"] + " " + c["D2·Riga di cautela"],
        "S2·Cella 1 · h3": "Per i bambini", "S2·Cella 1 · prosa": "Le fasce d'età le stabilisce il programma nazionale. Il pediatra dice se tuo figlio rientra.", "S2·Cella 1 · etichetta icona": "Fascia di età",
        "S2·Cella 2 · h3": "Nessuna lettera", "S2·Cella 2 · prosa": "Il percorso parte da chi segue tuo figlio: si chiede al pediatra.", "S2·Cella 2 · etichetta icona": "Come parte",
        "S2·Cella 3 · h3": "Programma pubblico", "S2·Cella 3 · prosa": c["D7·Risposta 4"], "S2·Cella 3 · etichetta icona": "Costo",
        "S3·Titolo h2": c["D4·Titolo h2"],
        "S3·Passo 1 · h3": "Fai la domanda al pediatra", "S3·Passo 1 · prosa": c["D4·Paragrafo"] + " " + c["D4·La frase da ripetere in ambulatorio"],
        "S3·Passo 2 · h3": "Se la risposta non è chiara", "S3·Passo 2 · prosa": c["D4·Nota sotto la frase"],
        "S3·Passo 3 · h3": "Il pediatra avvia il percorso", "S3·Passo 3 · prosa": c["D7·Risposta 1"],
        "S4·Titolo h2": "Cosa prevede la legge", "S4·Paragrafo": c["D1·Riquadro · prosa (L. 130/2023)"],
        "S5·Titolo h2": c["D6·Titolo h2"], "S5·Paragrafo": c["D6·Paragrafo"], "S5·Riquadro · h3": c["D6·Riquadro · titolo h3"], "S5·Riquadro · prosa": c["D6·Riquadro · prosa"],
        "S7·Titolo h2": c["D7·Titolo h2"],
        "S8·Titolo h2": "Dove farlo: scegli la tua regione", "S8·Paragrafo": c["D5·Paragrafo"],
        "S8-b·Titolo h2": m["D5-b·Titolo h3"], "S8-b·Prosa": m["D5-b·Prosa"], "S8-b·Etichetta piena": "Segnala un'iniziativa", "S8-b·Etichetta a contorno": "Torna alla mappa",
        "S9·Testo 17": c["D9"], "S11·Testo 17": c["D8"],
        "Microtesti·Titolo per Google": c["Microtesti·Titolo per Google"], "Microtesti·Descrizione per Google": c["Microtesti·Descrizione per Google"]
      };
      serie(c, "D7·Domanda", "", " ").forEach((t, i) => { o["S7·D" + (i + 1)] = t; o["S7·R" + (i + 1)] = c["D7·Risposta " + (i + 1)]; });
      return o;
    }
    return c;
  }

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
        nome: n, vis: comp.nomeVis(n), on: scelta === n ? "true" : "false", cls: scelta === n ? "btn-reg on" : "btn-reg",
        haN: q > 0, n: q === 1 ? "1 iniziativa aperta" : q + " iniziative aperte",
        pick: () => comp.setState({ regScr: n }, () => scendiRisultati(id))
      };
    });
  }

  // Mappa d'Italia delle pagine screening: stessa mappa della home, ma colora le regioni
  // con iniziative di QUESTO screening e al clic sceglie la regione qui, senza cambiare pagina.
  function conteggi(slug) {
    const tipo = TIPO[slug], q = {};
    (window.INIZIATIVE || []).forEach((x) => { if (haTipo(x, tipo)) { q[x.reg] = (q[x.reg] || 0) + 1; } });
    return q;
  }
  function scegli(comp, n) { comp.setState({ regScr: n }, () => scendiRisultati("scr-regione")); }

  function vals(stato, rotta, comp) {
    const dentro = rotta.vista === "screening" && slugValido(rotta.arg);
    const slug = dentro ? rotta.arg : "";
    const m = M();
    const out = {
      vistaScr: dentro,
      // Tutte le pagine screening hanno la stessa struttura (Davide 31/10/2026): neonatale e diabete
      // passano dallo stesso modello, con i loro testi rimappati da comeAdulto().
      scrAdulti: dentro,
      scrOnco: dentro,
      scrProstata: slug === "prostata",
      // Senza invito nazionale: prostata e cardiovascolare (17/10/2026) usano le stesse bande.
      scrSenzaInvito: slug === "prostata" || slug === "cardiovascolare",
      scrGenitori: false,
                  scrHome: {
        h2: m["H·Titolo h2"],
        // Due gruppi (Angelo 17/10): oncologici e altri; icone proprie per ogni screening (Davide 21/10).
        onco: SLUG.slice(0, 4).map((s, i) => cartaHome(m, s, i)),
        altri: SLUG.slice(4).map((s, i) => cartaHome(m, s, i + 4))
      },
      scr: {}
    };
    if (!dentro) { return out; }

    const c = comeAdulto(slug, P()[slug] || {}, M());
    const na = window.SI_NON_AFFILIAZIONE || {};
    const v = {
      ritorno: m["R·Link"],
      nonAff: (slug === "neonatale" || slug === "diabete-celiachia") ? na.genitori : na.adulti,
      scendiRegione: () => scendi("scr-regione"),
      scendiDir: () => scendi("scr-dir"),
      scendiDomanda: () => scendi("scr-domanda")
    };

    {
      // --- stessa struttura per tutte le pagine ---
      const celle = serie(c, "S2·Cella", " · h3").map((t, i) => {
        const et = c["S2·Cella " + (i + 1) + " · etichetta icona"];
        return { h3: t, p: c["S2·Cella " + (i + 1) + " · prosa"], et: et, icona: ICONA_CELLA[et] || INFO };
      });
      const tipo = TIPO[slug];
      const dati = window.INIZIATIVE || [];
      const conta = {};
      dati.forEach((x) => { if (haTipo(x, tipo)) { conta[x.reg] = (conta[x.reg] || 0) + 1; } });
      const reg = stato.regScr || null;
      const carte = reg ? dati.filter((x) => haTipo(x, tipo) && x.reg === reg)
        .slice().sort((a, b) => String(a.chiude || "9").localeCompare(String(b.chiude || "9"))) : [];
      const inAttesa = window.__siIniziativeStato === "attesa";
      Object.assign(v, {
        occhiello: c["S1·Occhiello"], h1: c["S1·Titolo h1"], sommario: c["S1·Sommario"],
        orient: c["S1·Riga di orientamento"], cta: c["S1·Etichetta CTA primaria"],
        s2h2: c["S2·Titolo h2"], s2p: c["S2·Paragrafo"], celle: celle,
        celleCls: celle.length === 4 ? "scr-celle scr-celle-4" : "scr-celle",
        // «Approfondisci» (Angelo 19/10/2026): link per sezione da window.SI_APPROFONDISCI, solo https.
        haAppr2: !!(((window.SI_APPROFONDISCI || {})[slug] || {}).s2),
        appr2Href: ((((window.SI_APPROFONDISCI || {})[slug] || {}).s2) || {}).url || "",
        appr2Et: ((((window.SI_APPROFONDISCI || {})[slug] || {}).s2) || {}).et || "",
        bish2: c["S2-bis·Titolo h2"], bisp: c["S2-bis·Paragrafo"], bisVoci: voci(c, "S2-bis·Voce"),
        s3h2: c["S3·Titolo h2"], passi: passi(c, "S3", "h3", "prosa"),
        s4h2: c["S4·Titolo h2"], s4p: c["S4·Paragrafo"], s4Voci: voci(c, "S4·Voce"),
        s5h2: c["S5·Titolo h2"], s5p: c["S5·Paragrafo"], s5h3: c["S5·Riquadro · h3"], s5prosa: c["S5·Riquadro · prosa"],
        s5Voci: voci(c, "S5·Voce"), haS5Voci: !!c["S5·Voce 1"],
        haHpv: !!HREF_HPV && !!c["S5·Etichetta di rimando a /hpv/"], hrefHpv: HREF_HPV || "", hpv: c["S5·Etichetta di rimando a /hpv/"] || "",
        haInvito: !!HREF_INVITO, hrefInvito: HREF_INVITO || "",
        s6h2: c["S6·Titolo h2"], s6p: c["S6·Prosa"], s6btn: c["S6·Etichetta bottone a contorno"],
        s7h2: c["S7·Titolo h2"], domande: domande(c, "S7·D", "S7·R", ""),
        s8h2: c["S8·Titolo h2"], s8p: c["S8·Paragrafo"],
        regioni: griglia(comp, conta, "scr-regione"),
        sceltaRegione: (e) => { if (e.target.value) { scegli(comp, e.target.value); } },
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
    const c = comeAdulto(r.arg, P()[r.arg] || {}, M());
    let t = c["Microtesti·Titolo per Google"] || "";
    if (Array.from(t).length > 60) { t = Array.from(t).slice(0, 59).join("") + "…"; }
    if (t && document.title !== t) { document.title = t; }
    const d = c["Microtesti·Descrizione per Google"] || "";
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); meta.dataset.scr = "creata"; document.head.appendChild(meta); }
    else if (!meta.dataset.scr) { meta.dataset.scr = meta.getAttribute("content") || " "; }
    if (meta.getAttribute("content") !== d) { meta.setAttribute("content", d); }
    return true;
  }

  window.__siScreening = { vals: vals, titolo: titolo, slugValido: slugValido, conteggi: conteggi, scegli: scegli };
})();
