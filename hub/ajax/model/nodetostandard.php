<?php

require_once("base.php");

function Delete($id){
    global $database;
    
    // Recover the id
    $split = explode("-", $id);
    if(count($split) > 2){
        throw new Exception("Could not recover ids. Should only be one '-' in the id.");
    }
    $nodeID = intval($split[0]);
    $sid = intval($split[1]);
    
    // Verify that the standard exists
    $obresult = $database->PrototypeQuery("SELECT * FROM ELM_SIMPLESTANDARD WHERE SID=?", array(&$sid));
    if(!isset($obresult["result"])){
        PreVarDump($obresult);
        throw new Exception("no object with id=$sid");
    }
    
    // Verify that the node exists
    $setresult = $database->PrototypeQuery("SELECT * FROM ELM_NODE WHERE NODEID=?", array(&$nodeID));
    if(!isset($setresult["result"])){
        PreVarDump($setresult);
        throw new Exception("no set with id=$nodeID");
    }
    
    // Check permissions
    if(!IsSuperAdmin() && !IsAdmin()){
        throw new Exception("Cannot manage set mapping for NODE-STANDARD");
    }
    
    // Perform deletion
    $database->PrototypeQueryQuiet("DELETE FROM ELM_NODETOSTANDARD WHERE SID=? AND NODEID=?", array(&$sid, &$nodeID));
    
    // Verify deletion
    $vresult = $database->PrototypeQuery("SELECT * FROM ELM_NODETOSTANDARD WHERE SID=? AND NODEID=?", array(&$sid, &$nodeID));
    if(isset($vresult["result"])){
        throw new Exception("Failed to delete.");
    }
    
    // Force a change
    ForceChange("nodestandard");
    
    return json_encode(array("sid"=>$sid, "nodeid"=>$nodeID));
}


function GetAll(){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_NODETOSTANDARD";
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
        $ob["id"] = $ob["nodeid"] . "-" . $ob["sid"];
        $all[] = $ob;
    }
    return $all;
}

function GetAllFromSet($setid){
    // Only get node-standard mappings if both node and standard are in the set
    return "
        SELECT 
            NS.SID AS SID,
            NS.NODEID AS NODEID,
            NS.DATE AS DATE,
            NS.D AS D
        FROM 
            ELM_NODETOSTANDARD AS NS 
            LEFT JOIN ELM_SETNODE AS SN ON NS.NODEID=SN.NODEID
            LEFT JOIN ELM_SETSTANDARD AS SS ON NS.SID=SS.SID
        WHERE
            SN.SETID=$setid AND SS.SETID=$setid";
}

function GetOne(){
    throw new Exception("not yet implemented");
}

function Post($data){
    global $database;
    
    $nodeid         = (isset($data["nodeid"]) ? $data["nodeid"] : "");
    $sid            = (isset($data["sid"]) ? $data["sid"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $database->PrototypeInsert("INSERT INTO ELM_NODETOSTANDARD(SID,NODEID,DATE,D) VALUES (?,?,?,?)", 
            array(
                &$sid,          // SID
                &$nodeid,       // NODEID
                &$date,         // DATE
                &$date          // D
                ));
    
    $data["id"] = $data["nodeid"] . "-" . $data["sid"];
    return $data;
}