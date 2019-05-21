<?php

require_once("../../../ajax.php");

define("AUTOMATED_PATH", "../../automated/");

$toClear = dirToArray(AUTOMATED_PATH);
foreach($toClear as $t){
    unlink(AUTOMATED_PATH . $t);
}

echo "Server Cleared!";