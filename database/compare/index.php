<?php

require_once("../core.php");
require_once("../ajax.php");

$releaseDb = $database;

require_once(SITE_ROOT . "database/elm_config_dual.php");

// Connect to the debug database
$debugDb = DbDebug();
$debugDb->Connect();



// Get tables
function getTables($conn, $name, $ignore = array()){
    $tables = array();
    $result = $conn->query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA LIKE '$name'");
    while ($row = $result->fetch_assoc()) { 
        if(in_array($row["TABLE_NAME"], $ignore)){
            continue;
        }

        if(strcmp($row["TABLE_TYPE"], "BASE TABLE") == 0){
            array_push($tables, $row["TABLE_NAME"]);
        }
    }
    return $tables;
}


// Differences:
// In DbA but not in DbB    (Orange)
// In DbB but not in DbA    (Yellow)
// In Both                  (Teal)

// Get debug database tables
$conn = $debugDb->GetConnection();
$dbName = DbDatabaseDebug();
$debugTables = getTables($conn, $dbName);

// Get release database tables
$releaseTables = getTables($releaseDb->GetConnection(), DbDatabase());

// Merge table lists
$allTables = array_merge($debugTables, $releaseTables);
usort($allTables, function($a,$b){
    return strcmp($a,$b);
});

// Remove duplicates
$uniqueTables = array();
$uniqueTables[] = $allTables[0];
for($i = 1; $i < count($allTables); $i++){
    if($allTables[$i] != $allTables[$i-1]){
        $uniqueTables[] = $allTables[$i];
    }
}

// Create new matched set
$matchedTables = array();
foreach($uniqueTables as $t){
    $matchedTables[] = array(
        "name"=>$t,
        "debug"=>in_array($t, $debugTables),
        "release"=>in_array($t, $releaseTables)
    );
}

// Sync tables one by one
$syncParameters = array(
    "ELM_USER" => array("core"=>array("EMAIL"), "ignore"=>array("USERID", "CREATED_ON")),
    "ELM_NODE" => array("core"=>array("TEXTID"), "ignore"=>array("NODEID"))
);

/**
 * Checks to see if the content of the given row matches the given content array
 * @param type $row - the row
 * @param type $content - the array
 * @return {bool} - true if it matches, otherwise false
 */
function MatchesContent($row, $content, $coreParams, $ignoreParams){
    // Check all values in the row
    foreach($row as $k => $v){
        if(!in_array($k, $ignoreParams) && $k != "D"){
            $debug = $content[$k];
            $release = $v;
            if($debug != $release){
                echo "does not match: $k ($debug,$release)<br />";
                return false;
            }
        }
    }
    return true;
}

/**
 * 
 * @param type $debugDb - debug database
 * @param type $releaseDb - release database
 * @param type $tableName - name of table to get status for
 * @param type $unsyncable - the list of unsyncable tables
 * @param type $toChange - things that need to change (database, table, core attr, core attr value)
 */
function CheckTableStatus($debugDb, $releaseDb, $tableName, $coreParams, $ignoreParams, &$unsyncable, &$toChange){
    // Get all from release
    $content = array();
    
    if(count($coreParams) > 1 || count($coreParams) == 0){
        throw new Exception("Invalid core count");
    }
    
    $result = $debugDb->PrototypeQuery("SELECT * FROM $tableName");
    //echo "SELECT * FROM $tableName";
    //PreVarDump($result);
    while($row = $debugDb->fetch($result)){
        $content[$row[$coreParams[0]]] = $row;
    }
    
    $result = $releaseDb->PrototypeQuery("SELECT * FROM $tableName");
    //echo "SELECT * FROM $tableName";
    //PreVarDump($result);
    
    while($row = $releaseDb->fetch($result)){
        $coreVal = $row[$coreParams[0]];
        
        // Is it in content?
        if(isset($content[$coreVal])){
            // Yes
            //echo "FOUND IN CONTENT: $coreVal ($tableName)";
            
            if(!MatchesContent($row, $content[$coreVal], $coreParams, $ignoreParams)){
                $debugTime = strtotime($content[$coreVal]["D"]);
                $releaseTime = strtotime($row["D"]);
                
                if($debugTime < $releaseTime){
                    $toChange[] = array(
                        "database"=> "ELM_DEBUG",
                        "table"=> $tableName,
                        "coreattr" => $coreParams[0],
                        "coreval"=>$coreVal
                    );
                }else if($debugTime > $releaseTime){
                    $toChange[] = array(
                        "database"=> "ELM_RELEASE",
                        "table"=> $tableName,
                        "coreattr" => $coreParams[0],
                        "coreval"=>$coreVal
                    );
                }else{
                    echo "Conflict!";
                }
                
                
                echo "dates: ($debugTime,$releaseTime)";
            }
            
        }
        else{
            
        }
    }
    
   
    
}

