<?php

require_once("base.php");

function GetAll(){
    global $database;
    
    $all = array();
    $result = $database->PrototypeQuery("SELECT * FROM ELM_HTMLCONTENT");
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database;
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_HTMLCONTENT WHERE ID=?", array(&$id));
    $current = $database->fetch($result);
    
    $ob = array();
    foreach($current as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    return $ob;
}

function Post($data){
    global $database;
    
    $program_code   = (isset($data["program_code"]) ? $data["program_code"] : "");
    $content        = (isset($data["content"]) ? $data["content"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_HTMLCONTENT(PROGRAM_CODE,DATE,CONTENT,D) VALUES (?,?,?,?)", 
            array(
                &$program_code, // PROGRAM CODE
                &$date,         // DATE
                &$content,      // CONTENT
                &$date          // D
                ));
    
    return GetOne($id);
}