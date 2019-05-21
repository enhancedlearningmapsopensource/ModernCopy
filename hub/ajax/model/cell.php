<?php

require_once("base.php");

function Delete($id){
    global $database;
    
    // Check permissions
    if(!IsAdmin()){
        throw new Exception("Cannot delete cell without admin rights.");
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_CELL WHERE CELLID=?", array(&$id));
    
    ForceChange("cell");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_CELL";
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetAllFromSet($userSet);
    }
    $result = $database->PrototypeQuery($query);
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["cellid"];
        $all[] = $ob;
    }
    return $all;
}
function GetAllFromSet($setid){
    return "SELECT C.CELLID,C.DOMAINGROUPID,C.ORD,C.NAME,C.D FROM ELM_CELL AS C LEFT JOIN ELM_DOMAINGROUP AS D ON C.DOMAINGROUPID=D.DOMAINGROUPID WHERE D.SETID=$setid";
}

function GetOne($id){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_CELL WHERE CELLID=$id";
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetOneFromSet($userSet);
    }
    $result = $database->PrototypeQuery($query);
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["cellid"];
    return $ob;
}
function GetOneFromSet($setid, $id){
    return GetAllFromSet($setid) . " AND CELLID=$id";
}


function Post($data){
    global $database, $userID;
    
    $domaingroupid  = (isset($data["domaingroupid"]) ? $data["domaingroupid"] : "");
    $cellord        = (isset($data["ord"]) ? $data["ord"] : "");
    $name           = (isset($data["name"]) ? $data["name"] : "-1");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_CELL(DOMAINGROUPID,ORD,NAME,D) VALUES (?,?,?,?)", 
            array(
                &$domaingroupid,// DOMAINGROUPID
                &$cellord,      // CELLORD
                &$name,         // NAME
                &$date,         // D
                ));
    
    return GetOne($id);
}

function Put($data){
    global $database, $userID;
    
    //PreVarDump($data);
    $id = $data["cellid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_CELL WHERE CELLID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsAdmin()){
        throw new Exception("Cannot modify standard table.");
    }
    
    // Save
    return Update("ELM_CELL", $data, $current, "CELLID=$id");
}