<?php

require_once("../../../../../../ajax.php");

//PreVarDump($database->PrototypeQuery("SELECT * FROM ELM_GROUPPERMISSION LIMIT 1"));

$p = [
    "PREFERENCE" => exportPreferences($database),
    "PERMISSION" => exportPermissions($database),
    "USER"=> exportUsers($database)
];

echo json_encode($p);

function exportUsers($database){
    $query = "
    SELECT 
        U.EMAIL AS EMAIL,
        G.NAME AS GROUPNAME
    FROM
        ELM_USER AS U 
        LEFT JOIN ELM_USERGROUP AS UG ON U.USERID=UG.USERID 
        LEFT JOIN ELM_GROUP AS G ON G.GROUPID=UG.GROUPID";
    
    // Perform query
    $result = $database->PrototypeQuery($query);
    unset($query);

    $lst = [];
    while($row = $database->fetch($result)){
        $u = [];
        foreach($row as $k => $v){
            $u[$k] = $v;
        }
        $lst[] = $u;
    }
    unset($row);
    unset($result);
    
    $prefs = [];
    foreach($lst as $l){
        if(!isset($prefs[$l["EMAIL"]])){
            $prefs[$l["EMAIL"]] = $l;
            $prefs[$l["EMAIL"]]["GROUPS"] = [];
        }
        $prefs[$l["EMAIL"]]["GROUPS"][] = $l["GROUPNAME"];
    }
    return $prefs;
}

function exportPermissions($database){
    $query = "
    SELECT 
        P.NAME AS NAME,
        P.DESCRIPTION AS DESCRIPTION,
        P.PROGRAM_CODE AS PROGRAM_CODE,
        G.NAME AS GROUPNAME
    FROM
        ELM_PERMISSION AS P 
        LEFT JOIN ELM_GROUPPERMISSION AS GP ON P.PERMISSIONID=GP.PERMISSIONID  
        LEFT JOIN ELM_GROUP AS G ON G.GROUPID=GP.GROUPID";
        
    
    // Perform query
    $result = $database->PrototypeQuery($query);
    unset($query);

    $lst = [];
    while($row = $database->fetch($result)){
        $u = [];
        foreach($row as $k => $v){
            $u[$k] = $v;
        }
        $lst[] = $u;
    }
    unset($row);
    unset($result);
    
    $prefs = [];
    foreach($lst as $l){
        if(!isset($prefs[$l["PROGRAM_CODE"]])){
            $prefs[$l["PROGRAM_CODE"]] = $l;
            $prefs[$l["PROGRAM_CODE"]]["GROUPS"] = [];
        }
        $prefs[$l["PROGRAM_CODE"]]["GROUPS"][] = $l["GROUPNAME"];
    }
    return $prefs;
}

function exportPreferences($database){
    $query = "
    SELECT 
        P.NAME AS NAME,
        P.FORMTYPE AS TYPE,
        P.CHOICES AS CHOICES,
        P.DEFAULTVALUE AS DEFAULTVALUE,
        P.PROGRAM_CODE AS PROGRAM_CODE,
        G.NAME AS GROUPNAME
    FROM
        ELM_PREFERENCE AS P 
        LEFT JOIN ELM_GROUPPREFERENCE AS GP ON P.PREFERENCEID=GP.PREFERENCEID  
        LEFT JOIN ELM_GROUP AS G ON G.GROUPID=GP.GROUPID";
    
    // Perform query
    $result = $database->PrototypeQuery($query);
    unset($query);

    $lst = [];
    while($row = $database->fetch($result)){
        $u = [];
        foreach($row as $k => $v){
            $u[$k] = $v;
        }
        $lst[] = $u;
    }
    unset($row);
    unset($result);
    
    $prefs = [];
    foreach($lst as $l){
        if(!isset($prefs[$l["PROGRAM_CODE"]])){
            $prefs[$l["PROGRAM_CODE"]] = $l;
            $prefs[$l["PROGRAM_CODE"]]["GROUPS"] = [];
        }
        $prefs[$l["PROGRAM_CODE"]]["GROUPS"][] = $l["GROUPNAME"];
    }
    return $prefs;
}

function exportQuery($database, $query){
    // Perform query
    $result = $database->PrototypeQuery($query);
    unset($query);

    $lst = [];
    while($row = $database->fetch($result)){
        $u = [];
        foreach($row as $k => $v){
            $u[$k] = $v;
        }
        $lst[] = $u;
    }
    unset($row);
    unset($result);

    return $lst;
}


