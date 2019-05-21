<?php

define("ELM_ROOT", "../../../");
require_once(ELM_ROOT . "database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

$preferenceID = filter_input(INPUT_POST, "preferenceid", FILTER_SANITIZE_NUMBER_INT);
$database->DeletePreference($preferenceID);
