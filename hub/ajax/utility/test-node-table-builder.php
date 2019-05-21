<?php

/**
 * Adds the test node to the table and returns its ID
 * @param {array} table - the test node table
 * @param {string} textid - the node textid
 * @param {number} isantinode - whether the node is an antinode
 * @param {string} d - last modified date
 * @return {number} - the id of new testnode
 */
function addTestNode(&$table, $textid, $isantinode, $d){
    if(!isset($table["textidlookup"])){
        $table["textidlookup"] = array();
    }
    if(!isset($table["idlookup"])){
        $table["idlookup"] = array();
    }

    if(isset($table["textidlookup"][$textid])){
        $record = $table["textidlookup"][$textid][$isantinode];
        if($record != null){
            return $record;
        }else{
            if(!isset($table["idlookup"])){
                throw new Exception("Failed to create idlookup subtable.");
            }

            // Add to table
            $id = "".count($table["idlookup"]);
            $table["idlookup"][] = array(
                "id" => intval($id),
                "textid" => $textid,
                "isantinode" => $isantinode,
                "d" => $d
            );

            // Add to textidlookup for this entry
            $table["textidlookup"][$textid][$isantinode] = $id;

            // Send the id back
            if($id == null){
                PreVarDump($table["idlookup"]);
                throw new Exception("Testnode id cannot be null.");
            }
            return $id;
        }
    }else{
        // Add to textidlookup
        $table["textidlookup"][$textid] = array(
            0 => null,
            1 => null
        );
        $testnodeID = addTestNode($table, $textid, $isantinode, $d);
        if($testnodeID == null){
            throw new Exception("Testnode id cannot be null.");
        }
        return $testnodeID;
    }
}