$unsyncable = array();
$toChange = array();



foreach($matchedTables as $table){
    if($table["debug"] == true && $table["release"] == true){
        $upperTable = strtoupper($table["name"]);
        if(isset($syncParameters[$upperTable])){
            $params = $syncParameters[$upperTable];
            $core = $params["core"];
            $ignore = $params["ignore"];
            CheckTableStatus($debugDb, $releaseDb, $upperTable, $core, $ignore, $unsyncable, $toChange);
        }
    }
}

 PreVarDump($toChange);

PreVarDump($unsyncable);
exit();


// Unsyncable tables
$unsyncable = array();

foreach($matchedTables as $table){
    
    
    
    //echo "Table: $upperTable<br />";
    
    if(isset($syncParameters[$upperTable])){
        $core   = $syncParameters[$upperTable]["core"];
        $ignore = $syncParameters[$upperTable]["ignore"];
        
        if(count($core) > 1){
            echo "Multiple core sync terms.";
        }else{
            $coreTerm = $core[0];
            $content = array();
            
            echo "CoreTerms: " . $coreTerm . "<br />";
            $query = "SELECT * FROM " . $upperTable;
            echo "QUERY: $query<br />";
            
            $result = $debugDb->PrototypeQuery($query);
            //PreVarDump($result);
            while($row = $debugDb->fetch($result)){
                PreVarDump($row);
                if(isset($content[$coreTerm])){
                    throw new Exception("Entry already exists.");
                }
                $content[$row[$coreTerm]] = $row;
            }
            
            PreVarDump($content);
            
            $result = $releaseDb->PrototypeQuery("SELECT * FROM " . $table["name"]);
            while($row = $releaseDb->fetch($result)){
                if(isset($content[$row[$coreTerm]])){     
                    echo "Found existig record: " . $coreTerm . "<br />";
                    // Check all values to see if it is identical
                    foreach($row as $k => $v){
                        if(!in_array($k, $ignore)){
                            // Get the existing value
                            $oldVal = $content[$core[0]][$k];
                            $newVal = $row[$k];
                            if($oldVal != $newVal){
                                echo "Different values for $k. Old: $oldVal, New: $newVal.<br />";
                            }
                        }
                    }
                }
                $content[$core[0]] = $row;
            }
            
            //exit(0);
        }
        
        PreVarDump($content);
        
        //$result = $debugDb->PrototypeQuery("SELECT * FROM " . $table["name"]);
        //PreVarDump($result);
    }else{
        $unsyncable[] = $upperTable;
    }
    
}

echo "Could not find details on syncing tables: " . implode(",",$unsyncable). "<br />";


$releaseUsers = $releaseDb->PrototypeQuery("SELECT * FROM ELM_USER");
$debugUsers = $debugDb->PrototypeQuery("SELECT * FROM ELM_USER");

/*
$releaseEmails = array();
while($row = $releaseDb->fetch($releaseUsers)){
    $releaseEmails[] = $row["EMAIL"];
}

$debugEmails = array();
while($row = $debugDb->fetch($debugUsers)){
    $debugEmails[] = $row["EMAIL"];
}

$allEmails = array_merge($debugEmails, $releaseEmails);
usort($allEmails, function($a,$b){
    return strcmp($a,$b);
});
$uniqueEmails = array();
$uniqueEmails[] = $allEmails[0];
for($i = 1; $i < count($allEmails); $i++){
    if($allEmails[$i] != $allEmails[$i-1]){
        $uniqueEmails[] = $allEmails[$i];
    }
}

// Create new matched set
$matchedEmails = array();
foreach($uniqueEmails as $t){
    $matchedEmails[] = array(
        "name"=>$t,
        "debug"=>in_array($t, $debugEmails),
        "release"=>in_array($t, $releaseEmails)
    );
}
*/


