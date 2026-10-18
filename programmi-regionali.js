/* Programmi di screening delle Regioni (18/10/2026, segnalazione di Davide).
   Fatti letti aprendo le pagine ufficiali della Regione, riscritti con parole nostre (MUSE):
   niente testo copiato, niente soglie o interpretazioni di esami, «gratuito» sempre con la data.
   Copy in bozza: da approvare da Davide prima della pubblicazione.

   Forma di una regione:
     verificato: data in cui le pagine sono state lette
     fonti:      [{ titolo, url }]
     gratuito:   frase con la data, mostrata sulle schede con gratuito: true
     programmi:  [{ slug (pagina del sito o null), tipo, titolo, chi, esame, accesso, nonEntra?, gratuito, link: [{ t, url }] }]
     contatti:   { testo, voci: [{ t, url }] }  */
window.SI_PROGRAMMI_REGIONALI = {
  "Lombardia": {
    verificato: "18 ottobre 2026",
    fonti: [
      { titolo: "Regione Lombardia, Screening: a chi sono rivolti e come aderire", url: "https://www.regione.lombardia.it/sanita/prevenzione-e-stili-di-vita/screening-per-la-diagnosi-precoce-dei-tumori" },
      { titolo: "Regione Lombardia, Screening del tumore alla prostata", url: "https://www.regione.lombardia.it/sanita/prevenzione-e-stili-di-vita/screening-tumore-prostata-lombardia" }
    ],
    gratuito: "Gratuito secondo la Regione (verificato il 18 ottobre 2026).",
    programmi: [
      {
        slug: "mammografico", tipo: "Mammografico", titolo: "Mammella",
        chi: "Donne dai 45 ai 74 anni.",
        esame: "Mammografia. Dai 45 ai 49 anni ogni anno, dai 50 ai 74 ogni due anni.",
        accesso: "Arriva una lettera con l'appuntamento già fissato. Se la data non ti va bene la cambi online. Se la lettera non è arrivata, o non sei andata, prenoti tu su Prenota Salute.",
        gratuito: true,
        link: [
          { t: "Prenota Salute", url: "https://prenotasalute.regione.lombardia.it/prenotaonline/" },
          { t: "Portale screening della Regione", url: "https://screening.servizirl.it/login" }
        ]
      },
      {
        slug: "cervicale", tipo: "Cervice uterina", titolo: "Collo dell'utero",
        chi: "Donne dai 25 ai 64 anni.",
        esame: "Dai 30 ai 64 anni test HPV ogni cinque anni. Dai 25 ai 29 anni Pap test ogni tre anni, per chi non ha completato il vaccino contro l'HPV entro i 15 anni.",
        accesso: "Arriva una lettera con l'appuntamento già fissato. Se non è arrivata, o non sei andata, chiami il centro screening della tua ATS.",
        gratuito: true,
        link: [
          { t: "Portale screening della Regione", url: "https://screening.servizirl.it/login" }
        ]
      },
      {
        slug: "colon-retto", tipo: "Colon-retto", titolo: "Colon-retto",
        chi: "Donne e uomini dai 50 ai 74 anni.",
        esame: "Ricerca del sangue occulto nelle feci, ogni due anni.",
        accesso: "La lettera ti manda in farmacia a ritirare il kit. Se non è arrivata o è scaduta, vai lo stesso in farmacia: lì riattivano il percorso.",
        gratuito: true,
        link: [
          { t: "Portale screening della Regione", url: "https://screening.servizirl.it/login" }
        ]
      },
      {
        slug: "prostata", tipo: "Prostata", titolo: "Prostata",
        chi: "Uomini assistiti in Lombardia nati tra il 1962 e il 1975. Chi è nato nel 1976 entra dal giorno in cui compie 50 anni. Chi ha l'età può aderire anche più tardi, fino ai 70 anni.",
        esame: "PSA, cioè un prelievo di sangue. In base al risultato e al questionario, il centro screening della ATS può chiamarti per una visita dall'urologo.",
        accesso: "Non arriva nessuna lettera: parti tu. Nel Fascicolo Sanitario Elettronico compili un questionario e ricevi un voucher. Con il voucher vai in uno dei laboratori aderenti, senza prenotazione e senza impegnativa. Se non usi il Fascicolo, il questionario lo compili in un punto di assistenza.",
        nonEntra: "Per ora no se hai fatto il PSA negli ultimi due anni, o esami specifici alla prostata negli ultimi cinque. Il programma non è pensato per chi ha già una diagnosi di tumore alla prostata, né per chi ha mutazioni genetiche note che richiedono un percorso dedicato.",
        gratuito: true,
        link: [
          { t: "Laboratori aderenti (PDF)", url: "https://www.regione.lombardia.it/content/dam/rl/canali-tematici-servizi/01-sanita/05-prevenzione-e-stili-di-vita/red-screening-tumore-alla-prostata-in-lombardia/allegati/all_punti_prelievo_v11.pdf" },
          { t: "Punti di assistenza per il questionario (PDF)", url: "https://www.regione.lombardia.it/content/dam/rl/canali-tematici-servizi/01-sanita/05-prevenzione-e-stili-di-vita/red-screening-tumore-alla-prostata-in-lombardia/allegati/all-punti-assistenza-compilazione-questionario_v3.pdf" },
          { t: "Pagina della Regione", url: "https://www.regione.lombardia.it/sanita/prevenzione-e-stili-di-vita/screening-tumore-prostata-lombardia" }
        ]
      },
      {
        slug: null, tipo: "Epatite C (HCV)", titolo: "Epatite C",
        chi: "Donne e uomini nati tra il 1969 e il 1989 che non sono mai stati curati per l'epatite C.",
        esame: "Un prelievo di sangue che cerca gli anticorpi contro il virus.",
        accesso: "Vai direttamente in un punto prelievo o in un ospedale aderente, senza impegnativa del medico.",
        gratuito: true,
        link: [
          { t: "Pagina della Regione", url: "https://www.regione.lombardia.it/sanita/prevenzione-e-stili-di-vita/screening-gratuito-epatite-c" }
        ]
      },
      {
        slug: null, tipo: "Polmonare", titolo: "Polmone",
        chi: "Persone dai 55 ai 74 anni che fumano molto o hanno fumato molto.",
        esame: "TAC del torace a basso dosaggio, insieme a un percorso nei centri antifumo per smettere di fumare.",
        accesso: "Il programma è sperimentale e la rete dei centri è ancora in costruzione. Per sapere se e dove puoi entrare, chiedi al centro screening della tua ATS.",
        gratuito: false,
        link: []
      }
    ],
    contatti: {
      testo: "Se l'invito non arriva, se hai perso la lettera o devi cambiare data, chiama il centro screening della tua ATS.",
      voci: [
        { t: "ATS Bergamo", url: "https://www.ats-bg.it/strutture/centro-screening" },
        { t: "ATS Brescia", url: "https://www.ats-brescia.it/screening-aderisci-alla-prevenzione" },
        { t: "ATS Brianza", url: "https://www.ats-brianza.it/it/screening-oncologici.html" },
        { t: "ATS Insubria", url: "https://www.ats-insubria.it/aree-tematiche/screening" },
        { t: "ATS Milano", url: "https://www.ats-milano.it/ats/carta-servizi/guida-servizi/prevenzione/screening-oncologico" },
        { t: "ATS Montagna", url: "https://www.ats-montagna.it/screening" },
        { t: "ATS Pavia", url: "https://www.ats-pavia.it/area-screening-tumori" },
        { t: "ATS Val Padana", url: "https://www.ats-valpadana.it/screening-oncologici" }
      ]
    }
  }
};

