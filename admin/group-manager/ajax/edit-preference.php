<?php

define("ELM_ROOT", "../../../");
require_once(ELM_ROOT . "database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

$pid            = filter_input(INPUT_POST, "pid", FILTER_SANITIZE_NUMBER_INT);
$name           = filter_input(INPUT_POST, "name", FILTER_SANITIZE_STRING);
$type           = filter_input(INPUT_POST, "type", FILTER_SANITIZE_STRING);
$groups         = filter_input(INPUT_POST, "groups", FILTER_SANITIZE_STRING);
$programCode    = filter_input(INPUT_POST, "programcode", FILTER_SANITIZE_STRING);
$choices        = filter_input(INPUT_POST, "choices", FILTER_SANITIZE_STRING);
$default        = filter_input(INPUT_POST, "default", FILTER_SANITIZE_STRING);

$groupIDs = array();

if(strlen(trim($groups)) > 0){
    $groupSplit = explode(",", $groups);
    foreach($groupSplit as $g){
        if(!is_numeric($g)){
            throw new Exception("not a number: $g");
        }else{
            array_push($groupIDs, intval($g));
        }
    }
}

$database->EditPreference($pid, $name, $type, $groupIDs, $programCode, $choices, $default);
$database->UpdateModernDataVersion("preference");
$database->UpdateModernDataVersion("group");
$database->UpdateModernDataVersion("user");

ForceChange("preference");
ForceChange("group");
ForceChange("user");
?>