/*
$missingFromRelease = array();
foreach($matchedEmails as $m){
    if($m["debug"] == true && $m["release"] == false){
        $missingFromRelease[] = $m["name"];
    }
}

$orPrep = array_map(function($d){
    return "EMAIL LIKE '$d'";
}, $missingFromRelease);
$orStr = implode(" OR ", $orPrep);

// Get users from DEBUG
$result = $debugDb->PrototypeQuery("SELECT * FROM ELM_USER WHERE $orStr");
$queries = array();
$users = array();

$releaseDb->PrototypeQueryQuiet("START TRANSACTION");

try{
while($row = $debugDb->fetch($result)){
    $x = array();
    $y = array();
    foreach($row as $k => $v){
        if($k != "USERID"){
            $x[] = $k;
            $y[] = "'" . $v . "'";
        }
    }
    
    $users[] = array(
        "debuguserid" => $row["USERID"],
        "email" => $row["EMAIL"]
    );
    
    //$userIDs[] = "USERID=".$row["USERID"];
    
    $x = implode(",", $x);
    $y = implode(",", $y);
    $queries[] = "INSERT INTO ELM_USER($x) VALUES ($y)";
}
foreach($queries as $q){
    $releaseDb->PrototypeInsert($q);
}
PreVarDump($queries);

// Recover the release db id
for($i = 0; $i < count($users); $i++){
    $result = $releaseDb->PrototypeQuery("SELECT * FROM ELM_USER WHERE EMAIL LIKE ?", array(&$users[$i]["email"]));
    $row = $releaseDb->fetch($result);
    $users[$i]["releaseuserid"] = $row["USERID"];
    PreVarDump($row);
}

// Get all old user ids
$orPrep = array_map(function($d){
    return "USERID=" . $d["debuguserid"];
}, $users);
$orStr = implode(" OR ", $orPrep);
echo "ORSTR: $orStr";
    

// Get password records
$query = "SELECT * FROM ELM_PASSWORD WHERE $orStr";
$passwordResults = $debugDb->PrototypeQuery($query);
echo "PASSWORD QUERY: $query<br />";

echo "PASSWORDS:";
PreVarDump($passwordResults);

$queries = array();

while($row = $debugDb->fetch($passwordResults)){
    $x = array();
    $y = array();
    foreach($row as $k => $v){
        if($k != "USERID"){
            $x[] = $k;
            $y[] = "'" . $v . "'";
        }
    }
    
    // Find the correct id
    foreach($users as $u){
        if($u["debuguserid"] == $row["USERID"]){
            $x[] = "USERID";
            $y[] = $u["releaseuserid"];
        }
    }
    
    $x = implode(",", $x);
    $y = implode(",", $y);
    $queries[] = "INSERT INTO ELM_PASSWORD($x) VALUES ($y)";
}
PreVarDump($queries);
foreach($queries as $q){
    $releaseDb->PrototypeInsert($q);
}
//$releaseDb->PrototypeQueryQuiet("ROLLBACK");
$releaseDb->PrototypeQueryQuiet("COMMIT");
}catch(Exception $ex){
    $releaseDb->PrototypeQueryQuiet("ROLLBACK");
    throw $ex;
}
*/
//echo $orStr;
//echo implode(" OR ", $userIDs);

//$debugDb->PrototypeInsert("INSERT INTO ELM_USER(EMAIL) VALUES('penguin@ku.edu')");



//PreVarDump($matchedEmails);

//PreVarDump($matchedTables);

?>

<html>
    <head>
        <title>Compare Databases</title>
        <style>
            .db-area{
                float: left;
                width: 49%;
            }
            .table-row{
                
            }
            .table-row.missing{
                background-color: orange;
            }
        </style>
    </head>
    <body>
        <div class="db-area">
            <h3>Debug Database</h3>
            <?php
            foreach($matchedEmails as $t){
                if($t["debug"] == true){
                    ?><div class="table-row"><?= $t["name"] ?></div><?php
                }else{
                    ?><div class="table-row missing"><?= $t["name"] ?></div><?php
                }
            }
            foreach($matchedTables as $t){
                if($t["debug"] == true){
                    ?><div class="table-row"><?= $t["name"] ?></div><?php
                }else{
                    ?><div class="table-row missing"><?= $t["name"] ?></div><?php
                }
            }
            ?>
        </div>
        <div class="db-area">
            <h3>Release Database</h3>
            <?php
            foreach($matchedEmails as $t){
                if($t["release"] == true){
                    ?><div class="table-row"><?= $t["name"] ?></div><?php
                }else{
                    ?><div class="table-row missing"><?= $t["name"] ?></div><?php
                }
            }
            foreach($matchedTables as $t){
                if($t["release"] == true){
                    ?><div class="table-row"><?= $t["name"] ?></div><?php
                }else{
                    ?><div class="table-row missing"><?= $t["name"] ?></div><?php
                }
            }
            ?>
        </div>
    </body>
</html>
