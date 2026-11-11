#!/bin/sh
# Rigenera i file minificati in radice a partire da sorgenti/ (le copie leggibili).
# Modifica SEMPRE i file in sorgenti/, poi lancia: sh scripts/minifica.sh
# Poi cambia il ?v=... in index.html per i file toccati (cache lunga).
cd "$(dirname "$0")/.." || exit 1
for f in stile.css screening.css support.js logica-render.js logica-classe.js screening-pagine.js logica-screening.js accessibilita.js iniziative.js iniziative-wp.js articoli.js testimonianze-wp.js esperienze-wp.js centri-wp.js dati-angelo-1019.js regioni-italia.js mappa.js; do
  case "$f" in
    *.css) npx --yes esbuild "sorgenti/$f" --minify --outfile="$f" ;;
    *.js)  npx --yes esbuild "sorgenti/$f" --minify-whitespace --minify-syntax --charset=utf8 --outfile="$f" ;;
  esac
done
