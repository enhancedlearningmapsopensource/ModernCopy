<?php

define("ELM_ROOT", "../../../");
require_once(ELM_ROOT . "database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

$email = filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL);
$groupID = filter_input(INPUT_POST, "groupid", FILTER_SANITIZE_NUMBER_INT);
$oldUserID = $database->GetUserIDFromEmail($email);


$results = $database->PrototypeQuery("SELECT * FROM ELM_USERGROUP WHERE USERID=? AND GROUPID=?", array(&$oldUserID, &$groupID));
if(!isset($results["result"])){
    echo "could not find usergroup record: $oldUserID,$groupID";
    PreVarDump($results);
    exit(0);
}

$database->PrototypeQueryQuiet("DELETE FROM ELM_USERGROUP WHERE USERID=? AND GROUPID=?", array(&$oldUserID, &$groupID));

$results = $database->PrototypeQuery("SELECT * FROM ELM_USERGROUP WHERE USERID=? AND GROUPID=?", array(&$oldUserID, &$groupID));
if(isset($results["result"])){
    echo "failed to remove usergroup record";
    exit(0);
}
?>

