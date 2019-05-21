<?php require_once("../../../../database/core.php"); ?>
<?php 
$email = filter_input(INPUT_GET, "email", FILTER_SANITIZE_EMAIL);
$email = str_replace("%40", "@", $email);
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
                	
                    <h2>Passphrase Reset!</h2>
                    <p id="ie-warning"><strong>Warning:</strong> Internet explorer is not yet supported by ELM. Please use an alternate browser. The ELM software was designed for and performs best on either Firefox or Google Chrome.</p>
                    <p>The passphrase for the account associated with <?= $email  != "" ? "(" . $email . ")" : "your email"?> has been reset.</p>
                    <br />
                    <br />
                    <p><a href="<?=ELM_ROOT?>"/>Back to Login Page</a></p>
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