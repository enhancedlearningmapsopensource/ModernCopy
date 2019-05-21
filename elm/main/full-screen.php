<?php

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
    if(!HasPermission("SITE_MAIN")){
        echo "Permission denied.<br />";
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

// Get standard set preference for user (defined in core.php)
$sset = GetSelectedStandardSet($database, $userID);


// Preload local storage if required
$preload = (strcmp(filter_input(INPUT_GET, "preload"), "true") == 0);
if($preload){
    $preloadedData = json_decode(file_get_contents(ELM_ROOT . "assets/preloaded-local-storage/preload.json"), true);
}
?>

<!DOCTYPE html>
<html>
    <head>
        <?php require_once(ELM_PATH . "main/head.php"); ?>
        <?php if($preload){ ?>
        <script>
            localStorage["elm-local-owner"] = "<?=$preloadedData["owner"]?>";
            var preloadedData = <?=json_encode($preloadedData["data"])?>;
        </script>
        <?php } ?>
    </head>
    <body>
        <?php 
            // Code to embed in the locater tool side panel

            //echo '<div id="locater-tool-area" class="locaterbody">';
            //echo file_get_contents("../../nodelocater/public/index.ejs");
            //echo '</div>';
        ?>
        
        <!-- Print area -->
        <div id="print-div" class="visible-print-block">
            <div id="print-header"></div>
            <svg></svg>
        </div>
        <div id="print-replace" class="visible-print-block"></div>
        
        <!-- Main area -->
        <?php require_once(ELM_PATH . "main/body.php"); ?>
    </body>
</html>

