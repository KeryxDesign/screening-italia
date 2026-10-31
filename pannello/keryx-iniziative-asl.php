<?php
/**
 * Plugin Name: Keryx — campo ASL nelle iniziative
 * Description: Richiesta di Florbo (31/10/2026). Aggiunge i campi facoltativi «ASL» (acf.asl, testo) e «Sito dell'ASL» (acf.asl_url, link) alle iniziative: l'ASL (o ASP, ASST, Azienda sanitaria) in cui si svolge l'iniziativa. Il sito lo mostra nella card insieme al «Dove» (città). Per tornare indietro basta svuotare o togliere questo file: i dati scritti restano nel database e il sito, senza campo, non mostra la riga.
 *
 * REST: compare in acf.asl, come gli altri campi. Il sito non lo deduce da «ente»: si scrive solo quello che e verificato.
 */

if (!defined('ABSPATH')) { exit; }

add_action('acf/include_fields', function () {
    if (!function_exists('acf_add_local_field_group')) { return; }
    acf_add_local_field_group(array(
        'key'          => 'group_kx_ini_asl',
        'title'        => 'Iniziativa — ASL',
        'location'     => array(array(array('param' => 'post_type', 'operator' => '==', 'value' => 'iniziativa'))),
        'position'     => 'side',
        'menu_order'   => 7,
        'show_in_rest' => 1,
        'fields'       => array(array(
            'key'          => 'field_kx_ini_asl',
            'name'         => 'asl',
            'label'        => 'ASL in cui si svolge',
            'type'         => 'text',
            'maxlength'    => 80,
            'instructions' => 'Per esempio «ASL Roma 1», «ASP Palermo», «ASST Sette Laghi». Facoltativo: lascia vuoto se non lo sai, il sito non scrive niente.',
        ), array(
            'key'          => 'field_kx_ini_asl_url',
            'name'         => 'asl_url',
            'label'        => "Sito dell'ASL (link)",
            'type'         => 'url',
            'instructions' => "Facoltativo, accanto al telefono. Indirizzo completo, con https://. Il sito mostra il pulsante «Vai al sito dell'ASL» solo se compilato.",
        )),
    ));
});
