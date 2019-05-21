<?php

require_once("base.php");

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $result = $database->PrototypeQuery("SELECT * FROM ELM_GROUPPREFERENCE");
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["groupid"] . "-" . $ob["preferenceid"];
        $all[] = $ob;
    }
    return $all;
}
