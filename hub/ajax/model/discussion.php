<?php

require_once("../utility/discussion-permissions.php");
require_once("base.php");

function GetAll(){
    return getPermittedDiscussions();
}

function GetOne($id){
    global $database, $userID;
    $discussions = getPermittedDiscussions($id);
    if(count($discussions) > 1){
        throw new Exception("Too many matches");
    }
    if(count($discussions) == 0){
        $result = $database->PrototypeQuery("SELECT * FROM ELM_DISCUSSION WHERE DID=?", array($id));
        $discussion = $database->fetch($result);
        
        if($discussion["OBTYPE"] == "resource"){
            echo "Is resource discussion";
            if($discussion["DATEDELETED"] == null || $discussion["DATEDELETED"] == TIME_ZERO || $discussion["DATEDELETED"] == "0000-00-00 00:00:00"){
                echo "Disussion not deleted";
            }else{
                throw new Exception("Disussion was deleted");
            }
            PreVarDump($discussion);
        }else{
            throw new Exception("Unknown type: " . $discussion["OBID"]);
        }
        
        
        
        throw new Exception("No matches");
    }
    return $discussions[0];
}

function Post($data){
    global $database, $userID;
    
    $obid           = (isset($data["obid"]) ? $data["obid"] : "");
    $obtype         = (isset($data["obtype"]) ? $data["obtype"] : "");
    $date           = date("Y-m-d H:i:s");
    $creatorid      = $userID;
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_DISCUSSION(OBID,OBTYPE,DATECREATED,CREATORID,D) VALUES (?,?,?,?,?)", 
            array(
                &$obid,         // OBID
                &$obtype,       // OBTYPE
                &$date,         // DATECREATED
                &$creatorid,    // CREATORID
                &$date,         // D
                ));
    
    return GetOne($id);
}

?>