<?php 

/**
 * Display a confirmation message to the user.
 */

/**
 * Add ?debug=true to the url to debug this page.
 */

require_once("../../../../database/core.php");
define("DEBUG", (isset($_GET["debug"]) && filter_input(INPUT_GET, "debug", FILTER_SANITIZE_STRING) == "true"));
$email = filter_input(INPUT_GET, "email", FILTER_SANITIZE_EMAIL);
$email = str_replace("%40", "@", $email);

// Connect to database
$database = Db();
$database->Connect();
$results = $database->PrototypeQuery("SELECT * FROM ELM_ACCOUNTCONFIRM AS AC LEFT JOIN ELM_USER AS U ON U.USERID=AC.USERID WHERE U.EMAIL LIKE '$email'");

// Load the config table
try{
    $config = json_decode(Config(),true);
}catch(Exception $ex){
    // Log exception and continue
    echo "<script>console.warn(\"" . str_replace("\"", "'", $ex->getMessage()) ."\");console.warn(\"The config table will be loaded by hub so if it's missing reload page.\");</script>";
    $config = json_encode(array("error"=>TRUE));
}

$contactEmail = NULL;
if (isset($config["CONTACT_EMAIL"])){
    $contactEmail = $config["CONTACT_EMAIL"];
}

if(DEBUG){
    echo "Results of account confirm query:<br />";

    if($results != null){
        PreVarDump($results);
    }else{
        echo "No results. User must already exist in the database and does not require a confirmation.<br />";
    }
}

$code = $database->fetch($results)["CODE"];
?>

<html>
    <head>
        <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
        <script src="<?php echo ELM_ROOT ?>external-lib/jquery/v3.2.1/jquery.min.js"></script>

        <!-- Bootstrap -->
        <link href="<?php echo ELM_ROOT ?>external-lib/bootstrap/bootstrap-3.3.7/css/bootstrap.min.css" rel="stylesheet" />

        <!-- Login Page styles -->
        <link href='<?php echo ELM_ROOT ?>elm/corestate/templates/login/login.css' rel='stylesheet' />
        <link rel="shortcut icon" href="<?php echo ELM_ROOT ?>elm/assets/img/elm_50px.png">
    </head>
    <body>        
        <div id="logindebug"></div>
        <div class="container login-container">
            <div class="row">
                <div class="col-lg-12">
                    <img src="<?php echo ELM_ROOT ?>elm/assets/img/elmfull.svg" class="img-logo" />
                </div>
            </div>
            <div class="row">
                <div class="col-lg-12">
                    <input type="hidden" value="<?=$email?>" id="email" />
                    <input type="hidden" value="<?=$code?>" id="code" />
                	
                    <h2>Nearly Done!</h2>
                    <p id="ie-warning"><strong>Warning:</strong> Internet explorer is not yet supported by ELM. Please use an alternate browser. The ELM software was designed for and performs best on either Firefox or Google Chrome.</p>
                    <p>An email has been sent to your email address (<?=$email?>). Please follow the enclosed link to complete the account creation process. If you do not receive an email or have additional questions please contact <a href="mailto:<?=$contactEmail?>"><?=$contactEmail?></a>.</p>
                    
                    <br />
                    <br />
                    <p><a href="<?=ELM_ROOT?>"/>Back to Login Page</a></p>
                    
                    <?php if (DEBUG) { ?>
                        <p>DEBUG: <a href="<?=ELM_ROOT?>elm/complete.php?code=<?=$code?>">complete.php?code=<?=$code?></a></p>
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
