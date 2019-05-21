<?php

define("ELM_ROOT", "../../../");
require_once(ELM_ROOT . "database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

$email = filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL);
$groupID = filter_input(INPUT_POST, "groupid", FILTER_SANITIZE_NUMBER_INT);

$userID = $database->GetUserIDFromEmail($email);
$database->AddUserToGroup($userID, $groupID);
?>

