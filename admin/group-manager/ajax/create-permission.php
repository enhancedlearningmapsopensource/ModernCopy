<?php

define("ELM_ROOT", "../../../");
require_once(ELM_ROOT . "database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

$name = filter_input(INPUT_POST, "name", FILTER_SANITIZE_STRING);
$id = $database->AddPermission($name, "");

$permission = $database->GetPermissionWithID($id);
$permission["GROUPS"] = $database->GetPermissionGroups($id);
$permission["id"] = $permission["PERMISSIONID"];

echo json_encode($permission);
?>

