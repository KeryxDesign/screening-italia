/* Dati dal PDF di Angelo del 19/10/2026, per il disegno (Claude Design).
   Sono dati di PROVA: in produzione l'offerta ASL e i link «Approfondisci» arrivano dal pannello.

   Offerta ASL, Lombardia: tabella del PDF, p. 2 (centri screening delle ATS).
   Numeri, e-mail e orari NON ancora ricontrollati sulle fonti: va fatto prima di pubblicare.
   «controllo» resta vuoto di proposito: «gratuito» si scrive solo con una data di controllo vera.
   «url» vuoto = il sito si mostra come testo, senza link (gli indirizzi nel PDF sono solo etichette). */
window.SI_OFFERTA_ASL = {
  "Lombardia": {
    cosa: "Screening oncologici: mammella, cervice uterina, colon-retto",
    controllo: "",
    righe: [
      { ente: "ATS di Milano", orari: "da lun. a ven. 8:30-14:00",
        tel: [{ et: "Milano (ASST Città di Milano e ASST Nord Milano)", n: "800 255 155" },
              { et: "Ovest (ASST Ovest Milanese e ASST Rhodense)", n: "800 705 630" },
              { et: "Est (ASST Melegnano Martesana e ASST Lodi)", n: "800 940 007" }],
        mail: ["centroscreeningmi@ats-milano.it", "centroscreeningmiovest@ats-milano.it", "centroscreeningmiest@ats-milano.it", "centroscreeninglo@ats-milano.it"],
        sito: "ats-milano.it", url: "" },
      { ente: "ATS dell'Insubria", orari: "da lun. a gio. 9:00-13:00",
        tel: [{ et: "Area Varese, colon-retto", n: "800 317 330" },
              { et: "Area Varese, mammografico", n: "800 371 315" },
              { et: "Area Lariana/Como", n: "031 370 503 / 592" }],
        mail: ["centroscreening.varese@ats-insubria.it", "centroscreening.como@ats-insubria.it"],
        sito: "ats-insubria.it", url: "" },
      { ente: "ATS della Montagna", orari: "da lun. a ven. 8:30-12:30",
        tel: [{ et: "Valcamonica", n: "800 221 661" }, { et: "Valtellina e Alto Lario", n: "800 569 300" }],
        mail: ["screening.vcs@ats-montagna.it", "centroscreening@ats-montagna.it"],
        sito: "ats-montagna.it", url: "" },
      { ente: "ATS della Brianza", orari: "da lun. a ven. 8:30-12:30",
        tel: [{ et: "Area Monza e Brianza", n: "800 504 610" },
              { et: "Area di Lecco, colon-retto", n: "0341 482522 · 0341 482274 · 0341 482218" },
              { et: "Area di Lecco, mammografico", n: "0341 482426 · 0341 482208" },
              { et: "Area di Lecco, cervice uterina", n: "0341 482291 · 0341 482522 · 0341 482218" }],
        mail: ["vaccinazioni.screening@ats-brianza.it"],
        sito: "ats-brianza.it", url: "" },
      { ente: "ATS di Bergamo", orari: "da lun. a ven. 8:30-12:30",
        tel: [{ et: "", n: "800 512 330" }], mail: ["screening@ats-bg.it"], sito: "ats-bg.it", url: "" },
      { ente: "ATS di Brescia", orari: "da lun. a ven. 8:30-12:30",
        tel: [{ et: "", n: "800 077 040" }], mail: ["centro.screening@ats-brescia.it"], sito: "ats-brescia.it", url: "" },
      { ente: "ATS della Valpadana", orari: "da lun. a ven. 8:30-15:00",
        tel: [{ et: "", n: "800 584 850" }], mail: ["screening@ats-valpadana.it"], sito: "ats-valpadana.it", url: "" },
      { ente: "ATS di Pavia", orari: "da lun. a ven. 9:00-13:00",
        tel: [{ et: "", n: "800 034 933" }], mail: ["screening@ats-pavia.it"], sito: "ats-pavia.it", url: "" }
    ]
  }
};

/* «Approfondisci»: un link per sezione descrittiva, scelto da Angelo. Si apre in una scheda nuova.
   Chiave = slug della pagina screening; «s2» = sezione «Ti riguarda». Link verificato il 21/10/2026. */
window.SI_APPROFONDISCI = {
  "colon-retto": { s2: { et: "Approfondisci sul sito del Ministero della Salute",
    url: "https://www.salute.gov.it/new/it/tema/tumori-e-screening/screening-il-cancro-del-colon-retto/" } }
};
