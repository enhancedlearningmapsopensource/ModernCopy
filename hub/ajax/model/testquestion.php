<?php

require_once("base.php");



function Delete($id){
    throw new Exception("Cannot delete a test question using hub.");
}

function GetAll(){
    global $database, $userID;

    $all = array();
    $result = $database->PrototypeQuery(
        "SELECT 
            Q.ID AS QUESTIONID,
            QUESTION_TYPE AS QUESTIONTYPE,
            TEST_ID AS TESTID,
            QUESTION_ORDER AS ORD,
            PART_ORDER AS PARTORD,
            PARENT_QUESTION_ID AS PARENTQUESTIONID,
            Q.LAST_MODIFIED AS D
        FROM 
            ELM_QUESTIONS AS Q
        LEFT JOIN ELM_TESTS AS T ON Q.TEST_ID=T.ID
        WHERE
            T.ISACTIVE = 1"
    );


    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["questionid"];
        $all[] = $ob;
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    $result = $database->PrototypeQuery(
        "SELECT 
            Q.ID AS QUESTIONID,
            QUESTION_TYPE AS QUESTIONTYPE,
            TEST_ID AS TESTID,
            QUESTION_ORDER AS ORD,
            PART_ORDER AS PARTORD,
            PARENT_QUESTION_ID AS PARENTQUESTIONID,
            Q.LAST_MODIFIED AS D
        FROM 
            ELM_QUESTIONS AS Q
        LEFT JOIN ELM_TESTS AS T ON Q.TEST_ID=T.ID
        WHERE
            T.ISACTIVE = 1 AND ID=?"
    , array(&$id));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["questionid"];
    return $ob;
}

function Post($data){
    throw new Exception("Cannot add a test question using hub.");
}

function Put($data){
    throw new Exception("Cannot update a test question using hub.");
}

?>