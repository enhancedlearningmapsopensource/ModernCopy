<?php
require_once("../../database/core.php");


// Connect to the database in case its needed
$database = Db();
$database->Connect();

//PreVarDump($database->PrototypeQuery("SELECT * FROM ELM_USER"));

// Get session data
$resecureCookie = false;
if(!isset($_SESSION)){
    $resecureCookie = true;
    if(strcmp(session_name(), MODERN_SESSION) != 0){
    	session_name(MODERN_SESSION);
    }
    session_start();
    session_write_close();
}else if(strcmp(session_name(), MODERN_SESSION) != 0){
    throw new Exception("Invalid session name: " . session_name());
}

// Verify login information
$elmEmail = isset($_SESSION["ELM_EMAIL"]) ? filter_var($_SESSION["ELM_EMAIL"]) : NULL;
$elmPassword = isset($_SESSION["ELM_EMAIL"]) ? filter_var($_SESSION["ELM_PASS"]) : NULL;
$isValidLogin = (!empty($elmEmail)) && (!empty($elmPassword)) && $database->IsValidLogin($elmEmail,$elmPassword);

//$isValidLogin = (isset($_SESSION['ELM_EMAIL']) && isset($_SESSION['ELM_PASS']) && $database->IsValidLogin($_SESSION['ELM_EMAIL'],$_SESSION['ELM_PASS']));
if(!$isValidLogin){
    echo "false";
}else{
    echo "true";
}