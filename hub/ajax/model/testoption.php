<?php

/** Represents a link between a student and an assigned test. */
define("OBJECT_TYPE", "a test option");
require_once("base.php");



function Delete($id){
    throw new Exception("Cannot delete ".OBJECT_TYPE." using hub.");
}

function GetAll(){
    global $database, $userID;

    $all = array();
    $result = $database->PrototypeQuery(
        "SELECT DISTINCT
            O.ID AS OPTIONID, 
            O.ISVALID AS ISCORRECT,
            O.NODES,
            O.ANTI_NODES AS ANTINODES, 
            O.QUESTION_ID AS QUESTIONID, 
            O.OPTION_ORDER AS ORD,
            O.LAST_MODIFIED AS D
        FROM 
            ELM_OPTIONS AS O
        LEFT JOIN ELM_QUESTIONS AS Q ON O.QUESTION_ID=Q.ID
        LEFT JOIN ELM_TESTS AS T ON Q.TEST_ID=T.ID
        WHERE 
            T.ISACTIVE = 1"
    );

    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["optionid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    throw new Exception("Not implemented.");
    global $database, $userID;

    // Recover the id
    $split = explode("-", $id);
    if(count($split) > 2){
        throw new Exception("Could not recover ids. Should only be one '-' in the id.");
    }
    $studentID = intval($split[0]);
    $instanceID = intval($split[1]);

    $result = $database->PrototypeQuery(
        "SELECT DISTINCT
            ID AS OPTIONID, 
            ISVALID AS ISCORRECT,
            QUESTION_ID AS QUESTIONID, 
            OPTION_ORDER AS ORD,
            LAST_MODIFIED AS D
        FROM 
            ELM_OPTIONS
        WHERE
            ID=?"
    , array(&$instanceID, &$studentID));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["optionid"];
    return $ob;
}

function Post($data){
    throw new Exception("Cannot add ".OBJECT_TYPE." using hub.");
}

function Put($data){
    throw new Exception("Cannot update ".OBJECT_TYPE." using hub.");
}

?>