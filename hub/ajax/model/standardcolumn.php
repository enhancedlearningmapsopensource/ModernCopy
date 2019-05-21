<?php

require_once("base.php");

function Delete($id){
    global $database;
    
    // Check permissions
    if(!IsAdmin()){
        throw new Exception("Cannot delete standard column without admin rights.");
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_STANDARDCOLUMN WHERE COLUMNID=?", array(&$id));
    
    ForceChange("standardcolumn");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_STANDARDCOLUMN";
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
        $ob["id"] = $ob["columnid"];
        $all[] = $ob;
    }
    return $all;
}
function GetAllFromSet($setid){
    return "SELECT * FROM ELM_STANDARDCOLUMN WHERE SETID=$setid";
}

function GetOne($id){
    global $database, $userID;
    
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_STANDARDCOLUMN WHERE COLUMNID=$id";
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
    $ob["id"] = $ob["columnid"];
    return $ob;
}
function GetOneFromSet($setid, $id){
    return GetAllFromSet($setid) . " AND COLUMNID=$id";
}


function Post($data){
    global $database, $userID;
    
    $setid          = (isset($data["setid"]) ? $data["setid"] : "");
    $ord            = (isset($data["ord"]) ? $data["ord"] : "");
    $name           = (isset($data["name"]) ? $data["name"] : "-1");
    $subjectid      = (isset($data["subjectid"]) ? $data["subjectid"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_STANDARDCOLUMN(SETID,ORD,NAME,SUBJECTID,D) VALUES (?,?,?,?,?)", 
            array(
                &$setid,        // SETID
                &$ord,          // ORD
                &$name,         // NAME
                &$subjectid,    // SUBJECTID
                &$date,         // D
                ));
    
    return GetOne($id);
}

function Put($data){
    global $database, $userID;
    
    //PreVarDump($data);
    $id = $data["columnid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_STANDARDCOLUMN WHERE COLUMNID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsAdmin()){
        throw new Exception("Cannot modify standard table.");
    }
    
    // Save
    return Update("ELM_STANDARDCOLUMN", $data, $current, "COLUMNID=$id");
}