<?php
/**
 * Plugin Name: Keryx — scadenza facoltativa e condizioni multiple
 * Description: Richiesta di Angelo (Doc «Lista modifiche», 25/10/2026) e di Florbo (31/10/2026). 0) Campo «Chi lo organizza» (programma pubblico / iniziativa di associazione o privato). 1) Data di chiusura FACOLTATIVA: i programmi delle ASL non hanno una fine, quindi senza data l'iniziativa non è mai scaduta e resta sul sito. 2) Condizioni (gratuito / a pagamento / su invito) a scelta multipla: possono coesistere. Si affianca a keryx-iniziative-maschera.php senza toccarlo. Per tornare indietro basta svuotare questo file: i dati scritti restano nel database.
 *
 * REST: acf.stati = elenco delle condizioni, acf.stato = la prima (compatibilità con il sito vecchio).
 * Si carica con i campi trovati per NOME (chiude, stato), non per chiave, così non dipende dalle chiavi ACF.
 */

if (!defined('ABSPATH')) { exit; }

/* 0. «Chi lo organizza»: separa i programmi pubblici (ASL, aziende sanitarie, Regione, Ministero) dalle iniziative di
   associazioni e privati. Il sito li mostra in due sezioni della pagina regione. Facoltativo: se resta vuoto il sito lo
   deduce dal nome dell'ente (ASL, AUSL, ATS, ASST, ULSS, Regione...). Esce in REST come acf.origine. */
add_action('acf/init', function () {
    if (!function_exists('acf_add_local_field_group')) { return; }
    acf_add_local_field_group(array(
        'key' => 'group_kx_origine',
        'title' => 'Chi lo organizza',
        'fields' => array(array(
            'key' => 'field_kx_origine',
            'label' => 'Chi lo organizza',
            'name' => 'origine',
            'type' => 'select',
            'choices' => array('programma' => 'Programma pubblico (ASL, Regione, Ministero)', 'iniziativa' => 'Iniziativa di associazione o privato'),
            'allow_null' => 1,
            'return_format' => 'value',
            'show_in_rest' => 1,
            'instructions' => 'Programma pubblico = screening del servizio sanitario (ASL, aziende sanitarie, Regione). Iniziativa = associazioni, fondazioni, strutture private. Se vuoto, il sito lo capisce dal nome dell\'ente.',
        )),
        'location' => array(array(array('param' => 'post_type', 'operator' => '==', 'value' => 'iniziativa'))),
        'position' => 'side',
        'show_in_rest' => 1,
    ));
});

/* 1. Data di chiusura non obbligatoria. */
add_filter('acf/load_field/name=chiude', function ($field) {
    $field['required'] = 0;
    $field['instructions'] = 'Lascia vuota per i programmi che non hanno una fine (per esempio gli screening delle ASL): restano sempre visibili sul sito.';
    return $field;
});

/* 2. Condizioni: più scelte insieme. I valori di sempre restano validi (anche quelli già salvati come testo). */
add_filter('acf/load_field/name=stato', function ($field) {
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

/* 3. REST: «stati» porta tutti i valori, «stato» resta il primo (testo) per il sito di prima. */
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

/* 4. Senza data di chiusura l'iniziativa non è scaduta. Il filtro «scadute escluse» (keryx-iniziative-maschera.php)
   confronta la data con oggi: qui ogni condizione sul campo «chiude» diventa «data >= oggi OPPURE data assente/vuota».
   Agisce solo se la condizione è nella meta_query della richiesta REST. */
add_filter('rest_iniziativa_query', function ($args) {
    if (empty($args['meta_query']) || !is_array($args['meta_query'])) { return $args; }
    $args['meta_query'] = kx_ini_chiude_facoltativa($args['meta_query']);
    return $args;
}, 99);

function kx_ini_chiude_facoltativa($mq) {
    foreach ($mq as $k => $clause) {
        if (!is_array($clause)) { continue; }
        if (isset($clause['key']) && $clause['key'] === 'chiude' && !isset($clause['__kx'])) {
            $mq[$k] = array(
                'relation' => 'OR',
                array_merge($clause, array('__kx' => 1)),
                array('key' => 'chiude', 'compare' => 'NOT EXISTS'),
                array('key' => 'chiude', 'value' => '', 'compare' => '='),
            );
        } elseif (!isset($clause['key'])) {
            $mq[$k] = kx_ini_chiude_facoltativa($clause);
        }
    }
    return $mq;
}
