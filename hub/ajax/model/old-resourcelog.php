<?php

require_once("base.php");

/**
 * Get all resources
 * @global Object $database - database
 * @global number $userID - the current user's id
 * @return array
 */
function GetAll(){
    global $database, $userID;
    
    $all = array();
    
    // Get resources logs for all resources that we are sharing with someone and also our own resources
    $query = "
        SELECT RL.RESOURCEID, RL.DATECREATED, RL.MSG 
        FROM ELM_RESOURCELOG AS RL
            LEFT JOIN ELM_SHAREDRESOURCE AS SR ON SR.RESOURCEID=RL.RESOURCEID
        WHERE SR.USERID=$userID 
        UNION
        SELECT RL.RESOURCEID, RL.DATECREATED, RL.MSG 
        FROM ELM_RESOURCELOG AS RL
            LEFT JOIN ELM_RESOURCE AS R ON R.RESOURCEID=RL.RESOURCEID
        WHERE R.CREATORID=$userID";
    
    $result = $database->PrototypeQuery($query);
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["resourceid"] . "-" . $ob["datecreated"];
        $all[] = $ob;
    }
    return $all;
}

function Post($data){
    global $database, $userID;
    
    // Verify that the resource belongs to the user
    $result = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCE WHERE RESOURCEID=?", array(&$data["resourceid"]));
    $current = $database->fetch($result);
    
    // Check permissions
    if(intval($current["CREATORID"]) != intval($userID)){
        throw new Exception("Cannot log changes to another user's resource.");
    }
    
    $d = date("Y-m-d H:i:s");
    
    // Check to see if there is already an entry for this resource at this time
    $result = $database->PrototypeQuery("SELECT * FROM ELM_RESOURCELOG WHERE RESOURCEID=? AND DATECREATED=?", array(&$data["resourceid"], &$d));
    if(isset($result["result"])){
        sleep(1);
        return Post($data);
    }
    
    $msg        = $data["msg"];
    $resourceID = $data["resourceid"];
    $database->PrototypeQueryQuiet("INSERT INTO ELM_RESOURCELOG(RESOURCEID,MSG,DATECREATED,D) VALUES(?,?,?,?)", array(&$resourceID, &$msg, &$d, &$d));
    $data["id"] = $data["resourceid"] . "-" . $d;
    $data["datecreated"] = $d;
    
    return $data;
}

?>