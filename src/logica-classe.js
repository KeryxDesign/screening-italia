/* Logica della pagina, parte 1 di 2: estratta verbatim dallo script x-dc (split 24/09/2026).
   Il runtime legge lo script x-dc solo inline: qui la classe vive intera, lo stub la chiede. */
window.__siLogica = function (DCLogic) {
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { rotta: this.leggiRotta(), tipi: [], mail: "", inviato: false,
      artArg: null, artQuanti: 6, artStato: null, artDati: null,
      // Pagine screening (25/09/2026): regione scelta nella pagina, resta per la sessione.
      regScr: null,
      // Tendina «Gli screening»: null = stato di partenza (chiusa da desktop,
      // aperta nel pannello hamburger se la rotta e #/screening*).
      scrAperto: null };
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
    // «articoli» (brief LORI 26/09/2026): un elenco solo, apre come «domande» su #elenco-domande.
    // «trova» (25/09/2026): apre la Home sulla scelta della regione (#trova).
    // «screening» (25/09/2026): #/screening senza pagina valida apre la Home sulla sezione #screening.
    if (vista !== "domande" && vista !== "articoli" && vista !== "trova" && vista !== "screening") { return; }
    const bersaglio = (vista === "domande" || vista === "articoli") ? "#elenco-domande" : (vista === "trova" ? "#trova" : "#screening");
    // Al primo caricamento il browser ripristina la posizione da solo e le foto
    // cambiano l'altezza della pagina: si insiste finche la posizione tiene.
    try { window.history.scrollRestoration = "manual"; } catch (e) {}
    const tenta = (giri) => {
      if (this.state.rotta.vista !== vista) { return; }
      if (vista === "screening" && this.state.rotta.arg) { return; }
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
      this.setState({ rotta: r, tipi: [], inviato: false, mail: "", scrAperto: false });
      this.chiudiHamburger();
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
    this.avviaTendina();
    // L'effetto di comparsa si accende SOLO se in questo ambiente le transizioni
    // avanzano davvero. Altrimenti non si nasconde nulla: il contenuto e la priorita.
    this.provaAnimazioni();
    this.osserva();
    setTimeout(() => this.curaDettaglio(), 0);
  }
  /* Articolo singolo da WordPress, rotta #/articolo/<slug> (24/09/2026).
     Le vecchie FAQ interne (faq-N) e #/articolo senza argomento portano a #/domande:
     lo fanno leggiRotta() e vaiA() con eVecchiaFaq() (brief LORI 26/09/2026). */
  caricaVoce() {
    const r = this.state.rotta;
    if (r.vista !== "articolo" || !r.arg) { this.voceChiesta = null; return; }
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
    if (r.vista !== "articolo" || !r.arg) { return "fuori"; }
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
    this.fraseChiave(el);
    this.noteCorsive(el);
    this.dividiSezioni(el);
  }
  /* <blockquote> = frase chiave (brief LORI 26/09/2026): ogni p del blockquote, o il
     blockquote stesso se non ha p, prende «art-p art-chiave» e i suoi figli si spostano
     dentro strong > mark creati con createElement. Nessun HTML nuovo. */
  fraseChiave(el) {
    el.querySelectorAll("blockquote").forEach((bq) => {
      const ps = bq.querySelectorAll("p");
      const bersagli = ps.length ? Array.prototype.slice.call(ps) : [bq];
      bersagli.forEach((n) => {
        n.classList.add("art-p", "art-chiave");
        const forte = document.createElement("strong");
        const segno = document.createElement("mark");
        forte.appendChild(segno);
        while (n.firstChild) { segno.appendChild(n.firstChild); }
        n.appendChild(forte);
      });
    });
  }
  /* <p> fatto solo di <em>/<i> (spazi a parte, testo non vuoto) = nota: art-aside al posto
     di art-p. Un em dentro una frase normale resta com'e. I p della frase chiave sono esclusi. */
  noteCorsive(el) {
    el.querySelectorAll("p").forEach((n) => {
      if (n.closest("blockquote")) { return; }
      if (!n.textContent.trim()) { return; }
      const soloCorsivo = Array.prototype.every.call(n.childNodes, (c) => {
        if (c.nodeType === 3) { return !c.textContent.trim(); }
        if (c.nodeType === 8) { return true; }
        return c.nodeType === 1 && (c.tagName === "EM" || c.tagName === "I");
      });
      if (!soloCorsivo) { return; }
      n.classList.remove("art-p");
      n.classList.add("art-aside");
    });
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
    window.Articoli.lista({ pagina: 1, perPagina: 100 }).then((r) => {
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
    document.removeEventListener("click", this.onClickFuori);
    document.removeEventListener("keydown", this.onEscTendina);
    document.removeEventListener("focusin", this.onFocusTendina);
    if (this.mqDesktop) { try { this.mqDesktop.removeEventListener("change", this.onCambioLarghezza); } catch (e) {} }
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onScroll);
    document.removeEventListener("toggle", this.onScroll, true);
    if (this.occhioAltezza) { this.occhioAltezza.disconnect(); }
    clearTimeout(this.timerAltezza);
    clearInterval(this.guardiaTimer);
    document.removeEventListener("visibilitychange", this.onVis);
    clearInterval(this.tick);
  }
  /* ---- Tendina «Gli screening» (brief 26/09/2026) ----
     Da 1200px: si apre solo al clic; chiude con Esc (focus al pulsante), clic fuori,
     Tab che esce dal pannello, cambio rotta. Sotto 1200px e una fisarmonica
     nel pannello hamburger, aperta in partenza sulle rotte #/screening*. */
  eDesktop() {
    try { return window.matchMedia("(min-width:1200px)").matches; } catch (e) { return true; }
  }
  scrAperto() {
    const a = this.state.scrAperto;
    if (a === true || a === false) { return a; }
    return !this.eDesktop() && this.state.rotta.vista === "screening";
  }
  // Cambio rotta (collaudo LORI giro 1): il pannello hamburger si chiude, la pagina nuova resta visibile.
  chiudiHamburger() {
    const c = document.getElementById("menu-chk");
    if (c) { c.checked = false; }
  }
  navScr(slug) {
    const r = this.state.rotta;
    return (r.vista === "screening" && (r.arg || "") === slug) ? "page" : "false";
  }
  avviaTendina() {
    const dentro = (el) => !!(el && el.closest && el.closest(".nav-voce"));
    const chiudi = () => { if (this.eDesktop() && this.scrAperto()) { this.setState({ scrAperto: false }); } };
    this.onClickFuori = (e) => { if (!dentro(e.target)) { chiudi(); } };
    this.onEscTendina = (e) => {
      if (e.key !== "Escape" || !this.eDesktop() || !this.scrAperto()) { return; }
      this.setState({ scrAperto: false });
      const b = document.querySelector(".nav-tendina");
      if (b) { b.focus(); }
    };
    this.onFocusTendina = (e) => { if (!dentro(e.target)) { chiudi(); } };
    document.addEventListener("click", this.onClickFuori);
    document.addEventListener("keydown", this.onEscTendina);
    document.addEventListener("focusin", this.onFocusTendina);
    // Passando la soglia dei 1200px la tendina torna allo stato di partenza.
    this.onCambioLarghezza = () => this.setState({ scrAperto: null });
    try { this.mqDesktop = window.matchMedia("(min-width:1200px)"); this.mqDesktop.addEventListener("change", this.onCambioLarghezza); } catch (e) {}
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
    const note = ["", "regione", "vuota", "faq", "prostata", "chi", "contatti", "testimonianze", "articolo", "enti", "cookie", "domande", "articoli", "iniziativa", "trova", "screening"];
    if (note.indexOf(vista) === -1) { vista = ""; }
    let arg = p[1] ? decodeURIComponent(p[1]) : "";
    // Alias permanente (brief LORI 25/09/2026): #/prostata e ora #/screening/prostata.
    if (vista === "prostata") { vista = "screening"; arg = "prostata"; rotta = "#/screening/prostata"; }
    // Vecchie FAQ interne e #/articolo senza argomento: portano a #/domande (brief LORI 26/09/2026).
    if (this.eVecchiaFaq(vista, arg)) { vista = "domande"; arg = ""; rotta = "#/domande"; }
    if (vista === "screening" && !this.scrValido(arg)) { arg = ""; }
    this.setState({ rotta: { vista: vista, arg: arg }, tipi: [], inviato: false, mail: "", scrAperto: false });
    this.chiudiHamburger();
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
    let arg = p[1] ? decodeURIComponent(p[1]) : "";
    const note = ["", "regione", "vuota", "faq", "prostata", "chi", "contatti", "testimonianze", "articolo", "enti", "cookie", "domande", "articoli", "iniziativa", "trova", "screening"];
    if (note.indexOf(vista) === -1) { vista = ""; }
    // Alias permanente: #/prostata diventa #/screening/prostata senza voce doppia nella cronologia.
    if (vista === "prostata") {
      vista = "screening"; arg = "prostata";
      try { window.history.replaceState(null, "", "#/screening/prostata"); } catch (e) {}
    }
    // Vecchie FAQ interne e #/articolo senza argomento: #/domande, senza voce doppia nella cronologia.
    if (this.eVecchiaFaq(vista, arg)) {
      vista = "domande"; arg = "";
      try { window.history.replaceState(null, "", "#/domande"); } catch (e) {}
    }
    // Pagina screening sconosciuta: vale come #/screening (Home, sezione delle tipologie).
    if (vista === "screening" && !this.scrValido(arg)) { arg = ""; }
    return { vista: vista, arg: arg };
  }
  eVecchiaFaq(vista, arg) { return vista === "articolo" && (!arg || /^faq-\d+$/.test(arg)); }
  scrValido(arg) { return !!(window.__siScreening && window.__siScreening.slugValido(arg)); }
  // «trova» e la Home scesa su #trova: per pagina e menu vale come Home.
  // «screening» senza pagina valida e la Home scesa su #screening.
  vista() {
    const v = this.state.rotta.vista;
    if (v === "trova" || (v === "screening" && !this.state.rotta.arg)) { return ""; }
    return v;
  }
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
    // Pagine screening: titolo e descrizione per Google dal copy (logica-screening.js).
    if (window.__siScreening && window.__siScreening.titolo(this)) { this.fuocoFatto = null; return; }
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
      scegli: () => this.setState({ artArg: n.chiave, artQuanti: 6 })
    }));
    const filtrati = conFiltro ? tutti.filter((a) => (a.categorie || []).some((c) => c.slug === scelto)) : tutti;
    const quanti = this.state.artQuanti;
    const visibili = filtrati.slice(0, quanti).map((a) => this.cardArticolo(a, "art-elenco-"));
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
  // Card di un articolo WordPress: la stessa in elenco e in home.
  cardArticolo(a, prefisso) {
    const c = (a.categorie || [])[0];
    const data = this.dataArticolo(a.dataIso);
    return {
      slot: prefisso + a.id,
      titolo: a.titolo,
      estratto: a.estratto,
      meta: [c ? c.nome : "", data].filter((x) => x).join(" · "),
      href: "#/articolo/" + encodeURIComponent(a.slug),
      aria: "Leggi la risposta: " + a.titolo,
      haFoto: !!(a.immagine && a.immagine.url),
      foto: a.immagine && a.immagine.url ? a.immagine.url : ""
    };
  }
  /* Home «Ultimi aggiornamenti» (brief LORI 26/09/2026): i primi 4 per data.
     Se lo stato non e «ok» o non ci sono articoli, la banda non si rende. */
  ultimiArticoli() {
    if (this.state.artStato !== "ok") { return []; }
    const tutti = (this.state.artDati || []).filter((a) => !a.protetto);
    const t = (a) => { const x = new Date(a.dataIso).getTime(); return isNaN(x) ? 0 : x; };
    return tutti.slice().sort((a, b) => t(b) - t(a)).slice(0, 4).map((a) => this.cardArticolo(a, "home-"));
  }
  // Vista articolo riempita con un articolo WordPress.
  voceArticolo() {
    const v = this.statoVoce() === "ok" ? this.state.voce : null;
    if (!v) { return { slot: "art-wp", foto: "", haFoto: false, cat: "", titolo: "", sommario: "", data: "", corpo: [], tornaHref: "#/domande", tornaTesto: "← Torna alle domande frequenti" }; }
    const c = (v.categorie || [])[0];
    return {
      slot: "art-wp-" + v.id, foto: v.immagine && v.immagine.url ? v.immagine.url : "",
      haFoto: !!(v.immagine && v.immagine.url),
      cat: c ? c.nome : "", titolo: v.titolo, sommario: v.estratto,
      data: this.dataArticolo(v.dataIso), corpo: [],
      tornaHref: "#/domande", tornaTesto: "← Torna alle domande frequenti"
    };
  }

}
const parte2 = window.__siLogicaRender.prototype;
for (const k of Object.getOwnPropertyNames(parte2)) {
  if (k !== "constructor") { Object.defineProperty(Component.prototype, k, Object.getOwnPropertyDescriptor(parte2, k)); }
}
return Component;
};
