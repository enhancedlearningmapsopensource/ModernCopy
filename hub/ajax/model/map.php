<?php

require_once("base.php");

/**
 * Align the map with the given ID to all standard sets.
 * @global {Database} $database
 * @param {number} $id - the id of the map to align
 */
function AlignToAllStandardSets($id){
    global $database;
    $date = date("Y-m-d H:i:s");
    $result = $database->PrototypeQuery("SELECT SETID FROM ELM_STANDARD_SET");
    while($row = $database->fetch($result)){
        $database->PrototypeInsert("INSERT INTO ELM_SETMAP(MAPID,SETID,DATECREATED,D) VALUES(?,?,?,?)", array(&$id, &$row["SETID"], &$date, &$date));
    }
}

function Delete($id){
    global $database, $userID;
    
    $editModeOn = GetUserEditMode($database, $userID);
    
    // If edit mode on and the requester is an admin then delete and move on
    if($editModeOn && (IsSuperAdmin() || IsAdmin())){
        // Continue\
        $database->PrototypeQueryQuiet("DELETE FROM ELM_MAP WHERE MAPID=?", array(&$id));
        ForceChange("map");
        return array();
    }else{
        // Get the resource to verify ownership
        $result = $database->PrototypeQuery("SELECT * FROM ELM_MAP WHERE MAPID=?", array(&$id));
        $current = $database->fetch($result);

        // Check permissions
        $creatorID = intval($current["CREATORID"]);
        if($creatorID != intval($userID) && !IsSuperAdmin()){
            PreVarDump($result);
            throw new Exception("Cannot delete another user's map. UserID: $userID, CreatorID: $creatorID, DomainID: $id" );
        }  
    }
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_MAP WHERE MAPID=?", array(&$id));
    
    ForceChange("map");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        if(IsSuperAdmin() || IsAdmin()){
            $query = "SELECT * FROM ELM_MAP";
        }else{
            $query = "SELECT * FROM ELM_MAP WHERE ISPUBLIC=1 OR CREATORID=$userID";
        }
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetAllFromSet($userSet, $userID);
    }
    $result = $database->PrototypeQuery($query);
    
    $all = array();
    //$result = $database->PrototypeQuery($query);
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["mapid"];
        $all[] = $ob;
    }
    return $all;
}

function GetAllFromSet($setid, $userID){
    if(IsSuperAdmin()){
        return "SELECT * FROM ELM_MAP AS M LEFT JOIN ELM_SETMAP AS S ON M.MAPID=S.MAPID WHERE S.SETID=$setid";
    }else{
        return "SELECT * FROM ELM_MAP AS M LEFT JOIN ELM_SETMAP AS S ON M.MAPID=S.MAPID WHERE (M.ISPUBLIC=1 OR M.CREATORID=$userID) AND S.SETID=$setid";
    }
}


function GetOne($id){
    global $database, $userID;
    
    $query = "";
    
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        if(IsSuperAdmin()){
            $query = "SELECT * FROM ELM_MAP WHERE MAPID=$id";
        }else{
            $query = "SELECT * FROM ELM_MAP WHERE (ISPUBLIC=1 OR CREATORID=$userID) AND MAPID=$id";
        }
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetOneFromSet($userSet, $id, $userID);
    }
    
    $result = $database->PrototypeQuery($query);
    echo "query: $query<br />";
    PreVarDump($result);
    
    return packageOne($result);
}

function packageOne($result){
    global $database;
    
    $row = $database->fetch($result);
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["mapid"];
    return $ob;
}

function GetOneFromSet($setid, $mapid, $userid){
    return GetAllFromSet($setid, $userid) . " AND M.MAPID=$mapid";
}

