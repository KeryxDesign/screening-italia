# Screening Italia — prototipo di portale

Prototipo funzionante di un portale che raccoglie le iniziative di screening
oncologico aperte in Italia, regione per regione.

**Tutti i dati sono dimostrativi.** Enti, sedi, date e numeri di telefono non
sono reali: servono a validare il funzionamento del portale.

## Pubblicare su GitHub Pages

1. Crea un repository nuovo e carica il contenuto di questa cartella nella radice.
2. Nel repository vai su **Settings → Pages**.
3. Alla voce *Source* scegli **Deploy from a branch**, ramo `main`, cartella `/ (root)`.
4. Dopo un minuto il sito è online su `https://<utente>.github.io/<repository>/`.

Il file `.nojekyll` serve a impedire a GitHub di reinterpretare i file: lascialo dov'è.

## Cos'è cosa

| File | A cosa serve |
|---|---|
| `index.html` | Il sito completo, autonomo. È l'unico file necessario per pubblicare. |
| `src/Screening Italia.dc.html` | Il sorgente da cui `index.html` viene generato. |
| `src/stile.css` | Colori, tipografia, componenti. |
| `src/bianconero.css` | Sovrascritture della versione in bianco e nero. |
| `src/iniziative.js` | Le iniziative dimostrative, con data di chiusura. |
| `src/regioni-italia.js` | Geometria delle venti regioni. |
| `src/mappa.js` | Disegna la mappa cliccabile. |
| `src/accessibilita.js` | Pulsante flottante: dimensione del testo e contrasto elevato. |
| `src/image-slot.js`, `src/support.js` | Componenti di supporto. |

## Struttura del portale

Una sola pagina con indirizzi puliti (senza #): il server riporta ogni percorso a `index.html` (regola in `.htaccess`) e il sito legge il percorso. I vecchi link con `#/...` si portano da soli al nuovo indirizzo.

| Indirizzo | Schermata |
|---|---|
| `/` | Home: apertura, sostenitori, come si consulta, mappa, testimonianze, domande |
| `/regione/<Nome>` | Iniziative aperte nella regione, filtrabili per tipo di screening |
| `/vuota/<Nome>` | Regione senza iniziative segnalate, con servizio di avviso |
| `/faq` | Domande frequenti, con ricerca e filtri per argomento |
| `/articolo/<id>` | Singola risposta impaginata come articolo |
| `/prostata` | Approfondimento sullo screening della prostata |
| `/testimonianze` | Tutte le testimonianze |
| `/chi`, `/contatti` | Chi siamo, contatti con modulo e WhatsApp |

## Note

- Le fotografie sono collegate a un servizio esterno: online funzionano, offline no.
  Per renderle locali, scaricale in `assets/` e sostituisci gli indirizzi in `src/`.
- Il numero WhatsApp è un segnaposto (`+39 300 000 0000`).
- Il portale non prenota esami e non sostituisce il parere del medico.

## Velocità (11/11/2026)

I file `.js` e `.css` in radice sono **minificati**; le copie leggibili stanno in `sorgenti/`.
Per modificarli: cambia il file in `sorgenti/`, lancia `sh scripts/minifica.sh`, poi cambia il `?v=...` in `index.html` per i file toccati (js e css restano in cache un anno, vedi `.htaccess`).
L'immagine principale della home ha tre misure (`foto-si-piazza-800/1280.webp` e l'originale) ed è precaricata.

## Pagine pre-renderizzate (`_pre/`)

Chi non esegue JavaScript (crawler AI, lettori automatici, anteprime) riceve il testo vero: `.htaccess` serve `/_pre/<percorso>.html` al posto della shell vuota; con JS acceso la copia viene sostituita all'avvio e il sito funziona come prima. Se manca la copia di una rotta, resta la shell di sempre.

Rigenerare dopo ogni modifica ai testi/template o alle iniziative (richiede `playwright-core` e Google Chrome; il sito va servito in locale):

    NODE_PATH=<cartella con playwright-core>/node_modules node scripts/prerender.js http://localhost:8099
    # una sola rotta: ... prerender.js http://localhost:8099 /domande

I file generati si committano: l'host non ha uno step di build. Le iniziative nella copia statica sono una fotografia al momento della generazione; con JS la pagina le legge dal pannello in tempo reale.
