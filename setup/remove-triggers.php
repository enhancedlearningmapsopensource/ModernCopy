// Remove triggers. They will be added back by hub later
//$result = $database->PrototypeQuery("SELECT Concat('DROP TRIGGER ', Trigger_Name, ';') FROM  information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'elm_release'");
$database->PrototypeQueryQuiet("USE `elm_release`;");
$result = $database->PrototypeQuery("SHOW TRIGGERS;");
PreVarDump($result);
exit();