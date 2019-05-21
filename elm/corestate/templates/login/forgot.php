<?php require_once("../../../../database/core.php"); ?>

<?php 
if(isset($_POST["email"])){
    $email = filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL);
    define("USE_FAKE_CLIENT", (file_exists("../../../../modernadmin/admin-main/managers/fake-email-client/email.php")));

    if(USE_FAKE_CLIENT){
        require_once("../../../../modernadmin/admin-main/managers/fake-email-client/email.php");
    }
    
    
    // Connect to the database
    $database = Db();
    $database->Connect();

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
    
    // Get the current date
    $date = date("Y-m-d H:i:s");
    $server = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
    
    // Set up the email headers
    $headers = 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'From: ' . $contactEmail . "\r\n";
    $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
    
    // Get the user id
    $userID = $database->GetUserIDFromEmail($email);
    
    // Generate code/expiration
    $code = md5($date . "ELM_ACCOUNT" . $userID . "RESET");
    $expires = date("Y-m-d H:i:s", strtotime('+24 hours'));
    
    // Submit the request to the database
    if(!$database->TableExists("ELM_PASSWORDRESET")){
        $database->CreatePasswordResetTable();
    }
    
    // Remove any existing requests by this user
    $database->PrototypeQueryQuiet("DELETE FROM ELM_PASSWORDRESET WHERE USERID=?", array(&$userID));

    // Add new request
    $database->PrototypeQueryQuiet("INSERT INTO ELM_PASSWORDRESET(USERID,CODE,EXPIRES) VALUES(?,?,?)", array(&$userID, &$code, &$expires));
    
    // The message
    $messageText = array(
        "A request to change the password for the user account associated with '$email' was sumbitted on $date. To complete the password reset process, please follow the link below:",
        "<a href=\"$server/elm/complete-reset.php?code=$code\">Reset Password</a>",
        "",
        "The link above will expire on $expires.",
        "",
        "If you've received this mail in error, it's likely that another user mistakenly entered your email address while attempting to reset a password. If you didn't initiate the request, you don't need to take further action and can safely disregard this email.",
    );

    // The message
    $message = join("<br />",$messageText);//()"Line 1\r\nLine 2\r\nLine 3";
    
    // In case any of our lines are larger than 70 characters, we should use wordwrap()
    $message = wordwrap($message, 70, "\r\n");

    // Send
    mail($email, 'ELM (Enhanced Learning Maps) Password Reset Request', $message, $headers);
    
}
?>

<html>
    <head>
        <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
        <script src="<?= ELM_ROOT ?>external-lib/jquery/v3.2.1/jquery.min.js"></script>

        <!-- Bootstrap -->
        <link href="<?= ELM_ROOT ?>external-lib/bootstrap/bootstrap-3.3.7/css/bootstrap.min.css" rel="stylesheet" />

        <!-- Login Page styles -->
        <link href='<?= ELM_ROOT ?>elm/corestate/templates/login/login.css' rel='stylesheet' />
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
                    <?php if(!isset($email)){ ?>
                        <h2>Password Reset</h2>
                        <p>Please enter the email address associated with the user account that you are trying to reset.</p>

                        <form id="loginform" method="post">
                            <div class="form-group">
                                <p id="ie-warning"><strong>Warning:</strong> Internet explorer is not yet supported by ELM. Please use an alternate browser. The ELM software was designed for and performs best on either Firefox or Google Chrome.</p>
                                <form class="form">
                                    <div class="form-group">
                                        <label for="loginemail">Email:</label><div id="email-error" class="err-msg"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>
                                        <input type="email" name='email' class="form-control" id="loginemail" placeholder="Email">
                                    </div>
                                    <button type="submit" class="btn btn-primary" id="reset">Reset</button>                          
                                </form>
                            </div>
                        </form>
                    <?php }else{ ?>
                        <h2>Password Reset Request Submitted.</h2>
                        <p>An email has been sent to <?=$email?>. Please follow the instructions in the email to finish reseting your password.</p>
                        
                    <?php }?>
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
