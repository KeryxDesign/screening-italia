<?php
/**
 * Plugin Name: Keryx — iniziativa: descrizione con l'editor completo di WordPress
 * Description: Il campo «descrizione» diventa l'editor completo (visuale + HTML, barra completa, caricamento media), così si possono formattare titoli, elenchi, grassetto e link. Le descrizioni già scritte (testo semplice, senza tag) vengono servite dalla REST identiche a prima: il sito le impagina come sempre. Solo le descrizioni salvate con l'editor arrivano come HTML (il sito le ripulisce prima di mostrarle). Per tornare indietro basta svuotare questo file: i testi restano nel database.
 */

if (!defined('ABSPATH')) { exit; }

add_filter('acf/load_field/name=descrizione', function ($field) {
    if (!is_array($field) || empty($field['name']) || $field['name'] !== 'descrizione') { return $field; }
    $field['type'] = 'wysiwyg';
    $field['tabs'] = 'all';
    $field['toolbar'] = 'full';
    $field['media_upload'] = 1;
    $field['delay'] = 0;
    $field['new_lines'] = '';
    return $field;
}, 30);

add_filter('rest_prepare_iniziativa', function ($response) {
    $data = $response->get_data();
    if (empty($data['id']) || !isset($data['acf']) || !is_array($data['acf']) || !array_key_exists('descrizione', $data['acf'])) { return $response; }
    $grezzo = get_post_meta((int) $data['id'], 'descrizione', true);
    if (is_string($grezzo) && $grezzo !== '' && !preg_match('/<[a-z\/][^>]*>/i', $grezzo)) {
        $data['acf']['descrizione'] = $grezzo;
        $response->set_data($data);
    }
    return $response;
}, 40);
