<?php

require_once(ELM_ROOT . "database/basedatabase.php");
abstract class MysqliDatabase extends BaseDatabase {

    //========= PUBLIC ===========//
    // Constructor
    public function __construct($server, $database, $username, $password) {
        $this->mServer = $server;
        $this->mDatabase = $database;
        $this->mUsername = $username;
        $this->mPassword = $password;
    }

    // Destructor
    public function __destruct() {
        $this->Disconnect();
    }

    // Connect
    public function Connect($connectToDatabase = true) {
        $options = array();
        $options["SERVER"] = $this->mServer;
        $options["UID"] = $this->mUsername;
        $options["PWD"] = $this->mPassword;
        $options["Database"] = $this->mDatabase;
        $options["ReturnDatesAsStrings"] = true;
        $options["CharacterSet"] = 'utf-8';

        //echo "c";
        
        // Allocate space for error messages during connection
        $errors = array();

        // Prevent warnings being reported
        //mysqli_report(MYSQLI_REPORT_OFF);
        //error_reporting(0);
        
        // Try normal connect
        $this->mConnection = mysqli_connect($this->mServer, $this->mUsername, $this->mPassword);

        // Restore error reporting
        mysqli_report(MYSQLI_REPORT_ALL ^ MYSQLI_REPORT_INDEX);
        error_reporting(E_ALL);

        //echo "d";

        if(!$this->mConnection){
            // Uncomment to debug
            //throw new Exception("Could not connect to the dbms. Server: " . $this->mServer . ", User: " . $this->mUsername);
            $err = mysql_errno($this->mConnection);

            echo "Error! Could not connect to the dbms. " . $err;
            exit();
        }

        

        //echo "e";

        if($connectToDatabase){
            if(!$this->DatabaseExists("elm_release", false)){
                throw new Exception("Could not find the release database.");
            }

            //echo "f";

            mysqli_query($this->mConnection, "USE " . $this->mDatabase);
        }

        //echo "connected successfully";
        return;

    }

    public function CreateTable($sqlQuery) {
        $this->GeneralQueryQuiet($sqlQuery, array());
    }

    public function CreateView($viewName, $query) {
        if ($this->ViewExistsGeneral($viewName)) {
            $this->GeneralQueryQuiet("DROP VIEW $viewName", array());
        }
        $this->GeneralQueryQuiet("CREATE VIEW $viewName AS $query", array());
    }

    /**
     * Check to see if a database exists
     * @param {string} $databaseName - the name of the database 
     * @param {boolean} $verbose - output details
     * @return boolean - true if the database exists, otherwise false
     */
    public function DatabaseExists($databaseName, $verbose = false) {
        mysqli_query($this->mConnection, "USE $databaseName");
        $errno = mysqli_errno($this->mConnection);
        if($errno == 0){
            return true;
        }else{
            switch($errno){
                case 1044:
                case 1049:
                    return false;
                default:
                    echo "ERROR: $errno" . mysqli_error($this->mConnection);
                    exit;
            }
        }
        


        // Check to see if the database even exists
        if($verbose){
            echo "Existing Tables: <br />";
            echo "<ul>";
        }
        $query = "SHOW DATABASES";
        $result = mysqli_query($this->mConnection, $query) or die("<strong>Query:</strong> $query<br /><strong>Error:</strong> " . mysqli_error($this->mConnection));
        $databaseExists = false;
        while($row = mysqli_fetch_assoc($result)){
            $nextDb = $row["Database"];
            if($verbose){
                echo "name: " . $nextDb . "<br />";
            }
            if(strcmp($databaseName, $nextDb) == 0){
                $databaseExists = true;
            }
        }
        
        if($verbose){
            echo "</ul>";
        }
        return $databaseExists;
    }

    public function Disconnect() {
        if (isset($this->mConnection) && $this->mConnection != NULL) {
            $this->mConnection->close();
        }
    }

    public function FetchRowFromArray(&$arr) {
        if (!$arr) {
            return NULL;
        } else if (!isset($arr['result'])) {
            return NULL;
        } else {
            if (!isset($arr['nextindex'])) {
                $arr['nextindex'] = 0;
            }
            if ($arr['nextindex'] >= count($arr['result'])) {
                return NULL;
            } else {
                $arr['nextindex'] = $arr['nextindex'] + 1;
                return $arr['result'][$arr['nextindex'] - 1];
            }
        }
    }

