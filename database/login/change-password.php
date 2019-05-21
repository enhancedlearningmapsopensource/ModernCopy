<?php

define("PROTOCOL", INPUT_POST); // Use INPUT_POST or INPUT_GET

require_once("./script-header.php");

$input = getInput();

$msg = [];
$msg[] = "Email: " . $input["email"];
$msg[] = "Password: " . $input["pass"];

$hashed = encryptPassword($database, $input["email"], $input["pass"]);
$database->ChangePassword($input["email"], $hashed);

$verify = json_decode(verifyPhpLogin($database, $input["email"], $input["pass"]), true);
if($verify["status"] == "SUCCESS"){ 
    $msg[] = "User verified.<br />";
    $msg[] = "Password changed";
}else{
    $msg[] = "User verification failed.";
}

writeMsg($msg);

?>