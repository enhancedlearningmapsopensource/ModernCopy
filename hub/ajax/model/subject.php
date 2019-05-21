<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    
    // Get the resource to verify ownership
    $result = $database->PrototypeQuery("SELECT * FROM ELM_SUBJECT WHERE SUBJECT_ID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    $creatorID = intval($current["CREATORID"]);
    if($creatorID != intval($userID) && !IsSuperAdmin()){
        PreVarDump($result);
        throw new Exception("Cannot delete another user's subject. UserID: $userID, CreatorID: $creatorID, SubjectID: $id" );
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_SUBJECT WHERE SUBJECT_ID=?", array(&$id));
    
    ForceChange("subject");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    // Get subjects that are avaliable to this user
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_SUBJECT";
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
        $ob["id"] = $ob["subject_id"];
        $ob["subjectid"] = $ob["subject_id"];
        $all[] = $ob;
    }
    return $all;
}
function GetAllFromSet($setid){
    return "SELECT * FROM ELM_SUBJECT WHERE SETID=$setid";
}

function GetOne($id){
    global $database, $userID;
    
    // Get subjects that are avaliable to this user
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT * FROM ELM_SUBJECT WHERE SUBJECT_ID=$id";
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetOneFromSet($userSet);
    }
    $result = $database->PrototypeQuery($query);
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["subject_id"];
    $ob["subjectid"] = $ob["subject_id"];
    return $ob;
}
function GetOneFromSet($setid, $id){
    return GetAllFromSet($setid) . " AND SUBJECT_ID=$id";
}


function Post($data){
    global $database, $userID;
    
    $name           = (isset($data["name"]) ? $data["name"] : "");
    $setid          = (isset($data["setid"]) ? $data["setid"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_SUBJECT(CREATORID,NAME,DATECREATED,D,SETID) VALUES (?,?,?,?,?)", 
            array(
                &$userID,       // CREATORID
                &$name,         // NAME
                &$date,         // DATECREATED
                &$date,         // D
                &$setid         // SETID
                ));
    
    return GetOne($id);
}


function Put($data){
    global $database, $userID;
    
    $id = $data["subject_id"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_SUBJECT WHERE SUBJECT_ID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsSuperAdmin() && !IsAdmin()){
        throw new Exception("Cannot modify another user's standard. UserID: " . $userID . ", CreatorID: " . intval($current["CREATORID"]));
    } 
        
    // Updatable fields
    $updatable = array(
        "NAME",
        "SETID"
    );
        
    $updatableData = array();
    foreach($updatable as $u){
        $updatableData[strtolower($u)] = $data[strtolower($u)];
    }
    
    // Save
    $query = "";
    Update("ELM_SUBJECT", $updatableData, $current, "SUBJECT_ID=$id", $query);
}

?>