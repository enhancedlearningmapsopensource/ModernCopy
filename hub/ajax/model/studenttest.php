<?php

/** Represents a link between a student and an assigned test. */
define("OBJECT_TYPE", "a student test");
require_once("base.php");



function Delete($id){
    throw new Exception("Cannot delete ".OBJECT_TYPE." using hub.");
}

function GetAll(){
    global $database, $userID;

    $all = array();
    $result = $database->PrototypeQuery(
        "SELECT DISTINCT
            TESTINSTANCE.LOCATER_PASSWORD_ID AS INSTANCEID,
            TESTINSTANCE.STUDENT_ID AS STUDENTID,
            TESTINSTANCE.ISCOMPLETE
        FROM 
            ELM_TESTS AS TEST
            LEFT JOIN STUDENT_TESTS AS TESTINSTANCE ON TEST.ACTIVE_TEST_ID=TESTINSTANCE.ACTIVE_TEST_ID
        WHERE 
            TEST.ISACTIVE=1;"
    );

    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["studentid"] . "-" . $ob["instanceid"];
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
    $studentID = intval($split[0]);
    $instanceID = intval($split[1]);

    $result = $database->PrototypeQuery(
        "SELECT DISTINCT
            TESTINSTANCE.LOCATER_PASSWORD_ID AS INSTANCEID,
            TESTINSTANCE.STUDENT_ID AS STUDENTID,
            TESTINSTANCE.ISCOMPLETE
        FROM 
            ELM_TESTS AS TEST
            LEFT JOIN STUDENT_TESTS AS TESTINSTANCE ON TEST.ACTIVE_TEST_ID=TESTINSTANCE.ACTIVE_TEST_ID
        WHERE 
            TEST.ISACTIVE=1 AND TESTINSTANCE.LOCATER_PASSWORD_ID=? AND TESTINSTANCE.STUDENT_ID=?"
    , array(&$instanceID, &$studentID));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["studentid"] . "-" . $ob["instanceid"];
    return $ob;
}

function Post($data){
    throw new Exception("Cannot add ".OBJECT_TYPE." using hub.");
}

function Put($data){
    throw new Exception("Cannot update ".OBJECT_TYPE." using hub.");
}

?>