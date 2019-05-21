
<?php

require_once("../../../database/core.php");
require_once(SITE_ROOT . "database/ajax.php");

/*
// Fetch mobile detection library
require_once(SITE_ROOT . "external-lib/Mobile-Detect/v2.8.26/Mobile_Detect.php");

// Instantiate class
$detect = new Mobile_Detect;

// Detect any mobile device (phones or tablets)
if ( $detect->isMobile() ) {
    define("IS_MOBILE", TRUE);
}else{
    define("IS_MOBILE", FALSE);
}*/

//=================================================   
//== BACKUP USER                           
//=================================================   
if (!isset($user)) {
    // Get the user info
    $result = $database->GetBasicUserInfo($userID);
    $user = $database->fetch($result);
}

//=================================================   
//== BACKUP MOBILE                           
//=================================================
/*if (!defined("IS_MOBILE")) {
    define("IS_MOBILE", false);
}*/

$result = $database->GetGroupID("admin");
$groupRow = $database->FetchRowFromArray($result);

// Items for the help dropdown
// Items for admin user
if ($user["GROUPID"] == $groupRow["GROUPID"]) {
    $userItems = array("Logout", "Admin", "Preferences");
    $helpItems = array("Feedback", "User Guide", "Videos", "Dashboard", "People");
}
// Items for pilot user
else {
    $userItems = array("Logout", "Preferences");
    $helpItems = array("Feedback", "User Guide", "Videos", "Dashboard", "People");
}

//if (!IS_MOBILE) {
    require_once("./default.php");
    
    /*
} else {
    $mobileUserItems = [];
    foreach ($helpItems as $h) {
        $mobileUserItems[] = $h;
    }
    foreach ($userItems as $u) {
        $mobileUserItems[] = $u;
    }
    $userItems = $mobileUserItems;

    require_once("./mobile.php");
}*/

