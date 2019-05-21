<?php
    require_once("../database/core.php");
    define("SETUP_PATH", "../setup.php");
    define("STORE_PATH", "./setup.php");

    /**
     * Check to see whether the current user is an admin. This function requires 
     * that ./database/ajax.php is included before it can be used.
     * @return {bool} - true if the user is an admin, otherwise false.
     */
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

    // Make that an admin is attempting to reset.
    define("INVALID_LOGIN_REDIRECT", ELM_ROOT . "elm/");
    require_once(ELM_ROOT . "database/ajax.php");
    if(!IsAdmin()){
        echo "<p>Permission denied. Must be an admin user to reset the database.</p>";
        exit();
    }     

    PreVarDump($_POST);

    if(isset($_POST["confirm-reset"])){
        $confirmReset = filter_input(INPUT_POST, "confirm-reset", FILTER_SANITIZE_STRING);
        if($confirmReset == "true"){
            copy(STORE_PATH, SETUP_PATH);

            // Redirect to the main page
            header('Location: ../'); die();
        }
    }

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
        
        <p>Are you sure you want to reset the database?</p>
            <!-- Input form -->
        <form class="form" method="post" action="#">
            <input type="hidden" name="confirm-reset" id="confirm-reset" value="true" />
            <input class="btn" type="submit" value="ok" />
        </form>
    </div>
</body>
</html>