    private function FetchRow(&$result) {
        if (!$result) {
            throw new Exception("invalid result provided");
        }
        if (is_bool($result)) {
            throw new Exception("result is a boolean!");
        }
        return mysqli_fetch_array($result, MYSQLI_ASSOC);
    }

    private function map_field_type_to_bind_type($field_type) {
        switch ($field_type) {
            case MYSQLI_TYPE_DECIMAL:
            case MYSQLI_TYPE_NEWDECIMAL:
            case MYSQLI_TYPE_FLOAT:
            case MYSQLI_TYPE_DOUBLE:
                return 'd';

            case MYSQLI_TYPE_BIT:
            case MYSQLI_TYPE_TINY:
            case MYSQLI_TYPE_SHORT:
            case MYSQLI_TYPE_LONG:
            case MYSQLI_TYPE_LONGLONG:
            case MYSQLI_TYPE_INT24:
            case MYSQLI_TYPE_YEAR:
            case MYSQLI_TYPE_ENUM:
                return 'i';

            case MYSQLI_TYPE_TIMESTAMP:
            case MYSQLI_TYPE_DATE:
            case MYSQLI_TYPE_TIME:
            case MYSQLI_TYPE_DATETIME:
            case MYSQLI_TYPE_NEWDATE:
            case MYSQLI_TYPE_INTERVAL:
            case MYSQLI_TYPE_SET:
            case MYSQLI_TYPE_VAR_STRING:
            case MYSQLI_TYPE_STRING:
            case MYSQLI_TYPE_CHAR:
            case MYSQLI_TYPE_GEOMETRY:
                return 's';

            case MYSQLI_TYPE_TINY_BLOB:
            case MYSQLI_TYPE_MEDIUM_BLOB:
            case MYSQLI_TYPE_LONG_BLOB:
            case MYSQLI_TYPE_BLOB:
                return 'b';

            default:
                trigger_error("unknown type: $field_type");
                return 's';
        }
    }
    
    /**
     * Get a direct connection to the database
     * @return type
     */
    public function GetConnection(){
        return $this->mConnection;
    }
    
    public function GetDatabaseUsed(){
        if ($result = $this->mConnection->query("SELECT DATABASE()")) {
            $row = $result->fetch_row();
            $databaseName = $row[0];
            $result->close();
            return $databaseName;
        }else{
            throw new Exception("Failed to get database name");
        }
    }

    protected function GeneralQuery($sql, $params = array()) {
        $result = $this->GeneralQueryQuiet($sql, $params);

        // Check to see if the query returned useful results
        if (is_bool($result)) {
            if (!$result) {
                throw new Exception("Query failed. SQL: '$sql', PARAMS: '" . print_r($params));
            } else {
                throw new Exception("no result. perhaps this should have been queried quietly? Use GeneralQueryQuiet if you do not expect results.");
            }
        }

        // Get the sql fields
        $sqlFieldInfo = $result->fetch_fields();


        // Get the field info
        $fieldInfo = array();
        foreach ($sqlFieldInfo as $val) {
            $fieldInfo[$val->name] = $this->map_field_type_to_bind_type($val->type);
        }
        //PreVarDump($fieldInfo);




        if (mysqli_num_rows($result) == 0) {
            return;
        }

        $assignmentarray = array();
        $assignmentarray['query'] = $this->QueryWithParams($sql, $params);
        $assignmentarray['params'] = $params;
        $resultarray = array();

        try {
            while ($row = $this->FetchRow($result)) {
                foreach ($row as $k => $v) {
                    $colType = $fieldInfo[$k];
                    if ($colType == "i") {
                        $row[$k] = intval($v);
                    }
                }

                $rowIndex = count($resultarray);
                $resultarray[$rowIndex] = $row;
            }
        } catch (Exception $e) {
            PreVarDump($assignmentarray);
            throw new Exception("Exception caused during query: '" . $e->getMessage() . "', SQL: '$sql', PARAMS: '" . print_r($params));
        }

        if (count($resultarray) > 0) {
            $assignmentarray['result'] = $resultarray;
        }

        return $assignmentarray;
    }

