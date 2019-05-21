<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    
    // Recover the id
    $split = explode("-", $id);
    if(count($split) != 2){
        throw new Exception("Could not recover ids. Should only be one '-' in the id.");
    }
    $user = intval($split[1]);
    $resourceID = intval($split[0]);
    
    if($user != $userID){
        throw new Exception("cannot force another user to stop sharing a resource.");
        //EnforceDivergance($user);
    }
    
    $database->PrototypeQueryQuiet("DELETE FROM ELM_SHAREDRESOURCE WHERE USERID=? AND RESOURCEID=?", array(&$user, &$resourceID));
    
    // Verify
    $result = $database->PrototypeQuery("SELECT * FROM ELM_SHAREDRESOURCE WHERE USERID=? AND RESOURCEID=?", array(&$user, &$resourceID));
    if(isset($result["result"])){
        throw new Exception("Failed to delete.");
    }
    
    // Force a change
    ForceChange("sharedresource");
    
    return array("userid"=>$user, "resourceid"=>$resourceID);
    
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $result = $database->PrototypeQuery("SELECT * FROM ELM_SHAREDRESOURCE", array());
    while($row = $database->fetch($result)){
        $ob = array();
        
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["resourceid"] . "-" . $ob["userid"];
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
    
    // Fix table if necessary
    $result = $database->PrototypeQuery("SELECT * FROM ELM_SHAREDRESOURCE LIMIT 1");
    if(isset($result) && isset($result["result"])){
        $row = $database->fetch($result);
        if(!isset($row["D"])){
            $database->PrototypeQueryQuiet("ALTER TABLE ELM_SHAREDRESOURCE ADD COLUMN D DATETIME DEFAULT '".TIME_ZERO."'");
        }
    }else{
        $database->PrototypeQueryQuiet("INSERT INTO ELM_SHAREDRESOURCE() VALUES()", array());
        throw new Exception("Please retry post");
    }
    
    $resourceID = $data["resourceid"];
    $uid = isset($data["userid"]) ? $data["userid"] : $userID;
    
    if($uid != $userID){
        throw new Exception("Cannot forcibly share a resource with another user.");
        //EnforceDivergance($uid);
    }
    
    // Make certain that the resource is sharable
    //$results = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$resourceid));
    //$row = $database->fetch($results);
    
    if(IsPublicResource($resourceID) || IsElm($resourceID)){
        $d          = date("Y-m-d H:i:s");
        $database->PrototypeQueryQuiet("INSERT INTO ELM_SHAREDRESOURCE(USERID,RESOURCEID,D,DATE) VALUES(?,?,?,?)", array(&$uid, &$resourceID, &$d, &$d));
        $data["id"] = $data["resourceid"] . "-" . $userID;
    }else{
        throw new Exception("Cannot share resource as it is not public and not elm.");
    }
    return $data;
}



/**
 * Check to see if the resource is public
 * @global type $database
 * @param type $resourceID
 * @return boolean
 */
function IsPublicResource($resourceID){
    global $database;
    
    // Make certain that the resource is sharable
    $results = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$resourceID));
    $row = $database->fetch($results);
    
    return ($row["ISPUBLIC"] == 1);
}

/**
 * Check to see if the resource belongs to an ELM public map
 * @global type $database
 * @param type $resourceID
 * @return boolean
 */
function IsElm($resourceID){
    global $database;
    
    // Check to see if the resource belongs to an ELM public map
    $results = $database->PrototypeQuery("SELECT MR.RESOURCEID,M.MAPID,M.ISPUBLIC "
            . "FROM ELM_MAPRESOURCE AS MR "
            . "LEFT JOIN ELM_MAP AS M ON MR.MAPID=M.MAPID WHERE MR.RESOURCEID=?", array(&$resourceID));
    $row = $database->fetch($results);
    return ($row["ISPUBLIC"] == 1);
}

/*
function EnforceDivergance($userID){
    global $database;
    // Normally its not possible to share a resource with a user by force
        
    // Get the log for the given resource
    $resourceLogLast = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCELOG ORDER BY DATECREATED DESC LIMIT 1");
    if(!isset($resourceLogLast["result"])){
        throw new Exception("Cannot force resource sharing.");
    }

    $row = $database->fetch($resourceLogLast);
    $parts = explode(",", $row["MSG"]);

    // Make sure we have "diverge,n" for the message
    if(count($parts) != 2){
        throw new Exception("Cannot force resource sharing.");
    }

    // Check for "diverge"
    if(strcmp($parts[0], "diverge") !== 0){
        throw new Exception("Cannot force resource sharing.");
    }

    // Recover the old id
    $oldResourceID = intval($parts[1]);

    // Check for connection to old resource
    $oldResQuery = $database->PrototypeQuery("SELECT * FROM ELM_SHAREDRESOURCE WHERE USERID=? AND RESOURCEID=?", array(&$userID, &$oldResourceID));
    if(!isset($oldResQuery["result"])){
        throw new Exception("Cannot force resource sharing. User '$userID' does not share resource '$oldResourceID'");
    }

    // So we have confirmed that the user was connected to a resource that diverged. As such
    // we are able to create a new connection to this resource as it should be the same.
}
 * 
 */

?>

