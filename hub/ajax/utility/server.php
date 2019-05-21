<?php
/**
 * Script responsible for recovering version status from server and ensuring that 
 * required database tables are loaded and ready.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: *");
header("Access-Control-Allow-Headers: *");

require_once("../../../database/core.php");

// Connect to the database to check for the user table (normally done in ajax.php)
$database = Db();
$database->Connect();

// Check for the user table
if(!$database->TableExists("ELM_USER")){
	/*try{
            $database->$creators[$table]();
        }catch(Exception $ex){
            throw new Exception("Error while trying to create $table.", 0, $ex);
        }*/

    $database->CreateUserTable();
}

require_once(ELM_ROOT . "database/ajax.php");

define("AUTOMATED_PATH", "../../automated/");
define("WRAPPER_PATH", "../../wrappers/");
define("SEARCHER_PATH", "../../searchers/");

$data = json_decode(file_get_contents("php://input"));
if($data != NULL){
    PreVarDump($data);
}

// Make sure we are only getting (not changing) server data
$requestMethod = filter_input(INPUT_SERVER, "REQUEST_METHOD");
if(strcmp($requestMethod, "GET") != 0){
    $rawRequest = $_SERVER["REQUEST_METHOD"];
    if(strcmp($rawRequest, "GET") != 0){
        PreVarDump($_SERVER);
        throw new Exception("Error. Unknown command: $requestMethod");
    }else{
        $requestMethod = $rawRequest;
    }
}

// Mapping between table and creation function
$creators = array(
    "ELM_ACCOUNTCONFIRM"        => "CreateAccountConfirmTable",
    "ELM_CELL"                  => "CreateCellTable",
    "ELM_CONFIG"                => "CreateConfigTable",
    "ELM_DOMAINGROUP"           => "CreateDomainGroupTable",
    "ELM_DISCUSSION"            => "CreateDiscussionTable",
    "ELM_DISCUSSION_POST"       => "CreateDiscussionPostTable",
    "ELM_DISCUSSION_POST_MSG"   => "CreateDiscussionPostMsgTable",
    "ELM_FILE"                  => "CreateFileTable",
    "ELM_FORCEDCHANGES"         => "CreateForcedChangesTable",
    "ELM_GROUPPERMISSION"       => "CreatePermissionTable",
    "ELM_GROUPPREFERENCE"       => "CreateGroupPreferenceTable",
    "ELM_HTMLCONTENT"           => "CreateHtmlContentTable",
    "ELM_NODETOSTANDARD"        => "CreateNodeToStandardTable",
    "ELM_SETMAP"                => "CreateSetMappingTables",
    "ELM_SETSUBJECT"            => "CreateSetSubjectTable",
    "ELM_SHAREDRESOURCE"        => "CreateSharedResourceTable",
    "ELM_SIMPLESTANDARD"        => "CreateSimpleStandardTable",
    "ELM_STANDARDCOLUMN"        => "CreateStandardColumnTable"
    /* "ELM_USER"           => Defined above after including core.php */
);
//$database->DestroyTable("ELM_CONFIG");
// Tables required by ELM but not used directly by hub
$nonHubTables = array(
    "ELM_ACCOUNTCONFIRM",
    "ELM_CONFIG",
    "ELM_FORCEDCHANGES",
    "ELM_GROUPPERMISSION"
);

// Check non-hub tables
//echo "non-hub table creation.";
//PreVarDump($nonHubTables);
//PreVarDump(get_class_methods($database));
//$database->CreateConfigTable();
//echo "config created.";
//phpinfo();
foreach($nonHubTables as $table){
    if(!$database->TableExists($table)){
	//echo "Creating $table\n";
        //echo "Creator " . $creators[$table] . "\n";
           // if(!isset($database->CreateConfigTable)){
	//	echo "Cannot find creation function\n";
        //}
	try{
            $database->{$creators[$table]}();
        }catch(Exception $ex){
            throw new Exception("Error while trying to create $table.", 0, $ex);
        }
    }
}

//================================================================================


$table = array(
    "cell"              =>"ELM_CELL",
    "discussion"        =>"ELM_DISCUSSION",
    "domaingroup"       =>"ELM_DOMAINGROUP",
    "edge"              =>"ELM_EDGE",
    "file"              =>"ELM_FILE",
    "group"             =>"ELM_GROUP",
    "grouppreference"   =>"ELM_GROUPPREFERENCE",
    "htmlcontent"       =>"ELM_HTMLCONTENT",
    "map"               =>"ELM_MAP",
    "mapnode"           =>"ELM_MAPNODES",
    "mapresource"       =>"ELM_MAPRESOURCE",
    "msg"               =>"ELM_DISCUSSION_POST_MSG",
    "node"              =>"ELM_NODE",
    "nodetostandard"    =>"ELM_NODETOSTANDARD",
    "preference"        =>"ELM_PREFERENCE",
    "post"              =>"ELM_DISCUSSION_POST",
    "resource"          =>"ELM_RESOURCE",
    //"rule"              =>"ELM_NAMING_RULE",
    "set"               =>"ELM_STANDARD_SET",
    "setmap"            =>"ELM_SETMAP",
    "setnode"           =>"ELM_SETNODE",
    "setresource"       =>"ELM_SETRESOURCE",
    "setstandard"       =>"ELM_SETSTANDARD",
    "setsubject"        =>"ELM_SETSUBJECT",
    //"sharedresource"    =>"ELM_SHAREDRESOURCE",
    "simplestandard"    =>"ELM_SIMPLESTANDARD",
    "standardcolumn"    =>"ELM_STANDARDCOLUMN",
    "subject"           =>"ELM_SUBJECT",
    "user"              =>"ELM_USER",
    "usergroup"         =>"ELM_USERGROUP",
    "userpreference"    =>"ELM_USERPREFERENCE",
);

