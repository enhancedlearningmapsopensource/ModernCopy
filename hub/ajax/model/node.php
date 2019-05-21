<?php

require_once("base.php");

function Delete($id){
    global $database;
    
    if(!IsSuperAdmin() && !IsAdmin()){
        throw new Exception("Cannot destroy nodes. Not super admin.");
    }
    
    $data = GetOne($id);
    
    // Delete
    $database->PrototypeQueryQuiet("DELETE FROM ELM_NODE WHERE NODEID=?", array(&$id));
    
    ForceChange("node");
    return $data;
}

function GetAll(){
    global $database, $userID;
    
    $all = array();
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        if(!IsSuperAdmin() && !IsAdmin()){
            $query = "SELECT NODEID,TAGS,TEXTID,TITLE,SHORTTITLE,SUMMARY,CREATORID,DATECREATED,D FROM ELM_NODE WHERE (TEXTID LIKE 'M%' OR TEXTID LIKE 'ELA%' OR TEXTID LIKE 'F-%' OR TEXTID LIKE 'F&%')";
        }else{
            $query = "SELECT NODEID,TAGS,TEXTID,TITLE,SHORTTITLE,SUMMARY,CREATORID,DATECREATED,D FROM ELM_NODE";
        }
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetAllFromSet($userSet);
    }
    
    try{
        $result = $database->PrototypeQuery($query);
    } catch (Exception $ex) {
        echo "Query failed: $query";
        throw $ex;
    }
    
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["nodeid"];
        $all[] = $ob;
    }
    return $all;
}
function GetAllFromSet($setid){
    // If super admin then get all the nodes otherwise get the nodes without the SCI/FS nodes
    if(!IsSuperAdmin() && !IsAdmin()){
        return "SELECT M.NODEID,M.TAGS,M.TEXTID,M.TITLE,M.SHORTTITLE,M.SUMMARY,M.CREATORID,M.DATECREATED,M.D FROM ELM_NODE AS M LEFT JOIN ELM_SETNODE AS S ON M.NODEID=S.NODEID WHERE S.SETID=$setid AND (TEXTID LIKE 'M%' OR TEXTID LIKE 'ELA%' OR TEXTID LIKE 'F-%' OR TEXTID LIKE 'F&%')"; 
    }else{
        return "SELECT M.NODEID,M.TAGS,M.TEXTID,M.TITLE,M.SHORTTITLE,M.SUMMARY,M.CREATORID,M.DATECREATED,M.D FROM ELM_NODE AS M LEFT JOIN ELM_SETNODE AS S ON M.NODEID=S.NODEID WHERE S.SETID=$setid"; 
    }
}

function GetOne($id){
    global $database, $userID;
    
    
    $editModeOn = GetUserEditMode($database, $userID);
    if($editModeOn){
        $query = "SELECT NODEID,TAGS,TEXTID,TITLE,SHORTTITLE,SUMMARY,CREATORID,DATECREATED,D FROM ELM_NODE WHERE NODEID=$id";
    }else{
        $userSet = GetUserSet($database, $userID);
        $query = GetOneFromSet($userSet, $id);
    }
    $result = $database->PrototypeQuery($query);
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["nodeid"];
    return $ob;
}
function GetOneFromSet($setid, $id){
    return GetAllFromSet($setid) . " AND M.NODEID=$id";
}

function Put($data){
    global $database, $userID;
    
    //PreVarDump($data);
    $id = $data["nodeid"];
    
    // Get the current data
    $result = $database->PrototypeQuery("SELECT * FROM ELM_NODE WHERE NODEID=?", array(&$data["nodeid"]));
    $current = $database->fetch($result);
    
    // Check permissions
    if(!IsAdmin()){
        throw new Exception("Cannot modify nodes.");
    }
    
    $data["datecreated"] = Unsanitize($data["datecreated"]);
    $data["type"] = 1;
    
    // Save
    return Update("ELM_NODE", $data, $current, "NODEID=$id");
}

function Post($data){
    global $database, $userID;
    
    $tags           = (isset($data["tags"]) ? $data["tags"] : "");
    $textid         = (isset($data["textid"]) ? $data["textid"] : "");
    $title          = (isset($data["title"]) ? $data["title"] : "");
    $shorttitle     = (isset($data["shorttitle"]) ? $data["shorttitle"] : "");
    $summary        = (isset($data["summary"]) ? $data["summary"] : "");
    $creatorid      = (isset($data["creatorid"]) ? intval($data["creatorid"]) : $userID);
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_NODE(TAGS,TEXTID,TITLE,SHORTTITLE,SUMMARY,CREATORID,DATECREATED,D) VALUES (?,?,?,?,?,?,?,?)", 
            array(
                &$tags,         // TAGS
                &$textid,       // TEXTID
                &$title,        // TITLE
                &$shorttitle,   // SHORTTITLE
                &$summary,      // SUMMARY
                &$creatorid,    // CREATORID
                &$date,         // DATECREATED
                &$date          // D
                ));
    
    return GetOne($id);
}

?>

