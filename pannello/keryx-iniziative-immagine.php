<?php
/**
 * Plugin Name: Keryx — iniziativa: calendario sulla data e immagine caricabile
 * Description: 1) Il campo «chiude» torna a mostrare il calendario (date picker; il formato salvato non cambia). 2) Nuovo campo «Immagine (carica)» con la libreria media. REST: acf.immagine_url = immagine in evidenza, poi immagine caricata se c'è, altrimenti l'URL scritto a mano (acf.immagine_link / url_immagine / immagine_url_manuale, se esiste). Per tornare indietro basta svuotare questo file: i dati restano nel database.
 */

if (!defined('ABSPATH')) { exit; }

/* Immagine in evidenza (riquadro standard di WordPress) anche per le iniziative. */
add_action('after_setup_theme', function () { add_theme_support('post-thumbnails'); }, 20);
add_action('init', function () { add_post_type_support('iniziativa', 'thumbnail'); }, 99);

add_filter('acf/load_field/name=chiude', function ($field) {
    if (!is_array($field) || empty($field['name']) || $field['name'] !== 'chiude') { return $field; }
    $field['type'] = 'date_picker';
    $field['display_format'] = 'd/m/Y';
    $field['first_day'] = 1;
    return $field;
}, 30);

add_action('acf/include_fields', function () {
    if (!function_exists('acf_add_local_field_group')) { return; }
    acf_add_local_field_group(array(
        'key'          => 'group_kx_ini_immagine',
        'title'        => 'Iniziativa — immagine',
        'location'     => array(array(array('param' => 'post_type', 'operator' => '==', 'value' => 'iniziativa'))),
        'position'     => 'side',
        'menu_order'   => 7,
        'show_in_rest' => 1,
        'fields'       => array(array(
            'key'           => 'field_kx_ini_immagine_file',
            'name'          => 'immagine_file',
            'label'         => 'Immagine (carica)',
            'type'          => 'image',
            'return_format' => 'id',
            'preview_size'  => 'medium',
            'library'       => 'all',
            'mime_types'    => 'jpg,jpeg,png,webp',
            'instructions'  => 'Carica o scegli un\'immagine dalla libreria. Se c\'è, ha la precedenza sull\'URL.',
        )),
    ));
});

add_filter('rest_prepare_iniziativa', function ($response) {
    $data = $response->get_data();
    if (!isset($data['acf']) || !is_array($data['acf'])) { return $response; }
    $url = '';
    $feat = !empty($data['id']) ? get_post_thumbnail_id((int) $data['id']) : 0;
    if ($feat) { $uf = wp_get_attachment_image_url($feat, 'large'); if ($uf) { $url = $uf; } }
    $id = isset($data['acf']['immagine_file']) ? (int) (is_array($data['acf']['immagine_file']) ? ($data['acf']['immagine_file']['ID'] ?? 0) : $data['acf']['immagine_file']) : 0;
    if ($url === '' && $id > 0) { $u = wp_get_attachment_image_url($id, 'large'); if ($u) { $url = $u; } }
    if ($url === '') {
        foreach (array('immagine_link', 'url_immagine', 'immagine_url_manuale', 'immagine') as $k) {
            if (!empty($data['acf'][$k]) && is_string($data['acf'][$k])) { $url = $data['acf'][$k]; break; }
        }
    }
    $data['acf']['immagine_file'] = $id ?: '';
    $data['acf']['immagine_url'] = $url;
    $response->set_data($data);
    return $response;
}, 30);
