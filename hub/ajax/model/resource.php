<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    $data = null;
    
    // Get the resource to verify ownership
    $result = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$id));
    if(isset($result["result"])){
        $current = $database->fetch($result);
    
        // Check permissions
        $creatorID = intval($current["CREATORID"]);
        if($creatorID != intval($userID) && !IsSuperAdmin()){
            PreVarDump($current);
            throw new Exception("Cannot delete another user's resource. UserID: $userID, CreatorID: $creatorID, ResID: $id" );
        }  
        $data = GetOne($id);
        
        // Delete
        $database->PrototypeQueryQuiet("DELETE FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$id));
    }
    
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
    
    if(IsSuperAdmin()){
        $query = "SELECT R.RESOURCEID,R.BASHTIMESTAMP,R.TITLE,R.URL,R.DESCRIPTION,R.CREATORID,R.DATECREATED,R.ISPUBLIC,R.FILENAME,R.ISLINK,R.D FROM ELM_RESOURCE AS R";
    }else{
    
    // Get resources that are 
    // a) public
    // b) owned by the current user
    // c) attached to a public map
    $query = "SELECT R.RESOURCEID,R.BASHTIMESTAMP,R.TITLE,R.URL,R.DESCRIPTION,R.CREATORID,R.DATECREATED,R.ISPUBLIC,R.FILENAME,R.ISLINK,R.D "
            . "FROM ELM_RESOURCE AS R "
            . "LEFT JOIN ELM_MAPRESOURCE AS MR ON R.RESOURCEID=MR.RESOURCEID "
            . "LEFT JOIN ELM_MAP AS M ON M.MAPID=MR.MAPID "
            . "WHERE "
            /*c*/ . "M.ISPUBLIC=1 OR "
            /*a*/ . "R.ISPUBLIC=1 OR "
            /*b*/ . "R.CREATORID=$userID";
    
    }
   
    $result = $database->PrototypeQuery($query);
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["resourceid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(intval($current["CREATORID"]) != intval($userID) && !IsSuperAdmin()){
        throw new Exception("Cannot aquire another user's resource.");
    }  
    
    $ob = array();
    foreach($current as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["resourceid"];
    return $ob;
}

function Put($data){
    global $database, $userID;
    
    //PreVarDump($data);
    $id = $data["resourceid"];

    // Check edit mode
    $editModeOn = GetUserEditMode($database, $userID);
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$data["resourceid"]));
    $current = $database->fetch($result);
    
    // Check permissions
    // If edit mode is on and and the user is an admin then no problem
    if(intval($current["CREATORID"]) != intval($userID) && !IsSuperAdmin()){
        if(!(IsAdmin() && $editModeOn)){
            throw new Exception("Cannot modify another user's resource.");
        }
    }   
    
    $data["datecreated"] = Unsanitize($data["datecreated"]);
    
    // Save
    return Update("ELM_RESOURCE", $data, $current, "RESOURCEID=$id");
}

function Post($data){
    global $database, $userID;
    
    $title          = (isset($data["title"]) ? $data["title"] : "");
    $url            = (isset($data["url"]) ? $data["url"] : "");
    $description    = (isset($data["description"]) ? $data["description"] : "");
    $bashtimestamp  = (isset($data["bashtimestamp"]) ? $data["bashtimestamp"] : "n/a");
    $date           = date("Y-m-d H:i:s");
    $ispublic       = (isset($data["ispublic"]) ? $data["ispublic"] : "0");
    $islink         = (isset($data["islink"]) ? $data["islink"] : "0");
    $filename       = (isset($data["filename"]) ? $data["filename"] : "0");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_RESOURCE(TITLE,URL,DESCRIPTION,BASHTIMESTAMP,CREATORID,DATECREATED,ISPUBLIC,FILENAME,ISLINK,D) VALUES (?,?,?,?,?,?,?,?,?,?)", 
            array(
                &$title,        // TITLE
                &$url,          // URL
                &$description,  // DESCRIPTION
                &$bashtimestamp, // BASHTIMESTAMP
                &$userID,       // CREATORID
                &$date,         // DATE
                &$ispublic,     // ISPUBLIC
                &$filename,     // FILENAME
                &$islink,       // ISLINK
                &$date          // D
                ));
    
    return GetOne($id);
}
?>

