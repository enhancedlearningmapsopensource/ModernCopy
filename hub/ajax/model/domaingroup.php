<?php

require_once("base.php");


function Delete($id){
    global $database;
    
    // Check permissions
    if(!IsAdmin()){
        throw new Exception("Cannot delete domain group without admin rights.");
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_DOMAINGROUP WHERE DOMAINGROUPID=?", array(&$id));
    
    ForceChange("domaingroup");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_DOMAINGROUP";
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
        $ob["id"] = $ob["domaingroupid"];
        $all[] = $ob;
    }
    return $all;
}
function GetAllFromSet($setid){
    return "SELECT * FROM ELM_DOMAINGROUP WHERE SETID=$setid";
}

function GetOne($id){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_DOMAINGROUP WHERE DOMAINGROUPID=$id";
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
    $ob["id"] = $ob["domaingroupid"];
    return $ob;
}
function GetOneFromSet($setid, $id){
    return GetAllFromSet($setid) . " AND DOMAINGROUPID=$id";
}


function Post($data){
    global $database, $userID;
    
    $setid          = (isset($data["setid"]) ? $data["setid"] : "");
    $ord            = (isset($data["ord"]) ? $data["ord"] : "");
    $roword         = (isset($data["roword"]) ? $data["roword"] : "");
    $subjectid      = (isset($data["subjectid"]) ? $data["subjectid"] : "");
    $name           = (isset($data["name"]) ? $data["name"] : "-1");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_DOMAINGROUP(SETID,ORD,ROWORD,NAME,SUBJECTID,D) VALUES (?,?,?,?,?,?)", 
            array(
                &$setid,        // SETID
                &$ord,          // ORD
                &$roword,       // ROWORD
                &$name,         // NAME
                &$subjectid,    // SUBJECTID
                &$date,         // D
                ));
    
    return GetOne($id);
}

function Put($data){
    global $database, $userID;
    
    //PreVarDump($data);
    $id = $data["domaingroupid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_DOMAINGROUP WHERE DOMAINGROUPID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsAdmin()){
        throw new Exception("Cannot modify standard table.");
    }
    
    // Save
    return Update("ELM_DOMAINGROUP", $data, $current, "DOMAINGROUPID=$id");
}