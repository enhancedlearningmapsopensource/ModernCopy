<?php

/*
 * Base implementation to provide common functionality
 */
require_once(ELM_ROOT . "database/i_database.php");


abstract class BaseDatabase implements IDatabase {

    // Force Extending class to define these methods
    abstract public function Connect();

    abstract public function Disconnect();

    public function fetch(&$arr) {
        return $this->FetchRowFromArray($arr);
    }

    abstract public function GetPrimaryKeyColumns($table);

    abstract public function GetTableFields($table);

    abstract public function GetTableNames();

    abstract public function Info();

    abstract public function Insert($table, $fields, $params);

    abstract protected function Query($sql, $params, &$result);

    abstract protected function QueryWithParams($sql, $params);

    abstract public function RealEscapeString($str);

    protected $mImportMode = false;
    private $mAsciiConversion = NULL;

    /**
     * Turns on/off import mode for cleaning bash-based text
     * @param {bool} on - whether import mode should be on or off
     */
    public function ImportMode($on = NULL) {
        if ($on == NULL) {
            return $this->mImportMode;
        } else {
            $this->mImportMode = $on;
        }
    }

    /**
     * Inefficient. Only for use during import
     * @param {string} str - the string to clean
     * @return {string} - the cleaned string
     */
    protected function CleanOutAscii($str) {
        if ($this->mAsciiConversion == NULL) {
            $hex = explode(",", "0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F");
            $this->mAsciiConversion = array();
            foreach ($hex as $h1) {
                foreach ($hex as $h2) {
                    array_push($this->mAsciiConversion, array("k" => "%" . $h1 . $h2, "v" => chr(intval(hexdec($h1 . $h2)))));
                }
            }
        }
        $pStr = $str;
        foreach ($this->mAsciiConversion as $p) {
            $pStr = str_replace($p["k"], $p["v"], $pStr);
        }
        return $pStr;
    }

    public function ToJson($result, &$jsonArray) {
        $jsonArray = array();
        while ($row = $this->FetchRowFromArray($result)) {
            array_push($jsonArray, $row);
        }
        $jsonArray = json_encode($jsonArray);
    }

    /**
     * Print out the contents of a database to a file
     * @param {string} filename - the name/path of the file
     * @param {array} tables - array of table names indicating the tables to print
     * @param {bool=} returnCopy - tells function whether or not to return a copy to the caller
     * @return {string|null} - a copy of the file output if returnCopy is true
     */
    public function ToFile($filename, $tables, $returnCopy = false) {
        $pOut = "";

        ob_start();

        // put a few comments into the SQL file
        //$pOut .= "-- pjl SQL Dump\n";
        //$pOut .= "-- Server version:".$mysqli->server_info."\n";
        //$pOut .= "-- Generated: ".date('Y-m-d h:i:s')."\n";
        //$pOut .= '-- Current PHP version: '.phpversion()."\n";
        //$pOut .= '-- Host: '.$this->mServer."\n";
        //$pOut .= '-- Database:'.$this->mDatabase."\n";

        $pOut .= $this->Info();

        // get a list of all the tables
        $aTables = (count($tables) > 0) ? $tables : $this->GetTableNames();

        $pOut .= "-- --------------------------------------------------------\n";
        $pOut .= "-- Tables exported:\n";
        $pOut .= "--\n\n";
        $pOut .= "EXPORT " . implode(",", $tables) . "\n\n";

        // Clear the file
        $fid = fopen($filename, "w");
        fwrite($fid, "");
        fclose($fid);

        // now go through all the tables in the database
        $pTableIndex = 0;
        foreach ($aTables as $table) {
            if (!$this->TableExists($table)) {
                continue;
            }

            // get the data from the table
            $fieldsArr = $this->GetTableFields($table);
            if (count($fieldsArr) == 0) {
                continue;
            }

            $pOut .= "-- --------------------------------------------------------\n";
            $pOut .= "-- Structure for '" . $table . "'\n";
            $pOut .= "--\n\n";

            $pOut .= "CREATETABLE $table\n";

            $pOut .= "-- --------------------------------------------------------\n";
            $pOut .= '-- Dump Data for `' . $table . "`\n";
            $pOut .= "--\n\n";

            $pOut .= "FIELDS " . implode(",", $fieldsArr) . "\n";

            echo ($returnCopy) ? "<pre>$pOut</pre>" : "";

            /// Write table creation
            $fid = fopen($filename, "a");
            fwrite($fid, $pOut);
            fclose($fid);
            $pOut = "";

            // now we can go through every field/value pair.
            // for each field/value we build a string strFields/strValues
            $pRowCnt = 100;
            $result = $this->GeneralQuery("SELECT * FROM $table", array());
            while ($row = $this->FetchRowFromArray($result)) {
                $strFields = '';
                $strValues = '';
                foreach ($fieldsArr as $field) {
                    if ($strFields != '')
                        $strFields .= ',';

                    // put quotes round everything - MYSQL will do type convertion (I hope) - also strip out any nasty characters
                    if ($strValues != '')
                        $strValues .= ',';

                    if ($row[$field] == NULL) {
                        $strValues .= 'NULL';
                    } else {
                        $strValues .= '"' . preg_replace('/[^(\x20-\x7F)\x0A]*/', '', $row[$field] . '"');
                    }
                }
                unset($field);

                // now we can put the values/fields into the insert command.
                $pOut .= "INSERT $strValues\n";
                unset($strFields);
                unset($strValues);

                /// Write row. Slow but necessary to avoid "out of memory" errors
                $pRowCnt--;
                if ($pRowCnt <= 0) {
                    $pRowCnt = 100;
                    echo ($returnCopy) ? "<pre>$pOut</pre>" : "";
                    $fid = fopen($filename, "a");
                    fwrite($fid, $pOut);
                    fclose($fid);
                    $pOut = "";
                }
            }
            $pOut .= "\n\n\n";
        }

        /// Write any remaining text
        echo ($returnCopy) ? "<pre>$pOut</pre>" : "";
        $fid = fopen($filename, "a");
        fwrite($fid, $pOut);
        fclose($fid);
        $pOut = "";

        $pCopy = ob_get_contents();
        ob_end_clean();

        return ($returnCopy) ? $pCopy : NULL;
    }

