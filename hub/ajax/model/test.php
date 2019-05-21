<?php

require_once("base.php");

function Delete($id){
    throw new Exception("Cannot delete a test using hub.");
}

function GetAll(){
    global $database, $userID;

    $all = array();
    $result = $database->PrototypeQuery(
        "SELECT 
            ID AS TESTID,
            TEST_TITLE AS NAME,
            STUDENT_TITLE AS TITLE,
            VERSION,
            SUBJECT_NODE_PREFIX AS PREFIX,
            LAST_MODIFIED AS D
        FROM 
            ELM_TESTS 
        WHERE 
            ISACTIVE = 1"
    );


    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["testid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    $result = $database->PrototypeQuery(
        "SELECT 
            ID AS TESTID,
            TEST_TITLE AS NAME,
            STUDENT_TITLE AS TITLE,
            VERSION,
            SUBJECT_NODE_PREFIX AS PREFIX,
            LAST_MODIFIED AS D
        FROM 
            ELM_TESTS 
        WHERE 
            ISACTIVE = 1 AND ID=?"
    , array(&$id));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["testid"];
    return $ob;
}

function Post($data){
    throw new Exception("Cannot add a test using hub.");
}

function Put($data){
    throw new Exception("Cannot update a test using hub.");
}

?>