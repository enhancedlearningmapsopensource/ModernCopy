<?php
require_once("../../../../ajax.php");

$result = $database->GetPreferencesForUserAll($userID);

$json = array();

while($row = $database->FetchRowFromArray($result)){
	$pref = array();
	$pref["id"] 		= $row["PREFERENCEID"];
	$pref["name"] 		= $row["NAME"];
	$pref["default"] 	= $row["DEFAULTVALUE"];
	$pref["choices"] 	= explode(",",$row["CHOICES"]);
	$pref["type"] 		= $row["FORMTYPE"];
	$pref["value"]		= $row["VAL"];
	array_push($json, $pref);
}

echo json_encode($json);

?>