<?php

require_once(ELM_ROOT . "database/login/common-functions.php");

/**
 * Include required files based on the server
 */
if (!defined("DATABASE")) {
    define("DATABASE", "MYSQLI");
}

require_once(ELM_ROOT . "database/mysqlidatabase.php");

// Old mechanism to use different database systems (mysql/mssql)
class BridgeDatabase extends MysqliDatabase {

}

require_once(ELM_ROOT . "database/crypt/crypt-pbkdf2.php");

// Primary database
class ElmDatabase extends BridgeDatabase {

    // Controller that handles search queries
    private $mSearchClass = null;
    // Prioritizer for search queries
    private $mPrioritizer = null;
    // Encryption class
    private $mCrypt = null;

    //========= PUBLIC ===========//
    // Constructor
    public function __construct($server, $database, $username, $password) {
        parent::__construct($server, $database, $username, $password);
        $this->mCrypt = new CryptPbkdf2();
    }

    // Destructor
    public function __destruct() {
        parent::__destruct();
    }

    public function AddEncryptionParameters($userid, $salt, $iterations) {
        return $this->InsertQueryRecoverID("INSERT INTO ELM_PASSWORD(USERID, SALT, ITERATIONS) VALUES(?,?,?)", array(&$userid, &$salt, &$iterations));
    }

    public function AddFeedback($email, $title, $type, $description, $img) {
        $date = date("Y-m-d H:i:s");
        return $this->InsertQueryRecoverID("INSERT INTO ELM_FEEDBACK(EMAIL,TITLE,TYPE,DESCRIPTION,DATE,IMAGE) VALUES(?,?,?,?,?,?);", array(&$email, &$title, &$type, &$description, &$date, &$img));
    }

    public function AddGroup($name) {
        $date = date("Y-m-d H:i:s");
        return $this->InsertQueryRecoverID("INSERT INTO ELM_GROUP(DATECREATED, NAME) VALUES(?, ?);", array(&$date, &$name));
    }

    public function AddPermission($name, $description) {
        $date = date("Y-m-d H:i:s");
        return $this->InsertQueryRecoverID("INSERT INTO ELM_PERMISSION(DATECREATED, NAME, DESCRIPTION) VALUES(?, ?, ?);", array(&$date, &$name, &$description));
    }

    public function AddPermissionToGroup($groupID, $permissionID) {
        $date = date("Y-m-d H:i:s");
        $this->InsertQueryRecoverID("INSERT INTO ELM_GROUPPERMISSION(DATE, GROUPID, PERMISSIONID) VALUES(?, ?, ?);", array(&$date, &$groupID, &$permissionID));
    }

    public function AddPost($mapName, $userName, $school, $state, $msg) {
        $date = date("Y-m-d H:i:s");
        $dateDeleted = NULL;
        return $this->InsertQueryRecoverID("INSERT INTO ELM_POSTS(MAP,NAME,SCHOOL,STATE,DATEPOSTED,DATEDELETED,MSG) VALUES(?,?,?,?,?,NULL,?);", array(&$mapName, &$userName, &$school, &$state, &$date, &$msg));
    }

    public function AddPreference($name, $type, $default, $choices, $programcode) {
        $date = date("Y-m-d H:i:s");
        $isDisabled = 0;
        return $this->InsertQueryRecoverID("INSERT INTO ELM_PREFERENCE(NAME,DEFAULTVALUE,FORMTYPE,PROGRAM_CODE,ISDISABLED,DATECREATED,CHOICES) VALUES(?,?,?,?,?,?,?);", array(&$name, &$default, &$type, &$programcode, &$isDisabled, &$date, &$choices));
    }

    public function AddPreferenceToGroup($groupID, $preferenceID) {
        $date = date("Y-m-d H:i:s");
        $this->InsertQueryRecoverID("INSERT INTO ELM_GROUPPREFERENCE(DATECREATED, GROUPID, PREFERENCEID) VALUES(?, ?, ?);", array(&$date, &$groupID, &$preferenceID));
    }

    public function AddPreprocCell($from, $to, $bySet) {
        return $this->InsertQueryRecoverID("INSERT INTO ELM_PREPROC(FROMID,TOID,BYSET) VALUES(?,?,?);", array(&$from, &$to, &$bySet));
    }

    public function AddPreprocThrough($bySet, $by) {
        return $this->InsertQueryRecoverID("INSERT INTO ELM_PREPROCBY(BYSET,BYID) VALUES(?,?);", array(&$bySet, &$by));
    }

    public function AddResource($title, $url, $description, $bashTimestamp) {
        global $userID;
        $date = date("Y-m-d H:i:s");
        $creator = $userID;
        return $this->InsertQueryRecoverID("INSERT INTO ELM_RESOURCE(BASHTIMESTAMP,TITLE,URL,DESCRIPTION,CREATORID,DATECREATED,D) VALUES(?,?,?,?,?,?,?);", array(&$bashTimestamp, &$title, &$url, &$description, &$creator, &$date, &$date));
    }

    /**
     * Add a new telemetry entry to the database
     * @param mixed $userID - the user id of the current user
     * @param mixed $url - the url/text to record
     * @return mixed - the id of the new entry
     */
    public function AddTelemetry($userID, $url) {
        $date = date("Y-m-d H:i:s");
        return $this->InsertQueryRecoverID("INSERT INTO ELM_TELEMETRY(USER_ID,URL,DATECREATED) VALUES(?,?,?);", array(&$userID, &$url, &$date));
    }

    /**
     * Add a user
     *
     * @param email - the email of the new user
     * @param password - the password of the new user
     * @param state - the state of the new user
     *
     * @return - the userid of the new user
     */
    public function AddUser($email, $password, $state) {
        // Since this needs to happen before any login to the page can occur and is not typically done
        // for each page load, checks for missing user tables can be performed here.
        if(!$this->TableExists("ELM_PASSWORD")){
            $this->CreatePasswordTable();
            $this->CreateUserPreferenceTable();
        }

        $date = date("Y-m-d H:i:s");
        $threeDaysAgo = date("Y-m-d H:i:s", strtotime("-3 days"));
        $userName = explode("@", $email);
        $userName = $userName[0];
        return $this->InsertQueryRecoverID("INSERT INTO ELM_USER(EMAIL,NAME,CREATED_ON,PASS,STATE,D,DASHBOARD_DATE) VALUES(?,?,?,?,?,?,?);", array(&$email, &$userName, &$date, &$password, &$state, &$date, &$threeDaysAgo));
    }

    public function AddUserToGroup($userID, $groupID) {
        $date = date("Y-m-d H:i:s");
        $this->InsertQueryRecoverID("INSERT INTO ELM_USERGROUP(DATE, GROUPID, USERID, D) VALUES(?, ?, ?, ?);", array(&$date, &$groupID, &$userID, &$date));
        $this->UpdateModernDataVersion("user");
        $this->UpdateModernDataVersion("group");
        $this->UpdateModernDataVersion("permission");
        $this->UpdateModernDataVersion("preference");
    }

    /**
     * Add a set of users to the database.
     * @param {array} data - an array of node objects each with: [email] attributes
     * @return {array} - list of ids for the newly inserted nodes
     */
    public function AddUsersToGroups(&$data) {
        $date = date("Y-m-d H:i:s");
        for ($d = 0; $d < count($data); $d++) {
            $data[$d]["date"] = $date;
        }
        $this->BatchInsert($data, array("fields" => array("userid", "date", "groupid"), "table" => "ELM_USERGROUP", "unique" => array("userid", "groupid"), "idcolumn" => array("USERID", "GROUPID")));
        $this->UpdateModernDataVersion("user");
        $this->UpdateModernDataVersion("group");
        $this->UpdateModernDataVersion("permission");
        $this->UpdateModernDataVersion("preference");
    }