/* Testi fissi dei blocchi (MUSE, bozza 18/10/2026). */
window.SI_PROGRAMMI_TESTI = {
  regH2: "I programmi della Regione",
  regP: "Sono i programmi pubblici attivi in questa regione: chi può farli, quale esame e come si entra. Li organizza la Regione, non Screening Italia.",
  contattiH3: "Centri screening",
  scrH2Prostata: "Dove c'è già un programma regionale",
  scrPProstata: "Alcune regioni hanno avviato un programma per la prostata. Qui trovi quelli che abbiamo verificato sulle pagine ufficiali.",
  scrH2: "Come funziona in alcune regioni",
  scrP: "Età e modi di accesso cambiano da una regione all'altra. Qui trovi le regioni che abbiamo già verificato sulle pagine ufficiali.",
  etChi: "Chi",
  etEsame: "L'esame",
  etAccesso: "Come si entra",
  etNonEntra: "Chi non entra, per ora",
  etCosto: "Costo",
  vediPagina: "La pagina su questo screening",
  vediRegione: "Tutti i programmi in ",
  fontePre: "Fonte: ",
  fontePost: ". Se qualcosa non torna, vale quello che dice la Regione."
};

(function () {
  const D = () => window.SI_PROGRAMMI_REGIONALI || {};
  const T = () => window.SI_PROGRAMMI_TESTI || {};

  function scheda(regione, r, p, titolo) {
    const t = T();
    return {
      titolo: titolo,
      chi: p.chi, esame: p.esame, accesso: p.accesso,
      haNonEntra: !!p.nonEntra, nonEntra: p.nonEntra || "",
      haGratuito: !!p.gratuito, gratuito: r.gratuito,
      link: (p.link || []).map((l) => ({ t: l.t, url: l.url })),
      haLink: (p.link || []).length > 0,
      etChi: t.etChi, etEsame: t.etEsame, etAccesso: t.etAccesso, etNonEntra: t.etNonEntra, etCosto: t.etCosto,
      regione: regione, slug: p.slug
    };
  }

  function fonte(r) {
    return (r.fonti || []).map((f) => ({ t: f.titolo, url: f.url }));
  }
  // Più fonti nella stessa riga: separatore davanti a tutte tranne la prima.
  const separa = (l) => l.map((f, i) => Object.assign({}, f, { sep: i ? "; " : "" }));

  // Pagina regione (#/regione e #/vuota): tutti i programmi della regione, più i contatti.
  function perRegione(reg) {
    const r = D()[reg];
    const t = T();
    if (!r) { return { ok: false, schede: [], contatti: [], fonti: [] }; }
    return {
      ok: true,
      h2: t.regH2 + " " + reg, p: t.regP,
      schede: r.programmi.map((p) => Object.assign(scheda(reg, r, p, p.titolo), {
        haPagina: !!p.slug, hrefPagina: p.slug ? "#/screening/" + p.slug : "", vediPagina: t.vediPagina
      })),
      contattiH3: t.contattiH3 + " " + (reg === "Lombardia" ? "delle ATS" : "della regione"),
      contattiP: (r.contatti || {}).testo || "",
      contatti: ((r.contatti || {}).voci || []).map((v) => ({ t: v.t, url: v.url })),
      haContatti: ((r.contatti || {}).voci || []).length > 0,
      fontePre: t.fontePre, fonti: separa(fonte(r)), fontePost: ". Pagine lette il " + r.verificato + t.fontePost
    };
  }

  // Pagina screening: una scheda per ogni regione che ha un programma per questo slug.
  function perScreening(slug) {
    const t = T();
    const schede = [];
    const fonti = [];
    let verificato = "";
    Object.keys(D()).sort().forEach((reg) => {
      const r = D()[reg];
      (r.programmi || []).filter((p) => p.slug === slug).forEach((p) => {
        schede.push(Object.assign(scheda(reg, r, p, reg), {
          hrefRegione: "#/regione/" + encodeURIComponent(reg), vediRegione: t.vediRegione + reg
        }));
        fonte(r).forEach((f) => fonti.push(f));
        verificato = r.verificato;
      });
    });
    const pro = slug === "prostata";
    return {
      ok: schede.length > 0,
      h2: pro ? t.scrH2Prostata : t.scrH2, p: pro ? t.scrPProstata : t.scrP,
      schede: schede,
      fontePre: t.fontePre, fonti: separa(fonti), fontePost: verificato ? ". Pagine lette il " + verificato + t.fontePost : t.fontePost
    };
  }

  window.__siProgrammi = { perRegione: perRegione, perScreening: perScreening };
})();
