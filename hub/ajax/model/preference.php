<?php

require_once("base.php");

function GetAll(){
    global $database, $userID;
    
    $query =    "SELECT 
                    P.PREFERENCEID,
                    P.NAME,
                    P.FORMTYPE,
                    P.CHOICES,
                    P.DEFAULTVALUE,
                    P.ISDISABLED,
                    P.DATECREATED,
                    P.PROGRAM_CODE,
                    P.D
                FROM 
                    ELM_USER AS U 
                LEFT JOIN ELM_USERGROUP AS UG ON U.USERID=UG.USERID 
                LEFT JOIN ELM_GROUPPREFERENCE AS GP ON UG.GROUPID=GP.GROUPID 
                LEFT JOIN ELM_PREFERENCE AS P ON P.PREFERENCEID=GP.PREFERENCEID 
                WHERE U.USERID=?";
    
    $all = array();
    $result = $database->PrototypeQuery($query, array(&$userID));
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["preferenceid"];
        $all[] = $ob;
    }
    return $all;
}


?>