    /**
     * Add a large batch of data using an sql insert
     * @param {array} nodeData - the array of data to insert. IDs are placed into the array after insertion
     * @param {array} options:
     * @param {array} options.fields    - the fields to insert (lowercase). eg: array("textid","title")
     * @param {string} options.table    - the table to insert into
     * @param {string} options.unique   - the field which is unique to every record (lowercase). eg: "title"
     * @param {string} options.idcolumn - the column of the table used for ID (uppercalse). eg: "NODEID"
     */
    public function BatchInsert(&$nodeData, $options) {
        if (!isset($options["fields"])) {
            throw new Exception("no fields provided.");
        }
        if (!isset($options["table"])) {
            throw new Exception("no table provided.");
        }
        if (!isset($options["unique"])) {
            throw new Exception("no unique field was provided.");
        }
        if (!isset($options["idcolumn"])) {
            throw new Exception("no idcolumn was provided.");
        }

        // Set the fields that are expected for this insertion
        $fields = $options["fields"];

        // Construct the question string that will be used for each record
        $questionString = "(" . implode(",", array_map(function($d) {
                            return "?";
                        }, $fields)) . ")";

        // Select the table to insert
        $table = $options["table"];

        // ID value
        $idColumn = $options["idcolumn"];

        // Create the query shell for each batch of insertions
        $queryShell = "INSERT INTO $table(" . implode(",", array_map(function($d) {
                            return strtoupper($d);
                        }, $fields)) . ") VALUES ?";

        // Determine the base length of the query string
        $questionBase = strlen($queryShell); //()
        // Determine the question mark size per record
        $sizePerRecord = strlen($questionString);

        $maxQueryLength = 12000;
        $maxParams = 2100;

        $params = array();
        $values = array();
        $numToDo = floor(count($nodeData) / 2.75);

        foreach ($nodeData as $d) {
            $records = count($params) / count($fields) + 1;
            $commas = $records - 1;
            $queryLength = $questionBase + ($sizePerRecord * $records) + $commas - 1;

            if ($queryLength > 12000 || (count($params) + count($fields)) >= $maxParams) {
                $query = str_replace("?", implode(",", $values), $queryShell);
                $this->GeneralQueryQuiet($query, $params);

                $params = array();
                $values = array();
            }

            foreach ($fields as $f) {
                $params[] = &$d[$f];
            }
            $values[] = $questionString;
        }
        $query = str_replace("?", implode(",", $values), $queryShell);

        // Get the primary keys of all rows that currently exist
        if (count($idColumn) > 1) {
            $result = $this->PrototypeQuery("SELECT " . implode(",", $idColumn) . " FROM $table", array());
            $preInsertionIDs = array();
            while ($row = $this->fetch($result)) {
                $idCol = array();
                foreach ($idColumn as $idc) {
                    $idCol[] = $row[$idc];
                }
                $preInsertionIDs[] = implode("-", $idCol);
            }
        } else if (count($idColumn) == 0) {
            PreVarDump($idColumn);
            throw new Exception("no primary key provided");
        } else if (count($idColumn) == 1) {
            $result = $this->PrototypeQuery("SELECT " . $idColumn[0] . " FROM $table", array());
            $preInsertionIDs = array();
            while ($row = $this->fetch($result)) {
                $preInsertionIDs[] = $row[$idColumn[0]];
            }
        }

        $result = $this->PrototypeInsert($query, $params);

        // Get the primary keys of all rows that currently exist
        if (count($idColumn) > 1) {
            $result = $this->PrototypeQuery("SELECT " . implode(",", $idColumn) . " FROM $table", array());
            $preInsertionIDs = array();
            while ($row = $this->fetch($result)) {
                $idCol = array();
                foreach ($idColumn as $idc) {
                    $idCol[] = $row[$idc];
                }
                $postInsertionIDs[] = implode("-", $idCol);
            }
        } else if (count($idColumn) == 1) {
            $result = $this->PrototypeQuery("SELECT " . $idColumn[0] . " FROM $table", array());
            $postInsertionIDs = array();
            while ($row = $this->fetch($result)) {
                $postInsertionIDs[] = $row[$idColumn[0]];
            }
        }

        return array("pre" => $preInsertionIDs, "post" => $postInsertionIDs);
    }

    public function ChangePassword($email, $newPassword) {
        $this->GeneralQueryQuiet("UPDATE ELM_USER SET PASS=? WHERE EMAIL LIKE ?", array(&$newPassword, &$email));
        $this->UpdateModernDataVersion("user");
    }

