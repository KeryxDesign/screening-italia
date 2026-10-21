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
        nome: t, etichetta: this.nomeTipo(t), on: on ? "true" : "false", icona: this.icona(t),
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

    // --- domande frequenti = articoli WordPress (brief LORI 26/09/2026) ---
    const art = this.articoli();
    const homeArt = this.ultimiArticoli();

    // --- testimonianze (blocco 3): zero storie = niente fascia, pagina e voci di menu ---
    const storie = this.storie();
    const testiFonte = (window.__siTesti || {}).fonte;

    // --- esperienze (13/10/2026): Buone pratiche e Difficolta, zero post = niente ---
    const bp = this.esperienze("bp");
    const centri = this.centriGruppi();
    const diff = this.esperienze("diff");
    const espFonte = (window.__siEsperienze || {}).fonte;
    // Home: solo Difficolta = la banda non esce (anti-paura); solo Buone pratiche = «Cosa funziona».
    const espHome = bp.length > 0;
    const rv = this.state.rotta.vista;
    const rcTesto = this.state.rcTesto || "";
    const rcErr = this.state.rcErr || {};
    const mErr = this.state.mErr || {};
    const rcTipo = this.state.rcTipo;

    return {
      // navigazione
      navReg: (vista === "regione" || vista === "vuota" || vista === "iniziativa") ? "page" : "false",
      navTesti: vista === "testimonianze" ? "page" : "false",
      navEnti: vista === "enti" ? "page" : "false",
      navChi: vista === "chi" ? "page" : "false",
      navContatti: vista === "contatti" ? "page" : "false",
      // «Gli screening» e una tendina (brief 26/09/2026): corrente su tutte le rotte #/screening*.
      navFaq: (vista === "faq" || this.state.rotta.vista === "screening") ? "page" : "false",
      scrAperto: this.scrAperto() ? "true" : "false",
      scrApriChiudi: () => this.apriChiudi("scr"),
      // Tendina «Esperienze» (13/10/2026): esce se almeno una categoria ha post.
      haEsperienze: storie.length > 0 || bp.length > 0 || diff.length > 0,
      espAperto: this.espAperto() ? "true" : "false",
      espApriChiudi: () => this.apriChiudi("esp"),
      navEsp: this.eRottaEsperienze(rv) ? "page" : "false",
      navBp: rv === "buone-pratiche" ? "page" : "false",
      navCentri: rv === "centri" ? "page" : "false",
      navDiff: rv === "difficolta" ? "page" : "false",
      navRacconta: rv === "racconta" ? "page" : "false",
      navScrTutti: this.navScr(""),
      navScrMammografico: this.navScr("mammografico"),
      navScrCervicale: this.navScr("cervicale"),
      navScrColon: this.navScr("colon-retto"),
      navScrProstata: this.navScr("prostata"),
      navScrNeonatale: this.navScr("neonatale"),
      navScrDiabete: this.navScr("diabete-celiachia"),
      navScrCardio: this.navScr("cardiovascolare"),
      navDomande: (vista === "domande" || vista === "articoli" || vista === "articolo") ? "page" : "false",
      // Florbo 16/10/2026: dall'header si sceglie la regione sulla mappa, niente Lombardia di default.
      hrefIniziative: "#/trova",
      hrefLombardia: this.rottaRegione("Lombardia"),
      hrefLazio: this.rottaRegione("Lazio"),
      hrefVeneto: this.rottaRegione("Veneto"),
      hrefCampania: this.rottaRegione("Campania"),
      vistaHome: vista === "",
      vistaRegione: vista === "regione",
      // Offerta ASL (Angelo 19/10/2026): senza dati per la regione la pagina resta com'era.
      haAsl: !!this.offertaAsl(),
      nonHaAsl: !this.offertaAsl(),
      asl: this.offertaAsl() || { cosa: "", controlloTesto: "", righe: [] },
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
      vistaChi: vista === "chi",
      vistaContatti: vista === "contatti",
      // Il floater mail non si rende su #/contatti: la pagina ha gia il suo bottone (collaudo LORI giro 1).
      floaterMail: vista !== "contatti",

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
      // vis: trattino non separabile (U+2011) solo a video, il nome resta la chiave della rotta (QA 390, 21/10).
      regioni: this.nomiRegioni().map((n) => ({ nome: n, vis: this.nomeVis(n), href: this.rottaRegione(n) })),
      // Ultimi aggiornamenti: primi 4 articoli WordPress per data; senza, la banda non c'e.
      homeArticoli: homeArt,
      homeOk: homeArt.length > 0,

      // regione
      reg: reg,
      hrefVuota: "#/vuota/" + encodeURIComponent(reg),
      apertura: tutte.length
        ? "Scegli gli screening che ti interessano: sotto trovi le iniziative aperte adesso, con chi le organizza e il numero da chiamare."
        : "Per questa regione non risultano iniziative segnalate.",
      elencoRegioni: this.nomiRegioni().map((n) => {
        const q = conteggi[n] || 0;
        const conta = q ? this.parola(q, "iniziativa", "iniziative") : "nessuna iniziativa";
        // Griglia di pulsanti al posto della tendina (QA 390 LORI, 21/10/2026).
        return {
          nome: n, vis: this.nomeVis(n), etichetta: n + " — " + conta, conta: conta,
          href: this.rottaRegione(n), cur: n === reg ? "page" : "false", cls: n === reg ? "btn-reg on" : "btn-reg"
        };
      }),
      vaiA: (e) => { this.vaiA(this.rottaRegione(e.target.value)); },
      scelte: scelte,
      // Zero iniziative (QA 390, 21/10): niente scelta degli screening, un solo titolo.
      regPiena: tutte.length > 0,
      regVuotaAsl: tutte.length === 0 && !!this.offertaAsl(),
      regVuotaNoAsl: tutte.length === 0 && !this.offertaAsl(),
      azzera: () => this.setState({ tipi: [] }),
      quante: quante,
      titoloElenco: tutte.length === 0
        ? "Nessuna iniziativa in " + reg
        : (sel.length ? "Le iniziative corrispondenti alla tua scelta" : "Tutte le iniziative attive in " + reg),
      iniziative: viste.map((x) => this.schedaReg(x)),
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

      // domande frequenti (articoli WordPress, brief LORI 26/09/2026)
      artCerca: this.state.artCerca || "",
      artCercaScrivi: (e) => this.setState({ artCerca: e.target.value, artQuanti: 6 }),
      artMostraFiltro: art.mostraFiltro,
      artArgomenti: art.argomenti,
      artOk: art.ok,
      articoli: art.visibili,
      artAltri: art.altri,
      artFiniti: art.finiti,
      artVuotoTutto: art.vuotoTutto,
      artVuotoFiltro: art.vuotoFiltro,
      artVuotoCerca: art.vuotoCerca,
      artHaCerca: !!(this.state.artCerca || ""),
      artCercaVia: () => this.setState({ artCerca: "", artQuanti: 6 }),
      artRisultati: art.risultati,
      artErrore: art.errore,
      artMostraAltri: () => this.setState({ artQuanti: this.state.artQuanti + 6 }),
      artAzzera: () => this.setState({ artArg: null, artCerca: "", artQuanti: 6 }),

      // articolo
      vistaArticolo: vista === "articolo",
      art: this.voceArticolo(),

      // articolo WordPress (#/articolo/<slug>): vuoto mentre carica, avviso se manca
      artPronto: this.statoVoce() === "ok",
      artNonTrovato: vista === "articolo" && this.statoVoce() === "errore",
      artFinito: this.statoVoce() !== "attesa",
      artHaTesto: this.statoVoce() === "ok",
      artTestoRef: this.artTestoRef,
      // Invito a fine articolo (blocco 3): variante per categoria WordPress, solo ad articolo caricato.
      invito: this.invitoArticolo(),

      vistaEnti: vista === "enti",

      // testimonianze: in home al massimo 2, le piu recenti; il bottone solo se sono di piu
      haTesti: storie.length > 0,
      /* Senza storie la fascia verde sparisce e due bande crema resterebbero
         attaccate: «Ultimi aggiornamenti» passa a fondo bianco (LORI, giro 1 blocco 3). */
      // Con la banda esperienze (bianca) davanti, «Ultimi aggiornamenti» torna crema (LORI §2).
      ultimiCls: "banda " + (storie.length > 0 || espHome ? "b-crema" : "b-bianco") + " wrap sezione",
      vistaTesti: vista === "testimonianze" && storie.length > 0,
      testiHome: storie.slice(0, 2),
      testiTutte: storie,
      testiAltri: storie.length > 2,
      // Schede di prova (solo fuori produzione): resta il marcatore .finto gia esistente.
      testiEsempi: storie.length > 0 && testiFonte === "esempi",

      // esperienze: banda home, pagine #/buone-pratiche e #/difficolta
      haBp: bp.length > 0,
      haDiff: diff.length > 0,
      espHome: espHome,
      espHomeTitolo: diff.length > 0 ? "Cosa funziona e cosa si può migliorare" : "Cosa funziona",
      espHomeBp: bp.slice(0, 1),
      espHomeDiff: diff.slice(0, 1),
      espEsempi: espFonte === "esempi" && (bp.length > 0 || diff.length > 0),
      vistaBp: rv === "buone-pratiche",
      // Centri screening delle ASL (17/10/2026): voce di menu solo con almeno un centro.
      haCentri: centri.length > 0,
      vistaCentri: rv === "centri",
      centriGruppi: centri,
      centriVuota: centri.length === 0,
      vistaDiff: rv === "difficolta",
      bpTutte: bp,
      diffTutte: diff,
      bpVuota: bp.length === 0,
      diffVuota: diff.length === 0,

      // modulo #/racconta: niente salvato, niente fetch; la mail la apre chi scrive
      vistaRacconta: rv === "racconta",
      rcDaCompilare: !this.state.rcAperta,
      rcAperta: !!this.state.rcAperta,
      rcTipoBp: rcTipo === "bp",
      rcTipoDiff: rcTipo === "diff",
      rcSceltaBp: rcTipo === "bp" ? "scelta on" : "scelta",
      rcSceltaDiff: rcTipo === "diff" ? "scelta on" : "scelta",
      rcScegliBp: () => this.setState({ rcTipo: "bp", rcErr: rcErr.tipo ? { ...rcErr, tipo: false } : this.state.rcErr }),
      rcScegliDiff: () => this.setState({ rcTipo: "diff", rcErr: rcErr.tipo ? { ...rcErr, tipo: false } : this.state.rcErr }),
      // Niente tendine (QA 390 LORI, 21/10): pulsanti regione e radio screening. "" = «Preferisco non dirlo».
      // vis: trattino non separabile (U+2011) solo a video; il valore nella mail resta il nome normale.
      rcRegioni: [""].concat(this.nomiRegioni()).map((n) => {
        const on = (this.state.rcReg || "") === n;
        return { nome: n, vis: n ? this.nomeVis(n) : "Preferisco non dirlo", on: on ? "true" : "false",
          cls: "btn-reg" + (n ? "" : " rc-nessuna") + (on ? " on" : "") };
      }),
      rcScreeningOpz: [""].concat(this.rcScreening()).map((n, i) => ({
        nome: n, id: "rc-scr-" + i, on: (this.state.rcScr || "") === n,
        et: this.nomeVis(({ "": "Preferisco non dirlo", "Prostata": "Prostatico (PSA)", "Diabete e celiachia pediatrici": "Diabete",
          "Epatite C (HCV)": "HCV (Epatite C)" })[n] || n)
      })),
      rcReg: this.state.rcReg || "",
      rcScr: this.state.rcScr || "",
      // currentTarget: il clic puo cadere sullo <span> dentro il pulsante; il valore sta sul <button>.
      rcScriviReg: (e) => this.setState({ rcReg: (e.currentTarget && e.currentTarget.value != null ? e.currentTarget : e.target).value }),
      rcScriviScr: (e) => this.setState({ rcScr: e.target.value }),
      rcTesto: rcTesto,
      rcScriviTesto: (e) => this.setState({ rcTesto: String(e.target.value || "").slice(0, 1200), rcErr: rcErr.testo ? { ...rcErr, testo: false } : this.state.rcErr }),
      rcConta: rcTesto.length.toLocaleString("it-IT") + " caratteri su 1.200",
      rcOk: !!this.state.rcOk,
      rcSpunta: (e) => this.setState({ rcOk: !!e.target.checked, rcErr: rcErr.ok ? { ...rcErr, ok: false } : this.state.rcErr }),
      rcErrTipo: !!rcErr.tipo,
      rcErrTesto: !!rcErr.testo,
      rcErrOk: !!rcErr.ok,
      rcInvTipo: rcErr.tipo ? "true" : "false",
      rcInvTesto: rcErr.testo ? "true" : "false",
      rcInvOk: rcErr.ok ? "true" : "false",
      rcDescTesto: "rc-regole rc-conta" + (rcErr.testo ? " rc-err-testo" : ""),
      rcDescOk: rcErr.ok ? "rc-err-ok" : undefined,
      rcDescTipo: rcErr.tipo ? "rc-err-tipo" : undefined,
      rcInvia: () => this.rcInvia(),

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
      // Radio al posto della tendina (QA 390, 21/10): stesso stato mTipo, stesso valore nella mail.
      mTipo1: (this.state.mTipo || "Segnalo un’iniziativa") === "Segnalo un’iniziativa",
      mTipo2: this.state.mTipo === "Segnalo un dato sbagliato",
      mTipo3: this.state.mTipo === "Ho una domanda",
      mTipo4: this.state.mTipo === "Altro",
      mTesto: this.state.mTesto || "",
      msgInviato: !!this.state.msgInviato,
      msgDaCompilare: !this.state.msgInviato,
      scriviNome: (e) => this.setState({ mNome: e.target.value }),
      scriviIndirizzo: (e) => this.setState({ mMail: e.target.value }),
      scriviTipo: (e) => this.setState({ mTipo: e.target.value }),
      scriviTesto: (e) => this.setState({ mTesto: String(e.target.value || "").slice(0, 1200), mErr: mErr.testo ? { ...mErr, testo: false } : this.state.mErr }),
      mConta: (this.state.mTesto || "").length.toLocaleString("it-IT") + " caratteri su 1.200",
      mOk: !!this.state.mOk,
      mSpunta: (e) => this.setState({ mOk: !!e.target.checked, mErr: mErr.ok ? { ...mErr, ok: false } : this.state.mErr }),
      mErrTesto: !!mErr.testo,
      mErrOk: !!mErr.ok,
      mInvTesto: mErr.testo ? "true" : "false",
      mInvOk: mErr.ok ? "true" : "false",
      mDescTesto: "m-conta" + (mErr.testo ? " m-err-testo" : ""),
      mDescOk: mErr.ok ? "m-err-ok" : undefined,
      // Contatti (13/10/2026): apre la posta con la mail gia scritta, come #/racconta.
      inviaModulo: () => this.ctInvia(),
      vistaPrivacy: vista === "privacy",

      // pagine screening (25/09/2026): vistaScr, scrOnco, scrProstata, scrGenitori, scr, scrHome
      ...(window.__siScreening ? window.__siScreening.vals(this.state, this.state.rotta, this)
        : { vistaScr: false, scrAdulti: false, scrOnco: false, scrProstata: false, scrSenzaInvito: false, scrGenitori: false, scrNeo: false, scrDia: false, scr: {}, scrHome: { card: [] } })
    };
  }
};
