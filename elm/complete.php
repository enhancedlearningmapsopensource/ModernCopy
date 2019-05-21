<?php
/**
 * Complete the user registration.
 */

/**
 * Add ?debug=true to the url to debug this page.
 */

require_once("../database/core.php");
define("DEBUG", (isset($_GET["debug"]) && filter_input(INPUT_GET, "debug", FILTER_SANITIZE_STRING) == "true"));

$code = filter_input(INPUT_GET, "code", FILTER_SANITIZE_STRING);
    
$database = Db();
$database->Connect();

$results = $database->PrototypeQuery("SELECT * FROM ELM_ACCOUNTCONFIRM AS AC LEFT JOIN ELM_USER AS U ON U.USERID=AC.USERID WHERE AC.CODE LIKE '$code'");
if(DEBUG){
    if($results == null && !isset($results["result"])){
        echo "Could not find anything with that code in the account confirm table.";
    }else{
        $row = $database->fetch($results);
        $expires = strtotime($row["EXPIRES"]);
        echo "Code expires at:" . $expires;
    }
}

if(!isset($results["result"])){
    $hasExpired = true;
}else{
    $row = $database->fetch($results);
    $date = strtotime(date("Y-m-d H:i:s"));
    $expires = strtotime($row["EXPIRES"]);
    $hasExpired = ($date > $expires) ? true : false;

    // If the confirmation has expired then delete the user account 
    if($hasExpired){
        $userID = $row["USERID"];
        $database->DeleteUser($userID);
    }

    // Otherwise confirm the account by removing the entry in the accountconfirm database
    else{
        $database->PrototypeQueryQuiet("DELETE FROM ELM_ACCOUNTCONFIRM WHERE USERID=" . $row["USERID"]);
    }
}

?>


<html>
    <head>
        <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
        <script src="<?php echo ELM_ROOT ?>external-lib/jquery/v3.2.1/jquery.min.js"></script>

        <!-- Bootstrap -->
        <link href="<?php echo ELM_ROOT ?>external-lib/bootstrap/bootstrap-3.3.7/css/bootstrap.min.css" rel="stylesheet" />

        <!-- Login Page styles -->
        <link href='<?php echo ELM_ROOT ?>elm/corestate/templates/login/login.css' rel='stylesheet' />
    </head>
    <body>
        
        <div class="container login-container">
            <div class="row">
                <div class="col-lg-12">
                    <img src="<?php echo ELM_ROOT ?>elm/assets/img/elmfull.svg" class="img-logo" />
                </div>
            </div>
            <div class="row">
                <div class="col-lg-12">
                    <?php if($hasExpired){ ?>
                        <h2>Link Expired</h2>
                        <p>This link has expired. Please follow the links below:</p>
                        <p><a href="<?=ELM_ROOT?>elm/corestate/templates/login/create-account.php">Create Account</a><br />
                        <a href="<?=ELM_ROOT?>">Login</a></p>
                    <?php } else { ?>
                        <h2>Account Creation Complete</h2>
                        <p>Thank you. Your account has been created. Please follow the link below to log in.</p>
                        <p><a href="<?=ELM_ROOT?>">Login</a></p>
                    <?php } ?>
                </div>
            </div>
            
            <div class="row">
                <div class="col-lg-12">
                    <h2 class="h2-copyright">© 2016 University of Kansas Center for Research</h2>
                    <p class="login-small">Copyright Statement The Enhanced Learning Maps resources, products, graphs, and structures, including node names, descriptions, and connections, have been developed by the Achievement and Assessment Institute and are copyrighted by the University of Kansas Center for Research. Learning map information is available for use by educators but may not be used for commercial purposes (including being shared without cost when bundled in a commercial transaction) without written permission. Enhanced Learning Map nodes and connections may not be altered by anyone other than the staff of the Achievement and Assessment Institute at the University of Kansas.</p>
                </div>
            </div>
        </div>
    </body>
</html>


