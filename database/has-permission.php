<?php

require_once("./core.php");
require_once(ELM_ROOT . "database/ajax.php");

$programCode = filter_input(INPUT_POST, "code", FILTER_SANITIZE_STRING);
if(hasPermission($programCode)){
    echo "true";
}else{
    echo "false";
}
?>