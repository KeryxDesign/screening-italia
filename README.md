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
| `src/Screening Italia - bozza bn.dc.html` | La stessa pagina in bianco e nero, per le revisioni su carta. |
| `src/stile.css` | Colori, tipografia, componenti. |
| `src/bianconero.css` | Sovrascritture della versione in bianco e nero. |
| `src/iniziative.js` | Le iniziative dimostrative, con data di chiusura. |
| `src/regioni-italia.js` | Geometria delle venti regioni. |
| `src/mappa.js` | Disegna la mappa cliccabile. |
| `src/accessibilita.js` | Pulsante flottante: dimensione del testo e contrasto elevato. |
| `src/image-slot.js`, `src/support.js` | Componenti di supporto. |

## Struttura del portale

Una sola pagina con navigazione interna via indirizzo:

| Indirizzo | Schermata |
|---|---|
| `#/` | Home: apertura, sostenitori, come si consulta, mappa, testimonianze, domande |
| `#/regione/<Nome>` | Iniziative aperte nella regione, filtrabili per tipo di screening |
| `#/vuota/<Nome>` | Regione senza iniziative segnalate, con servizio di avviso |
| `#/faq` | Domande frequenti, con ricerca e filtri per argomento |
| `#/articolo/<id>` | Singola risposta impaginata come articolo |
| `#/prostata` | Approfondimento sullo screening della prostata |
| `#/testimonianze` | Tutte le testimonianze |
| `#/chi`, `#/contatti` | Chi siamo, contatti con modulo e WhatsApp |

## Note

- Le fotografie sono collegate a un servizio esterno: online funzionano, offline no.
  Per renderle locali, scaricale in `assets/` e sostituisci gli indirizzi in `src/`.
- Il numero WhatsApp è un segnaposto (`+39 300 000 0000`).
- Il portale non prenota esami e non sostituisce il parere del medico.