    public function CreateAccountConfirmTable() {
        $pTableName = "ELM_ACCOUNTCONFIRM";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                ID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                USERID INT(6),
                CODE TEXT,
                EXPIRES DATETIME);", array());
    }

    /**
     * Used to store configuration options. Using a json file is more appealing but then server permissions get
     * complicated. Since this has to store things like icon paths and the path to the locater tool server it
     * has been left as a generic 'TEXT' field.
     */
    public function CreateConfigTable() {
        $pTableName = "ELM_CONFIG";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                CONFIGID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                CODE TEXT,
                VAL TEXT);", array());


        $defaults = array
        ( "ICON_PATH" => "elm/assets/img/elmpublicmap.svg"
        , "LOGO_PATH" => "elm/assets/img/elmfullwhite.svg"
        , "SELF_CREATION_ON" => "FALSE"
        , "LOCATER_TOOL_PATH" => "https://elm-lt-poc.kiteaai.org/locatertool/login2"
        , "CONTACT_EMAIL" => "EnhancedLM@ku.edu"
        );

        // Set up defaults
        foreach($defaults as $code => $val){
            $this->GeneralQueryQuiet("INSERT INTO ELM_CONFIG(CODE,VAL) VALUES (?,?)", array(&$code, &$val));
        }
    }

    public function CreateDataDictionaryTable() {
        $pTableName = "ELM_DATADICTIONARY";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                RECORDID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                TABLENAME TEXT,
                COLUMNNAME TEXT DEFAULT NULL,
                DESCRIPTION TEXT DEFAULT NULL);", array());
    }

    public function CreateDataVersionTable() {
        $pTableName = "ELM_DATA_VERSION_B";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  VERSIONID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            VERSIONNAME VARCHAR(32),
                                                            VERSION DATETIME);", array());
    }

    public function CreateDiscussionTable() {
        $pTableName = "ELM_DISCUSSION";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  DID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            CREATORID INT(6),
                                                            DATECREATED DATETIME,
                                                            DATEDELETED DATETIME,
                                                            OBTYPE VARCHAR(10) NOT NULL,
                                                            OBID INT(6) NOT NULL,
                                                                D DATETIME);", array());
    }

    public function CreateDiscussionPostTable() {
        $pTableName = "ELM_DISCUSSION_POST";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  POSTID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            DID INT(6),
                                                            CREATORID INT(6),
                                                            DATECREATED DATETIME,
                                                            DATEDELETED DATETIME,
                                                            ORIGINALID INT(6),
                                                                D DATETIME);", array()); // OriginalID not null for replies
    }

    public function CreateDiscussionPostMsgTable() {
        $pTableName = "ELM_DISCUSSION_POST_MSG";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                            MID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            DATECREATED DATETIME,
                                                            MSG TEXT,
                                                            POSTID INT(6),
                                                                D DATETIME);", array());
    }

    public function CreateEdgeTable() {
        $pTableName = "ELM_EDGE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                            EDGEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            CREATORID INT(6) NOT NULL,
                                                            STARTNODE INT(6) NOT NULL,
                                                            ENDNODE INT(6) NOT NULL,
                                                            REASON TEXT,
                                                            DATECREATED DATETIME,
                                                                D DATETIME);", array());
    }

    public function CreateEdgeChangeTable() {
        $pTableName = "ELM_EDGECHANGE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                            CHANGEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            EDITORID INT(6),
                                                            EDGEID INT(6),
                                                            DATE DATETIME,
                                                            DETAILS TEXT);", array());
    }

    public function CreateFeedbackTable() {
        $pTableName = "ELM_FEEDBACK";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                            FID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            EMAIL VARCHAR(256),
                                                            TITLE VARCHAR(256),
                                                            TYPE VARCHAR(256),
                                                            DESCRIPTION TEXT,
                                                            IMAGE TEXT,
                                                            DATE DATETIME);", array());
    }

    public function CreateFileTable() {
        $pTableName = "ELM_FILE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                        FILEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                        USERID INT(6),
                                                        TITLE VARCHAR(256) DEFAULT '',
                                                        FILENAME VARCHAR(256) DEFAULT '',
                                                        EXT VARCHAR(16) DEFAULT '',
                                                        DESCRIPTION TEXT,
                                                        URL TEXT,
                                                        SIZE INT(8),
                                                        DATEUPLOADED DATETIME,
                                                        D DATETIME);", array());
    }

    public function CreateForcedChangesTable() {
        $pTableName = "ELM_FORCEDCHANGES";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                    ID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                    TABLENAME VARCHAR(100) NOT NULL,
                                    D DATETIME DEFAULT '".TIME_ZERO."');",array());
    }

    public function CreateGradeLevelTable() {
        $pTableName = "ELM_GRADE_LEVEL";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                GRADEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                CREATORID INT(6),
                                DATECREATED DATETIME,
                                TITLE VARCHAR(256),
                                SHORT VARCHAR(32),
                                SUBJECTID INT(6),
                                                                D DATETIME);", array());
    }

    public function CreateGroupTable() {
        $pTableName = "ELM_GROUP";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                GROUPID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                NAME VARCHAR(256),
                                                                DATECREATED DATETIME,
                                                                D DATETIME);", array());
    }

    public function CreateGroupPermissionsTable() {
        $pTableName = "ELM_GROUPPERMISSIONS";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                GROUPID INT(6),
                                                                PERMISSIONID INT(6),
                                                                DATE DATETIME,
                                                                PRIMARY KEY (GROUPID,PERMISSIONID));", array());
    }

    public function CreateHtmlContentTable() {
        $pTableName = "ELM_HTMLCONTENT";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  ID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                PROGRAM_CODE VARCHAR(10),
                                                                DATE DATETIME,
                                                                CONTENT TEXT,
                                                                D DATETIME)", array());
    }

    public function CreateIndirectConnectionsTable() {
        $pTableName = "ELM_INDIRECTCONNECTIONS";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                        SOURCEID INT(6),
                                                                        DESTID INT (6),
                                                                        MAXLENGTH INT(3),
                                                                        PRIMARY KEY (SOURCEID,DESTID))", array());
    }

    public function CreateMapTable() {
        $pTableName = "ELM_MAP";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                MAPID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                TITLE VARCHAR(256),
                                                                CREATORID INT(6),
                                                                SEARCHTERM TEXT,
                                                                DATECREATED DATETIME,
                                                                DATEDELETED DATETIME,
                                                                DESCRIPTION TEXT,
                                                                BASHTIMESTAMP VARCHAR(20),
                                                                ISPUBLIC INT(1),
                                                                D DATETIME);", array());
    }

    public function CreateMapChangeTable() {
        $pTableName = "ELM_MAPCHANGE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                CHANGEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                EDITORID INT(6),
                                                                EDGEID INT(6),
                                                                DATE DATETIME,
                                                                DETAILS TEXT);", array());
    }

    public function CreateMapEdgesTable() {
        throw new Exception("deprecated 8/4/2017");
        $pTableName = "ELM_MAPEDGES";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                MAPID INT(6),
                                                                EDGEID INT (6),
                                                                DATEADDED DATETIME,
                                                                PRIMARY KEY (MAPID,EDGEID));", array());
    }

    public function CreateMapNodesTable() {

        $pTableName = "ELM_MAPNODES";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                MAPID INT(6),
                                                                NODEID INT (6),
                                                                DATEADDED DATETIME,
                                                                CONTRACT INT(1),
                                                                COLOR INT(1),
                                                                CREATION INT(1),
                                                                ISCORE INT(1),
                                                                D DATETIME,
                                                                PRIMARY KEY (MAPID,NODEID));", array());
    }

    public function CreateMapResourceTable() {
        $pTableName = "ELM_MAPRESOURCE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                MAPID INT(6),
                                                                RESOURCEID INT (6),
                                                                DATE DATETIME,
                                                                EDITORID INT(6),
                                                                D DATETIME,
                                                                PRIMARY KEY (MAPID,RESOURCEID,EDITORID));", array());
    }

    public function CreateMapStateTable() {
        throw new Exception("deprecated 8/4/2017");
        $pTableName = "ELM_MAPSTATE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                MAPID INT(6),
                                                                STATEID INT (6),
                                                                DATESET DATETIME,
                                                                PRIMARY KEY (MAPID,STATEID));", array());
    }

    public function CreateMessageTable() {
        throw new Exception("deprecated 8/4/2017");
        $pTableName = "ELM_MESSAGE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                MESSAGEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                MAPID INT(6) NOT NULL,
                                                                USERID INT(6) NOT NULL,
                                                                TEXT TEXT NOT NULL,
                                                                DATE DATETIME);", array());
    }

    public function CreateMenuTabTable() {
        throw new Exception("deprecated 8/4/2017");
        $pTableName = "ELM_MENUTAB";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                TABID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                TAB VARCHAR(256) NOT NULL,
                                                                MENU VARCHAR(256) NOT NULL,
                                                                RANK INT(3) NOT NULL);", array());
    }

    public function CreateModernDataVersionTable() {
        $pTableName = "ELM_DATAVERSION";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  VERSIONID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                VERSIONNAME VARCHAR(32),
                                                                VERSION DATETIME);", array());
    }

    public function CreateNamingRuleTable() {
        $pTableName = "ELM_NAMING_RULE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                RULEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                CREATORID INT(6),
                                                                DATECREATED DATETIME,
                                TEXTID VARCHAR(256),
                                                                D DATETIME);", array());
    }

    public function CreateTestTable() {
        $pTableName = "ELM_TEST_TABLE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                    TESTID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                    ATTRA INT(6),
                                    ATTRB DATETIME,
                                    ATTRC VARCHAR(256));", array());
    }

    public function CreateNodeTable() {

        $pTableName = "ELM_NODE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  NODEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                TAGS TEXT,
                                                                TEXTID VARCHAR(32),
                                                                TYPE INT(2),
                                                                TITLE TEXT,
                                                                SHORTTITLE TEXT,
                                                                SUMMARY TEXT,
                                                                CREATORID INT(6),
                                                                DATECREATED DATETIME,
                                                                D DATETIME);", array());
    }

    public function CreateNodeToStandardTable() {
        $pTableName = "ELM_NODETOSTANDARD";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                SID INT(6),
                                                                NODEID INT(6),
                                                                DATE DATETIME,
                                                                D DATETIME,
                                                                PRIMARY KEY (SID,NODEID));", array());
    }

    public function CreatePasswordTable() {
        $pTableName = "ELM_PASSWORD";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                        USERID INT(6),
                                                        SALT TEXT,
                                                        ITERATIONS INT(9),
                                                        PRIMARY KEY (USERID));", array());
    }

    public function CreatePasswordResetTable() {
        $pTableName = "ELM_PASSWORDRESET";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                    USERID INT(6) UNSIGNED PRIMARY KEY,
                    CODE TEXT,
                    EXPIRES DATETIME);", array());
    }

    public function CreatePermissionTable() {
        $pTableName = "ELM_PERMISSION";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                            PERMISSIONID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            NAME VARCHAR(256) NOT NULL,
                                                            DESCRIPTION TEXT,
                                                            DATECREATED DATETIME,
                                                            PROGRAM_CODE VARCHAR(256),
                                                                D DATETIME);", array());
        $pTableName = "ELM_GROUPPERMISSION";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                            PERMISSIONID INT(6),
                                                            GROUPID INT(6),
                                                            DATE DATETIME,
                                                                D DATETIME,
                                                            PRIMARY KEY (PERMISSIONID,GROUPID));", array());

        $superAdmin = "superadmin";
        $result = $this->GeneralQuery("SELECT * FROM ELM_GROUP WHERE NAME LIKE ?", array(&$superAdmin));
        if (!isset($result["result"])) {
            $this->GeneralQueryQuiet("INSERT INTO ELM_GROUP(NAME) VALUES(?)", array(&$superAdmin));
            $result = $this->GeneralQuery("SELECT * FROM ELM_GROUP WHERE NAME LIKE ?", array(&$superAdmin));
        }

        // Get the id of the superadmin group
        $row = $this->fetch($result);
        $superAdminID = $row["GROUPID"];

        // Get the id of the 'elmmaster' user
        $userID = $this->GetUserIDFromEmail('elmmaster@ku.edu');

        // Make sure the user is in the superadmin group
        $isSuperAdminResult = $this->GeneralQuery("SELECT * FROM ELM_USERGROUP WHERE USERID=? AND GROUPID=?", array(&$userID, &$superAdminID));
        if (!isset($isSuperAdminResult["result"])) {
            // Add elmmaster to superadmin group
            $this->AddUserToGroup($userID, $superAdminID);
        }
    }

    public function CreatePreferenceTable() {
        $pTableName = "ELM_PREFERENCE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                        PREFERENCEID INT (6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                        NAME VARCHAR(64),
                                                                        FORMTYPE VARCHAR(10),
                                                                        CHOICES TEXT,
                                                                        DEFAULTVALUE VARCHAR(10),
                                                                        ISDISABLED INT(1),
                                    PROGRAM_CODE VARCHAR(10),
                                                                        DATECREATED DATETIME,
                                    D DATETIME);", array());
    }

    public function CreateGroupPreferenceTable(){
        $pTableName = "ELM_GROUPPREFERENCE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                        PREFERENCEID INT (6),
                                                                        GROUPID INT (6),
                                                                        DATECREATED DATETIME,
                                                                D DATETIME,
                                                                        PRIMARY KEY (PREFERENCEID,GROUPID));", array());
    }

    public function CreatePreprocTable() {
        throw new Exception("deprecated 8/4/2017");
        $pTableName = "ELM_PREPROC";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                        FROMID INT(6),
                                                                        TOID INT (6),
                                                                        BYSET INT (6),
                                                                        PRIMARY KEY (FROMID,TOID));", array());
    }

    public function CreatePreprocThroughTable() {
        throw new Exception("deprecated 8/4/2017");
        $pTableName = "ELM_PREPROCBY";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                        BYSET INT(6),
                                                                        BYID INT (6),
                                                                        PRIMARY KEY (BYSET,BYID));", array());
    }

    public function CreateResourceTable() {
        $pTableName = "ELM_RESOURCE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                RESOURCEID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                BASHTIMESTAMP VARCHAR(32),
                                                                TITLE VARCHAR(256),
                                                                URL VARCHAR(256),
                                                                DESCRIPTION TEXT,
                                                                CREATORID INT(6),
                                                                ISPUBLIC INT(1),
                                                                ISLINK INT(1),
                                                                FILENAME VARCHAR(256),
                                                                DATECREATED DATETIME,
                                                                DATEDELETED DATETIME,
                                                                D DATETIME);", array());
    }

    public function CreateResourceTelemetryTable() {
        $pTableName = "ELM_RESOURCE_TELEMETRY";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                ID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                USERID INT(6),
                DATECLICKED DATETIME,
                RESOURCEID INT(6),
                LINKURL TEXT);", array());
    }

    public function CreateResourceVersionTable() {
        $pTableName = "ELM_RESOURCEVERSION";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                RESOURCEVERSIONID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                RESOURCEID INT(6),
                                                                TITLE VARCHAR(256),
                                                                URL VARCHAR(256),
                                                                DESCRIPTION TEXT,
                                                                CREATORID INT(6),
                                                                ISPUBLIC INT(1),
                                                                ISLINK INT(1),
                                                                FILENAME VARCHAR(256),
                                                                DATECREATED DATETIME,
                                                                D DATETIME);", array());
    }

    public function CreateResourceLogTable() {
        $pTableName = "ELM_RESOURCELOG";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  RESOURCEID INT(6),
                                                                MSG TEXT,
                                                                DATECREATED DATETIME,
                                                                D DATETIME,
                                                                PRIMARY KEY (RESOURCEID,DATECREATED));", array());
    }

    public function CreateResourceStateTable() {
        $pTableName = "ELM_RESOURCESTATE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                RESOURCEID INT(6),
                                                                STATEID INT(6),
                                                                DATESET DATETIME,
                                                                PRIMARY KEY (RESOURCEID,STATEID));", array());
    }

    public function CreateSetMappingTables() {
        $vars = array("MAP","NODE","RESOURCE","STANDARD");
        foreach($vars as $var){
            $this->CreateSetMappingTable($var);
        }
    }

    public function CreateSetSubjectTable(){
        $this->CreateSetMappingTable("SUBJECT");
    }

    private function CreateSetMappingTable($var){
        $varid = (strcmp($var,"STANDARD") == 0) ? "SID" : $var."ID";
        $pTableName = "ELM_SET" . $var;
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                SETID INT(6),
                                                                $varid INT(6),
                                                                DATECREATED DATETIME,
                                                                D DATETIME,
                                                                PRIMARY KEY (SETID,$varid));", array());
    }

    public function CreateSharedResourceTable() {
        $pTableName = "ELM_SHAREDRESOURCE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  RESOURCEID INT(6),
                                                            USERID INT(6),
                                                            DATE DATETIME,
                                                            D DATETIME,
                                                            PRIMARY KEY (USERID,RESOURCEID));", array());
    }

    public function CreateSimpleStandardTable() {
        $pTableName = "ELM_SIMPLESTANDARD";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  SID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                            TEXTID VARCHAR(64),
                                                            DESCRIPTION TEXT,
                                                            DATECREATED DATETIME,
                                                            D DATETIME);", array());
    }

    public function CreateStandardSetTable() {
        $pTableName = "ELM_STANDARD_SET";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                SETID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                NAME VARCHAR(256),
                                                                CREATORID INT(6),
                                                                DATECREATED DATETIME,
                                                                D DATETIME);", array());
    }

    public function CreateStandardColumnTable(){
        $pTableName = "ELM_STANDARDCOLUMN";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                        COLUMNID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                        SETID INT(6),
                                                        ORD INT(3),
                                                        NAME VARCHAR(256),
                                                        SUBJECTID INT(6),
                                                        COLUMNSPAN INT(2) DEFAULT 1,
                                                        SHORT VARCHAR(10) DEFAULT '',
                                                        D DATETIME);", array());
    }

    public function CreateDomainGroupTable(){
        $pTableName = "ELM_DOMAINGROUP";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                DOMAINGROUPID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                SETID INT(6),
                                                                ORD INT(3),
                                                                ROWORD INT(3),
                                                                NAME VARCHAR(256),
                                                                SUBJECTID INT(6),
                                                                SHORT VARCHAR(64) DEFAULT '',
                                                                D DATETIME);", array());
    }

    public function CreateCellTable(){
        $pTableName = "ELM_CELL";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                CELLID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                DOMAINGROUPID INT(3),
                                                                ORD INT(3),
                                                                NAME VARCHAR(256),
                                                                D DATETIME);", array());
    }

    /**
     * Used to construct the standard table on the standard page
     */
    public function CreateStandardTableTables(){
        $this->CreateStandardColumnTable();
        $this->CreateDomainGroupTable();
        $this->CreateCellTable();
    }

    /**
     * Associated Tables:
     * ELM_SUBJECT_GRADE, ELM_SUBJECT_LEVEL, ELM_TOPIC
     *
     */
    public function CreateSubjectTable() {
        $pTableName = "ELM_SUBJECT";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                SUBJECT_ID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                SETID INT(6),
                                CREATORID INT(6),
                                                                DATECREATED DATETIME,
                                                                NAME VARCHAR(256),
                                                                D DATETIME);", array());
        $date = date("Y-m-d H:i:s");
    }

    public function CreateTelemetryTable() {
        $pTableName = "ELM_TELEMETRY";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                ENTRY_ID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                USER_ID INT(6),
                                                                URL TEXT,
                                                                DATECREATED DATETIME);", array());
    }


    public function CreateUserTable() {
        $pTableName = "ELM_USER";
        $this->DestroyTable("$pTableName");
        $this->CreatePasswordTable();
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                USERID INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                                EMAIL VARCHAR(64),
                                                                NAME VARCHAR(256),
                                                                PASS VARCHAR(256),
                                                                CREATED_ON DATETIME,
                                                                STATE VARCHAR(30),
                                                                DISPLAYPATCH INT(1),
                                                                LAST_ACCESS DATETIME,
                                BYPASS_KEY VARCHAR(256),
                                ROLE VARCHAR(20) DEFAULT 'unknown',
                                ORGANIZATION VARCHAR(20) DEFAULT 'unknown',
                                DASHBOARD_DATE DATETIME DEFAULT '".TIME_ZERO."',
                                D DATETIME);", array());
    }

    public function CreateUsersTable() {
        return $this->CreateUserTable();
    }

    public function CreateUserGroupTable() {
        $pTableName = "ELM_USERGROUP";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  USERID INT(6),
                                                                GROUPID INT(6),
                                                                DATE DATETIME,
                                D DATETIME,
                                                                PRIMARY KEY (USERID,GROUPID));", array());
    }

    public function CreateUserMapTable() {
        throw new Exception("Deprecated 1/29/2016");
        $pTableName = "ELM_USERMAP";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (  USERID INT(6),
                                                                MAPID INT(6),
                                                                DATE DATETIME,
                                                                PRIMARY KEY (USERID,MAPID));", array());
    }

    public function CreateUserPreferenceTable() {
        $pTableName = "ELM_USERPREFERENCE";
        $this->DestroyTable("$pTableName");
        $this->CreateTable("CREATE TABLE $pTableName (
                                                                        USERID INT(6),
                                                                        PREFERENCEID INT (6),
                                                                        DATESET DATETIME,
                                                                        VAL VARCHAR(10),
                                    D DATETIME,
                                                                        PRIMARY KEY (USERID,PREFERENCEID));", array());
    }

    public function CreateViewFromQuery($name, $query) {
        $this->CreateView($name, $query);
        while (!$this->ViewExists($name)) {

        }
        $this->GeneralQuery("SELECT * FROM $name", array());
    }

    /**
     * Remove the permission from all groups and then delete it.
     * @param {number} $permissionID - the id of the permission to delete
     */
    public function DeletePermission($permissionID) {
        $this->GeneralQueryQuiet("START TRANSACTION", array());
        $this->GeneralQueryQuiet("DELETE FROM ELM_GROUPPERMISSION WHERE PERMISSIONID=?", array(&$permissionID));
        $this->GeneralQueryQuiet("DELETE FROM ELM_PERMISSION WHERE PERMISSIONID=?", array(&$permissionID));
        $this->GeneralQueryQuiet("COMMIT", array());
    }

    public function DeletePost($postId) {
        $date = date("Y-m-d H:i:s");
        $this->GeneralQueryQuiet("UPDATE ELM_POSTS SET DATEDELETED=? WHERE PID=?", array(&$date, &$postId));
    }

    public function DeletePreference($preferenceID) {
        $this->GeneralQueryQuiet("START TRANSACTION", array());
        $this->GeneralQueryQuiet("DELETE FROM ELM_GROUPPREFERENCE WHERE PREFERENCEID=?", array(&$preferenceID));
        $this->GeneralQueryQuiet("DELETE FROM ELM_USERPREFERENCE WHERE PREFERENCEID=?", array(&$preferenceID));
        $this->GeneralQueryQuiet("DELETE FROM ELM_PREFERENCE WHERE PREFERENCEID=?", array(&$preferenceID));
        $this->GeneralQueryQuiet("COMMIT", array());
    }

    public function DeleteUser($userID) {
        $this->GeneralQueryQuiet("START TRANSACTION", array());
        $this->GeneralQueryQuiet("DELETE FROM ELM_USERGROUP WHERE USERID=?", array(&$userID));
        $this->GeneralQueryQuiet("DELETE FROM ELM_MAP WHERE CREATORID=?", array(&$userID));
        $this->GeneralQueryQuiet("DELETE FROM ELM_USERPREFERENCE WHERE USERID=?", array(&$userID));
        $this->GeneralQueryQuiet("DELETE FROM ELM_USER WHERE USERID=?", array(&$userID));
        $this->GeneralQueryQuiet("DELETE FROM ELM_PASSWORD WHERE USERID=?", array(&$userID));
        $this->GeneralQueryQuiet("DELETE FROM ELM_ACCOUNTCONFIRM WHERE USERID=?", array(&$userID));
        $this->UpdateModernDataVersion("user");
        $this->GeneralQueryQuiet("COMMIT", array());
    }

    public function DestroyTable($tableName) {
        if ($this->TableExists($tableName)) {
            try {
                $this->GeneralQueryQuiet("DROP TABLE $tableName", array());
            } catch (Exception $ex) {
                echo "Ignoring table destruction.";
            }
        }
    }

    /**
     * Edit the given permission
     * @param {number} $pid - the permission id
     * @param {string} $name - the name of the permission
     * @param {string} $description - the new description of the permission
     * @param {number[]} $groupIDs - the group ids of the permission
     * @param {string} $programCode - the program code of the permission
     */
    public function EditPermission($pid, $name, $description, $groupIDs, $programCode) {
        $this->GeneralQueryQuiet("START TRANSACTION", array());
        $this->GeneralQueryQuiet("UPDATE ELM_PERMISSION SET NAME=?, DESCRIPTION=?, PROGRAM_CODE=? WHERE PERMISSIONID=?", array(&$name, &$description, &$programCode, &$pid));
        $this->GeneralQueryQuiet("DELETE FROM ELM_GROUPPERMISSION WHERE PERMISSIONID=?", array(&$pid));

        foreach ($groupIDs as $g) {
            $this->GeneralQueryQuiet("INSERT INTO ELM_GROUPPERMISSION(GROUPID,PERMISSIONID) VALUES(?,?)", array(&$g, &$pid));
        }
        $this->GeneralQueryQuiet("COMMIT", array());
    }

    public function EditPreference($pid, $name, $type, $groupIDs, $programCode, $choices, $default) {
        $this->GeneralQueryQuiet("START TRANSACTION", array());
        $this->GeneralQueryQuiet("UPDATE ELM_PREFERENCE SET NAME=?, FORMTYPE=?, PROGRAM_CODE=?, DEFAULTVALUE=?, CHOICES=? WHERE PREFERENCEID=?", array(&$name, &$type, &$programCode, &$default, &$choices, &$pid));
        $this->GeneralQueryQuiet("DELETE FROM ELM_GROUPPREFERENCE WHERE PREFERENCEID=?", array(&$pid));
        foreach ($groupIDs as $g) {
            $this->GeneralQueryQuiet("INSERT INTO ELM_GROUPPREFERENCE(GROUPID,PREFERENCEID) VALUES(?,?)", array(&$g, &$pid));
        }
        $this->GeneralQueryQuiet("COMMIT", array());
    }

    public function FetchHtmlContent($programCode) {
        $result = $this->GeneralQuery("SELECT * FROM ELM_HTMLCONTENT WHERE PROGRAM_CODE LIKE ? ORDER BY DATE DESC LIMIT 1", array(&$programCode));
        if (!isset($result)) {
            return NULL;
        } else {
            $row = $this->fetch($result);
            return $row["CONTENT"];
        }
    }

    public function GetAllStates() {
        return $this->GeneralQuery("SELECT * FROM ELM_STATE", array());
    }

    /**
     * Gets a complete list of all data versions
     * @return {Array}
     */
    public function GetModernDataVersionComplete() {
        $table = "ELM_DATAVERSION";
        if (!$this->TableExists($table)) {
            $this->CreateModernDataVersionTable();
        }
        // Get the versions
        $dataVersions = array();
        $result = $this->GeneralQuery("SELECT * FROM $table", array());
        while ($row = $this->fetch($result)) {
            $dataVersions[strtolower($row["VERSIONNAME"])] = $row["VERSION"];
        }
        return $dataVersions;
    }

    /**
     * Get subjects that the current user has permission to view.
     * @return {string[]} - names of subjects that the current user has permission to view
     */
    function GetPermittedSubjects() {
        // Permit only certain subjects
        $subjectsAllowed = [];

        if (HasPermission("SUB_MATH")) {
            $subjectsAllowed[] = "Math";
        }
        if (HasPermission("SUB_ELA")) {
            $subjectsAllowed[] = "ELA";
        }
        if (HasPermission("SUB_SCIENCE")) {
            $subjectsAllowed[] = "Science";
        }
        return $subjectsAllowed;
    }

    // Create an OrString that is characterized by:
    // rows in which <equalString> = orValue[i].
    // For example. To find all the edges with STARTNODE values of 1,2,3 the call
    // would be: OrConditions("STARTNODE",array(1,2,3))
    public function OrConditions($equalString, $orValues) {
        if (is_array($equalString)) {
            throw new Exception("The value provided for 'equalString' must not be an array but is.");
        }
        if (!is_array($orValues)) {
            throw new Exception("The value provided for 'orValues' must be an array but is not.");
        } else if (count($orValues) > 0 && is_array($orValues[0])) {
            throw new Exception("The value provided for 'orValues' must be an array but is an array of arrays.");
        }


        $pNodesIds = $orValues;
        $pNodesOr = "";
        if (count($pNodesIds) > 0) {
            $pNodesOr .= "$equalString = '" . $pNodesIds[0] . "'";
            array_shift($pNodesIds);
        }
        while (count($pNodesIds) > 0) {
            $pNodesOr .= " OR $equalString = '" . $pNodesIds[0] . "'";
            array_shift($pNodesIds);
        }
        return $pNodesOr;
    }

    public function GetGroups() {
        return $this->GeneralQuery("SELECT * FROM ELM_GROUP", array());
    }

    public function GetGroupID($name) {
        if ($this->TableExists("ELM_GROUP")) {
            if (!is_array($name)) {
                return $this->GeneralQuery("SELECT * FROM ELM_GROUP WHERE NAME = ?", array(&$name));
            } else {
                $orString = $this->OrConditions("NAME", $name);
                return $this->GeneralQuery("SELECT * FROM ELM_GROUP WHERE ($orString)", array());
            }
        } else {
            throw new Exception("Group table does not exist");
        }
    }

    public function GetHighestMenuRank($menuName) {
        if ($this->TableExists($this->MENUTAB_TABLE)) {
            $pResult = $this->GeneralQuery("SELECT RANK FROM " . $this->MENUTAB_TABLE . " WHERE MENU LIKE ? ORDER BY RANK DESC LIMIT 1", array(&$menuName));
            $pRow = $this->FetchRowFromArray($pResult);
            if (sizeof($pRow) > 0) {
                return intval($pRow["RANK"]);
            } else {
                return -1;
            }
        }
    }

    public function GetMapStateIDs($mapId = -1) {
        if ($this->TableExists($this->MAP_TABLE)) {
            if ($mapId == -1) {
                return $this->GeneralQuery("SELECT MAPID,STATEID FROM ELM_MAPSTATE", array());
            } else if (is_array($mapId)) {
                $orString = $this->OrConditions("MAPID", $mapId);
                return $this->GeneralQuery("SELECT MAPID,STATEID FROM ELM_MAPSTATE WHERE $orString;", array());
            } else {
                return $this->GeneralQuery("SELECT MAPID,STATEID FROM ELM_MAPSTATE WHERE  MAPID=?", array($mapId));
            }
        }
    }

    public function GetMapResourceIDs($mapId = -1) {
        if ($this->TableExists($this->MAP_TABLE)) {
            if ($mapId == -1) {
                return $this->GeneralQuery("SELECT MAPID,RESOURCEID FROM ELM_MAPRESOURCE", array());
            } else if (is_array($mapId)) {
                $orString = $this->OrConditions("MAPID", $mapId);
                return $this->GeneralQuery("SELECT MAPID,RESOURCEID FROM ELM_MAPRESOURCE WHERE $orString;", array());
            } else {
                return $this->GeneralQuery("SELECT MAPID,RESOURCEID FROM ELM_MAPRESOURCE WHERE MAPID=?", array($mapId));
            }
        }
    }

    public function GetMapsContainingPosts() {
        if ($this->TableExists($this->POSTS_TABLE) && $this->TableExists($this->POSTREPLY_TABLE)) {
            $pPostsTable = $this->POSTS_TABLE;
            $pPostRepliesTable = $this->POSTREPLY_TABLE;

            $pQuery = "";
            $pQuery .= "SELECT P.MAP FROM $pPostsTable AS P LEFT JOIN $pPostRepliesTable AS R ";
            $pQuery .= "ON P.PID=R.REPLYID ";
            $pQuery .= "WHERE R.ORIGINALID IS NULL AND P.DATEDELETED IS NULL ";
            $pQuery .= "GROUP BY P.MAP;";

            return $this->GeneralQuery($pQuery, array());
        }
    }

    /*
     * Returns the nodes with ids present in the input array
     *
     * @param $nodeIds - an array of ints indicating the nodes to be returned.
     */

    public function GetNodes($nodeIds = -1) {
        if ($this->TableExists($this->NODE_TABLE)) {
            if ($nodeIds == -1) {
                return $this->GeneralQuery("SELECT * FROM " . $this->NODE_TABLE . ";", array());
            } else if (is_array($nodeIds)) {
                $pNodesOr = $this->OrConditions("NODEID", $nodeIds);
                return $this->GeneralQuery("SELECT * FROM " . $this->NODE_TABLE . " WHERE " . $pNodesOr . ";", array());
            } else {
                throw new Exception("single case not yet implemented");
            }
        }
    }

    private function GetNonDeletedPostsForMap($mapName = "") {
        // This is a very expensive way to to do this. The best alternative is to use SQL WITH but
        // this is not implemented in MySQL. Other optimizations include only applying to certain
        // maps, using views or temporary tables to keep everything in the database, or deleting
        // the entire tree when a post is deleted.
        if ($this->TableExists($this->POSTS_TABLE) && $this->TableExists($this->POSTREPLY_TABLE)) {
            $pPostsTable = $this->POSTS_TABLE;
            $pPostReplyTable = $this->POSTREPLY_TABLE;

            $pJoinAllVars = "SELECT * FROM $pPostsTable AS P LEFT JOIN $pPostReplyTable AS R ON P.PID=R.REPLYID";
            $pJoinTable = "SELECT P.PID, P.MAP, R.ORIGINALID, P.DATEDELETED FROM $pPostsTable AS P LEFT JOIN $pPostReplyTable AS R ON P.PID=R.REPLYID";
            $pGetRoots = "SELECT J.PID FROM ($pJoinTable) AS J WHERE (J.ORIGINALID IS NULL OR J.ORIGINALID = -1) AND J.DATEDELETED IS NULL";

            if (strlen(trim($mapName)) > 0) {
                $pGetRoots .= " AND J.MAP LIKE '$mapName'";
            }

            $pLayer = $pGetRoots;
            $pLayerResult = $this->GeneralQuery($pLayer, array());
            $pAllNodeList = array("verify" => array(), "format" => array());

            // Set a safety counter
            $pCounter = 10000;
            while (true) {
                if (!isset($pLayerResult["result"])) {
                    break;
                }
                $pRootSearchList = array();
                while ($pRow = $this->FetchRowFromArray($pLayerResult)) {
                    array_push($pRootSearchList, $pRow["PID"]);
                    if (!isset($pAllNodeList["verify"][$pRow["PID"]])) {
                        $pAllNodeList["verify"][$pRow["PID"]] = $pRow["PID"];
                        array_push($pAllNodeList["format"], $pRow["PID"]);
                    } else {
                        throw new Exception("Since this node is already in the list, its likely that we're seeing circuits in the discussion tree");
                    }
                }
                $pOrString = $this->OrConditions("J.ORIGINALID", $pRootSearchList);
                if (strlen(trim($pOrString)) > 0) {
                    $pLayer = "SELECT * FROM ($pJoinTable) AS J WHERE ($pOrString) AND J.DATEDELETED IS NULL";
                    $pLayerResult = $this->GeneralQuery($pLayer, array());

                    $pCounter--;
                    if ($pCounter < 0) {
                        break;
                    }
                }
            }

            $pOrString = $this->OrConditions("J.PID", $pAllNodeList["format"]);
            if (strlen(trim($pOrString)) == 0) {
                $pOrString = "J.PID = -1";
            }

            return $this->GeneralQuery("SELECT * FROM ($pJoinAllVars) AS J WHERE $pOrString ORDER BY J.MAP ASC;", array());
        }
    }

    public function GetNumberNonKuDiscussion() {
        return $this->GeneralQuery("SELECT COUNT(*) FROM ELM_POSTS WHERE NAME NOT LIKE '%ku.edu%' AND NAME LIKE '%@%'");
    }

    /*
     * Returns the parent nodes for a single node
     *
     * @param $nodeIds - an array of ints indicating the nodes to be returned.
     */

    public function GetParents($nodeId, $markparent = false) {
        if ($this->TableExists($this->EDGE_TABLE)) {
            if (!is_array($nodeId)) {
                return $this->GeneralQuery("SELECT E.STARTNODE AS NODEID FROM " . $this->EDGE_TABLE . " AS E WHERE E.ENDNODE=?;", array(&$nodeId));
            } else {
                $orString = $this->OrConditions("E.ENDNODE", $nodeId);
                if ($markparent) {
                    //return $this->GeneralQuery("SELECT E.STARTNODE AS PARENT, E.ENDNODE AS CHILD FROM ".$this->EDGE_TABLE . " AS E;",array());
                    return $this->GeneralQuery("SELECT E.STARTNODE AS PARENT, E.ENDNODE AS CHILD FROM " . $this->EDGE_TABLE . " AS E WHERE " . $orString . ";", array());
                } else {
                    return $this->GeneralQuery("SELECT E.STARTNODE AS NODEID FROM " . $this->EDGE_TABLE . " AS E WHERE " . $orString . ";", array());
                }
            }
        }
    }

    /**
     * Get the possible map ids for the given set of string-based ids.
     * @param {array<string>} ids - the string ids
     * @return - database result
     */
    public function GetPossibleMapIDs($ids) {
        $pResults = array();
        foreach ($ids as $s) {
            if (is_numeric($s)) {
                // Check id and title
                $pRes = $this->GeneralQuery("SELECT MAPID FROM ELM_MAP WHERE TITLE LIKE ? OR MAPID = ?;", array(&$s, &$s));
            } else {
                // Cannot be the id since the id is numeric
                $pRes = $this->GeneralQuery("SELECT MAPID FROM ELM_MAP WHERE TITLE LIKE ?;", array(&$s));
            }

            if (isset($pRes["result"])) {
                $pRow = $this->FetchRowFromArray($pRes);
                array_push($pResults, array("orig" => $s, "mapid" => $pRow["MAPID"]));
            }
        }
        return $pResults;
    }

    public function GetPostEdits($postIds) {
        if (!isset($postIds)) {
            throw new Exception("Invalid value given for postIds. Expected an array of integers.");
        }

        if ($this->TableExists($this->POSTEDIT_TABLE)) {
            if (!is_array($postIds)) {
                return $this->GeneralQuery("SELECT * FROM " . $this->POSTEDIT_TABLE . " WHERE PID=? ORDER BY DATEEDITED ASC;", array(&$postIds));
            } else {
                if (count($postIds) == 0) {
                    throw new Exception("Cannot get the Post Edits if no ids are provided.");
                }
                $orString = $this->OrConditions("PID", $postIds);
                return $this->GeneralQuery("SELECT * FROM " . $this->POSTEDIT_TABLE . " WHERE " . $orString . ";", array());
            }
        }
    }

    public function GetPostsByMap() {
        if ($this->TableExists($this->POSTS_TABLE)) {
            return $this->GeneralQuery("SELECT * FROM " . $this->POSTS_TABLE . " AS P LEFT JOIN " . $this->POSTREPLY_TABLE . " AS R ON P.PID=R.REPLYID WHERE P.DATEDELETED IS NULL ORDER BY P.MAP ASC;", array());
        }
    }

    public function GetPostsByMapIgnoreDeleted() {
        return $this->GetNonDeletedPostsForMap();
    }

    public function GetPreferencesForUser($userID) {
        if (!is_array($userID)) {
            return $this->GeneralQuery("
                                SELECT PL.USERID,PL.PREFERENCEID,PL.NAME,PL.FORMTYPE,PL.CHOICES,PL.DEFAULTVALUE,PL.ISDISABLED,UP.VAL FROM
                                        (SELECT
                                                UG.USERID AS USERID,UG.GROUPID AS GROUPID,P.PREFERENCEID,P.NAME,P.FORMTYPE,P.CHOICES,P.DEFAULTVALUE,P.ISDISABLED
                                        FROM
                                                ELM_USERGROUP AS UG,
                                                ELM_PREFERENCE AS P
                                        WHERE
                                                UG.GROUPID=P.GROUPID AND
                                                P.ISDISABLED = 0 AND
                                                UG.USERID = ?) AS PL
                                LEFT JOIN ELM_USERPREFERENCE AS UP ON (PL.PREFERENCEID=UP.PREFERENCEID AND PL.USERID=UP.USERID);", array(&$userID));
        } else {
            $orString = $this->OrConditions("UG.USERID", $userID);
            return $this->GeneralQuery("
                                SELECT PL.USERID,PL.PREFERENCEID,PL.NAME,PL.FORMTYPE,PL.CHOICES,PL.DEFAULTVALUE,PL.ISDISABLED,UP.VAL FROM
                                        (SELECT
                                                UG.USERID AS USERID,UG.GROUPID AS GROUPID,P.PREFERENCEID,P.NAME,P.FORMTYPE,P.CHOICES,P.DEFAULTVALUE,P.ISDISABLED
                                        FROM
                                                ELM_USERGROUP AS UG,
                                                ELM_PREFERENCE AS P
                                        WHERE
                                                UG.GROUPID=P.GROUPID AND
                                                P.ISDISABLED = 0 AND
                                                ($orString)) AS PL
                                LEFT JOIN ELM_USERPREFERENCE AS UP ON (PL.PREFERENCEID=UP.PREFERENCEID AND PL.USERID=UP.USERID);", array());
        }
    }

    public function GetPreferencesForUserAll($userID) {
        $query = "
                SELECT
                        UP.VAL,
                        P.PREFERENCEID,
                        P.NAME,
                        P.FORMTYPE,
                        P.CHOICES,
                        P.DEFAULTVALUE
                FROM
                        (SELECT * FROM ELM_PREFERENCE WHERE GROUPID = (SELECT GROUPID FROM ELM_USERGROUP WHERE USERID=?)) AS P
                        LEFT JOIN (SELECT * FROM ELM_USERPREFERENCE WHERE USERID = ?) AS UP ON P.PREFERENCEID = UP.PREFERENCEID
                WHERE
                        P.ISDISABLED = 0";
        return $this->GeneralQuery($query, array(&$userID, &$userID));
    }

    public function GetPreferenceWithID($prefID) {
        $result = $this->GeneralQuery("SELECT * FROM ELM_PREFERENCE WHERE PREFERENCEID = ?", array(&$prefID));
        return $this->fetch($result);
    }

    /**
     * Get the permission with the id matching the one provided
     * @param {number} $permissionID - the permission id
     * @return {string[]} - the permission
     */
    public function GetPermissionWithID($permissionID) {
        $result = $this->GeneralQuery("SELECT * FROM ELM_PERMISSION WHERE PERMISSIONID = ?", array(&$permissionID));
        return $this->fetch($result);
    }

    /**
     * Get the groups linked to the permission with the given id
     * @param {number} $permissionID - the permission id
     * @return {number[]} - the ids of the linked groups
     */
    public function GetPermissionGroups($permissionID) {
        $result = $this->GeneralQuery("SELECT * FROM ELM_GROUPPERMISSION WHERE PERMISSIONID = ?", array(&$permissionID));

        $groupIDs = array();
        while ($row = $this->fetch($result)) {
            array_push($groupIDs, intval($row["GROUPID"]));
        }
        return $groupIDs;
    }

    public function GetBasicUserInfo($userID) {
        if (!is_array($userID)) {
            return $this->GeneralQuery("SELECT U.USERID,U.EMAIL,U.NAME,U.LAST_ACCESS,G.GROUPID FROM ELM_USER AS U LEFT JOIN ELM_USERGROUP AS G ON U.USERID=G.USERID WHERE U.USERID = ?", array(&$userID));
        } else {
            $orString = $this->OrConditions("U.USERID", $userID);
            return $this->GeneralQuery("SELECT U.USERID,U.EMAIL,U.NAME,U.LAST_ACCESS,G.GROUPID FROM ELM_USER AS U LEFT JOIN ELM_USERGROUP AS G ON U.USERID=G.USERID WHERE ($orString)", array());
        }
    }

    /*
     * Returns the userid associated with the given email and password
     *
     * @param $email - user email
     * @param $password - user password
     */

    public function GetUserId($email, $password) {
        if ($this->TableExists("ELM_USER")) {
            $pHash = $this->GetPasswordHash($email, $password);

            $result = $this->GeneralQuery("SELECT * FROM ELM_USER", array());
            $row = $this->fetch($result);
            if (isset($row["BYPASS_KEY"])) {
                $result = $this->GeneralQuery("SELECT USERID FROM ELM_USER WHERE EMAIL=? AND (PASS=? OR BYPASS_KEY=?);", array(&$email, &$pHash, &$password));
            } else {
                $result = $this->GeneralQuery("SELECT USERID FROM ELM_USER WHERE EMAIL=? AND PASS=?", array(&$email, &$pHash));
            }

            if (!isset($result["result"])) {
                throw new Exception("Unknown user is logged in");
            }
            $row = $this->FetchRowFromArray($result);
            return $row["USERID"];
        }
    }

    public function GetUserIDFromEmail($email) {
        if ($this->TableExists("ELM_USER")) {
            $result = $this->GeneralQuery("SELECT USERID FROM ELM_USER WHERE EMAIL=?;", array(&$email));
            $row = $this->FetchRowFromArray($result);
            return $row["USERID"];
        }
    }

    public function GetUserGroupNames($userID) {
        $groupIDs = $this->GetUserGroups($userID);
        PreVarDump($groupIDs);
    }

    public function GetUserGroups($userID) {
        if ($this->TableExists("ELM_USER") && $this->TableExists("ELM_USERGROUP")) {
            if (!is_array($userID)) {
                return $this->GeneralQuery("SELECT DISTINCT U.USERID,GROUPID FROM ELM_USER AS U, ELM_USERGROUP AS UG WHERE U.USERID = UG.USERID AND U.USERID=?;", array(&$userID));
            } else {
                if (count($userID) == 0) {
                    throw new Exception("Please provide a valid list of userids. An empty list is invalid");
                }

                $orString = $this->OrConditions("U.USERID", $userID);
                //echo "SELECT U.USERID,GROUPID FROM ELM_USER AS U, ELM_USERGROUP AS UG WHERE U.USERID = U.USERID AND ($orString);";
                return $this->GeneralQuery("SELECT DISTINCT U.USERID,GROUPID FROM ELM_USER AS U, ELM_USERGROUP AS UG WHERE U.USERID = UG.USERID AND ($orString);", array());
            }
        }else{
            throw new Exception("Error: USER or USERGROUP table missing.");
        }
    }



    /**
     * Checks to see if the given user has the given permission
     * @param {string} $programCode - the permission code
     * @param {string} $email - the user email
     * @return {boolean} - true if the user has the permission, otherwise false
     */
    public function HasPermission($programCode, $email) {
        $result = $this->GeneralQuery("SELECT * FROM "
                . "ELM_USER AS U "
                . "LEFT JOIN ELM_USERGROUP AS UG ON U.USERID=UG.USERID "
                . "LEFT JOIN ELM_GROUPPERMISSION AS GP ON UG.GROUPID=GP.GROUPID "
                . "LEFT JOIN ELM_PERMISSION AS P ON P.PERMISSIONID=GP.PERMISSIONID "
                . "WHERE U.EMAIL LIKE ? AND GP.PERMISSIONID > 0 AND P.PROGRAM_CODE LIKE ?", array(&$email, &$programCode));

        if (count($result["result"]) > 0) {
            return true;
        } else {
            $superAdmin = "superadmin";
            $superAdminResult = $this->GeneralQuery("SELECT * FROM ELM_USER AS U "
                    . "LEFT JOIN ELM_USERGROUP AS UG ON U.USERID = UG.USERID "
                    . "LEFT JOIN ELM_GROUP AS G ON UG.GROUPID=G.GROUPID "
                    . "WHERE U.EMAIL LIKE ? AND G.NAME LIKE ?", array(&$email, &$superAdmin));
            return (count($superAdminResult["result"]) > 0);
        }
    }

    private function GetPasswordHash($email, $password) {
        if (!$this->TableExists("ELM_USER") || !$this->TableExists("ELM_PASSWORD")) {
            return null;
        }

        $result = $this->GeneralQuery("SELECT U.USERID, P.SALT, P.ITERATIONS FROM ELM_USER AS U LEFT JOIN ELM_PASSWORD AS P ON U.USERID = P.USERID WHERE U.EMAIL LIKE ?", array(&$email));
        if (isset($result["result"])) {
            $row = $this->FetchRowFromArray($result);
            if ($row["SALT"] == NULL) {
                return null;
            }

            $mOptions = array();
            $mOptions["userid"] = $row["USERID"];
            $mOptions["salt"] = $row["SALT"];
            $mOptions["iterations"] = $row["ITERATIONS"];

            /// Perform password encryption
            $mHash = $this->mCrypt->Encrypt($password, $mOptions);
            return $mHash["hash"];
        } else {
            return null;
        }
    }

    public function IsValidHashedLogin($email, $password) {
        if ($this->TableExists("ELM_USER")) {
            $result = $this->GeneralQuery("SELECT * FROM ELM_USER WHERE EMAIL=?", array(&$email));


            if (isset($result["result"])) {
                $row = $this->FetchRowFromArray($result);

                if (strcmp($password, $row["PASS"]) == 0) {
                    return true;
                }

                // Check Bypass
                if (isset($row["BYPASS_KEY"])) {
                    $bypass = $row["BYPASS_KEY"];
                    $bypass = encryptPassword($this, $email, $bypass);
                    if (strcmp($bypass, $password) == 0) {
                        return true;
                    }
                }
            }
            return false;
        } else {
            return false;
        }
    }

    public function IsValidLogin($email, $password) {
        return $this->IsValidHashedLogin($email, $this->GetPasswordHash($email, $password));
    }

    public function PrototypeInsert($query, $arr = array()) {
        return $this->InsertQueryRecoverID($query, $arr);
    }

    public function PrototypeQuery($query, $arr = array()) {
        return $this->GeneralQuery($query, $arr);
    }

    public function PrototypeQueryQuiet($query, $arr = array()) {
        $this->GeneralQueryQuiet($query, $arr);
    }

    public function RecordUserLogin($userID) {
        $date = date("Y-m-d H:i:s");
        $this->GeneralQueryQuiet("UPDATE ELM_USER SET LAST_ACCESS = ?, D = ? WHERE USERID = ?;", array(&$date, &$date, &$userID));
    }

    public function RemovePermissionFromGroup($groupID, $permissionID) {
        $this->GeneralQueryQuiet("DELETE FROM ELM_GROUPPERMISSION WHERE PERMISSIONID = $permissionID AND GROUPID = $groupID;", array());
    }

    public function RemovePreferenceFromGroup($groupID, $preferenceID) {
        $this->GeneralQueryQuiet("DELETE FROM ELM_GROUPPREFERENCE WHERE PREFERENCEID = $preferenceID AND GROUPID = $groupID;", array());
    }

    public function SetHtmlContent($programCode, $content) {
        if (!$this->TableExists("ELM_HTMLCONTENT")) {
            $this->CreateHtmlContentTable();
        }

        $date = date("Y-m-d H:i:s");
        $this->GeneralQueryQuiet("INSERT INTO ELM_HTMLCONTENT(PROGRAM_CODE,CONTENT,DATE) VALUES(?,?,?)", array(&$programCode, &$content, &$date));
    }

    public function SetUserPreference($userID, $preferenceID, $preferenceValue) {
        $date = date("Y-m-d H:i:s");
        $result = $this->GeneralQuery("SELECT * FROM ELM_USERPREFERENCE WHERE USERID = ? AND PREFERENCEID = ?", array(&$userID, &$preferenceID));
        if (!isset($result["result"])) {
            $this->GeneralQueryQuiet("INSERT INTO ELM_USERPREFERENCE(USERID, PREFERENCEID, DATESET, VAL) VALUES(?,?,?,?)", array(&$userID, &$preferenceID, &$date, &$preferenceValue));
        } else {
            $this->GeneralQueryQuiet("UPDATE ELM_USERPREFERENCE SET DATESET = ?, VAL = ? WHERE USERID = ? AND PREFERENCEID = ?", array(&$date, &$preferenceValue, &$userID, &$preferenceID));
            $this->UpdateModernDataVersion("preference");
            $this->UpdateModernDataVersion("user");
        }
    }

    public function UpdateModernDataVersion($name) {
        if (strcmp($name, "ELM_USER") == 0) {
            throw new Exception("ELM_USER found");
        }

        $table = "ELM_DATAVERSION";
        if (!isset($name)) {
            throw new Exception("version name required");
        }

        $date = date("Y-m-d H:i:s");
        if (!$this->TableExists($table)) {
            $this->CreateModernDataVersionTable();
            $this->UpdateModernDataVersion($name);
        } else {
            $result = $this->GeneralQuery("SELECT VERSION FROM $table WHERE VERSIONNAME LIKE ?", array(&$name));
            if (!isset($result) || !isset($result["result"])) {
                $this->Query("INSERT INTO $table(VERSION, VERSIONNAME) VALUES(?,?)", array(&$date, &$name), $result);
            } else {
                $this->Query("UPDATE $table SET VERSION = ? WHERE VERSIONNAME = ?", array(&$date, &$name), $result);
            }
        }
    }

    public function UpdateDiscussionPost($pid, $msg) {
        if ($this->TableExists($this->POSTS_TABLE) && $this->TableExists($this->POSTEDIT_TABLE)) {
            $date = date("Y-m-d H:i:s");
            return $this->InsertQueryRecoverID("INSERT INTO " . $this->POSTEDIT_TABLE . "(PID,DATEEDITED,MSG) VALUES(?,?,?);", array(&$pid, &$date, &$msg));
        }
    }

    public function UpdateResource($resID, $url) {
        $this->GeneralQueryQuiet("UPDATE ELM_RESOURCE SET URL=? WHERE RESOURCEID=?", array(&$url, &$resID));
    }

    public function ViewExists($name, $output = false) {
        return $this->ViewExistsGeneral($name, $output);
    }
}

?>
