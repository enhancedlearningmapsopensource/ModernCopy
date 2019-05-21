<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    
    // Recover the id
    $split = explode("-", $id);
    if(count($split) > 2){
        throw new Exception("Could not recover ids. Should only be one '-' in the id.");
    }
    $mapID = intval($split[0]);
    $nodeID = intval($split[1]);
    
    // Get the map
    $mapResult = $database->PrototypeQuery("SELECT * FROM ELM_MAP WHERE MAPID=?", array(&$mapID));
    if(!isset($mapResult["result"])){
        throw new Exception("no map with id=$mapID");
    }
    $map = $database->fetch($mapResult);
    if(!IsSuperAdmin() && !IsAdmin() && intval($map["CREATORID"]) != intval($userID)){
        throw new Exception("Cannot delete nodes from another user's map");
    }
    
    $database->PrototypeQueryQuiet("DELETE FROM ELM_MAPNODES WHERE MAPID=? AND NODEID=?", array(&$mapID, &$nodeID));
    
    // Verify
    $result = $database->PrototypeQuery("SELECT * FROM ELM_MAPNODES WHERE MAPID=? AND NODEID=?", array(&$mapID, &$nodeID));
    if(isset($result["result"])){
        throw new Exception("Failed to delete.");
    }
    
    // Force a change
    ForceChange("mapnode");
    
    return json_encode(array("mapid"=>$mapID, "nodeid"=>$nodeID));
}

function GetAll(){
    global $database,$userID;
    
    $all = array();
    $query = "";
    
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        if(IsSuperAdmin() || IsAdmin()){
            $query = "SELECT MAPID,NODEID,DATEADDED,D,COLOR FROM ELM_MAPNODES";
        }else{
            $query = "SELECT MN.MAPID,MN.NODEID,MN.DATEADDED,MN.D,MN.COLOR FROM ELM_MAPNODES AS MN LEFT JOIN ELM_MAP AS M ON MN.MAPID=M.MAPID WHERE M.ISPUBLIC=1 OR M.CREATORID=$userID";
        }
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetAllFromSet($userSet, $userID);
    }
    $result = $database->PrototypeQuery($query);
    
    
    
    $result = $database->PrototypeQuery($query);
    
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["mapid"] . "-" . $ob["nodeid"];
        $all[] = $ob;
    }
    return $all;
}

function GetAllFromSet($setid, $userID){
    if(IsSuperAdmin() || IsAdmin()){
        $query = "
            SELECT 
                MN.MAPID,
                MN.NODEID,
                MN.DATEADDED,
                MN.D,
                MN.COLOR 
            FROM 
                ELM_MAPNODES AS MN
                LEFT JOIN ELM_SETNODE AS SN ON MN.NODEID=SN.NODEID
                LEFT JOIN ELM_SETMAP AS SM ON MN.MAPID=SM.MAPID
            WHERE
                SN.SETID=$setid AND SM.SETID=$setid";
    }else{
        $query = "
            SELECT 
                MN.MAPID,
                MN.NODEID,
                MN.DATEADDED,
                MN.D,
                MN.COLOR 
            FROM 
                ELM_MAPNODES AS MN
                LEFT JOIN ELM_SETNODE AS SN ON MN.NODEID=SN.NODEID
                LEFT JOIN ELM_SETMAP AS SM ON MN.MAPID=SM.MAPID
                LEFT JOIN ELM_MAP AS M ON MN.MAPID=M.MAPID
            WHERE
                SN.SETID=$setid AND SM.SETID=$setid AND (M.ISPUBLIC=1 OR M.CREATORID=$userID)";
    }
    return $query;
}

function GetOne($id){
    global $database;
    
    // Recover the id
    $split = explode("-", $id);
    if(count($split) != 2){
        throw new Exception("Could not recover ids. Should only be one '-' in the id.");
    }
    $mapID = intval($split[0]);
    $nodeID = intval($split[1]);
    
    $result = $database->PrototypeQuery("SELECT MAPID,NODEID,DATEADDED,D,COLOR FROM ELM_MAPNODES WHERE MAPID=$mapID AND NODEID=$nodeID");
    $row = $database->fetch($result);
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["mapid"] . "-" . $ob["nodeid"];
    return $ob;
}

function Post($data){
    global $database;
    
    $mapid          = (isset($data["mapid"]) ? $data["mapid"] : "");
    $nodeid         = (isset($data["nodeid"]) ? $data["nodeid"] : "");
    $color          = (isset($data["color"]) ? $data["color"] : 0);
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $database->PrototypeInsert("INSERT INTO ELM_MAPNODES(
            MAPID,
            NODEID,
            DATEADDED,
            CONTRACT,
            COLOR,
            CREATION,
            ISCORE,
            D) VALUES (?,?,?,?,?,?,?,?)", 
            array(
                &$mapid,        // MAPID
                &$nodeid,       // NODEID
                &$date,         // DATEADDED
                0,              // CONTRACT
                &$color,        // COLOR
                0,              // CREATION
                0,              // ISCORE
                &$date,         // D
                ));
    
    return GetOne($mapid . "-" . $nodeid);
}
