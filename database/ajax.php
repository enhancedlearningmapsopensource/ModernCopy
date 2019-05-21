<?php

// Using SITE_ROOT
unset($gRoot);

// Connect to the database in case its needed
if(!isset($database)){
    $database = Db();
    $database->Connect();
}

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
    if(defined("INVALID_LOGIN_REDIRECT")){
        header('Location: ' . INVALID_LOGIN_REDIRECT);
    }else if(defined("AUTHENTICATOR")){
        require_once(AUTHENTICATOR);
        exit(0);
    }
    echo "invalid login.";
    echo "<script>console.warn(\"invalid login data. Email: '".$elmEmail."', pass: '" .$elmPassword."'\")</script>";
    exit(0);
}
$userID = $database->GetUserId($_SESSION['ELM_EMAIL'],$_SESSION['ELM_PASS']);

// Get preferences for user
$setProgramCode =  "SSET";
$result = $database->PrototypeQuery("SELECT * FROM ELM_USERPREFERENCE AS UP LEFT JOIN ELM_PREFERENCE AS P ON UP.PREFERENCEID=P.PREFERENCEID WHERE UP.USERID=? AND P.PROGRAM_CODE LIKE ?", array(&$userID, &$setProgramCode));
if(!isset($result["result"])){
    $sset = "a";
}else{
    $row = $database->fetch($result);
    $sset = $row["VAL"];
}

// Resecure
if($resecureCookie){
    setcookie(MODERN_SESSION, session_id(), time() + (86400 * 30), "/", "", true);
}

/**
 * Force a registered change in the data table. This is for times such as when 
 * a row is deleted in which no date can conveniently mark the change. 
 * @global type $database - the database
 * @param {string} $table - the table to force the change to
 */
function ForceChange($table){
    global $database;
    
    $date = date("Y-m-d H:i:s");
    $database->PrototypeQueryQuiet("UPDATE ELM_FORCEDCHANGES SET D=? WHERE TABLENAME LIKE ?", array(&$date, &$table));
}



?>