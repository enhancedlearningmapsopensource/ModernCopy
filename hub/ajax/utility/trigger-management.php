<?php

require_once("../../../database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

// =============================================================
// == MANAGE ELM_DEBUG COLUMNS
// =============================================================

// Only transfer the columns that are absolutely necessary for the
// locater tool to ELM_DEBUG. Any that are transfered are tied to
// ELM_RELEASE by the triggers defined below.

/**
 * 
 * @global {Database} $database - the database connection
 * @param {string} $table - the table to manage
 * @param {string[]} $managedColumns - the columns of the table to manage
 */
function manageTableColumns($table, $managedColumns){
    global $database;

    // Get a row from the table
    $result = $database->PrototypeQuery("SELECT * FROM `elm_debug`.$table LIMIT 1");

    // Verify results
    if(!isset($result["result"])){
        throw new Exception("Could not find 'elm_debug'.$table table.");
    }

    // Get columns
    $columns = array_keys($database->fetch($result));

    // Verify each column by comparing it to the list of managed columns
    // and remove any that are unmanaged from the table.
    foreach($columns as $c){
        if(!in_array($c, $managedColumns)){
            $database->PrototypeQueryQuiet("ALTER TABLE `elm_debug`.$table DROP COLUMN $c");
        }
    }
}

// -------------------------------------------------------------
// -- Manage columns for ELM_DEBUG.ELM_USER
// -------------------------------------------------------------
manageTableColumns("ELM_USER", ["USERID","EMAIL","NAME","PASS"]);


// -------------------------------------------------------------
// -- Manage columns for ELM_DEBUG.ELM_PASSWORD
// -------------------------------------------------------------
manageTableColumns("ELM_PASSWORD", ["USERID", "ITERATIONS", "SALT"]);


// -------------------------------------------------------------
// -- Manage columns for ELM_DEBUG.ELM_NODE
// -------------------------------------------------------------
// Waiting for input from Chaitanya
// manageTableColumns("ELM_PASSWORD", ["USERID", "ITTERATIONS", "SALT"]);


// =============================================================
// == MANAGE ELM_RELEASE TRIGGERS
// =============================================================
$database->PrototypeQueryQuiet("USE `elm_release`");

/**
 * Check for triggers associated with the given table
 * @global {Database} $database
 * @param {string} $table - table to check (e.g. subject|node|user|password)
 * @throws Exception
 */
function checkTriggers($table){
    global $database;
    
    $tableLower = strtolower($table);
    $tableUpper = strtoupper($table);
    
    $managedTriggers = ["trigger_insert_$tableLower", "trigger_update_$tableLower", "trigger_delete_$tableLower"];

    $result = $database->PrototypeQuery("SHOW TRIGGERS LIKE 'ELM_$tableUpper'");
    $triggers = [];
    if(isset($result["result"])){
        while($row = $database->fetch($result)){
            $triggers[] = $row["Trigger"];
        }
    }

    foreach($managedTriggers as $trigger){
        if(!in_array($trigger, $triggers)){
            //var_dump(shell_exec("mysql -u root -p < random.sql"));
            throw new Exception("Trigger missing: '$trigger'. Please restore the sql file: '../triggers/$tableLower-triggers.sql'");
        }
    }
}

// -------------------------------------------------------------
// -- Check triggers for ELM_RELEASE.ELM_USER
// -------------------------------------------------------------
checkTriggers("USER");

// -------------------------------------------------------------
// -- Check triggers for ELM_RELEASE.ELM_SUBJECT
// -------------------------------------------------------------
checkTriggers("SUBJECT");

// -------------------------------------------------------------
// -- Check triggers for ELM_RELEASE.ELM_PASSWORD
// -------------------------------------------------------------
checkTriggers("PASSWORD");

// -------------------------------------------------------------
// -- Check triggers for ELM_RELEASE.ELM_NODE
// -------------------------------------------------------------
checkTriggers("NODE");



