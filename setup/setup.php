<?php
    // Dumping mariadb for Import to a mysql database:
    // mysqldump -u root -p --skip-triggers --databases elm_release elm_debug > elm_all_mmddyyyy.sql

    require_once("./database/core.php");

    // Define constants
    define("ELM_USER", "elm_debug_user");

    // Set up an array to serve as a log.
    $log = array();

    // Get the sql files in root folder
    $pageStartTime = microtime(true);
    $startTime = microtime(true);
    $sqlExtensionFiles = array();
    $dir = "./";
    $cdir = scandir($dir);

    // Log time taken to scan the director
    $elapsed = microtime(true) - $startTime;
    $log[] = "Scan files. (" . $elapsed . " s)";
    $startTime = microtime(true);

    foreach ($cdir as $key => $value) {
        if (!in_array($value, array(".", ".."))) {
            if (!is_dir($dir . DIRECTORY_SEPARATOR . $value)) {
                $pieces = explode(".", $value);
                $lastPiece = $pieces[count($pieces) - 1];
                if($lastPiece == "sql"){
                    $sqlExtensionFiles[] = $value;
                }
            }
        }
    }
    $elapsed = microtime(true) - $startTime;
    $log[] = "Scan for sql files. (" . $elapsed . " s)";

    // Uncomment to see the list of files in the root folder with the 'sql' extension
    //PreVarDump($sqlExtensionFiles);

    // Source: https://stackoverflow.com/questions/15461765/check-if-username-exist-activated-in-database-using-mysqli
    function SqlUserExists($connection, $user, $host){
        $result = mysqli_query($connection, "SHOW GRANTS FOR '$user'@'$host'");
        return (mysqli_errno($connection) != 1141);
        PreVarDump($result);
        $err = mysqli_error($connection);
        if($err != ""){
            echo $err;
            echo mysqli_errno($connection);
        }
        return mysqli_num_rows($result) > 0;
    }

    /**
     * Perform an sql query. If an error occurs then display the
     * given log along with the error code and description before
     * exiting the program.
     * @param {object} link - the mysqli connection
     * @param {string} query - the query to execute
     * @param {string[]} log - the log
     */
    function DebugQuery($link, $query, $log = []){
        mysqli_query($link, $query);
        $errno = mysqli_errno($link);
        if($errno != 0){
            if(count($log) > 0){
                PreVarDump($log);
            }
            echo "[$errno]: " . mysqli_error($link);
            exit;
        }
    }

    
    $host = "localhost";
    $pass = "";
    $path = "";
    $databaseFile = null;
    $errors = [
        "host" => false,
        "pass" => false,
        "sqlpath" => false,
        "elmpass" => false
    ];
    $elmDatabasePw = null;
    $overwriteConflict = false;
    $importDatabase = false;     // Indicates whether or not the database should be imported asynchrounously

    if(isset($_POST["sql-host"])){
        // Uncomment to see all posted variables.
        PreVarDump($_POST);

        $host = filter_input(INPUT_POST, "sql-host", FILTER_SANITIZE_STRING);
        $pass = filter_input(INPUT_POST, "root-password", FILTER_SANITIZE_STRING);
        $path = filter_input(INPUT_POST, "sql-path", FILTER_SANITIZE_STRING);
        $databaseFile = filter_input(INPUT_POST, "database-file", FILTER_SANITIZE_STRING);
        $elmDatabasePw = filter_input(INPUT_POST, "elm-password", FILTER_SANITIZE_STRING);

        ob_start();
        $link = mysqli_connect($host, "root", $pass);
        ob_end_clean();
        ob_flush();

        

        // Handle failed connection attempt
        if (!$link) {
            // Use the errno to figure out what went wrong.
            $errno = mysqli_connect_errno();
            switch($errno){
                case 2002:
                    $errors["host"] = true;
                    break;
                case 1045:
                    $errors["pass"] = true;
                    break;
                default:
                    echo "Error: Unable to connect to MySQL." . PHP_EOL;
                    echo "Debugging errno: " . mysqli_connect_errno() . PHP_EOL;
                    echo "Debugging error: " . mysqli_connect_error() . PHP_EOL;
            
                    throw new Exception("Failed to connect to database. Unknown reason: ");
                    exit;
            }
        }

        // Handle invalid path to mysql call
        if(strlen(trim($path)) > 0){
            $list = glob($path . '\mysql.*');
            if(count($list) == 0){
                $errors["sqlpath"] = true;
            }
        }

        // Look for any errors up to this point.
        $errorsExist = false;
        foreach($errors as $k => $v){
            $errorsExist = $errorsExist || $v;
        }

        // Handle successful connection attempt
        if(!$errorsExist){
            // Check for the elm user account
            if(SqlUserExists($link, ELM_USER, $host)){
                $log[] = "User exists. Revoking permissions.";
                // Revoke all permissions
                DebugQuery($link, "FLUSH PRIVILEGES;", $log);
                DebugQuery($link, "REVOKE ALL PRIVILEGES, GRANT OPTION FROM '".ELM_USER."'@'$host'", $log);
                DebugQuery($link, "FLUSH PRIVILEGES;", $log);

                // Remove user
                $log[] = "Permissions revoked. Removing user.";
                mysqli_query($link, "DROP USER '".ELM_USER."'@'$host'");
                $errno = mysqli_errno($link);
                if($errno != 0){
                    echo "[$errno]: " . mysqli_error($link);
                    exit;
                }
                $log[] = "User removed.";
            }

            // Create user
            $log[] = "User does not exist. Creating user.";
            mysqli_query($link, "CREATE USER '".ELM_USER."'@'$host' IDENTIFIED BY '".$elmDatabasePw."'");
            $errno = mysqli_errno($link);
            if($errno != 0){
                echo "[$errno]: " . mysqli_error($link);
                exit;
            }
            $log[] = "User created. Granting permissions.";


            // Granting permissions
            $tables = ["elm_debug", "elm_release", "COMMAND_TEMP"];
            DebugQuery($link, "FLUSH PRIVILEGES;", $log);
            foreach($tables as $t){
                DebugQuery($link, "GRANT ALL PRIVILEGES ON $t.* TO '".ELM_USER."'@'$host'", $log);
            }
            DebugQuery($link, "FLUSH PRIVILEGES;", $log);
            $log[] = "Permissions granted.";

            // Check for elm_release database
            mysqli_query($link, "DROP DATABASE IF EXISTS elm_debug");
            $errno = mysqli_errno($link);
            if($errno != 0){
                echo "[$errno]: " . mysqli_error($link);
                exit;
            }
            mysqli_query($link, "DROP DATABASE IF EXISTS elm_release");
            $errno = mysqli_errno($link);
            if($errno != 0){
                echo "[$errno]: " . mysqli_error($link);
                exit;
            }
            $log[] = "Databases cleared.";

            $importDatabase = true;

            // Set up the new config file
            $configFile = file_get_contents("./setup/elm_config_template.php");
            $configFile = str_replace("<ELM_USER_PASSWORD>", $elmDatabasePw, $configFile);
            file_put_contents("./database/elm_config.php", $configFile);


            /*exec("dir 2>&1",$output);
            var_dump($output);*/

            // Prepare import command
            $showoutput = isset($_POST["showsql"]) ? 1 : 0;
            $commandPath = (strlen(trim($path)) > 0) ? str_replace("\\","/",$path) : "";

            if($showoutput){
                $command = trim($commandPath . "mysql -u root --password=\"$pass\" -v < ../$databaseFile");
            }else{
                $command = trim($commandPath . "mysql -u root --password=\"$pass\" < ../$databaseFile");
            }
            

            // Create table to transfer import command to import page
            DebugQuery($link, "DROP DATABASE IF EXISTS COMMAND_TEMP");
            DebugQuery($link, "CREATE DATABASE COMMAND_TEMP");
            DebugQuery($link, "CREATE TABLE `COMMAND_TEMP`.COMMAND_TEMP (IMPORTCOMMAND TEXT, SHOWOUTPUT INT)");
            DebugQuery($link, "INSERT INTO `COMMAND_TEMP`.COMMAND_TEMP(IMPORTCOMMAND,SHOWOUTPUT) VALUES ('$command','$showoutput')");

            $log[] = "Transfer databases created.";
        }

    }

    // Uncomment to view posted variables
    //PreVarDump($_POST);