// Load locater tool objects if cascade present
if(file_exists(ELM_ROOT . "/cascade/")){
    $readonlyTables = array(
        "optionnode",
        "test",
        "testinstance",
        "testnode",
        "testoption",
        "testquestion",
        "studentresponse",
        "studenttest"
    );
}else{
    $readonlyTables = array();
}

$collections = array();
foreach($table as $k => $t){
    // Check for the table
    if(!$database->TableExists($t)){
        $database->{$creators[$t]}();
    }
    
    // Temporary check
    $result = $database->PrototypeQuery("SELECT * FROM $t LIMIT 1");
    if(isset($result["result"])){
        $rowA = $database->Fetch($result);
        if(!in_array("D", array_keys($rowA))){
            $result = $database->PrototypeQueryQuiet("ALTER TABLE $t ADD COLUMN D DATETIME DEFAULT '1990-01-01 00:00:00'");
        }

        $result = $database->PrototypeQuery("SELECT D FROM $t ORDER BY D DESC LIMIT 1");
        $rowB = $database->fetch($result);
        
        if($k == null){
            throw new Exception("K null");
        }
        
        $collections[] = array(
            "name" => $k,
            "date" => $rowB["D"]
        );
    }else{
        if($k == null){
            throw new Exception("K null");
        }
        
        $collections[] = array(
            "name" => $k,
            "date" => '1990-01-01 00:00:00'
        );
    }
}

$date = date("Y-m-d H:i:s");
foreach($readonlyTables as $k){
    $collections[] = array(
        "name" => $k,
        "date" => $date
    );
}



if(!file_exists(AUTOMATED_PATH)){
    mkdir(AUTOMATED_PATH);
}

// Check existing collection definitions
$existing = dirToArray(AUTOMATED_PATH);

// Check for required collections that will not be creatable
$missing = array();
$notMissing = false;

//PreVarDump($collections);

foreach($collections as $ky => $c){
    /*echo "I: $i\n";
    echo "c[name]: ".$c["name"]."\n";
    echo "count(collections): ".count($collections)."\n";*/
    
    $notMissing = false;
    for($i = 0; $i < count($existing); $i++){
        //echo $c["name"]."-set.js =?=" . $existing[$i] . "<br />";
        if(strcmp($c["name"]."-set.js", $existing[$i]) == 0){
            //echo "MATCH<br />";
            $notMissing = true;
            break;
        }
    }
    unset($i);
    
    if(!$notMissing){
        array_push($missing, $c["name"]);
    }
    
    // Check for and add collection to forced
    $result = $database->PrototypeQuery("SELECT * FROM ELM_FORCEDCHANGES WHERE TABLENAME LIKE '".$c["name"]."'");
    if(!isset($result["result"])){
        $database->PrototypeQueryQuiet("INSERT INTO ELM_FORCEDCHANGES(TABLENAME, D) VALUES('".$c["name"]."','1990-01-01 00:00:00')");
    }else{
        $row = $database->fetch($result);
        
        $cellDate = strtotime($c["date"]);
        $forcedDate = strtotime($row["D"]);
        
        if($forcedDate > $cellDate){
            if(key_exists("name", $collections[$ky])){
                $collections[$ky]["date"] = date("Y-m-d H:i:s", $forcedDate);
            }
        }
        unset($cellDate);
        unset($forcedDate);
        unset($row);
    }
    unset($result);
}
unset($ky);
unset($c);



// Create the missing files
if(count($missing) > 0){
    // Get the template
    $template = file_get_contents("collectiontemplate.js");
    
    // Write the files
    foreach($missing as $m){
        $filename = AUTOMATED_PATH . "$m-set.js";
        $contents = str_replace("LOW", $m, $template);
        file_put_contents($filename, $contents, LOCK_EX);
    }
}

// Check for wrappers
$wrapperFiles = dirToArray(WRAPPER_PATH);
$wrappers = array();
foreach($wrapperFiles as $w){
    $s = explode("-", $w);
    if(count($s) != 2){
        throw new Exception("Invalid name format for wrapper file: $w");
    }
    if(strcmp($s[0], "base") != 0){
        $wrappers[] = $s[0];
    }
}

// Check for searchers
$searcherFiles = dirToArray(SEARCHER_PATH);
$searchers = array();
foreach($searcherFiles as $w){
    $s = explode("-", $w);
    if(count($s) != 2){
        throw new Exception("Invalid name format for searcher file: $w");
    }
    if(strcmp($s[0], "base") != 0){
        $searchers[] = $s[0];
    }
}

// Get the current database
$result = $database->PrototypeQuery("SELECT DATABASE()");
$row = $database->fetch($result);

// Repond with required collections
echo json_encode(
    array(
        "modifiedtime"=>date("Y-m-d H:i:s", GetLastModifiedTime("./server.php")),
        "tables"=>$collections,
        "timezero"=>TIME_ZERO,
        "fileUpdates"=>$missing,
        "wrappers"=>$wrappers,
        "searchers"=>$searchers,
        "database"=>$row["DATABASE()"]
    )
);

?>