    public function FromFile($filename) {
        echo file_get_contents($filename);
    }

    public function StressTest($input) {
        $pTableName = "ELM_STRESS_TEST";
        if (!$this->TableExists($pTableName)) {
            $this->CreateTable("CREATE TABLE $pTableName (
								IDFIELD INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
								INTFIELD INT(6),
								VARCHARFIELD VARCHAR(256),
								TEXTFIELD TEXT);", array());
        }

        $this->GeneralQueryQuiet("INSERT INTO $pTableName(TEXTFIELD) VALUES(?)", array(&$input));
        $id = $this->InsertQueryRecoverID("INSERT INTO $pTableName(TEXTFIELD) VALUES(?)", array(&$input));
        return $id;
    }

    /**
     * Provides a direct access to the database query functionality. Requres user check
     * each query. Will not allow database modification.
     * 
     * @param {string} query - the sql query
     * @param {string[]} params - the input parameters for the query
     * @param {string} username - the username of the query owner
     * @param {string} username - the password of the query owner
     */
    public function ProtectedQuery($query, $params, $username, $password) {
        $mIsValidLogin = $this->IsValidLogin($username, $password);
        if (!$mIsValidLogin) {
            return null;
        } else {
            $pQuery = $query;
            $pQuery = str_replace("INSERT", "__INSERT__", $pQuery);
            $pQuery = str_replace("UPDATE", "__UPDATE__", $pQuery);
            //$pQuery = str_replace("DELETE", "__DELETE__", $pQuery);
            $pQuery = str_replace("ALTER", "__ALTER__", $pQuery);
            $pQuery = str_replace("DROP", "__DROP__", $pQuery);
            $pQuery = str_replace("GRANT", "__GRANT__", $pQuery);


            ob_start();
            $result = null;
            try {
                $result = $this->GeneralQuery($pQuery, $params);
                $echoed = ob_get_contents();
                ob_end_clean();
                //echo "Query complete";
                //echo $echoed;
            } catch (Exception $ex) {
                $echoed = ob_get_contents();
                ob_end_clean();

                echo "Error occured while performing query. \n<br /> Query:$query\n<br />Params:$params\n<br />";
                echo $echoed;
            }

            return $result;
        }
    }

}