?>


<html>
<head>
    <title>ELM Software Setup</title>
    <link rel="shortcut icon" href="./elm/assets/img/elm_50px.png">
    <link rel="stylesheet" href="./external-lib/bootstrap/bootstrap-3.3.7/css/bootstrap.min.css" />
</head>
<body>
    <div class="container">
        
        <h3>ELM Software Setup</h3>
        
        <?php if(count($log) > 0){ ?>
            <!-- Log -->
            <h3>Log</h3>
            <?php PreVarDump($log) ?>
        <?php } ?>
        <?php if(!$importDatabase){ ?>
            <!-- Input form -->
            <form class="form" method="post" action="#">
                <div class="form-group">
                    <p>Select the database file to import from the drop down below</p>
                    <select class="form-control" name="database-file" id="database-file">
                        <option disabled="disabled" <?= ($databaseFile == null) ? ' selected="selected"' : "" ?>>Select Database File</option>
                        <?php foreach($sqlExtensionFiles as $s){ ?>
                            <option value="<?=$s?>" <?= ($databaseFile == $s) ? ' selected="selected"' : "" ?> ><?=$s?></option>
                        <?php } ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="sql-host">Database Host<?php if($errors["host"]){?><span class="text-danger"> * Invalid host</span><?php } ?></label>
                    <p>Please enter the database host. Default: localhost.</p>
                    <input class="form-control" type="text" id="sql-host" name="sql-host" value="<?=$host?>" />
                </div>

                <div class="form-group">
                    <label for="root-password">Root Password<?php if($errors["pass"]){?><span class="text-danger"> * Invalid password</span><?php } ?></label>
                    <p>Please enter the root password for the mysql database system. This password will be used to create a user account for the ELM software. It will not be saved or used in any operation after this setup.</p>
                    <input class="form-control" type="password" id="root-password" name="root-password" value="<?=$elmDatabasePw?>" />
                </div>

                <div class="form-group">
                    <label for="elm-password">ELM User Password<?php if($errors["elmpass"]){?><span class="text-danger"> * Invalid password</span><?php } ?></label>
                    <p>Please enter a new database password for the elm user account. This password will be used by the elm software to interact with the database.</p>
                    <input class="form-control" type="password" id="elm-password" name="elm-password" value="<?=$pass?>" />
                </div>

                <div class="form-group">
                    <label for="sql-path">Path To SQL
                        <!-- Error Notification -->
                        <?php if($errors["sqlpath"]){?><span class="text-danger"> * Invalid path: '<?= $path ?>'. Could not find file 'mysql'.</span><?php } ?>
                    </label>
                    <p>Please enter the path to mysql (e.g. C:\wamp64\bin\mysql\mysql5.7.21\bin\). Leave blank if the mysql command is globally visable.</p>
                    <input class="form-control" type="text" id="sql-path" name="sql-path" value="<?=$path?>" />
                </div>
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="showsql" id="showsql" value="showsql"> Show sql output log.
                    </label>
                </div>
                <input class="btn" type="submit" value="ok" />
            </form>
        <?php }else{ ?>
            <?php require_once("./setup/import-database.html"); ?>

        <?php } ?>

        <p><small>Page Load Time: <?= microtime(true) - $pageStartTime ?> s</small></p>
    </div>
</body>
</html>