<?php

define("ELM_ROOT", "../../../");
require_once(ELM_ROOT . "database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

$pid            = filter_input(INPUT_POST, "pid", FILTER_SANITIZE_NUMBER_INT);
$name           = filter_input(INPUT_POST, "name", FILTER_SANITIZE_STRING);
$description    = filter_input(INPUT_POST, "description", FILTER_SANITIZE_STRING);
$groups         = filter_input(INPUT_POST, "groups", FILTER_SANITIZE_STRING);
$programCode    = filter_input(INPUT_POST, "programcode", FILTER_SANITIZE_STRING);

$groupIDs = array();
$groupSplit = explode(",", $groups);
foreach($groupSplit as $g){
    if(!is_numeric($g)){
        throw new Exception("not a number: $g");
    }else{
        array_push($groupIDs, intval($g));
    }
}

$database->EditPermission($pid, $name, $description, $groupIDs, $programCode);

?>

