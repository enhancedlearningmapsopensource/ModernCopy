<?php
require_once("../database/core.php");
define("SETUP_PATH", "../setup.php");
define("STORE_PATH", "./setup.php");

// Connect to the database in case its needed
$database = Db();
$database->Connect(false);

// Recover the import command from the database
$result = $database->PrototypeQuery("SELECT * FROM `COMMAND_TEMP`.COMMAND_TEMP");
$row = $database->fetch($result);
$command = trim($row["IMPORTCOMMAND"]);
$showOutput = intval(trim($row["SHOWOUTPUT"]));

// Remove the database
$database->PrototypeQueryQuiet("DROP DATABASE `COMMAND_TEMP`");
$accessdb = explode("<", $command)[0];

// Execute the import command
$start = microtime();
exec($command . ' 2>&1', $output);
$elapsed = microtime() - $start;

/**
 * Simple function to convert table names in the given database to uppercase. This 
 * is due to the default installation of mysql on linux aparently being case sensitve.
 * @param {object} $database - the database connection
 * @param {string} $name - the name of the database
 */
function convertToUppercase($database, $name){
    $database->PrototypeQueryQuiet("USE `$name`;");
    $result = $database->PrototypeQuery("SHOW TABLES");
    $tables = array();
    while($row = $database->fetch($result)){
        foreach($row as $v){
            $tables[] = $v;
        }
    }
    foreach($tables as $t){
        $upper = strtoupper($t);
        $prefix = explode("_", $t)[0];
        //echo $prefix . "<br />";
        if($prefix == "elm"){
            $database->PrototypeQueryQuiet("ALTER TABLE `$t` RENAME TO `$upper`;");
        }
    }
}



/**
 * Make sure that the database imported correctly. This is very imprecise and
 * should really just check that all tables are present and that the admin user
 * account was created. 
 * @return {bool} - true if the database validates otherwise false.
 */
function ValidateDatabase($database){
    if(!$database->DatabaseExists("elm_release")){
        return false;
    }

    $database->PrototypeQueryQuiet("USE `elm_release`");
    $result = $database->PrototypeQuery("SHOW TABLES");
    if(count($result["result"]) < 5){
        PreVarDump($result);
        return false;
    }

    return true;
}




// Run a validation check to make sure all tables are present
if(ValidateDatabase($database)){
    convertToUppercase($database, "elm_release");

    // Reimport triggers (Or import if they don't exist yet)
    // $triggerOutput = array();
    // $start = microtime();
    // $triggers = ["user","node","subject","password","usergroup","group"];
    // foreach($triggers as $t){
    //     $triggerFile = "../hub/ajax/triggers/$t-triggers.sql";
    //     if(!file_exists($triggerFile)){
    //         throw new Exception("Could not find trigger file: " . $triggerFile);
    //     }

    //     //echo "Trigger: '" . ($accessdb . " < " . $triggerFile . " 2>&1") . "'";
    //     exec($accessdb . " < " . $triggerFile . " 2>&1", $tOut);
    //     array_merge($triggerOutput, $tOut);
    // }
    // $elapsed = microtime() - $start;

    // Delete the setup file. To restore the file an admin can go to "/setup/reset-database.php"
    if(file_exists(SETUP_PATH)){
        unlink(SETUP_PATH);
    } 

    // Send response
    echo "... Import finished (time: $elapsed). Please review the log below for further information.<br /><br /><a href='../'>Continue To Site</a><br />";
}else{
    echo "... An error occured while importing. Please review the log below for further information.<br /><br />";
}


// Show the results of the database import.
echo "<div class='log'>";

if($showOutput == 1){
    foreach($output as $line){
        echo "$line<br />";
    }
    /*foreach($triggerOutput as $line){
        echo "$line<br />";
    }*/
}
echo "</div>";

