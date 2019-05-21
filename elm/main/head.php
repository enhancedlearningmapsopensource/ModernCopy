<?php

/**
 * Set up content that appears within the 'head' tag of the main page.
 */

/** Global variables:  $database, $userID, ELM_ROOT */
if(!defined("ELM_PATH")){
    define("ELM_PATH", ELM_ROOT . "elm/");
}

// Check to make sure we have not already set the headers
if (headers_sent()) {
    throw new Exception("Error! Headers are already set");
}

// Get the list of user permissions avaliable to the current user. This
// should be kept as server-side as much as possible for enforcement but
// there are some things that are needed by javascript so push the list
// to a script tag (see below).
$result = $database->PrototypeQuery("SELECT * FROM "
    . "ELM_USER AS U "
    . "LEFT JOIN ELM_USERGROUP AS UG ON U.USERID=UG.USERID "
    . "LEFT JOIN ELM_GROUPPERMISSION AS GP ON UG.GROUPID=GP.GROUPID "
    . "LEFT JOIN ELM_PERMISSION AS P ON P.PERMISSIONID=GP.PERMISSIONID "
    . "WHERE U.USERID=? AND GP.PERMISSIONID > 0", array(&$userID));
$permissionLst = array();
while($row = $database->fetch($result)){
    $permissionLst[] = $row["PROGRAM_CODE"];
}
$permissions = "[" . implode(",", array_map(function($d){return "'$d'";}, $permissionLst)) . "]";

// Try to load config options
try{
    $config = Config();
}catch(Exception $ex){
    // Log exception and continue
    echo "<script>console.warn(\"" . str_replace("\"", "'", $ex->getMessage()) ."\");console.warn(\"The config table will be loaded by hub so if it's missing reload page.\");</script>";
    $config = json_encode(array("error"=>TRUE));
}

?>

<!-- Configure viewport for mobile compatibility -->
<meta name="viewport" content="width=device-width, initial-scale=1" />

<!-- Set the page icon -->
<link rel="shortcut icon" href='<?= ELM_PATH ?>assets/img/elm_50px.png' />

<!-- Load site wide css -->
<?php require_once(ELM_PATH . "main/css-loader.php");  ?>

<script>
    // The path to the site root
    var gRoot = '<?=  ELM_PATH ?>';

    // The id of the current user
    var userID = Number('<?=  $userID ?>');

    // The currently selected standard set
    var sset = '<?= $sset ?>';

    // The version of data currently housed on the server
    var dataVersion = JSON.parse('<?= json_encode($database->GetModernDataVersionComplete()) ?>');

    // Config options 
    var config = JSON.parse('<?= $config ?>');

    // The last time this user logged in
    var lastLogin = '<?= $lastLogin ?>';

    // User permissions
    var permissions = <?= $permissions ?>;

    // The current session id
    var sessionID = '<?=session_id()?>';
</script>


<!-- Provide path to jsclass -->
<script>JSCLASS_PATH = '<?=ELM_ROOT ?>external-lib/jsclass/v4.0.5/jsclass/min'</script>
<script src="<?=ELM_ROOT ?>external-lib/jsclass/v4.0.5/jsclass/min/loader-browser.js"></script>

<!-- Set the page title -->
<title>ELM Explorer</title>

