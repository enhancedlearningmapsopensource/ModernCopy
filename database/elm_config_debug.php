<?php
function DbUser(){
    return "elm_debug_user";
}
function DbHost(){
    return "localhost";
}
function DbDatabase(){
    return "elm_debug";
}
function DbPass(){
    return "sC&75a[88y2B";
}

function Db(){
    //$server, $database, $username, $password
    return new ElmDatabase(DbHost(), DbDatabase(), DbUser() , DbPass());
}
?>