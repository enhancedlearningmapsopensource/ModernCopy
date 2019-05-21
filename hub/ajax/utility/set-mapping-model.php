<?php

function Delete($id){
    global $database, $userID;
    
    // Recover the id
    $split = explode("-", $id);
    if(count($split) > 2){
        throw new Exception("Could not recover ids. Should only be one '-' in the id.");
    }
    $setID = intval($split[0]);
    $oid = intval($split[1]);
    
    // Verify that the object exists
    $obresult = $database->PrototypeQuery("SELECT * FROM ".CHECK." WHERE ".ID."=?", array(&$oid));
    if(!isset($obresult["result"])){
        PreVarDump($obresult);
        throw new Exception("no object with id=$oid");
    }
    
    // Verify that the set exists
    $setresult = $database->PrototypeQuery("SELECT * FROM ELM_STANDARD_SET WHERE SETID=?", array(&$setID));
    if(!isset($setresult["result"])){
        PreVarDump($setresult);
        throw new Exception("no set with id=$setID");
    }
    
    // Check permissions
    if(!IsSuperAdmin() && !IsAdmin()){
        throw new Exception("Cannot manage set mapping for " . CHECK);
    }
    
    // Perform deletion
    $database->PrototypeQueryQuiet("DELETE FROM ".TABLE." WHERE ".ID."=? AND SETID=?", array(&$oid, &$setID));
    
    // Verify deletion
    $vresult = $database->PrototypeQuery("SELECT * FROM ".TABLE." WHERE ".ID."=? AND SETID=?", array(&$oid, &$setID));
    if(isset($vresult["result"])){
        throw new Exception("Failed to delete.");
    }
    
    // Force a change
    ForceChange(strtolower(TABLE));
    
    return json_encode(array(strtolower(ID)=>$oid, "setid"=>$setID));
}

function GetAll(){
    global $database,$userID;
    
    $all = array();
    if(IsSuperAdmin() || IsAdmin()){
        $result = $database->PrototypeQuery("SELECT ".ID.",SETID,DATECREATED,D FROM " . TABLE);
    }else{
        return $all;
    }
    
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["setid"] . "-" . $ob[strtolower(ID)];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database;
    
    // Recover the id
    $split = explode("-", $id);
    if(count($split) > 2){
        throw new Exception("Could not recover ids. Should only be one '-' in the id.");
    }
    $setID = intval($split[0]);
    $oid = intval($split[1]);
    
    $result = $database->PrototypeQuery("SELECT SETID,".ID.",DATECREATED,D FROM ".TABLE." WHERE ".ID."=$oid AND SETID=$setID");
    $row = $database->fetch($result);
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["setid"] . "-" . $ob[strtolower(ID)];
    return $ob;
}

function Post($data){
    global $database;
    
    $oid            = (isset($data[strtolower(ID)]) ? $data[strtolower(ID)] : "");
    $setid          = (isset($data["setid"]) ? $data["setid"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $database->PrototypeInsert("INSERT INTO ".TABLE."(
            ".ID.",
            SETID,
            DATECREATED,
            D) VALUES (?,?,?,?)", 
            array(
                &$oid,          // MAPID
                &$setid,        // NODEID
                &$date,         // DATECREATED
                &$date,         // D
                ));
    
    return GetOne($setid . "-" . $oid);
}