<?php //define("DATABASE_OVERRIDE", "elm_config") ?>
<?php if(!isset(ELM_ROOT)){ require_once("../../../../../ajax.php"); } ?>

<?php 
require_once("./recent-discussion-functions.php");

echo $database->GetDatabaseUsed();

PreVarDump(getRecentExpanded($database, $userID));

?>


