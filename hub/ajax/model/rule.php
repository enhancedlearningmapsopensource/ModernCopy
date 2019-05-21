<?php

require_once("base.php");

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $result = $database->PrototypeQuery("SELECT * FROM ELM_NAMING_RULE");
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["ruleid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_NAMING_RULE WHERE RULEID=?", array(&$id));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["ruleid"];
    return $ob;
}

function Post($data){
    global $database, $userID;
    
    $textid         = (isset($data["textid"]) ? $data["textid"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_NAMING_RULE(CREATORID,TEXTID,DATECREATED,D) VALUES (?,?,?,?)", 
            array(
                &$userID,       // CREATORID
                &$textid,       // TEXTID
                &$date,         // DATECREATED
                &$date,         // D
                ));
    
    return GetOne($id);
}

?>