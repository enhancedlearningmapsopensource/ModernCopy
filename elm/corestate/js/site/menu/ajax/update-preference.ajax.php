<?php

require_once("../../../../ajax.php");

$prefID = PostRecover("prefID");
$value = PostRecover("value");

$database->SetUserPreference($userID, $prefID, $value);

?>