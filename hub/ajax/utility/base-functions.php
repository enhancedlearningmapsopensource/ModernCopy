<?php

if(!defined("ELM_ROOT")){
    require_once("../../../database/ajax.php");
}

function IsSuperAdmin(){
    global $userID, $database;
    if(!defined("SUPER_ADMIN")){
        $result = $database->PrototypeQuery("SELECT G.NAME FROM ELM_USERGROUP AS UG LEFT JOIN ELM_GROUP AS G ON UG.GROUPID=G.GROUPID WHERE UG.USERID=$userID AND G.NAME LIKE 'superadmin'");
        $row = $database->fetch($result);
       // echo "group: " . $row["NAME"];
        define("SUPER_ADMIN", strcmp($row["NAME"],"superadmin") == 0);
    }
    return SUPER_ADMIN;
}

function IsAdmin(){
    global $userID, $database;
    if(!defined("ADMIN_USER")){
        $result = $database->PrototypeQuery("SELECT G.NAME FROM ELM_USERGROUP AS UG LEFT JOIN ELM_GROUP AS G ON UG.GROUPID=G.GROUPID WHERE UG.USERID=$userID AND G.NAME LIKE 'admin'");
        $row = $database->fetch($result);
       // echo "group: " . $row["NAME"];
        define("ADMIN_USER", strcmp($row["NAME"],"admin") == 0);
    }
    return ADMIN_USER;
}

/**
 * Force a registered change in the data table. This is for times such as when 
 * a row is deleted in which no date can conveniently mark the change. 
 * @global type $database - the database
 * @param {string} $table - the table to force the change to
 */
/*function ForceChange($table){
    global $database;
    
    $date = date("Y-m-d H:i:s");
    $database->PrototypeQueryQuiet("UPDATE ELM_FORCEDCHANGES SET D=? WHERE TABLENAME LIKE ?", array(&$date, &$table));
}*/

/**
 * Update the database with the given values
 * @global type $database
 * @param string $table - name of the table to update
 * @param array $values - the values to change in the table
 * @param array $current - the values currently in the table
 * @param array $where - the where conditions of the query
 * @return array - the keys and values of anything in values array that was different from the current array
 */
function Update($table, $values, $current, $where, &$query = null){
    global $database;
    
    // Set the date
    $values["d"] = date("Y-m-d H:i:s");
    
    //PreVarDump($values, "Values");
    
    // Detect differences
    $different = array();
    $changeArr = array();
    foreach($values as $k => $v){
        $dbKey = strtoupper(trim($k));
        if(!array_key_exists($dbKey, $current)){
            continue;
        }
        
        $dbVal = "".$current[$dbKey];
        $nwVal = "".trim($v);
        if(strcmp($nwVal, $dbVal) != 0){
            //echo "DIFFERENT: $k\n";
            $different[$k] = $v;
            $changeArr[] = "$dbKey='$nwVal'";
        }/*else{
            echo "NOT DIFFERENT: $k\n";
        }*/
    }
    
    // Create query from differences
    $query = "UPDATE $table SET " . implode(",", $changeArr) . " WHERE $where";
    try{
        $database->PrototypeQueryQuiet($query);
    }catch(Exception $ex){
        echo "query: $query";
        throw $ex;
    }
    return $different;
}

function GetUserSet($database, $userID){
    // Get the preference
    $prefResult = $database->PrototypeQuery("SELECT * FROM ELM_PREFERENCE WHERE PROGRAM_CODE LIKE 'SSET'");
    $preference = $database->fetch($prefResult);
    
    // Get the user preference
    $userPrefResult = $database->PrototypeQuery("SELECT * FROM ELM_USERPREFERENCE WHERE PREFERENCEID=? AND USERID=?", array(&$preference["PREFERENCEID"], &$userID));
    if(!isset($userPrefResult["result"])){
        $ord = ord($preference["DEFAULTVALUE"]) - ord("a");
    }else{
        $userPref = $database->fetch($userPrefResult);
        $ord = ord($userPref["VAL"]) - ord("a");
    }
    
    $choices = explode(",",$preference["CHOICES"]);
    $choice = trim($choices[$ord]);
    
    // Find the set
    $setResult = $database->PrototypeQuery("SELECT * FROM ELM_STANDARD_SET WHERE NAME LIKE ?", array(&$choice));
    $set = $database->fetch($setResult);
    
    return $set["SETID"];
}

function GetUserEditMode($database, $userID){
    // Get the preference
    $prefResult = $database->PrototypeQuery("SELECT * FROM ELM_PREFERENCE WHERE PROGRAM_CODE LIKE 'EDIT_ON'");
    $preference = $database->fetch($prefResult);
    
    // Get the user preference
    $userPrefResult = $database->PrototypeQuery("SELECT * FROM ELM_USERPREFERENCE WHERE PREFERENCEID=? AND USERID=?", array(&$preference["PREFERENCEID"], &$userID));
    $userPref = $database->fetch($userPrefResult);
    
    if(!isset($userPref)){
        return false;
    }else{
        return ($userPref["VAL"] == "t");
    }
}

?>