    protected function GeneralQueryQuiet($sql, $params) {
        $result = "";
        $this->Query($sql, $params, $result);
        return $result;
    }

    public function GetColumnNames($tableName) {
        $query = "SELECT * FROM $tableName LIMIT 1";
        $result = mysqli_query($this->mConnection, $query);
        $finfo = mysqli_fetch_fields($result);
        $nameArray = array();
        PreVarDump($finfo);
        foreach ($finfo as $i) {
            array_push($nameArray, $i->name);
        }
        PreVarDump($nameArray);
        return $nameArray;
    }

    public function GetNumRows($tableName) {
        if ($this->TableExists($tableName)) {
            return $this->GeneralQuery("SELECT COUNT(*) AS NUMROWS FROM $tableName", array());
        }
    }

    public function GetNumRowsFromQuery($query) {
        return $this->GeneralQuery("SELECT COUNT(*) AS NUMROWS FROM ($query) AS A", array());
    }

    public function GetTableContents($tableName, $maxRows = 10) {
        if ($this->TableExists($tableName)) {
            return $this->GeneralQuery("SELECT * FROM $tableName LIMIT $maxRows", array());
        }
    }

    public function GetPrimaryKeyColumns($table) {
        $result = null;
        $this->Query("SELECT * FROM $table LIMIT 1", array(), $result);
        $primary_key = [];
        while ($meta = $result->fetch_field()) {
            if ($meta->flags & MYSQLI_PRI_KEY_FLAG) {
                $primary_key[] = $meta->name;
            }
        }
        return $primary_key;
    }

    public function GetTableFromQuerySubsetContents($query, $offset = 0, $maxRows = 10) {
        return $this->GeneralQuery("$query LIMIT $maxRows OFFSET $offset;", array());
    }

    public function GetTableSubsetContents($tableName, $offset = 0, $maxRows = 10) {
        if ($this->TableExists($tableName)) {
            return $this->GeneralQuery("SELECT * FROM $tableName LIMIT $maxRows OFFSET $offset", array());
        }
    }

    public function GetTableFields($table) {
        $result = $this->GeneralQuery("SELECT * FROM $table LIMIT 1", array());
        $fields = array();
        if (isset($result["result"])) {
            while ($row = $this->FetchRowFromArray($result)) {
                foreach ($row as $k => $v) {
                    array_push($fields, $k);
                }
            }
        }
        return $fields;
    }

    public function GetTableNames() {
        $result = $this->GeneralQuery("show tables", array());
        $tableNames = array();
        while ($row = $this->FetchRowFromArray($result)) {
            foreach ($row as $r) {
                array_push($tableNames, $r);
                break;
            }
        }
        return $tableNames;
    }

    public function Info() {
        $mysqli = $this->mConnection;
        $pOut = "-- pjl SQL Dump\n";
        $pOut .= "-- Server version:" . $mysqli->server_info . "\n";
        $pOut .= "-- Generated: " . date('Y-m-d h:i:s') . "\n";
        $pOut .= '-- Current PHP version: ' . phpversion() . "\n";
        $pOut .= '-- Host: ' . $this->mServer . "\n";
        $pOut .= '-- Database:' . $this->mDatabase . "\n";
        return $pOut;
    }

    public function Insert($table, $fields, $params) {
        $pParams = array();
        foreach ($params as $p) {
            array_push($pParams, "'$p'");
        }

        $pParams = implode(",", $pParams);
        $query = "INSERT INTO $table(" . implode(",", $fields) . ") VALUES($pParams)";
        $this->GeneralQueryQuiet($query, array());
    }

