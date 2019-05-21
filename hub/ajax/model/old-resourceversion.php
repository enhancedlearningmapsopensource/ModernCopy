<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    
    // Get the resource to verify ownership
    $result = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    $creatorID = intval($current["CREATORID"]);
    if($creatorID != intval($userID)){
        throw new Exception("Cannot delete another user's resource. UserID: $userID, CreatorID: $creatorID, ResID: $id" );
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$id));
    
    ForceChange("resource");
    return $data;
}

/**
 * Get all resources
 * @global Object $database - database
 * @global number $userID - the current user's id
 * @return array
 */
function GetAll(){
    global $database, $userID;
    
    $all = array();
    
    // Get resources that are 
    // a) public
    // b) owned by the current user
    // c) attached to a public map
    $query = "SELECT R.RESOURCEID "
            . "FROM ELM_RESOURCE AS R "
            . "LEFT JOIN ELM_MAPRESOURCE AS MR ON R.RESOURCEID=MR.RESOURCEID "
            . "LEFT JOIN ELM_MAP AS M ON M.MAPID=MR.MAPID "
            . "WHERE "
            /*c*/ . "M.ISPUBLIC=1 OR "
            /*a*/ . "R.ISPUBLIC=1 OR "
            /*b*/ . "R.CREATORID=$userID";
    
    // Get all versions associated with these resources
    $resourceIDs = array();
    $result = $database->PrototypeQuery($query);
    while($row = $database->fetch($result)){
        $resourceIDs[] = $row["RESOURCEID"];
    }
    
    $orStr = array_map(function($d){
        return "RESOURCEID='$d'";
    }, $resourceIDs);
    
    $versionQuery = "SELECT * FROM ELM_RESOURCEVERSION WHERE " . implode(" OR ", $orStr);
   
    $result = $database->PrototypeQuery($versionQuery);
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["resourceversionid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    
    // Make sure we own the resource for the version
    $versionResult = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCEVERSION WHERE RESOURCEVERSIONID=?", array(&$id));
    $versionRow = $database->fetch($versionResult);
    
    $resourceResult = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=? AND CREATORID=?", array(&$versionRow["RESOURCEID"], &$userID));
    if(!isset($resourceResult["result"])){
        throw new Exception("Cannot directly get version for another user's resource.");
    }
    
    $ob = array();
    foreach($versionRow as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["resourceversionid"];
    return $ob;
}

function Put($data){
    global $database, $userID;
    
    //PreVarDump($data);
    $id = $data["resourceid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$data["resourceid"]));
    $current = $database->fetch($result);
    
    // Check permissions
    if(intval($current["CREATORID"]) != intval($userID)){
        throw new Exception("Cannot modify another user's resource.");
    }    
    
    // Save
    return Update("ELM_RESOURCE", $data, $current, "RESOURCEID=$id");
}

function Post($data){
    global $database, $userID;
    
    $resourceid     = $data["resourceid"];
    $title          = (isset($data["title"]) ? $data["title"] : "");
    $url            = (isset($data["url"]) ? $data["url"] : "");
    $description    = (isset($data["description"]) ? $data["description"] : "");
    $date           = date("Y-m-d H:i:s");
    $ispublic       = (isset($data["ispublic"]) ? $data["ispublic"] : "0");
    $islink         = (isset($data["islink"]) ? $data["islink"] : "0");
    $filename       = (isset($data["filename"]) ? $data["filename"] : "0");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_RESOURCEVERSION(RESOURCEID,TITLE,URL,DESCRIPTION,DATECREATED,ISPUBLIC,FILENAME,ISLINK,D) VALUES (?,?,?,?,?,?,?,?,?)", 
            array(
                &$resourceid,   // RESOURCEID
                &$title,        // TITLE
                &$url,          // URL
                &$description,  // DESCRIPTION
                &$date,         // DATE
                &$ispublic,     // ISPUBLIC
                &$filename,     // FILENAME
                &$islink,       // ISLINK
                &$date          // D
                ));
    
    return GetOne($id);
}
?>

