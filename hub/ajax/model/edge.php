<?php

require_once("base.php");

function Delete($id){
    global $database;
    
    if(!IsSuperAdmin() && !IsAdmin()){
        throw new Exception("Cannot destroy edge. Not super admin.");
    }
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_EDGE WHERE EDGEID=?", array(&$id));
    
    ForceChange("edge");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_EDGE";
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
        $ob["id"] = $ob["edgeid"];
        $all[] = $ob;
    }
    return $all;
}

function GetAllFromSet($setid){
    // Only get node-standard mappings if both node and standard are in the set
    return "
        SELECT 
            E.EDGEID AS EDGEID,
            E.STARTNODE AS STARTNODE,
            E.ENDNODE AS ENDNODE,
            E.D AS D
        FROM 
            ELM_EDGE AS E 
            LEFT JOIN ELM_SETNODE AS NODEA ON E.STARTNODE=NODEA.NODEID
            LEFT JOIN ELM_SETNODE AS NODEB ON E.ENDNODE=NODEB.NODEID
        WHERE
            NODEA.SETID=$setid AND NODEB.SETID=$setid";
}

function GetOne($id){
    global $database, $userID;
    
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_EDGE WHERE EDGEID=$id";
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetOneFromSet($userSet, $id);
    }
    $result = $database->PrototypeQuery($query);
    $row = $database->fetch($result);
    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["edgeid"];
    return $ob;
}
function GetOneFromSet($setid, $id){
    return GetAllFromSet($setid) . " AND E.EDGEID=$id";
}

function Post($data){
    global $database, $userID;
    
    $endnode        = (isset($data["endnode"]) ? $data["endnode"] : "");
    $startnode      = (isset($data["startnode"]) ? $data["startnode"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_EDGE(STARTNODE,ENDNODE,D,CREATORID) VALUES (?,?,?,?)", 
            array(
                &$startnode,    // STARTNODE
                &$endnode,      // ENDNODE
                &$date,         // D
                &$userID        // CREATORID
                ));
    
    return GetOne($id);
}

