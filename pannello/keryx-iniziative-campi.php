<?php
/**
 * Plugin Name: Keryx — campi iniziativa: condizioni multiple, chiusura facoltativa, origine
 * Description: Richieste di Angelo e Davide (25-31/10/2026). 1) Data di chiusura non obbligatoria. 2) Condizioni (gratuito / a pagamento / su invito) a scelta multipla. 3) Campo «Programma pubblico o iniziativa» (acf.origine) che il sito usa per separare i due elenchi. Per tornare indietro basta svuotare questo file: i dati scritti restano nel database.
 *
 * REST: acf.stati = elenco delle condizioni, acf.stato = la prima (compatibilità con il sito).
 * I campi esistenti si trovano per NOME (chiude, stato), non per chiave.
 */

if (!defined('ABSPATH')) { exit; }

add_filter('acf/load_field/name=chiude', function ($field) {
    $field['required'] = 0;
    $field['instructions'] = 'Lascia vuota per i programmi che non hanno una fine (per esempio gli screening delle ASL): restano sempre visibili sul sito.';
    return $field;
});

add_filter('acf/load_field/name=stato', function ($field) {
    if (!is_array($field) || empty($field['name']) || $field['name'] !== 'stato') { return $field; }
    $field['type'] = 'checkbox';
    $field['choices'] = array('gratuito' => 'Gratuito', 'a pagamento' => 'A pagamento', 'su invito' => 'Su invito');
    $field['layout'] = 'horizontal';
    $field['allow_custom'] = 0;
    $field['save_custom'] = 0;
    $field['toggle'] = 0;
    $field['return_format'] = 'value';
    $field['required'] = 0;
    $field['instructions'] = 'Una o più voci, anche insieme (per esempio «su invito» e «gratuito»). Lascia vuoto se non è chiaro: il sito non scrive niente.';
    return $field;
});

/* Origine: programma pubblico (ASL, Regione) oppure iniziativa di associazione o privato. Riquadro a parte. */
add_action('acf/include_fields', function () {
    if (!function_exists('acf_add_local_field_group')) { return; }
    acf_add_local_field_group(array(
        'key'          => 'group_kx_ini_origine',
        'title'        => 'Iniziativa — programma o iniziativa',
        'location'     => array(array(array('param' => 'post_type', 'operator' => '==', 'value' => 'iniziativa'))),
        'position'     => 'side',
        'menu_order'   => 6,
        'show_in_rest' => 1,
        'fields'       => array(array(
            'key'           => 'field_kx_ini_origine',
            'name'          => 'origine',
            'label'         => 'Che cos\'è',
            'type'          => 'radio',
            'choices'       => array('programma' => 'Programma pubblico (ASL, Regione)', 'iniziativa' => 'Iniziativa di associazione o privato'),
            'allow_null'    => 1,
            'layout'        => 'vertical',
            'return_format' => 'value',
            'instructions'  => 'Il sito separa i due elenchi. Se vuoto, conta come iniziativa.',
        )),
    ));
});

add_filter('rest_prepare_iniziativa', function ($response) {
    $data = $response->get_data();
    if (isset($data['acf']) && is_array($data['acf']) && array_key_exists('stato', $data['acf'])) {
        $v = $data['acf']['stato'];
        $stati = array_values(array_unique(array_filter(is_array($v) ? $v : array($v), function ($s) { return is_string($s) && $s !== ''; })));
        $data['acf']['stati'] = $stati;
        $data['acf']['stato'] = $stati ? $stati[0] : '';
        $response->set_data($data);
    }
    return $response;
}, 20);
