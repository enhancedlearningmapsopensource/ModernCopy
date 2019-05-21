<?php

// Connect to core functions
require_once("../core.php");
if(!isset($database)){
    $database = Db();
    $database->Connect();
}

function getInput(){
    return [
        "email" => filter_input(PROTOCOL, "email", FILTER_SANITIZE_EMAIL),
        "pass" => filter_input(PROTOCOL, "pass", FILTER_SANITIZE_STRING)
    ];
}

function writeMsg($msg){
    $joinOn = "<br />";
    if(PROTOCOL == INPUT_POST){
        $joinOn = "\n";
    }
    echo implode($joinOn, $msg);
}

?>