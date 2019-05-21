<?php

define("PROTOCOL", INPUT_POST); // Use INPUT_POST or INPUT_GET

require_once("./script-header.php");

$input = getInput();

$msg = [];
$msg[] = "Email: " . $input["email"];
$msg[] = "Password: " . $input["pass"];

createUser($database, $input["email"], $input["pass"], "");

$msg[] = "User created.";

$verify = json_decode(verifyPhpLogin($database, $input["email"], $input["pass"]), true);
if($verify["status"] == "SUCCESS"){ 
    $msg[] = "User verified.";
}else{
    $msg[] = "User verification failed.";
}

writeMsg($msg);

?>