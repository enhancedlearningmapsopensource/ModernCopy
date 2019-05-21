<?php
// To debug the login page pass debug=true via the url

if(isset($_GET["debug"])){
    $debug = filter_input(INPUT_GET, "debug", FILTER_SANITIZE_STRING);
    if(trim($debug) == "true"){
        define("DEBUG_LOGIN", true);
    }
}

try{
    $config = json_decode(Config(),true);
}catch(Exception $ex){
    // Log exception and continue
    //echo "<script>console.warn(\"" . str_replace("\"", "'", $ex->getMessage()) ."\");console.warn(\"The config table will be loaded by hub so if it's missing reload page.\");</script>";
    
    
    $config = json_encode(array("error"=>TRUE));
}

//PreVarDump($config);

?>



<html>
    <head>
        <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
        <script src="<?=ELM_ROOT ?>external-lib/jquery/v3.2.1/jquery.min.js"></script>

        <!-- Bootstrap -->
        <link href="<?=ELM_ROOT ?>external-lib/bootstrap/bootstrap-3.3.7/css/bootstrap.min.css" rel="stylesheet" />

        <!-- Login Page styles -->
        <link href='<?=ELM_ROOT ?>elm/corestate/templates/login/login.css' rel='stylesheet' />
    </head>
    <body>
        <?php if (USE_CROSS_VERSION_LOGIN) { ?>
            <script src= "<?= ELM_ROOT ?>database/crypt/javascript-encrypt.js"></script>
        <?php } ?>
        <script src="<?= ELM_ROOT ?>database/common-functions.js"></script>
        <script>
            var gRoot = '<?= ELM_ROOT ?>';
            
            function submitCreds(options, password) {
                $.post('<?= ELM_ROOT ?>elm/login/login.php', options, function (ret) {
                    try{
                        var json = JSON.parse(ret);
                    }catch(ex){
                        const err = [
                            "Error with login response.",
                            "options sent to server: " + JSON.stringify(options),
                            "response from server: " + ret
                        ]
                        console.warn(err.join("\n"));
                        throw Error(err.join("\n"));
                    }

                    <?php if(defined("DEBUG_LOGIN")){ ?>
                        $("body").prepend([
                            "<p>Debugging login action</p>",
                            "<p>Submitted to server: " + JSON.stringify(options) + "</p>",
                            "<p>Server response: " + ret + "</p>"
                        ].join(""));
                        return;
                    <?php } ?>

                   
                    if(json.valid){
                        $('#loginform').submit();
                    } else if(password){
                        options.clear = password;
                        submitCreds(options);
                    } else{
                        $('#invalidloginmessage').show();
                        $('#loadingmessage').hide();
                    }


                    if (displayConfirm) {
                        $("#confirm-row").show();
                    } else {
                        $("#confirm-row").hide();
                    }
                });
            }

            var displayConfirm = false;
            $(document).ready(function () {
                $('#invalidloginmessage').hide();
                $('#loadingmessage').hide();
                
                /**
                 * @listens 'click #loginsubmit' 
                 * @param {type} hashed
                 * @returns {undefined}
                 */
                $('body').on('click', '#loginsubmit', function (e) {
                    e.preventDefault();
                    
                    $('#invalidloginmessage').hide();
                    $('#loadingmessage').show();

                    var password = $('#loginpassword').val();
                    var options = {};
                    
                    options.email = $('#loginemail').val();
                    options.remember = $('#remember').prop('checked');

                    tryPBKDF2(options.email, password).then(function (hashed) {
                        options.pass = hashed;
                        submitCreds(options, password);
                    }).catch(function (err) {
                        alert(err);
                    });      
                });
                
                // Check for IE and disable login
                if(detectIE() !== false){
                    $(".login-container").addClass("ie");
                }
            });
        </script>

        <div id="logindebug"></div>
        <div class="container login-container">
            <div class="row">
                <div class="col-lg-12">
                    <img src="<?php echo ELM_ROOT ?>elm/assets/img/elmfull.svg" class="img-logo" />
                </div>
            </div>
            <div class="row">
                <div class="col-lg-7">
                    <h2>Enhanced Learning Maps</h2>
                    <p>Our project focuses on providing learning maps for the standards you teach along with instructional activities that help students develop understanding of the concepts and skills relevant to each standard. Learning maps are fine-grained depictions of concepts, skills, and connections that indicate prerequisites and multiple pathways to support understanding. We have created instructional units aligned to the standards and have shared these units via the learning map software. A unit may relate to a single or small number of standards and will include:</p>
                    <ul>
                        <li>Learning map information</li>
                        <li>Teacher notes summarizing relevant research findings</li>
                        <li>Instructional activity with at least two lessons and supplemental materials</li>
                        <li>Student activity</li>
                        <li>Solution guide for the student activity with correct answers as well as possible errors and misconceptions</li>
                    </ul>

                    <p>To get started, login and press "submit." This action will take you to the learning map software.</p>

                    <p>
                        For help, please see the <a href="<?=ELM_ROOT?>elm/assets/user-guide/user-guide.pdf" target="_blank">User Guide</a>.
                    </p>
                </div>
                <div class="col-lg-1">&nbsp;</div>
                <div class="col-lg-4">
                    <h2>Login</h2>
                    <form id="loginform" method="post">
                        <div class="form-group">
                            <p id="ie-warning"><strong>Warning:</strong> Internet explorer is not yet supported by ELM. Please use an alternate browser. The ELM software was designed for and performs best on either Firefox or Google Chrome.</p>
                            <table class="table table-condensed" id="login-table">
                                <tr>
                                    <td>
                                        <label for="loginemail">Email:</label>
                                    </td>
                                    <td>
                                        <input type="email" name='email' class="form-control" id="loginemail" placeholder="Email">
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <label for="loginpassword">Passphrase:</label>
                                    </td>
                                    <td>
                                        <input type="password" name='passphrase' class="form-control" id="loginpassword" placeholder="Password">
                                    </td>
                                </tr>
                                <tr id="confirm-row" style="display:none">
                                    <td>
                                        <label for="confirmpassword">Confirm Passphrase:</label>
                                    </td>
                                    <td>
                                        <input type="password" class="form-control" id="confirmpassword" placeholder="Password">
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2">
                                        <table class="table" id="submit-button-table">
                                            <tr>
                                                <td>
                                                    <div id="invalidloginmessage"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>
                                                    <div id="loadingmessage"><small>Loading...</small></div>
                                                </td>
                                                <td>
                                                    <button type="submit" class="btn btn-primary" id="loginsubmit">Submit</button>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2"></td>
                                </tr>
                            </table>
                        </div>

                        <br clear="all" />
                        <?php if (isset($config["SELF_CREATION_ON"]) && $config["SELF_CREATION_ON"] == "TRUE"){?>
                            <p> <a href="<?=ELM_ROOT?>elm/corestate/templates/login/create-account.php">Create Account</a></p>
                            <p>Forgot your password? <a href="<?=ELM_ROOT?>elm/corestate/templates/login/forgot.php">Reset it.</a></p>
                        <?php } ?>

                        <p>Thank you for visiting the Enhanced Learning Map Software Tool. If you have any questions or would like more information, please contact <a href="mailto:<?=$config["CONTACT_EMAIL"]?>"><?=$config["CONTACT_EMAIL"]?></a></p>
                        
                    </form>
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
