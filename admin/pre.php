<?php

define("ELM_ROOT", "../");
require_once(ELM_ROOT . "database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

// Define the path to the ELM folder
define("ELM_PATH", ELM_ROOT . "elm/");

// Fetch mobile detection library
require_once(ELM_ROOT . "external-lib/Mobile-Detect/v2.8.26/Mobile_Detect.php");

// Instantiate class
$detect = new Mobile_Detect;

// Detect any mobile device (phones or tablets) and set a constant declaring the fact.
if ( $detect->isMobile() ) {
    define("IS_MOBILE", TRUE);
}else{
    define("IS_MOBILE", FALSE);
}

// Recover the session
session_name(MODERN_SESSION);
session_start();
session_write_close();

// Check for database
if(!isset($database)){
    echo "Error! No database detected";
    exit(0);
}

// Check for the existance of the telemetry table. Since telemetry is high-use and must
// be low-impact, we don't want to waste time checking for the table during run-time.
if(!$database->TableExists("ELM_TELEMETRY")){
    $database->CreateTelemetryTable();
}

// Fetch session variables (null if not set)
$email = isset($_SESSION['ELM_EMAIL']) ? $_SESSION['ELM_EMAIL'] : null;
$pass = isset($_SESSION['ELM_PASS']) ? $_SESSION['ELM_PASS'] : null;

// Check the login
$mIsValidLogin = ($email != null) && ($pass != null) && $database->IsValidLogin($email,$pass);
if(!$mIsValidLogin){
    require_once(ELM_ROOT . "elm/login/login-page.php");
    exit(0);
}else{    
    // Ensure that the user has permission to be on this page
    if(!HasPermission("SITE_BETA")){
        echo "Permission denied.<br />";
        echo "<a href='".ELM_ROOT . "'>Back to Login</a>";
        session_start();
        unset($email);
        unset($pass);
        session_write_close();
        exit(0);
    }
    
    // Get the user id
    try{
        $userID = $database->GetUserId($email,$pass);
    }catch(Exception $ex){
        require_once(ELM_ROOT . "login/logout.php");
        exit(0);
    }

    // Get the user info
    $result = $database->GetBasicUserInfo($userID);
    $user = $database->fetch($result);

    // Get the last login
    $lastLogin = $user["LAST_ACCESS"];
    if($lastLogin == NULL){
        $lastLogin = "never";
    }

    // Set the new last login
    $database->RecordUserLogin($userID);
}
?>

