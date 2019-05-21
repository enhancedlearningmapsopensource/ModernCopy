<?php
function DbUser(){
    return "elm_debug_user";
}
function DbHost(){
    return "localhost";
}
function DbDatabase(){
    return "elm_release";
}
function DbPass(){
    return "<ELM_USER_PASSWORD>";
}

function Db(){
    //$server, $database, $username, $password
    return new ElmDatabase(DbHost(), DbDatabase(), DbUser() , DbPass());
}
?>