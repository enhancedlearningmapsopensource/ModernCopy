<?php

if(!defined("MODERN_SESSION")){
    define("MODERN_SESSION", "MODERN_SESSION_ID");
}

session_name(MODERN_SESSION);
session_start();
$_SESSION['ELM_EMAIL'] = "";
$_SESSION['ELM_PASS'] = "";
session_unset();
session_write_close();

if(defined(ELM_ROOT)){
    header("Location: ELM_ROOT");
}else{
    header('Location: ../');
}

?>