function Post($data){
    global $database, $userID;
    
    $title          = (isset($data["title"]) ? $data["title"] : "");
    $datedeleted    = ((isset($data["datedeleted"]) && $data["datedeleted"] != null) ? Unsanitize($data["datedeleted"]) : TIME_ZERO);
    $description    = (isset($data["description"]) ? $data["description"] : "");
    $date           = date("Y-m-d H:i:s");
    $ispublic       = (isset($data["ispublic"]) ? $data["ispublic"] : "0");
    $bashtimestamp  = (isset($data["bashtimestamp"]) ? $data["bashtimestamp"] : "n/a");
    $searchterm     = (isset($data["searchterm"]) ? $data["searchterm"] : "");

    
    // Get the current data
    try{
    $id = $database->PrototypeInsert("INSERT INTO ELM_MAP(
            TITLE,
            CREATORID,
            SEARCHTERM,
            DATECREATED,
            DATEDELETED,
            DESCRIPTION,
            BASHTIMESTAMP,
            ISPUBLIC,
            D) VALUES (?,?,?,?,?,?,?,?,?)", 
            array(
                &$title,        // TITLE
                &$userID,       // CREATORID
                &$searchterm,   // SEARCHTERM
                &$date,         // DATECREATED
                &$datedeleted,  // DATEDELETED
                &$description,  // DESCRIPTION
                &$bashtimestamp,// BASHTIMESTAMP
                &$ispublic,     // ISPUBLIC
                &$date          // D
                ));
    }catch(Exception $ex){
        $datedeleted = null;
        $id = $database->PrototypeInsert("INSERT INTO ELM_MAP(
            TITLE,
            CREATORID,
            SEARCHTERM,
            DATECREATED,
            DESCRIPTION,
            BASHTIMESTAMP,
            ISPUBLIC,
            D) VALUES (?,?,?,?,?,?,?,?)", 
            array(
                &$title,        // TITLE
                &$userID,       // CREATORID
                &$searchterm,   // SEARCHTERM
                &$date,         // DATECREATED
                &$description,  // DESCRIPTION
                &$bashtimestamp,// BASHTIMESTAMP
                &$ispublic,     // ISPUBLIC
                &$date          // D
                ));
    }
    
    // Align map with all standard sets by default
    AlignToAllStandardSets($id);
    
    $created = $database->PrototypeQuery("SELECT * FROM ELM_MAP WHERE MAPID=?", array($id));
    return packageOne($created);
}

function Put($data){
    global $database, $userID;
    
    $id = $data["mapid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_MAP WHERE MAPID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsSuperAdmin() && !IsAdmin() && intval($current["CREATORID"]) != intval($userID)){
        throw new Exception("Cannot modify another user's map. UserID: " . $userID . ", CreatorID: " . intval($current["CREATORID"]));
    } 
    
    // Update datedeleted if necessary
    if(isset($data["datedeleted"]) && strcmp($data["datedeleted"], "now") == 0){
        $data["datedeleted"] = date("Y-m-d H:i:s");
    }
    
    // Updatable fields
    $updatable = array(
        "CREATORID",
        "DATEDELETED",
        "DESCRIPTION",
        "TITLE",
        "ISPUBLIC",
        "BASHTIMESTAMP",
        "SEARCHTERM"
    );
        
    $updatableData = array();
    foreach($updatable as $u){
        $updatableData[strtolower($u)] = $data[strtolower($u)];
    }      
    
    // Unsanitize date deleted
    if(isset($updatableData["datedeleted"])){
        $updatableData["datedeleted"] = Unsanitize($updatableData["datedeleted"]);
    }
    
    //echo "dd: [".$updatableData["datedeleted"]."]";
    
    // Save
    $query = "";
    $updateResult = Update("ELM_MAP", $updatableData, $current, "MAPID=$id", $query);
    
    // Verify
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_MAP WHERE MAPID=$id");
    if(!isset($result["result"])){
        throw new Exception("Cannot find map.");
    }
    $row = $database->fetch($result);
            
    foreach($updatable as $term){
        if(isset($updatableData[strtolower($term)])){
            // Expected
            $expected = $updatableData[strtolower($term)];
            
            // Actual
            $actual = $row[$term];
            
            if(is_string($expected)){
                // If the expected is "" then the actual can be null
                if(strlen(trim($expected)) == 0){
                    if($actual == null){
                        continue;
                    }
                }
                
                if(!is_string($actual)){
                    echo "Failed to update term: $term.\n";
                    echo "Expected a string: [$expected] but got [$actual]";
                    echo "Current database:\n";
                    PreVarDump($current);
                    
                    echo "New data:\n";
                    PreVarDump($updatableData);
                    echo "Query used to update: $query\n";
                    throw new Exception("Failed to update.");
                }else{
                    if(strcmp($expected, $actual) != 0){
                        throw new Exception("Failed to update. Expected: [$expected], Actual: [$actual], Term: [$term]");
                    }
                }
            }else if($expected != $actual){
                throw new Exception("Failed to update. Expected: [$expected], Actual: [$actual], Term: [$term]");
            }
        }
    }
    
    return $updateResult;
}




?>

