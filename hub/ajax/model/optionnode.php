<?php

/** Represents a link between a student and an assigned test. */
define("OBJECT_TYPE", "an option node");
require_once("../utility/test-node-table-builder.php");
require_once("base.php");



function Delete($id){
    throw new Exception("Cannot delete ".OBJECT_TYPE." using hub.");
}

function GetAll(){
    global $database, $userID;

    $testnodeTable = array();
    //addTestNode($testnodeTable, "testid", 1, "2018-10-2 02:12:12");

    //PreVarDump($testnodeTable);
    //throw new Exception();

    $all = array();
    $result = $database->PrototypeQuery(
        "SELECT DISTINCT
            O.ID AS OPTIONID, 
            O.NODES,
            O.ANTI_NODES AS ANTINODES, 
            T.SUBJECT_NODE_PREFIX AS PREFIX,
            O.LAST_MODIFIED AS D
        FROM 
            ELM_OPTIONS AS O
        LEFT JOIN ELM_QUESTIONS AS Q ON O.QUESTION_ID=Q.ID
        LEFT JOIN ELM_TESTS AS T ON Q.TEST_ID = T.ID
        WHERE 
            T.ISACTIVE = 1
        ORDER BY O.ID ASC;"
    );

    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }

        if($ob["nodes"] != null){
            $nodes = explode(",", $ob["nodes"]);
            foreach($nodes as $n){
                $testNodeID = addTestNode($testnodeTable, cleanTextID($n, $ob["prefix"]), 0, $ob["d"]);

                $all[] = array(
                    "id" => $ob["optionid"] . "-" . $testNodeID,
                    "optionid" => $ob["optionid"],
                    "testnodeid" => intval($testNodeID)

                    /*"optionid" => $ob["optionid"],
                    "nodetextidnumber" => cleanTextID($n, $ob["prefix"]),
                    "isantinode" => 0,
                    "d" => $ob["d"]*/
                );
            }
        }

        if($ob["antinodes"] != null){
            $nodes = explode(",", $ob["antinodes"]);
            foreach($nodes as $n){
                $testNodeID = addTestNode($testnodeTable, cleanTextID($n, $ob["prefix"]), 1, $ob["d"]);

                $all[] = array(
                    "id" => $ob["optionid"] . "-" . $testNodeID,
                    "optionid" => $ob["optionid"],
                    "testnodeid" => intval($testNodeID)
                    

                    /*"id" => $ob["optionid"] . "-" . $n,
                    "optionid" => $ob["optionid"],
                    "nodetextidnumber" => cleanTextID($n, $ob["prefix"]),
                    "isantinode" => 1,
                    "d" => $ob["d"]*/
                );
            }
        }      

        
        
    }
    //PreVarDump($all);
    return $all;
}

function GetOne($id){
    global $database, $userID;
    throw new Exception("Cannot recover a single object. This is because the node/antinode is stored as a string in the database.");
}

function Post($data){
    throw new Exception("Cannot add ".OBJECT_TYPE." using hub.");
}

function Put($data){
    throw new Exception("Cannot update ".OBJECT_TYPE." using hub.");
}

function cleanTextID($raw, $prefix){
    if(is_numeric($raw)){
        return $prefix . "-" . trim($raw);
    }else{
        return trim($raw);
    }
    /*if($.isNumeric(uncleanid)){
        return prefix + "-" + uncleanid.trim();
    }else{
        return uncleanid.trim();
    }*/
}

?>