<?php

require_once("base.php");

function Delete($id){
    global $database;
    
    // Get the resource to verify ownership
    $result = $database->PrototypeQuery("SELECT * FROM ELM_SIMPLESTANDARD WHERE SID=?", array(&$id));
    
    // Check permissions
    if(!IsSuperAdmin() && !IsAdmin()){
        PreVarDump($result);
        throw new Exception("Cannot delete standards." );
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_SIMPLESTANDARD WHERE SID=?", array(&$id));
    
    ForceChange("simplestandard");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_SIMPLESTANDARD";
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
        $ob["id"] = $ob["sid"];
        $all[] = $ob;
    }
    return $all;
}

function GetAllFromSet($setid){
    return "SELECT * FROM ELM_SIMPLESTANDARD AS M LEFT JOIN ELM_SETSTANDARD AS S ON M.SID=S.SID WHERE S.SETID=$setid";
}

function GetOne($id){
    global $database, $userID;
    $userSet = GetUserSet($database, $userID);
    
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_SIMPLESTANDARD WHERE SID=$id";
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetOneFromSet($userSet, $id);
    }
    $result = $database->PrototypeQuery($query);
    
    /*$result = $database->PrototypeQuery("SELECT * FROM ELM_SIMPLESTANDARD WHERE SID=?", array(&$id));
    if(!isset($result["result"])){
        PreVarDump($result);
        throw new Exception("Could not get row. SID: $id");
    }*/
    
    $row = $database->fetch($result);
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["sid"];
    return $ob;
}

function GetOneFromSet($setid, $id){
    return GetAllFromSet($setid) . " AND M.SID=$id";
}

function Post($data){
    global $database, $userID;
    
    // Check permissions
    if(!IsSuperAdmin() && !IsAdmin()){
        throw new Exception("Cannot add standards." );
    }  
    
    $description    = (isset($data["description"]) ? $data["description"] : "");
    $textid         = (isset($data["textid"]) ? $data["textid"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_SIMPLESTANDARD(DESCRIPTION,TEXTID,DATECREATED,D) VALUES (?,?,?,?)", 
            array(
                &$description,  // DESCRIPTION
                &$textid,       // TEXTID
                &$date,         // DATECREATED
                &$date,         // D
                ));
    
    return GetOne($id);
}

function Put($data){
    global $database, $userID;
    
    $id = $data["sid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_SIMPLESTANDARD WHERE SID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsSuperAdmin() && !IsAdmin()){
        throw new Exception("Cannot modify standard");
    } 
        
    // Updatable fields
    $updatable = array(
        "DESCRIPTION",
        "TEXTID"
    );
        
    $updatableData = array();
    foreach($updatable as $u){
        $updatableData[strtolower($u)] = $data[strtolower($u)];
    }
    
    // Save
    $query = "";
    $updateResult = Update("ELM_SIMPLESTANDARD", $updatableData, $current, "SID=$id", $query);
    
    // Verify
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_SIMPLESTANDARD WHERE SID=$id");
    if(!isset($result["result"])){
        throw new Exception("Cannot find standard.");
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