<?php
/**
 * Plugin Name: Keryx — iniziativa: data con calendario accanto al «Quando»
 * Description: Aggiunge «Data (calendario)», un campo data con calendario, accanto al «Quando» in testo libero (che resta per periodi e più date). Facoltativo. REST: acf.quando_data = AAAAMMGG o vuoto. Il sito la mostra come «Quando» solo se il testo libero è vuoto. Per tornare indietro basta svuotare questo file: i dati restano nel database.
 */

if (!defined('ABSPATH')) { exit; }

add_action('acf/include_fields', function () {
    if (!function_exists('acf_add_local_field_group')) { return; }
    acf_add_local_field_group(array(
        'key'          => 'group_kx_ini_quando_data',
        'title'        => 'Iniziativa — data (calendario)',
        'location'     => array(array(array('param' => 'post_type', 'operator' => '==', 'value' => 'iniziativa'))),
        'position'     => 'normal',
        'menu_order'   => 8,
        'show_in_rest' => 1,
        'fields'       => array(array(
            'key'            => 'field_kx_ini_quando_data',
            'name'           => 'quando_data',
            'label'          => 'Data (calendario)',
            'type'           => 'date_picker',
            'display_format' => 'd/m/Y',
            'return_format'  => 'Ymd',
            'first_day'      => 1,
            'required'       => 0,
            'instructions'   => 'Se l\'iniziativa è in un giorno solo, scegli la data dal calendario. Per periodi o più date usa il campo «Quando» in testo libero: se è compilato, il sito mostra quello.',
        )),
    ));
});
