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
            SR.STUDENT_ID AS STUDENTID,
            CONCAT(ST.LOCATER_PASSWORD_ID,ST.TEST_VERSION) AS INSTANCEID,
            SR.OPTION_ID AS SELECTEDOPTIONS,
            SR.RESPONSE_VALUE AS CONSTRUCTEDVALUE
        FROM 
            STUDENT_RESPONSE AS SR
            LEFT JOIN STUDENT_TESTS AS ST ON SR.STUDENT_TEST_ID = ST.ID
            LEFT JOIN ELM_OPTIONS AS O ON SR.OPTION_ID=O.ID;"
    );

    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }

        $options = explode(",", $ob["selectedoptions"]);
        unset($ob["selectedoptions"]);

        $options = array_map(function($d){
            return trim($d);
        }, $options);

        foreach($options as $opt){
            $ob["optionid"] = $opt;
            $ob["id"] = $ob["studentid"] . "-" . $ob["instanceid"] . "-" . $opt;
            $all[] = $ob;
        }        
        
    }
    return $all;
}

function GetOne($id){
    global $database, $userID;
    throw new Exception("Cannot recover a single object. This is because the optionid is stored as a string in the database.");
}

function Post($data){
    throw new Exception("Cannot add ".OBJECT_TYPE." using hub.");
}

function Put($data){
    throw new Exception("Cannot update ".OBJECT_TYPE." using hub.");
}

?>