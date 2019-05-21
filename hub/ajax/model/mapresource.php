<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    
    // Recover the id
    $split = explode("-", $id);
    if(count($split) != 3){
        throw new Exception("Could not recover ids. Should be two '-' in the id. ID: $id");
    }
    $mapID = intval($split[0]);
    $resourceID = intval($split[1]);
    $creatorID = intval($split[2]);
    $editModeOn = GetUserEditMode($database, $userID);

    if($creatorID != intval($userID) && !IsSuperAdmin() && !$editModeOn){
        throw new Exception("Cannot delete another user's map-resource connection. UserID: $userID, CreatorID: $creatorID, DomainID: $id" );
    } 
    
    $database->PrototypeQueryQuiet("DELETE FROM ELM_MAPRESOURCE WHERE MAPID=? AND RESOURCEID=? AND EDITORID=?", array(&$mapID, &$resourceID, &$userID));
    
    // Verify
    $result = $database->PrototypeQuery("SELECT * FROM ELM_MAPRESOURCE WHERE MAPID=? AND RESOURCEID=? AND EDITORID=?", array(&$mapID, &$resourceID, &$userID));
    if(isset($result["result"])){
        throw new Exception("Failed to delete.");
    }
    
    // Force a change
    ForceChange("mapresource");
    
    return json_encode(array("mapid"=>$mapID, "resourceid"=>$resourceID, "editorid"=>$userID));
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $result = $database->PrototypeQuery("SELECT * FROM ELM_MAPRESOURCE");
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["mapid"] . "-" . $ob["resourceid"] . "-" . $ob["editorid"];
        $all[] = $ob;
    }
    return $all;
}

/**
 * 
 * @global type $database
 * @global type $userID
 * @param type $data
 * @return type
 */
function Post($data){
    global $database, $userID;
    
    // Check primary keys
    $conn = $database->GetConnection();
    $result = $conn->query("SELECT * FROM ELM_MAPRESOURCE LIMIT 1");
    $editModeOn = GetUserEditMode($database, $userID);
    
    //get primary key
    $primary_key = [];
    while ($meta = $result->fetch_field()) {
        if ($meta->flags & MYSQLI_PRI_KEY_FLAG) { 
            $primary_key[] = $meta->name; 
        }
    }
    if(count($primary_key) === 2){
        $conn->query("ALTER TABLE ELM_MAPRESOURCE DROP PRIMARY KEY, ADD PRIMARY KEY(MAPID,RESOURCEID,EDITORID)");
    }
    
    //get primary key
    $primary_key = '';
    while ($meta = $result->fetch_field()) {
        if ($meta->flags & MYSQLI_PRI_KEY_FLAG) { 
            $primary_key = $meta->name; 
        }
    }
    
    $mapID      = $data["mapid"];
    $resourceID = $data["resourceid"];
    $editorID   = isset($data["editorid"]) ? $data["editorid"] : $userID;
    
    if($editorID != $userID && !IsSuperAdmin() && !$editModeOn){
        throw new Exception("Cannot associate map with resource for another user. Editor: $editorID, User: $userID, IsSuper: " + IsSuperAdmin());
    }
    
    $d          = date("Y-m-d H:i:s");
    $database->PrototypeQueryQuiet("INSERT INTO ELM_MAPRESOURCE(MAPID,RESOURCEID,EDITORID,D,DATE) VALUES(?,?,?,?,?)", array(&$mapID, &$resourceID, &$editorID, &$d, &$d));
    $data["id"] = $data["mapid"] . "-" . $data["resourceid"] . "-" . $editorID;
    $data["editorid"] = $userID;
    
    return $data;
}



?>

