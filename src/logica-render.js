/* Logica della pagina, parte 2 di 2: renderVals(), verbatim dallo script x-dc (split 24/09/2026). */
window.__siLogicaRender = class {
  renderVals() {
    const vista = this.vista();
    const reg = this.reg();
    const dati = window.INIZIATIVE || [];
    const conteggi = this.conteggi();

    // --- regione ---
    const tutte = dati.filter((x) => x.reg === reg);
    const sel = this.state.tipi;
    const nomiTipi = [];
    tutte.forEach((x) => { if (nomiTipi.indexOf(x.tipo) === -1) { nomiTipi.push(x.tipo); } });
    // Massimo sei filtri: oltre quel numero la fila diventa illeggibile.
    // Restano i sei tipi con piu iniziative nella regione.
    nomiTipi.sort((a, b) => {
      const d = tutte.filter((x) => x.tipo === b).length - tutte.filter((x) => x.tipo === a).length;
      return d !== 0 ? d : a.localeCompare(b);
    });
    nomiTipi.splice(6);
    nomiTipi.sort();
    const scelte = nomiTipi.map((t) => {
      const n = tutte.filter((x) => x.tipo === t).length;
      const on = sel.indexOf(t) !== -1;
      return {
        nome: t, on: on ? "true" : "false", icona: this.icona(t),
        conta: this.parola(n, "iniziativa", "iniziative"),
        cls: on ? "scelta on" : "scelta",
        pick: () => this.setState((s) => ({
          tipi: s.tipi.indexOf(t) === -1 ? s.tipi.concat([t]) : s.tipi.filter((x) => x !== t)
        }))
      };
    });
    // Chi chiude prima sta in cima: e l'informazione che fa agire.
    const viste = (sel.length ? tutte.filter((x) => sel.indexOf(x.tipo) !== -1) : tutte)
      .slice().sort((a, b) => String(a.chiude || "9").localeCompare(String(b.chiude || "9")));
    const inScadenza = viste.filter((x) => {
      const g = this.giorniAllaChiusura(x);
      return g !== null && g >= 0 && g <= 7;
    }).length;
    let quante = "Nessuna iniziativa aperta in " + reg + ".";
    if (tutte.length) {
      quante = sel.length
        ? this.parola(viste.length, "iniziativa aperta", "iniziative aperte") + " per la tua scelta."
        : this.parola(tutte.length, "iniziativa aperta", "iniziative aperte") + " in " + reg + ". Seleziona uno screening per restringere l’elenco.";
    }

    // --- domande frequenti ---
    const tutteFaq = this.domande();
    const ago = this.normalizza(this.state.q).trim();
    const cat = this.state.cat;
    const nomiCat = [];
    tutteFaq.forEach((a) => { if (nomiCat.indexOf(a.cat) === -1) { nomiCat.push(a.cat); } });
    const categorie = [{ nome: "Tutti", val: null }].concat(nomiCat.map((c) => ({ nome: c, val: c }))).map((c) => ({
      nome: c.nome,
      cls: cat === c.val ? "filtro on" : "filtro",
      pick: () => this.setState({ cat: c.val })
    }));
    const trovate = tutteFaq.filter((a) => {
      if (cat && a.cat !== cat) { return false; }
      if (!ago) { return true; }
      return this.normalizza(a.titolo + " " + a.cat + " " + a.chiavi).indexOf(ago) !== -1;
    });
    let quanteFaq = this.parola(trovate.length, "risposta", "risposte");
    if (trovate.length === 0) { quanteFaq = "Nessuna risposta"; }
    quanteFaq = quanteFaq + (cat ? " in «" + cat + "»" : "") + (ago ? " per «" + this.state.q + "»" : "") + ".";

    // --- articoli sugli screening ---
    const art = this.articoli();

    return {
      // navigazione
      navReg: (vista === "regione" || vista === "vuota" || vista === "iniziativa") ? "page" : "false",
      navTesti: vista === "testimonianze" ? "page" : "false",
      navEnti: vista === "enti" ? "page" : "false",
      navChi: vista === "chi" ? "page" : "false",
      navContatti: vista === "contatti" ? "page" : "false",
      navFaq: (vista === "faq" || vista === "prostata" || vista === "articolo" || vista === "articoli") ? "page" : "false",
      navDomande: vista === "domande" ? "page" : "false",
      hrefIniziative: this.rottaRegione("Lombardia"),
      vistaHome: vista === "",
      vistaRegione: vista === "regione",
      vistaVuota: vista === "vuota",
      // pagina dell'iniziativa (card cliccabili, 24/09/2026)
      vistaIniziativa: vista === "iniziativa",
      iniTrovata: vista === "iniziativa" && dati.some((x) => x.id === this.state.rotta.arg),
      // Finche i dati non sono caricati non si dichiara «non trovata».
      iniMancante: vista === "iniziativa" && dati.length > 0 && window.__siIniziativeStato !== "attesa" && !dati.some((x) => x.id === this.state.rotta.arg),
      ini: (() => {
        const d = dati.filter((x) => x.id === this.state.rotta.arg)[0];
        return d ? this.scheda(d) : this.scheda({ reg: "", tipo: "", titolo: "", tel: "", stato: "" });
      })(),
      vistaFaq: vista === "faq" || vista === "domande" || vista === "articoli",
      vistaProstata: vista === "prostata",
      vistaChi: vista === "chi",
      vistaContatti: vista === "contatti",

      // home
      nIniziative: dati.length ? String(dati.length) : "–",
      nRegioni: String(Object.keys(conteggi).length),
      nTipi: String(new Set(dati.map((x) => x.tipo)).size),
      aggiornato: "3 settembre",
      vaiAllaMappa: () => {
        const el = document.querySelector("#trova");
        if (el) { window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset - 70); }
      },
      mappaRef: this.mappaRef,
      erroreMappa: !!this.state.erroreMappa,
      regioni: this.nomiRegioni().map((n) => ({ nome: n, href: this.rottaRegione(n) })),
      faqHome: tutteFaq.slice(0, 3).map((a) => ({ slot: "home-" + a.id, cat: a.cat, data: a.data, titolo: a.titolo, sommario: a.sommario, foto: a.foto, href: a.href })),

      // regione
      reg: reg,
      hrefVuota: "#/vuota/" + encodeURIComponent(reg),
      apertura: tutte.length
        ? "Seleziona gli screening che ti interessano: di seguito sono riportate le sole iniziative attualmente attive, con l’ente organizzatore e il recapito telefonico."
        : "Per questa regione non risultano iniziative segnalate.",
      elencoRegioni: this.nomiRegioni().map((n) => {
        const q = conteggi[n] || 0;
        return { nome: n, etichetta: n + " — " + (q ? this.parola(q, "iniziativa", "iniziative") : "nessuna iniziativa") };
      }),
      vaiA: (e) => { this.vaiA(this.rottaRegione(e.target.value)); },
      scelte: scelte,
      azzera: () => this.setState({ tipi: [] }),
      quante: quante,
      titoloElenco: tutte.length === 0
        ? "Nessuna iniziativa in " + reg
        : (sel.length ? "Le iniziative corrispondenti alla tua scelta" : "Tutte le iniziative attive in " + reg),
      iniziative: viste.map((x) => this.scheda(x)),
      avvisoScadenza: inScadenza > 0
        ? (inScadenza === 1 ? "Una di queste chiude entro una settimana." : inScadenza + " di queste chiudono entro una settimana.")
        : "",
      haAvvisoScadenza: inScadenza > 0,
      vuotoPerScelta: tutte.length > 0 && viste.length === 0,

      // regione vuota
      mail: this.state.mail,
      inviato: this.state.inviato,
      daCompilare: !this.state.inviato,
      scriviMail: (e) => this.setState({ mail: e.target.value }),
      inviaMail: () => { if (this.state.mail) { this.setState({ inviato: true }); } },

      // domande frequenti
      q: this.state.q,
      haQ: this.state.q.length > 0,
      scrivi: (e) => this.setState({ q: e.target.value }),
      pulisci: () => this.setState({ q: "" }),
      categorie: categorie,
      quanteFaq: quanteFaq,
      vuotoFaq: trovate.length === 0,
      risposte: trovate.map((a) => ({ slot: a.id, cat: a.cat, data: a.data, titolo: a.titolo, sommario: a.sommario, foto: a.foto, href: a.href })),

      // articoli sugli screening (sezione in fondo alle domande, 23/09/2026)
      artMostraFiltro: art.mostraFiltro,
      artArgomenti: art.argomenti,
      artOk: art.ok,
      articoli: art.visibili,
      artAltri: art.altri,
      artFiniti: art.finiti,
      artVuotoTutto: art.vuotoTutto,
      artVuotoFiltro: art.vuotoFiltro,
      artErrore: art.errore,
      artMostraAltri: () => this.setState({ artQuanti: this.state.artQuanti + 10 }),
      artAzzera: () => this.setState({ artArg: null, artQuanti: 3 }),

      // articolo
      vistaArticolo: vista === "articolo",
      art: (() => {
        const id = this.state.rotta.arg || "faq-1";
        const d = tutteFaq.filter((x) => x.id === id)[0] || tutteFaq[0];
        const corpo = (this.corpi()[d.id] || []).map((s) => ({
          h: s.h, p: s.p, chiave: s.chiave || "", corsivo: s.corsivo || "",
          haChiave: !!s.chiave, haCorsivo: !!s.corsivo
        }));
        return {
          slot: "art-" + d.id, foto: d.foto, cat: d.cat, titolo: d.titolo,
          sommario: d.sommario, data: d.data, corpo: corpo
        };
      })(),

      vistaEnti: vista === "enti",

      // testimonianze
      vistaTesti: vista === "testimonianze",
      testiGiro: this.testimonianze(),
      testiTutte: this.testimonianze(),

      // consenso ai cookie
      bannerAperto: !!this.state.bannerAperto,
      scelteAperte: !!this.state.scelteAperte,
      statOn: this.state.statBozza ? "true" : "false",
      statCls: this.state.statBozza ? "ck-sw on" : "ck-sw",
      giraStat: () => this.setState({ statBozza: !this.state.statBozza }),
      apriScelte: () => {
        const c = this.leggiConsenso();
        this.setState({ scelteAperte: true, bannerAperto: false, statBozza: c ? !!c.stat : false });
      },
      chiudiScelte: () => this.setState({ scelteAperte: false, bannerAperto: !this.leggiConsenso() }),
      salvaScelte: () => this.scriviConsenso(this.state.statBozza),
      accettaTutti: () => this.scriviConsenso(true),
      rifiutaTutti: () => this.scriviConsenso(false),
      vistaCookie: vista === "cookie",
      statoConsenso: (() => {
        const c = this.state.consenso;
        if (!c) { return "Non hai ancora scelto: i cookie di statistica sono spenti."; }
        return c.stat
          ? "Hai accettato i cookie di statistica."
          : "Hai scelto solo i cookie tecnici: le statistiche sono spente.";
      })(),
      misurazioneFinta: !!this.state.misurazioneFinta,

      // modulo dei contatti
      mNome: this.state.mNome || "",
      mMail: this.state.mMail || "",
      mTipo: this.state.mTipo || "Segnalo un’iniziativa",
      mTesto: this.state.mTesto || "",
      msgInviato: !!this.state.msgInviato,
      msgDaCompilare: !this.state.msgInviato,
      scriviNome: (e) => this.setState({ mNome: e.target.value }),
      scriviIndirizzo: (e) => this.setState({ mMail: e.target.value }),
      scriviTipo: (e) => this.setState({ mTipo: e.target.value }),
      scriviTesto: (e) => this.setState({ mTesto: e.target.value }),
      inviaModulo: () => {
        if (this.state.mMail && this.state.mTesto) { this.setState({ msgInviato: true }); }
      },

      // articolo prostata
      prostata: dati.filter((x) => x.tipo === "Prostata").map((x) => this.scheda(x))
    };
  }
};
