<?php

define("ELM_ROOT", "../../../");
require_once(ELM_ROOT . "database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

$name = filter_input(INPUT_POST, "name", FILTER_SANITIZE_STRING);
$id = $database->AddPreference($name, "check", "t", "t,f", "NA");

$pref = $database->GetPreferenceWithID($id);
$pref["GROUPS"] = [];
$pref["id"] = $pref["PREFERENCEID"];

echo json_encode($pref);
?>

