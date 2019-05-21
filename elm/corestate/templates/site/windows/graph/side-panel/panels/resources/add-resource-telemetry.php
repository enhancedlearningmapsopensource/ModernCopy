<?php

require_once("../../../../../../../../../database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

if(!$database->TableExists("ELM_RESOURCE_TELEMETRY")){
    $database->CreateResourceTelemetryTable();
}

$resourceid = filter_input(INPUT_POST, "resourceid", FILTER_SANITIZE_NUMBER_INT);
$linkurl = filter_input(INPUT_POST, "linkurl", FILTER_SANITIZE_URL);

$date = date("Y-m-d H:i:s");
$database->PrototypeInsert("INSERT INTO ELM_RESOURCE_TELEMETRY(USERID,DATECLICKED,RESOURCEID,LINKURL) VALUES('$userID','$date','$resourceid','$linkurl');");

