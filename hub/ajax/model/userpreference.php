<?php

require_once("base.php");

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $result = $database->PrototypeQuery("SELECT * FROM ELM_USERPREFERENCE WHERE USERID=$userID");
    while($row = $database->fetch($result)){
        $ob = array();
        
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["preferenceid"] . "-" . $ob["userid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    
    // Recover the id
    $split = explode("-", $id);
    if(count($split) > 2){
        throw new Exception("Could not recover ids. Should only be one '-' in the id.");
    }
    $preferenceID = intval($split[0]);
    $userID = intval($split[1]);
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_USERPREFERENCE WHERE USERID=$userID AND PREFERENCEID=$preferenceID");
    $row = $database->fetch($result);
    $ob = array();

    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["preferenceid"] . "-" . $ob["userid"];
    $all[] = $ob;
    return $ob;
}

function Post($data){
    global $database, $userID;
    
    $date = date("Y-m-d H:i:s");
    
    $database->PrototypeInsert("INSERT INTO ELM_USERPREFERENCE(USERID,PREFERENCEID,DATESET,VAL,D) VALUES (?,?,?,?,?)", array(
        &$data["userid"],
        &$data["preferenceid"],
        &$date,
        &$data["val"],
        &$date
    ));
    return GetOne($data["preferenceid"] . "-" . $data["userid"]);
}

function Put($data){
    global $database, $userID;
    
    $user = (isset($data["userid"])) ? $data["userid"] : $userID;
    if($userID != $user){
        throw new Exception("Cannot update another user's preference settings.");
    }
    
    $date = date("Y-m-d H:i:s");
    
    // Get the current data
    $database->PrototypeQueryQuiet("UPDATE ELM_USERPREFERENCE SET VAL=?, D=? WHERE PREFERENCEID=? AND USERID=?", array(
        &$data["val"],
        &$date,
        &$data["preferenceid"],
        &$data["userid"]
    ));
    return GetOne($data["preferenceid"] . "-" . $data["userid"]);
}

?>

