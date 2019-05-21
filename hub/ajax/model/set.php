<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    
    // Get the resource to verify ownership
    $result = $database->PrototypeQuery("SELECT * FROM ELM_STANDARD_SET WHERE SETID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    $creatorID = intval($current["CREATORID"]);
    if($creatorID != intval($userID) && !IsSuperAdmin()){
        PreVarDump($result);
        throw new Exception("Cannot delete another user's standard set. UserID: $userID, CreatorID: $creatorID, SetID: $id" );
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_STANDARD_SET WHERE SETID=?", array(&$id));
    
    ForceChange("set");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $result = $database->PrototypeQuery("SELECT * FROM ELM_STANDARD_SET");
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["setid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_STANDARD_SET WHERE SETID=?", array(&$id));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["setid"];
    return $ob;
}

function Post($data){
    global $database, $userID;
    
    $name           = (isset($data["name"]) ? $data["name"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_STANDARD_SET(CREATORID,NAME,DATECREATED,D) VALUES (?,?,?,?)", 
            array(
                &$userID,       // CREATORID
                &$name,         // NAME
                &$date,         // DATECREATED
                &$date,         // D
                ));
    
    return GetOne($id);
}

function Put($data){
    global $database, $userID;
    
    $id = $data["setid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_STANDARD_SET WHERE SETID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsSuperAdmin() && !IsAdmin()){
        throw new Exception("Cannot modify another user's standard. UserID: " . $userID . ", CreatorID: " . intval($current["CREATORID"]));
    } 
        
    // Updatable fields
    $updatable = array(
        "NAME"
    );
        
    $updatableData = array();
    foreach($updatable as $u){
        $updatableData[strtolower($u)] = $data[strtolower($u)];
    }
    
    // Save
    $query = "";
    $updateResult = Update("ELM_STANDARD_SET", $updatableData, $current, "SETID=$id", $query);
    
    // Verify
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_STANDARD_SET WHERE SETID=$id");
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