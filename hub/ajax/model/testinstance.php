<?php

/** Represents an instance of a test as assigned by a teacher to their students. */
define("OBJECT_TYPE", "a test instance");
require_once("base.php");



function Delete($id){
    throw new Exception("Cannot delete ".OBJECT_TYPE." using hub.");
}

function GetAll(){
    global $database, $userID;

    $all = array();
    $result = $database->PrototypeQuery(
        "SELECT DISTINCT
            CONCAT(TESTINSTANCE.LOCATER_PASSWORD_ID,TEST.VERSION) AS INSTANCEID,
            TEST.ID AS TESTID,
            TESTINSTANCE.CREATED_USER AS CREATORID,
            TESTINSTANCE.CREATED_DATE AS DATECREATED,
            TEST.VERSION AS VERSION,
            TESTINSTANCE.LOCATER_PASSWORD_ID AS SUBID
        FROM 
            ELM_TESTS AS TEST
            LEFT JOIN STUDENT_TESTS AS TESTINSTANCE ON TEST.ACTIVE_TEST_ID=TESTINSTANCE.ACTIVE_TEST_ID 
        WHERE TEST.ISACTIVE=1;"
    );


    //PreVarDump($result);
    //return;


    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["instanceid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    $result = $database->PrototypeQuery(
        "SELECT DISTINCT
            CONCAT(TESTINSTANCE.LOCATER_PASSWORD_ID,TEST.VERSION) AS INSTANCEID,
            TEST.ID AS TESTID,
            TESTINSTANCE.CREATED_USER AS CREATORID,
            TESTINSTANCE.CREATED_DATE AS DATECREATED,
            TEST.VERSION AS VERSION,
            TESTINSTANCE.LOCATER_PASSWORD_ID AS SUBID
        FROM 
            ELM_TESTS AS TEST
            LEFT JOIN STUDENT_TESTS AS TESTINSTANCE ON TEST.ACTIVE_TEST_ID=TESTINSTANCE.ACTIVE_TEST_ID 
        WHERE TEST.ISACTIVE=1 AND ID=?"
    , array(&$id));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["instanceid"];
    return $ob;
}

function Post($data){
    throw new Exception("Cannot add ".OBJECT_TYPE." using hub.");
}

function Put($data){
    throw new Exception("Cannot update ".OBJECT_TYPE." using hub.");
}

?>