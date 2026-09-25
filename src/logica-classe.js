/* Logica della pagina, parte 1 di 2: estratta verbatim dallo script x-dc (split 24/09/2026).
   Il runtime legge lo script x-dc solo inline: qui la classe vive intera, lo stub la chiede. */
window.__siLogica = function (DCLogic) {
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { rotta: this.leggiRotta(), tipi: [], q: "", cat: null, mail: "", inviato: false,
      artArg: null, artQuanti: 3, artStato: null, artDati: null };
    this.mappaRef = (el) => { this.mapEl = el; this.disegnaMappa(); };
    // Corpo dell'articolo WordPress: lo scrive mettiTesto(), non il modello.
    this.artTestoRef = (el) => { this.artTestoEl = el; this.mettiTesto(); };
  }
  /* ---- Consenso ai cookie ----
     Il tag di misurazione parte SOLO dopo il consenso: Consent Mode con
     default negato, e nessuno script di Google caricato prima del si. */
  /* «Domande frequenti» apre la pagina degli screening direttamente sull'elenco.
     Vale per clic, ricarica e link condiviso. Il tasto indietro del browser riporta
     sempre in cima (Davide, 24/09/2026): per questo onHash non chiama portaAllElenco. */
  portaAllElenco(vista) {
    // «articoli» (23/09/2026) fa lo stesso: apre gli screening sul titolo della sezione articoli.
    if (vista !== "domande" && vista !== "articoli") { return; }
    const bersaglio = vista === "domande" ? "#elenco-domande" : "#elenco-articoli";
    // Al primo caricamento il browser ripristina la posizione da solo e le foto
    // cambiano l'altezza della pagina: si insiste finche la posizione tiene.
    try { window.history.scrollRestoration = "manual"; } catch (e) {}
    const tenta = (giri) => {
      if (this.state.rotta.vista !== vista) { return; }
      const el = document.querySelector(bersaglio);
      if (el) {
        const meta = el.getBoundingClientRect().top + window.pageYOffset - 96;
        if (Math.abs(window.pageYOffset - meta) > 4) { window.scrollTo(0, meta); }
      }
      if (giri > 0) { setTimeout(() => tenta(giri - 1), 260); }
    };
    setTimeout(() => tenta(10), 260);
  }
  leggiConsenso() {
    try {
      const v = window.localStorage.getItem("si-consenso-cookie");
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }
  scriviConsenso(stat) {
    const dato = { stat: !!stat, data: new Date().toISOString(), versione: 1 };
    try { window.localStorage.setItem("si-consenso-cookie", JSON.stringify(dato)); } catch (e) {}
    this.applicaConsenso(dato);
    this.setState({ consenso: dato, bannerAperto: false, scelteAperte: false });
  }
  avviaConsentMode() {
    if (window.__siConsentPronto) { return; }
    window.__siConsentPronto = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Default: tutto negato finche l'utente non sceglie.
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      wait_for_update: 500
    });
    window.gtag("js", new Date());
  }
  applicaConsenso(dato) {
    if (!dato) { return; }
    this.avviaConsentMode();
    window.gtag("consent", "update", {
      analytics_storage: dato.stat ? "granted" : "denied"
    });
    if (dato.stat) { this.caricaMisurazione(); }
  }
  caricaMisurazione() {
    if (this.misurazioneCaricata) { return; }
    this.misurazioneCaricata = true;
    // ⚠️ Segnaposto: in anteprima gli script girano davvero, e un ID di produzione
    // sparerebbe eventi veri da un dominio che non e quello del cliente.
    // L'ID reale (G-…) lo mette SENTINEL in fase di build.
    const ID = "G-XXXXXXXXXX";
    if (ID.indexOf("X") !== -1) {
      this.setState({ misurazioneFinta: true });
      window.gtag("config", ID, { send_page_view: false });
      return;
    }
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
    document.head.appendChild(s);
    window.gtag("config", ID);
  }

  componentDidMount() {
    const c = this.leggiConsenso();
    this.avviaConsentMode();
    if (c) { this.applicaConsenso(c); } else { setTimeout(() => this.setState({ bannerAperto: true }), 900); }
    this.setState({ consenso: c });
    this.portaAllElenco(this.state.rotta.vista);

    /* Articoli: i dati veri arrivano da window.Articoli (articoli.js, SENTINEL):
       lista({pagina, perPagina, categoria}) risponde {esito:"ok"|"vuoto"|"offline"|"errore", articoli, totale}.
       In bozza articoli.js non e caricato: lo stato si sceglie dal pannello Tweaks, prop "statoArticoli". */
    // Gli script del prototipo arrivano in ordine sparso: se articoli.js non e ancora
    // caricato, ci riprova il giro del tick qui sotto (SENTINEL, 24/09/2026).
    this.caricaArticoli();
    this.caricaVoce();

    this.onHash = () => {
      const r = this.leggiRotta();
      this.setState({ rotta: r, tipi: [], inviato: false, mail: "" });
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", this.onHash);
    // In certe anteprime in iframe il cambio di indirizzo e bloccato:
    // i clic sui link interni vengono gestiti qui, senza dipendere dall hash.
    this.onClickInterno = (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href^="#/"]') : null;
      if (!a) { return; }
      e.preventDefault();
      this.vaiA(a.getAttribute("href"));
    };
    document.addEventListener("click", this.onClickInterno);
    this.tick = setInterval(() => {
      const vuote = document.querySelectorAll(".mappa:not(:has(svg))");
      if (vuote.length) { this.disegnaMappa(); }
      if (!window.INIZIATIVE || !window.REGIONI_ITALIA) { this.forceUpdate(); }
      this.caricaArticoli();
      this.caricaVoce();
      // Iniziative vere da WordPress (iniziative-wp.js): arrivano dopo il montaggio.
      // Se iniziative.js arriva in ritardo e le copre con gli esempi, si rimettono.
      if (window.__siIniziativeWP && window.INIZIATIVE !== window.__siIniziativeWP) { window.INIZIATIVE = window.__siIniziativeWP; this.iniVer = -1; }
      if ((window.__siIniziativeVer || 0) !== (this.iniVer || 0)) {
        this.iniVer = window.__siIniziativeVer || 0;
        // La mappa si ridisegna solo se cambia regione: si azzera il segno per i nuovi conteggi.
        document.querySelectorAll(".mappa").forEach((el) => { delete el.dataset.reg; });
        this.forceUpdate();
      }
    }, 350);
    setTimeout(() => { if (!window.REGIONI_ITALIA) { this.setState({ erroreMappa: true }); } }, 8000);
    this.centraNav();
    // L'effetto di comparsa si accende SOLO se in questo ambiente le transizioni
    // avanzano davvero. Altrimenti non si nasconde nulla: il contenuto e la priorita.
    this.provaAnimazioni();
    this.osserva();
    setTimeout(() => this.curaDettaglio(), 0);
  }
  /* Articolo singolo da WordPress, rotta #/articolo/<slug> (24/09/2026).
     Le FAQ interne (faq-N, o nessun argomento) restano sui dati di corpi(). */
  eFaq(arg) { return !arg || /^faq-\d+$/.test(arg); }
  caricaVoce() {
    const r = this.state.rotta;
    if (r.vista !== "articolo" || this.eFaq(r.arg)) { this.voceChiesta = null; return; }
    if (this.voceChiesta === r.arg || !window.Articoli) { return; }
    const slug = r.arg;
    this.voceChiesta = slug;
    this.setState({ voceSlug: slug, voceStato: "attesa", voce: null });
    const fine = (a) => {
      if (this.voceChiesta !== slug) { return; }
      // Gli articoli protetti da password non si mostrano: il contenuto arriva vuoto.
      const buono = a && !a.protetto;
      this.setState({ voceStato: buono ? "ok" : "errore", voce: buono ? a : null });
    };
    window.Articoli.perSlug(slug).then((x) => fine(x.esito === "ok" ? x.articolo : null), () => fine(null));
  }
  // Stato della vista articolo: «attesa» finche la risposta per QUESTO slug non c'e.
  statoVoce() {
    const r = this.state.rotta;
    if (r.vista !== "articolo" || this.eFaq(r.arg)) { return "faq"; }
    return this.state.voceSlug === r.arg && this.state.voceStato !== "attesa" ? this.state.voceStato : "attesa";
  }
  /* L'unico innerHTML della pagina: testoHtml e gia passato da ripulisciHtml().
     Nessun'altra stringa entra qui. Ai paragrafi e ai sottotitoli si danno le
     classi che il corpo delle FAQ usa gia: stesso aspetto, nessuna classe nuova.
     Poi i nodi gia inseriti si spostano (nessun HTML nuovo) in una section
     .art-sez per ogni h2, come le FAQ; cio che sta prima del primo h2 fa sezione a se. */
  mettiTesto() {
    const el = this.artTestoEl;
    if (!el) { return; }
    const v = this.statoVoce() === "ok" ? this.state.voce : null;
    const chiave = v ? v.slug : "";
    if (el.dataset.slug === chiave) { return; }
    el.dataset.slug = chiave;
    el.innerHTML = v ? v.testoHtml : "";
    el.querySelectorAll("p").forEach((n) => n.classList.add("art-p"));
    el.querySelectorAll("h2").forEach((n) => n.classList.add("art-sub"));
    this.dividiSezioni(el);
  }
  dividiSezioni(el) {
    const nodi = Array.prototype.slice.call(el.childNodes);
    let sez = null;
    nodi.forEach((n) => {
      const vuoto = n.nodeType === 3 && !n.textContent.trim();
      if (n.nodeType === 1 && n.tagName === "H2") { sez = null; }
      if (!sez) {
        if (vuoto || n.nodeType === 8) { el.removeChild(n); return; }
        sez = document.createElement("section");
        sez.className = "art-sez fx col gap12";
        el.insertBefore(sez, n);
      }
      sez.appendChild(n);
    });
  }
  // «23 settembre 2026», fuso di Roma: lo stesso formato delle date gia sul sito.
  dataArticolo(iso) {
    if (!iso) { return ""; }
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) { return ""; }
      return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(d);
    } catch (e) { return ""; }
  }
  caricaArticoli() {
    if (this.artChiesti || !window.Articoli) { return; }
    this.artChiesti = true;
    window.Articoli.lista({ pagina: 1, perPagina: 10 }).then((r) => {
      this.setState({ artStato: r.esito, artDati: r.articoli });
    });
  }
  osserva() {
    // Comparsa graduale dei blocchi quando entrano nello schermo.
    const applica = () => {
      // Solo i blocchi strutturali: mai le schede generate dai filtri,
      // altrimenti un contenuto rigenerato potrebbe restare invisibile.
      const nodi = document.querySelectorAll(".banda > div > *");
      nodi.forEach((n, i) => {
        if (n.closest(".hero")) { return; }
        if (n.classList.contains("card") || n.classList.contains("art")) { return; }
        if (n.classList.contains("rivela")) { return; }
        n.classList.add("rivela");
        if (i % 3 === 1) { n.classList.add("d1"); }
        if (i % 3 === 2) { n.classList.add("d2"); }
        // Se e gia in vista (o quasi) si mostra subito: la visibilita non dipende dall osservatore.
        const b = n.getBoundingClientRect();
        if (b.top < window.innerHeight * 1.05) {
          requestAnimationFrame(() => n.classList.add("dentro"));
          return;
        }
        if (this.occhio) { this.occhio.observe(n); } else { n.classList.add("dentro"); }
      });
    };
    if (!this.occhio && window.IntersectionObserver) {
      this.occhio = new IntersectionObserver((voci) => {
        voci.forEach((v) => {
          if (v.isIntersecting) { v.target.classList.add("dentro"); this.occhio.unobserve(v.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    }
    applica();
    this.riapplica = applica;
    setTimeout(applica, 400);
    this.rete();
    // Anche durante lo scorrimento: cio che entra in vista si mostra, sempre.
    this.onScroll = () => {
      document.querySelectorAll(".rivela:not(.dentro)").forEach((n) => {
        const b = n.getBoundingClientRect();
        // Basta che il blocco abbia superato la soglia: se e gia stato oltrepassato
        // (bottom negativo) deve comunque restare visibile, non tornare invisibile.
        if (b.top < window.innerHeight * 0.94) { n.classList.add("dentro"); }
      });
    };
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onScroll);
    // Un cambio di altezza senza scorrimento (un soffietto che si apre) spinge
    // il blocco successivo in vista senza generare alcun evento: lo intercettiamo.
    if (window.ResizeObserver) {
      this.occhioAltezza = new ResizeObserver(() => {
        clearTimeout(this.timerAltezza);
        this.timerAltezza = setTimeout(this.onScroll, 60);
      });
      const radice = document.querySelector("x-dc") || document.body;
      if (radice) { this.occhioAltezza.observe(radice); }
    }
    document.addEventListener("toggle", this.onScroll, true);

    // Guardiano: se in questo ambiente le transizioni non avanzano, un blocco
    // marcato come visibile resta a opacita zero. In quel caso l'effetto di
    // comparsa si spegne del tutto: meglio nessuna animazione che testo invisibile.
    const guardiano = () => {
      const marcati = document.querySelectorAll(".rivela.dentro");
      for (let i = 0; i < marcati.length; i++) {
        const o = parseFloat(window.getComputedStyle(marcati[i]).opacity);
        if (o < 0.5) { this.spegniAnimazioni(); return; }
      }
    };
    this.guardiaTimer = setInterval(guardiano, 1400);
    setTimeout(guardiano, 1600);
    // Se la pagina non e in primo piano le animazioni non girano: niente effetto.
    this.onVis = () => {
      if (document.visibilityState !== "visible") {
        this.spegniAnimazioni();
      } else if (document.documentElement.classList.contains("senza-anim")) {
        // Reversibile: se la pagina torna in primo piano si riprova.
        document.documentElement.classList.remove("senza-anim");
        this.provaAnimazioni();
      }
    };
    document.addEventListener("visibilitychange", this.onVis);
    this.onVis();
  }
  provaAnimazioni() {
    const p = document.createElement("div");
    p.setAttribute("aria-hidden", "true");
    p.style.cssText = "position:fixed;left:-9999px;top:0;width:8px;height:8px;pointer-events:none;opacity:0;transition:opacity 80ms linear";
    document.body.appendChild(p);
    void p.offsetHeight;
    p.style.opacity = "1";
    setTimeout(() => {
      const avanzata = parseFloat(window.getComputedStyle(p).opacity) > 0.3;
      p.remove();
      if (avanzata && document.visibilityState === "visible") {
        document.documentElement.classList.add("js-anim");
      } else {
        this.spegniAnimazioni();
      }
    }, 300);
  }
  spegniAnimazioni() {
    // senza-anim vince con !important anche su una transizione gia avviata.
    document.documentElement.classList.remove("js-anim");
    document.documentElement.classList.add("senza-anim");
  }
  rete() {
    // Nulla resta invisibile: dopo poco si mostra tutto cio che e in vista.
    clearTimeout(this.reteTimer);
    this.reteTimer = setTimeout(() => {
      document.querySelectorAll(".rivela:not(.dentro)").forEach((n) => {
        const b = n.getBoundingClientRect();
        if (b.top < window.innerHeight * 1.3) { n.classList.add("dentro"); }
      });
    }, 1200);
  }
  componentDidUpdate() {
    if (this.riapplica) { this.riapplica(); this.rete(); }
    this.disegnaMappa();
    const s = document.querySelector("#scegli-reg");
    if (s && s.options.length > 1 && s.value !== this.reg()) { s.value = this.reg(); }
    this.curaDettaglio();
    this.caricaVoce();
    this.mettiTesto();
  }
  componentWillUnmount() {
    window.removeEventListener("hashchange", this.onHash);
    document.removeEventListener("click", this.onClickInterno);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onScroll);
    document.removeEventListener("toggle", this.onScroll, true);
    if (this.occhioAltezza) { this.occhioAltezza.disconnect(); }
    clearTimeout(this.timerAltezza);
    clearInterval(this.guardiaTimer);
    document.removeEventListener("visibilitychange", this.onVis);
    clearInterval(this.tick);
  }
  centraNav() {
    setTimeout(() => {
      const nav = document.querySelector(".nav-riga");
      const att = nav && nav.querySelector('[aria-current="page"]');
      if (nav && att) { nav.scrollLeft = att.offsetLeft - (nav.clientWidth - att.offsetWidth) / 2; }
    }, 150);
  }

  vaiA(rotta) {
    const pulita = String(rotta).replace(/^#\/?/, "");
    const p = pulita.split("/");
    let vista = p[0] || "";
    const note = ["", "regione", "vuota", "faq", "prostata", "chi", "contatti", "testimonianze", "articolo", "enti", "cookie", "domande", "articoli", "iniziativa"];
    if (note.indexOf(vista) === -1) { vista = ""; }
    const arg = p[1] ? decodeURIComponent(p[1]) : "";
    this.setState({ rotta: { vista: vista, arg: arg }, tipi: [], inviato: false, mail: "" });
    window.scrollTo(0, 0);
    this.portaAllElenco(vista);
    // pushState: ogni vista entra nella cronologia, cosi il tasto indietro del browser
    // torna alla vista prima invece di uscire dal sito. Niente voci doppie.
    try { if (window.location.hash !== new URL(rotta, window.location.href).hash) { window.history.pushState(null, "", rotta); } } catch (e) {}
  }
  leggiRotta() {
    let h = "";
    try { h = String(window.location.hash || "").replace(/^#\/?/, ""); } catch (e) {}
    const p = h.split("/");
    let vista = p[0] || "";
    const arg = p[1] ? decodeURIComponent(p[1]) : "";
    const note = ["", "regione", "vuota", "faq", "prostata", "chi", "contatti", "testimonianze", "articolo", "enti", "cookie", "domande", "articoli", "iniziativa"];
    if (note.indexOf(vista) === -1) { vista = ""; }
    return { vista: vista, arg: arg };
  }
  vista() { return this.state.rotta.vista; }
  reg() { return this.state.rotta.arg || "Lombardia"; }

  nomiRegioni() {
    return ["Abruzzo","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia","Lazio","Liguria","Lombardia","Marche","Molise","Piemonte","Puglia","Sardegna","Sicilia","Toscana","Trentino-Alto Adige","Umbria","Valle d'Aosta","Veneto"];
  }
  conteggi() {
    const c = {};
    (window.INIZIATIVE || []).forEach((x) => { c[x.reg] = (c[x.reg] || 0) + 1; });
    return c;
  }
  rottaRegione(n) {
    const q = this.conteggi()[n] || 0;
    return "#/" + (q > 0 ? "regione" : "vuota") + "/" + encodeURIComponent(n);
  }
  etichettaConta(n) {
    const q = this.conteggi()[n] || 0;
    if (q === 0) { return "nessuna iniziativa segnalata"; }
    if (q === 1) { return "1 iniziativa aperta"; }
    return q + " iniziative aperte";
  }
  parola(n, uno, molte) { return n + " " + (n === 1 ? uno : molte); }

  disegnaMappa() {
    // Tutte le mappe presenti nella schermata, non solo la prima.
    const tutte = Array.prototype.slice.call(document.querySelectorAll(".mappa"));
    if (this.mapEl && this.mapEl.isConnected && tutte.indexOf(this.mapEl) === -1) { tutte.push(this.mapEl); }
    if (!tutte.length || !window.MappaItalia || !window.MappaItalia.pronta()) { return; }
    const marca = this.vista() === "regione" ? this.reg() : "";
    tutte.forEach((el) => {
      if (el.querySelector("svg") && el.dataset.reg === marca) { return; }
      el.dataset.reg = marca;
      window.MappaItalia.disegna(el, {
        conteggi: this.conteggi(),
        attiva: this.vista() === "regione" ? this.reg() : null,
        href: (n) => this.rottaRegione(n),
        vai: (n) => this.vaiA(this.rottaRegione(n)),
        etichetta: (n) => this.etichettaConta(n)
      });
    });
  }

  icona(tipo) {
    const I = {
      "Mammografico": "M12 3a9 9 0 100 18 9 9 0 000-18M12 10.6a1.4 1.4 0 100 2.8 1.4 1.4 0 000-2.8",
      "Colon-retto": "M6 4c0 4.5 5.5 3.5 5.5 8S5 15.5 5 19h14",
      "Cervice uterina": "M12 3.5l7 3v5.2c0 4.2-3 6.9-7 8.3-4-1.4-7-4.1-7-8.3V6.5z",
      "Prostata": "M12 3.5c3.2 4.2 5.2 6.4 5.2 9A5.2 5.2 0 0112 17.7 5.2 5.2 0 016.8 12.5c0-2.6 2-4.8 5.2-9z",
      "Melanoma": "M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9M12 2.5v2M12 19.5v2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M2.5 12h2M19.5 12h2M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4",
      "Polmone": "M12 3.5v9M9 8.5c-2.2 1.2-3.2 3.4-3.2 6.4v5H9v-7M15 8.5c2.2 1.2 3.2 3.4 3.2 6.4v5H15v-7",
      "Osteoporosi": "M8 5.5a2.2 2.2 0 00-2.2 2.2A2.2 2.2 0 008 9.9h8a2.2 2.2 0 002.2-2.2A2.2 2.2 0 0016 5.5M8 14.1a2.2 2.2 0 00-2.2 2.2A2.2 2.2 0 008 18.5h8a2.2 2.2 0 002.2-2.2 2.2 2.2 0 00-2.2-2.2M9.5 9.9v4.2M14.5 9.9v4.2",
      "Tiroide": "M12 7.5v8M9.2 8c-2.9 0-4.2 2-4.2 4.2S6.3 16.5 9.2 16.5s2.8-2 2.8-4.3S12.1 8 9.2 8M14.8 8c2.9 0 4.2 2 4.2 4.2s-1.3 4.3-4.2 4.3-2.8-2-2.8-4.3S11.9 8 14.8 8"
    };
    return I[tipo] || "M12 3a9 9 0 100 18 9 9 0 000-18";
  }
  scheda(x) {
    let cls = "tag tag-gratis";
    if (x.stato === "a pagamento") { cls = "tag tag-paga"; }
    if (x.stato === "su invito") { cls = "tag tag-invito"; }
    return {
      tipo: x.tipo, icona: this.icona(x.tipo), titolo: x.titolo, ente: x.ente, dove: x.dove,
      quando: x.quando, chi: x.chi, tel: x.tel, href: "tel:" + x.tel.split(" ").join(""),
      tagTesto: x.stato, tagCls: cls,
      scadenza: this.scadenza(x).testo, scadenzaCls: this.scadenza(x).cls,
      haScadenza: !!this.scadenza(x).testo,
      posti: x.posti || "", haPosti: !!x.posti,
      // Card cliccabile (24/09/2026): la card apre la pagina dell'iniziativa.
      id: x.id || "", hrefDettaglio: "#/iniziativa/" + encodeURIComponent(x.id || ""),
      reg: x.reg, hrefRegione: "#/regione/" + encodeURIComponent(x.reg)
    };
  }
  /* Pagina dell'iniziativa: fuoco sull'H1 all'arrivo (il lettore di schermo annuncia
     la pagina) e titolo della scheda del browser. Lo scroll resta quello di sempre:
     in cima (Davide, 24/09/2026), anche sul ritorno all'elenco. */
  titoloScheda(titolo, regione) {
    const TETTO = 60;
    const lung = (s) => Array.from(s).length;
    const sep = " · ";
    const pieno = titolo + sep + regione + sep + "Screening Italia";
    if (lung(pieno) <= TETTO) { return pieno; }
    const corto = titolo + sep + regione;
    if (lung(corto) <= TETTO) { return corto; }
    const parole = titolo.split(" ");
    while (parole.length > 1) {
      parole.pop();
      const t = parole.join(" ") + "…" + sep + regione;
      if (lung(t) <= TETTO) { return t; }
    }
    // Una parola sola ancora troppo lunga: si taglia a caratteri, la regione resta.
    const spazio = Math.max(1, TETTO - lung(sep + regione) - 1);
    return Array.from(titolo).slice(0, spazio).join("") + "…" + sep + regione;
  }
  curaDettaglio() {
    if (this.titoloBase === undefined) { this.titoloBase = document.title; }
    const r = this.state.rotta;
    if (r.vista !== "iniziativa") {
      this.fuocoFatto = null;
      if (document.title !== this.titoloBase) { document.title = this.titoloBase; }
      return;
    }
    const d = (window.INIZIATIVE || []).filter((x) => x.id === r.arg)[0];
    if (d) {
      // C3 (MUSE, 24/09/2026): «{titolo} · {regione} · Screening Italia», tetto 60 caratteri.
      // Oltre 60 cade « · Screening Italia»; se non basta, il titolo si taglia all'ultima
      // parola intera e chiude con «…». La regione non cade mai.
      const t = this.titoloScheda(d.titolo, d.reg);
      if (document.title !== t) { document.title = t; }
    } else if (document.title !== this.titoloBase) { document.title = this.titoloBase; }
    const k = r.arg + "|" + (d ? "1" : "0");
    if (this.fuocoFatto === k) { return; }
    const el = document.querySelector(".ini-fuoco");
    if (!el) { return; }
    this.fuocoFatto = k;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }
  giorniAllaChiusura(x) {
    if (!x.chiude) { return null; }
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const p = x.chiude.split("-");
    const fine = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return Math.round((fine - oggi) / 86400000);
  }
  scadenza(x) {
    const g = this.giorniAllaChiusura(x);
    if (g === null) { return { testo: "", cls: "" }; }
    const MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
    const p = x.chiude.split("-");
    const data = Number(p[2]) + " " + MESI[Number(p[1]) - 1];
    if (g < 0) { return { testo: "chiusa", cls: "scad scad-chiusa" }; }
    if (g === 0) { return { testo: "ultimo giorno, oggi", cls: "scad scad-rossa" }; }
    if (g === 1) { return { testo: "chiude domani", cls: "scad scad-rossa" }; }
    if (g <= 7) { return { testo: "chiude fra " + g + " giorni", cls: "scad scad-rossa" }; }
    if (g <= 21) { return { testo: "chiude il " + data, cls: "scad scad-gialla" }; }
    return { testo: "aperta fino al " + data, cls: "scad scad-calma" };
  }

  testimonianze() {
    const F = "https://img.magnific.com/free-photo/";
    const foto = [
      F + "close-up-portrait-beautiful-smiling-old-woman-blue-shirt_171337-7899.jpg",
      F + "portrait-caucasian-man_641386-12.jpg",
      F + "adult-woman-with-gray-hair-smiling_23-2148277910.jpg",
      F + "portrait-smiley-mature-man_23-2148465219.jpg",
      F + "medium-shot-smiley-woman-portrait_23-2149361949.jpg",
      F + "good-mood-mature-man-burgundy-shirt-looking-positive_259150-56976.jpg",
      F + "portrait-happy-smiley-older-woman_23-2149022611.jpg",
      F + "portrait-man-laughing_23-2148859448.jpg"
    ];
    const lista = this.voci ? this.voci : (this.voci = [
      { nome: "Anna R.", ruolo: "58 anni, Bologna", testo: "Grazie a Screening Italia ho trovato una giornata di screening a due fermate di autobus da casa. Prima cercavo sui siti delle ASL e non capivo mai se l’iniziativa fosse ancora aperta. Qui era tutto in una schermata: dove, quando, e il numero da chiamare." },
      { nome: "Marco T.", ruolo: "34 anni, figlio di un utente", testo: "Mio padre ha 71 anni e non usa internet. Ho aperto il sito, scelto la Puglia, spuntato colon-retto e in un minuto avevo il numero da chiamare. L’ho prenotato io per lui mentre eravamo al telefono." },
      { nome: "Giulia S.", ruolo: "46 anni, Torino", testo: "Stavo per prenotare una mammografia in una clinica privata a 130 euro. Ho scoperto qui che nella mia zona c’era la stessa cosa, gratuita. Dormo sonni tranquilli grazie alla prevenzione, e senza spendere." },
      { nome: "Salvatore P.", ruolo: "63 anni, Palermo", testo: "Il sito è chiaro anche per chi come me non è pratico. Caratteri grandi, poche cose per pagina, e il pulsante per ingrandire il testo mi ha risolto la giornata." },
      { nome: "Chiara M.", ruolo: "41 anni, figlia di un’utente", testo: "Ho aiutato mia madre a capire cosa fosse il kit del colon-retto: la spiegazione qui era più comprensibile della lettera arrivata a casa. Le ho letto la pagina al telefono e ha fatto tutto da sola." },
      { nome: "Davide L.", ruolo: "52 anni, Verona", testo: "Cercavo un controllo della prostata e non sapevo che non esistesse l’invito. Averlo scritto chiaro, senza allarmismi, mi ha fatto prendere appuntamento dal medico invece di rimandare un altro anno." },
      { nome: "Rosa D.", ruolo: "67 anni, Napoli", testo: "Non mi era mai arrivata la lettera. Qui ho letto cosa fare e a chi telefonare: in mezz’ora avevo l’appuntamento. Pensavo di aver perso il turno." },
      { nome: "Federico B.", ruolo: "29 anni, figlio di un utente", testo: "Di solito nei siti pubblici mi perdo. Questo si capisce al primo colpo: clicchi la regione sulla mappa e vedi solo quello che ti serve. L’ho girato a tutta la famiglia." }
    ]);
    return lista.map((t, i) => ({ nome: t.nome, ruolo: t.ruolo, testo: t.testo, foto: foto[i % foto.length], slot: "testi-" + i }));
  }
  corpi() {
    return {
      "faq-1": [
        { h: "Perché la lettera può non arrivare", p: ["L’invito viene spedito all’indirizzo che risulta all’anagrafe sanitaria, non a quello dove abiti di fatto. Se hai cambiato casa senza aggiornare la residenza, o se il nome sul citofono non corrisponde, la lettera torna al mittente.", "Capita anche per un semplice mancato recapito postale. In tutti questi casi resti comunque nell’elenco delle persone da invitare: non sei stato escluso."] , chiave: "Non sei stato escluso: la tua posizione resta nell’elenco delle persone da invitare." },
        { h: "Cosa fare, in concreto", p: ["Chiama il centro screening della tua azienda sanitaria e di’ che non hai ricevuto l’invito: il numero si trova sul sito dell’ASL alla voce screening, oppure lo chiedi in farmacia.", "Tieni a portata di mano la tessera sanitaria: servono codice fiscale e indirizzo aggiornato. Nella stessa telefonata puoi già fissare l’appuntamento."] , corsivo: "Chiedi anche di aggiornare l’indirizzo: eviti che salti anche il prossimo invito." },
        { h: "Hai perso il turno?", p: ["No. Il programma richiama a intervalli regolari e l’adesione fuori invito è prevista: l’esame resta gratuito e senza impegnativa."] , chiave: "L’esame resta gratuito e senza impegnativa, anche fuori invito." }
      ],
      "faq-3": [
        { h: "L’invito non è un buono da esibire", p: ["La lettera serve a informarti, non è un titolo di accesso. Se l’hai buttata, persa o cestinata per errore, la prenotazione resta possibile: la tua posizione è registrata nell’elenco del centro screening."] , chiave: "La lettera informa, non autorizza: senza di essa la prenotazione resta possibile." },
        { h: "Come recuperare l’appuntamento", p: ["Telefona al centro screening della tua ASL. Comunichi nome, codice fiscale e data di nascita, e ti viene assegnata una nuova data.", "Se nella lettera c’era un appuntamento già fissato e non ci sei andato, dillo: viene semplicemente riprogrammato."] , corsivo: "Una telefonata basta: non serve ripresentare domanda né passare dal medico." },
        { h: "Se non ricordi di quale ASL sei", p: ["Fa riferimento al comune di residenza. In farmacia o dal medico di medicina generale te lo dicono in un minuto."]  }
      ],
      "faq-4": [
        { h: "Ogni quanto si fa", p: ["Nel programma pubblico la mammografia si ripete ogni due anni. È l’intervallo su cui il programma è costruito: più spesso non porta benefici dimostrati, più raramente riduce l’efficacia della diagnosi precoce."] , chiave: "Due anni è l’intervallo su cui il programma è costruito." },
        { h: "Da quale età è gratuita", p: ["La fascia invitata comprende in genere le donne fra i 50 e i 69 anni; diverse regioni la estendono dai 45 ai 74. Dentro la fascia prevista l’esame è gratuito e non richiede impegnativa.", "Fuori dalla fascia il controllo può comunque essere indicato: se hai familiarità o hai notato qualcosa, parlane col medico senza aspettare l’invito."] , chiave: "Dentro la fascia prevista l’esame è gratuito e non richiede impegnativa." },
        { h: "Come ci si prepara", p: ["Non serve digiuno né alcuna preparazione. Meglio evitare deodoranti o talco sotto le ascelle il giorno dell’esame, e portare con te le mammografie precedenti se le hai."] , corsivo: "Porta con te le mammografie precedenti: il confronto è più informativo del singolo esame." }
      ],
      "faq-5": [
        { h: "Che cosa cerca il kit", p: ["Cerca tracce di sangue non visibili nelle feci, un segno che può comparire molto prima dei sintomi. Non è un esame che diagnostica un tumore: indica se serve approfondire con una colonscopia."] , chiave: "Non diagnostica un tumore: dice se serve approfondire." },
        { h: "Come si usa", p: ["Il kit è una provetta con un bastoncino nel tappo. Raccogli un piccolo campione di feci sfiorando la superficie in tre punti diversi, richiudi bene e conserva in frigorifero fino alla riconsegna.", "Non serve dieta, non serve sospendere farmaci. Evita la raccolta durante il ciclo mestruale o in presenza di emorroidi sanguinanti: aspetta qualche giorno."] , corsivo: "Niente dieta, niente sospensione di farmaci." },
        { h: "Dove si ritira e si riporta", p: ["Nella maggior parte delle regioni si ritira e si riconsegna in farmacia, gratuitamente. In alcune arriva a casa con la lettera di invito. L’esito arriva per posta entro poche settimane."] , chiave: "Il ritiro e la riconsegna in farmacia sono gratuiti." }
      ],
      "faq-6": [
        { h: "Gratuito", p: ["Sono gli esami del programma pubblico rivolti a una fascia di età precisa: mammella, colon-retto e cervice uterina. Non si paga nulla, non serve impegnativa, e sei tu a essere chiamato."] , chiave: "Non si paga nulla, e sei tu a essere chiamato." },
        { h: "Su invito", p: ["Vuol dire che ci si accede solo se convocati, perché il programma segue un calendario per fasce di età. Se rientri nei requisiti ma l’invito non è arrivato, puoi chiamare e aderire comunque."] , chiave: "Se rientri nei requisiti ma l’invito non è arrivato, puoi aderire comunque." },
        { h: "A pagamento", p: ["Sono controlli fuori programma: prescritti dal medico con ticket, oppure privati. Nelle giornate organizzate da ospedali e associazioni gli stessi esami sono spesso gratuiti: le trovi elencate qui, regione per regione."] , corsivo: "Nelle giornate organizzate lo stesso esame è spesso gratuito." }
      ],
      "faq-7": [
        { h: "Chi ti prende in carico", p: ["Il programma di screening segue la residenza. Appena la nuova residenza è registrata, l’azienda sanitaria del comune dove sei andato ad abitare ti inserisce nei suoi elenchi e ti invita quando tocca a te."] , chiave: "Il programma di screening segue la residenza." },
        { h: "I tempi, e cosa fare nel frattempo", p: ["Il passaggio non è immediato: fra il cambio di residenza e il primo invito possono passare mesi. Se nel frattempo il tuo turno scade, chiama il centro screening della nuova ASL e chiedi di aderire.", "Porta con te gli esiti degli esami fatti prima: servono a capire a che punto del percorso ti trovi ed evitano di ripetere un esame già fatto."] , corsivo: "Gli esiti precedenti valgono: portarli evita di ripetere un esame già fatto." }
      ],
      "faq-8": [
        { h: "Che cosa vuol dire", p: ["Vuol dire che l’esame ha mostrato qualcosa che va guardato meglio, non che è stato trovato un tumore. Gli esami di screening sono costruiti per essere prudenti: preferiscono richiamare qualche persona in più piuttosto che lasciare passare qualcosa."] , chiave: "Vuol dire guardare meglio, non che sia stato trovato un tumore." },
        { h: "Che cosa succede adesso", p: ["Il centro screening ti contatta per un secondo esame, più accurato del primo: una mammografia di approfondimento o un’ecografia, una colonscopia, una colposcopia, a seconda del programma. Anche questo passaggio è gratuito.", "Nella maggior parte dei casi l’approfondimento chiude la questione e si torna al calendario normale."] , chiave: "Anche l’approfondimento è gratuito." },
        { h: "Quanto si aspetta", p: ["I percorsi di approfondimento hanno tempi riservati, in genere poche settimane. Se l’appuntamento tarda, chiama il centro screening: la priorità è prevista dal programma."] , corsivo: "Se l’appuntamento tarda, chiama: la priorità è prevista dal programma." }
      ]
    };
  }
  /* Articoli veri da window.Articoli.lista(). Gli argomenti del filtro sono le
     categorie WordPress degli articoli gia caricati: il filtro lavora in pagina,
     per slug di categoria, e compare solo con almeno due categorie distinte (24/09/2026). */
  articoli() {
    const tutti = (this.state.artDati || []).filter((a) => !a.protetto);
    let stato = this.state.artStato || this.props.statoArticoli || "vuoto";
    if (stato === "ok" && !tutti.length) { stato = "vuoto"; }
    const cats = [];
    tutti.forEach((a) => (a.categorie || []).forEach((c) => {
      if (c.slug && !cats.some((x) => x.slug === c.slug)) { cats.push(c); }
    }));
    // Un argomento rimasto in memoria che non esiste piu vale come «tutti».
    const scelto = cats.some((c) => c.slug === this.state.artArg) ? this.state.artArg : null;
    const conFiltro = scelto !== null;
    const nomi = [{ chiave: null, nome: "Tutti gli argomenti" }].concat(cats.map((c) => ({ chiave: c.slug, nome: c.nome })));
    const argomenti = nomi.map((n) => ({
      nome: n.nome,
      attivo: scelto === n.chiave ? "true" : "false",
      cls: scelto === n.chiave ? "filtro on" : "filtro",
      scegli: () => this.setState({ artArg: n.chiave, artQuanti: 3 })
    }));
    const filtrati = conFiltro ? tutti.filter((a) => (a.categorie || []).some((c) => c.slug === scelto)) : tutti;
    const quanti = this.state.artQuanti;
    const visibili = filtrati.slice(0, quanti).map((a) => {
      const c = (a.categorie || [])[0];
      const data = this.dataArticolo(a.dataIso);
      return {
        slot: "art-elenco-" + a.id,
        titolo: a.titolo,
        estratto: a.estratto,
        meta: [c ? c.nome : "", data].filter((x) => x).join(" · "),
        href: "#/articolo/" + encodeURIComponent(a.slug),
        aria: "Leggi l’articolo: " + a.titolo,
        haFoto: !!(a.immagine && a.immagine.url),
        foto: a.immagine && a.immagine.url ? a.immagine.url : ""
      };
    });
    const ok = stato === "ok" && filtrati.length > 0;
    const vuoto = stato === "vuoto" || (stato === "ok" && !filtrati.length);
    return {
      ok: ok,
      vuotoTutto: vuoto && !conFiltro,
      vuotoFiltro: vuoto && conFiltro,
      errore: stato === "offline" || stato === "errore",
      mostraFiltro: stato === "ok" && cats.length >= 2,
      argomenti: argomenti,
      visibili: visibili,
      altri: ok && filtrati.length > quanti,
      finiti: ok && filtrati.length <= quanti
    };
  }
  // Vista articolo riempita con un articolo WordPress: stessi campi delle FAQ, corpo vuoto.
  voceArticolo() {
    const v = this.statoVoce() === "ok" ? this.state.voce : null;
    if (!v) { return { slot: "art-wp", foto: "", haFoto: false, cat: "", titolo: "", sommario: "", data: "", corpo: [], tornaHref: "#/articoli", tornaTesto: "← Torna agli articoli" }; }
    const c = (v.categorie || [])[0];
    return {
      slot: "art-wp-" + v.id, foto: v.immagine && v.immagine.url ? v.immagine.url : "",
      haFoto: !!(v.immagine && v.immagine.url),
      cat: c ? c.nome : "", titolo: v.titolo, sommario: v.estratto,
      data: this.dataArticolo(v.dataIso), corpo: [],
      tornaHref: "#/articoli", tornaTesto: "← Torna agli articoli"
    };
  }
  domande() {
    return [
      { id: "faq-1", foto: "https://img.magnific.com/free-photo/happy-mature-woman-her-doctor-communicating-while-going-through-paperwork-hospital-hallway_637285-5300.jpg", sommario: "La posizione è recuperabile e il turno non viene perso.", cat: "Inviti e lettere", data: "28 agosto 2026", titolo: "Mancato recapito della lettera di invito: come procedere", href: "#/articolo/faq-1", chiavi: "invito lettera posta asl convocazione" },
      { id: "faq-2", foto: "https://img.magnific.com/free-photo/positive-man-with-grey-hair-light-shirt-jeans-with-camera-laughing-with-blonde-lady-hat-sunglasses-striped-blue-shirt-park_197531-19160.jpg", sommario: "Non è previsto invito: il primo passo del controllo spetta a te.", cat: "Prostata", data: "21 agosto 2026", titolo: "Screening della prostata: a chi è rivolto e da quale età", href: "#/prostata", chiavi: "psa uomini urologo eta" },
      { id: "faq-3", foto: "https://img.magnific.com/free-photo/portrait-female-health-specialist-working-with-laptop-plan-patient-appointment-medical-office-general-practitioner-using-medication-notes-help-with-diagnosis-treatment_482257-45642.jpg", sommario: "Sì: il recapito di riferimento resta quello dell’azienda sanitaria.", cat: "Inviti e lettere", data: "14 agosto 2026", titolo: "Invito smarrito: è ancora possibile prenotare?", href: "#/articolo/faq-3", chiavi: "invito perso prenotare numero verde" },
      { id: "faq-4", foto: "https://img.magnific.com/free-photo/old-grey-haired-female-cabinet-modern-clinic_7502-9557.jpg", sommario: "Con cadenza biennale, gratuita nella fascia di età prevista.", cat: "Mammografia", data: "7 agosto 2026", titolo: "Mammografia: periodicità ed età di accesso gratuito", href: "#/articolo/faq-4", chiavi: "seno donne gratis eta due anni" },
      { id: "faq-5", foto: "https://img.magnific.com/free-photo/thank-you-your-prescription_329181-2225.jpg", sommario: "Si ritira e si riconsegna in farmacia: la raccolta richiede pochi minuti.", cat: "Colon-retto", data: "31 luglio 2026", titolo: "Kit per la ricerca del sangue occulto: uso e riconsegna", href: "#/articolo/faq-5", chiavi: "kit feci farmacia sangue occulto" },
      { id: "faq-6", foto: "https://img.magnific.com/free-photo/thank-you-your-visit-my-office_329181-2204.jpg", sommario: "Tre condizioni che determinano il costo e le modalità di accesso.", cat: "Come funziona", data: "24 luglio 2026", titolo: "Gratuito, a pagamento, su invito: le differenze", href: "#/articolo/faq-6", chiavi: "costo ticket invito differenza" },
      { id: "faq-7", foto: "https://img.magnific.com/free-photo/charming-woman-with-short-hairstyle-hat-blue-blouse-holds-map-points-side-smiles-with-grey-haired-man-with-camera-park_197531-19155.jpg", sommario: "La presa in carico passa all’azienda sanitaria del nuovo domicilio.", cat: "Come funziona", data: "17 luglio 2026", titolo: "Trasferimento di residenza: a quale azienda sanitaria rivolgersi", href: "#/articolo/faq-7", chiavi: "trasferimento residenza regione asl nuova" },
      { id: "faq-8", foto: "https://img.magnific.com/free-photo/senior-woman-answering-doctor-questions-examination-hospital-room_482257-8442.jpg", sommario: "Non indica una diagnosi: comporta un secondo accertamento.", cat: "Come funziona", data: "10 luglio 2026", titolo: "Esito «da approfondire»: che cosa comporta", href: "#/articolo/faq-8", chiavi: "esito risultato approfondimento richiamo" }
    ];
  }
  normalizza(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

}
const parte2 = window.__siLogicaRender.prototype;
for (const k of Object.getOwnPropertyNames(parte2)) {
  if (k !== "constructor") { Object.defineProperty(Component.prototype, k, Object.getOwnPropertyDescriptor(parte2, k)); }
}
return Component;
};
