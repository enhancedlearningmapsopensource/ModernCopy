<?php
    define("ELM_ROOT", "../../../../moderncopy/");
    require_once(ELM_ROOT . "database/core.php");
    require_once(ELM_ROOT . "database/ajax.php");
    $thisFile = explode('.',basename(__FILE__))[0];
    define("NO_JQUERY", true);
    require_once("../connection.php");
?>
