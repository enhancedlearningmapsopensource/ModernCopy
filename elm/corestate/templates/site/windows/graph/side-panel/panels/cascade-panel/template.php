<?php

require_once("../../../../../../../../../database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

if(!HasPermission("RESOURCE")){
    echo "<div>permission denied</div>";
}

?>

<div class="container-fluid" id="cascade-menu-panel"></div>