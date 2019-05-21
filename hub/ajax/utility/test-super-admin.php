<?php

// Check user login and connect to database
if(!isset(ELM_ROOT)){
    require_once("../../../ajax.php");
}
require_once("base-functions.php");

echo "User ID: $userID<br />";
echo "Is Super: ".IsSuperAdmin()."<br />";

?>