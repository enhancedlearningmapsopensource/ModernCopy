<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    
    if($userID == $id && IsSuperAdmin()){
        // Do not allow destruction of super admin
        return;
    }
    
    // Get the resource to verify ownership
    $result = $database->PrototypeQuery("SELECT * FROM ELM_USER WHERE USERID=?", array(&$id));
    
    // Check permissions
    if(!IsSuperAdmin()){
        PreVarDump($result);
        throw new Exception("Cannot delete user. Please use super admin account. UserID: $userID, TargetID: $id");
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_USER WHERE USERID=?", array(&$id));
    
    ForceChange("user");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    // Get all OTHER users
    $all = array();
    $result = $database->PrototypeQuery("SELECT USERID,EMAIL FROM ELM_USER WHERE USERID <> $userID");
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["userid"];
        $all[] = $ob;
    }
    
    // Get the current user
    $result = $database->PrototypeQuery("SELECT * FROM ELM_USER WHERE USERID = $userID");
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["userid"];
        $all[] = $ob;
    }
    
    return $all;
}

function GetOne($id){
    global $database, $userID;
    
    if(!IsSuperAdmin() && $userID != $id){
        throw new Exception("cannot get user data for another user.");
    }
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_USER WHERE USERID=?", array(&$id));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["userid"];
    return $ob;
}

function Post($data){
    global $database;
    
    $email          = (isset($data["email"]) ? $data["email"] : "");
    $date           = date("Y-m-d H:i:s");

    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_USER(
            EMAIL,
            D) VALUES (?,?)", 
            array(
                &$email,       // CREATORID
                &$date          // D
                ));
    
    return GetOne($id);
}

function Put($data){
    global $database, $userID;
    
    $id = $data["userid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_USER WHERE USERID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsSuperAdmin() && intval($current["USERID"]) != intval($userID)){
        throw new Exception("Cannot modify another user.");
    } 
    
    // Update datedeleted if necessary
    if(isset($data["dashboard_date"]) && strcmp($data["dashboard_date"], "now") == 0){
        $data["dashboard_date"] = date("Y-m-d H:i:s");
    }
    
    // Updatable fields
    $updatable = array(
        "DASHBOARD_DATE"
    );
        
    $updatableData = array();
    foreach($updatable as $u){
        $updatableData[strtolower($u)] = $data[strtolower($u)];
    }      
    
    // Unsanitize date deleted
    if(isset($updatableData["dashboard_date"])){
        $updatableData["dashboard_date"] = Unsanitize($updatableData["dashboard_date"]);
    }
    
    //echo "dd: [".$updatableData["datedeleted"]."]";
    
    // Save
    $query = "";
    $updateResult = Update("ELM_USER", $updatableData, $current, "USERID=$id", $query);
    return $updateResult;
}


?>