    protected function InsertQueryRecoverID($sql, $params) {
        //echo "SQL: $sql<br />";

        /* $databaseCopy = "ELM";
          $result = null;
          $date = date("Y-m-d H:i:s");
          if(!$this->TableExists("ELM_DATA_VERSION")){
          $this->CreateDataVersionTable();
          $this->Query("INSERT INTO ELM_DATA_VERSION(VERSION, DATABASECOPY) VALUES(?,?)", array(&$date,&$databaseCopy), $result);
          }else{
          $this->Query("UPDATE ELM_DATA_VERSION SET VERSION = ? WHERE DATABASECOPY = ?", array(&$date,&$databaseCopy), $result);
          } */


        $pParams = array();
        if ($this->mImportMode) {
            //throw new Exception("import mode on");
            foreach ($params as $p) {
                array_push($pParams, $this->CleanOutAscii($p));
            }
        } else {
            $pParams = $params;
        }

        $result = "";
        $this->Query($sql, $pParams, $result);



        return mysqli_insert_id($this->mConnection);

        //sqlsrv_next_result($result); 
        //sqlsrv_fetch($result); 
        //return sqlsrv_get_field($result, 0); 
    }

    protected function Query($sql, $params, &$result) {
        if ($this->mDatabase == NULL) {
            throw new Exception("No database detected.");
        }
        if ($this->mConnection == NULL) {
            throw new Exception("Database not connected!");
        }

        $pNewQuery = $this->QueryWithParams($sql, $params);
        $result = mysqli_query($this->mConnection, $pNewQuery) or die("<strong>Query:</strong> $pNewQuery<br /><strong>Error:</strong> " . mysqli_error($this->mConnection));
        if (!$result) {
            $pExceptionString = "error with query declared:   ";
            $pExceptionString .= "{ query: '" . $pNewQuery . "', params: " . var_dump($params) . ", " . printf("Error: %s\n", mysqli_error($this->mConnection));
            throw new Exception($pExceptionString);
        }
    }

    protected function QueryWithParams($sql, $params) {
        $pExplodedQuery = explode("?", $sql);
        $pNewQuery = "";
        $pExplosionCounter = 0;
        foreach ($pExplodedQuery as $e) {
            if ($pExplosionCounter < count($params)) {
                $pParam = mysqli_real_escape_string($this->mConnection, $params[$pExplosionCounter]);
                $pNewQuery .= $e . "'$pParam'";
            } else {
                $pNewQuery .= $e;
            }
            $pExplosionCounter++;
        }
        return $pNewQuery;
    }
    
    public function RealEscapeString($str) {
        return $this->mConnection->real_escape_string($str);
    }

    protected function StreamQuery($sql) {
        $result = mysqli_query($this->mConnection, $sql) or die("<strong>Query:</strong> $pNewQuery<br /><strong>Error:</strong> " . mysqli_error($this->mConnection));
        if (!$result) {
            $pExceptionString = "error with query declared. <br />  ";
            $pExceptionString .= "&nbsp;&nbsp;&nbsp;&nbsp;query:" . $pNewQuery . "<br />";
            $pExceptionString .= "&nbsp;&nbsp;&nbsp;&nbsp; " . printf("Error: %s\n", mysqli_error($this->mConnection));
            throw new Exception($pExceptionString);
        }
    }

    public function TableExists($tableName) {
        $result = $this->GeneralQuery("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA LIKE '" . $this->mDatabase . "' AND TABLE_TYPE LIKE 'BASE TABLE' AND TABLE_NAME LIKE '$tableName'", array());
        return isset($result["result"]);
    }
    
    public function ViewExistsGeneral($name, $output = false) {
        $result = $this->GeneralQuery("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA LIKE '" . $this->mDatabase . "' AND TABLE_TYPE LIKE 'VIEW' AND TABLE_NAME LIKE '$name'", array());
        ///PreVarDump($result);
        //exit(0);
        return isset($result["result"]);
    }

    public function QueryBypass($sql, $params) {
        $result = null;
        $this->Query($sql, $params, $result);

        $resultarray = array();
        try {
            while ($row = $this->FetchRow($result)) {
                $rowIndex = count($resultarray);
                $resultarray[$rowIndex] = $row;
                //foreach($resultarray[$rowIndex] as $col){
                //$resultarray[$rowIndex]['type'] = 'put here';
                //}
            }
        } catch (Exception $e) {
            PreVarDump($assignmentarray);
            throw new Exception("Exception caused during query: '" . $e->getMessage() . "', SQL: '$sql', PARAMS: '" . print_r($params));
        }

        return $resultarray;
    }

    //========= PRIVATE ===========//
    private $mServer = NULL;
    private $mConnection = NULL;
    private $mDatabase = NULL;
    private $mUsername = "";
    private $mPassword = "";

}

?>