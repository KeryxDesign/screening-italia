<?php
/**
 * Plugin Name: Keryx — scadenza facoltativa (solo REST)
 * Description: Le iniziative senza data di chiusura (programmi delle ASL, che non hanno una fine) non sono mai scadute e restano visibili. Tocca SOLO la richiesta REST, non i campi del pannello: per tornare indietro basta svuotare questo file. Provato su WordPress locale con 38 iniziative (con data, senza meta, con meta vuota): stessa velocità di prima.
 *
 * Il filtro «scadute escluse» di keryx-iniziative-maschera.php aggiunge alla richiesta la condizione
 * chiude >= oggi. Qui, a fine giro (priorità 99), quella condizione viene sostituita da
 * «chiude >= oggi OPPURE chiude assente OPPURE chiude vuota». Nessuna ricorsione: si scorre una volta
 * la lista delle condizioni di primo livello. Con ?scadute=1 non si fa niente (già tutte).
 */

if (!defined('ABSPATH')) { exit; }

add_filter('rest_iniziativa_query', function ($args, $request) {
    if (!empty($request['scadute']) || empty($args['meta_query']) || !is_array($args['meta_query'])) { return $args; }
    $nuove = array();
    $ritrovata = null;
    foreach ($args['meta_query'] as $k => $clausola) {
        if (is_array($clausola) && isset($clausola['key']) && $clausola['key'] === 'chiude' && isset($clausola['compare']) && $clausola['compare'] === '>=') {
            $ritrovata = $clausola;
            continue;
        }
        $nuove[$k] = $clausola;
    }
    if ($ritrovata === null) { return $args; }
    $nuove[] = array(
        'relation' => 'OR',
        $ritrovata,
        array('key' => 'chiude', 'compare' => 'NOT EXISTS'),
        array('key' => 'chiude', 'value' => '', 'compare' => '='),
    );
    $args['meta_query'] = $nuove;
    return $args;
}, 99, 2);
