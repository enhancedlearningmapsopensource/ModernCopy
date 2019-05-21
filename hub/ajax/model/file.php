<?php

require_once("base.php");

function Delete($id){
    global $database, $userID;
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_FILE WHERE FILEID=?", array(&$id));
    $current = $database->fetch($result);
    
    // Check permissions
    $creatorID = intval($current["USERID"]);
    if($creatorID != intval($userID) && !IsSuperAdmin()){
        PreVarDump($result);
        throw new Exception("Cannot delete another user's file. UserID: $userID, CreatorID: $creatorID, FileID: $id" );
    }  
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_FILE WHERE FILEID=?", array(&$id));
    
    ForceChange("file");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $result = $database->PrototypeQuery("SELECT * FROM ELM_FILE");
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["fileid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_FILE WHERE FILEID=?", array(&$id));
    
    $row = $database->fetch($result);
    if(intval($row["USERID"]) != intval($userID)){
        throw new Exception("Cannot directly request other user's files");
    }
    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["fileid"];
    return $ob;
}

?>