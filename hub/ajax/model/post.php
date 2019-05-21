<?php

require_once("../utility/discussion-permissions.php");
require_once("base.php");

function GetAll(){
    global $database, $userID;
    
    return getPermittedPosts();
}

function GetOne($id){
    global $database, $userID;
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_DISCUSSION_POST WHERE POSTID=? AND (DATEDELETED LIKE '".TIME_ZERO."' OR DATEDELETED LIKE '0000-00-00 00:00:00' OR DATEDELETED IS NULL)", array(&$id));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["postid"];
    return $ob;
}

function Post($data){
    global $database, $userID;
    
    $did            = (isset($data["did"]) ? $data["did"] : "");
    $date           = date("Y-m-d H:i:s");
    $creatorid      = $userID;
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_DISCUSSION_POST(DID,D,CREATORID,DATECREATED,DATEDELETED) VALUES (?,?,?,?,NULL)", 
            array(
                &$did,          // DID
                &$date,         // D
                &$creatorid,    // CREATORID
                &$date          // DATECREATED
                ));
    
    return GetOne($id);
}

function Put($data){
    global $database, $userID;
    
    $id = $data["postid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_DISCUSSION_POST WHERE POSTID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsSuperAdmin() && intval($current["CREATORID"]) != intval($userID)){
        throw new Exception("Cannot modify another user's map.");
    } 
    
    // Update datedeleted if necessary
    if(isset($data["datedeleted"]) && strcmp($data["datedeleted"], "now") == 0){
        $data["datedeleted"] = date("Y-m-d H:i:s");
    }
    
    // Updatable fields
    $updatable = array(
        "CREATORID",
        "DATEDELETED"
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
    $updateResult = Update("ELM_DISCUSSION_POST", $updatableData, $current, "POSTID=$id", $query);
    return $updateResult;
}

?>