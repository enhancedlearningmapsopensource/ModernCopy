<?php

// Landing page for a user who clicks to finish resetting their password.

require_once("../database/core.php");
define("DEBUG", (isset($_GET["debug"]) && filter_input(INPUT_GET, "debug", FILTER_SANITIZE_STRING) == "true"));
$code = filter_input(INPUT_GET, "code", FILTER_SANITIZE_STRING);
    
$database = Db();
$database->Connect();

$results = $database->PrototypeQuery("SELECT * FROM ELM_PASSWORDRESET AS AC LEFT JOIN ELM_USER AS U ON U.USERID=AC.USERID WHERE AC.CODE LIKE '$code'");
$email = null;

if(!isset($results["result"])){
    if(DEBUG){
        echo "Cannot find any record in the elm_passwordreset table with the given code.";
    }
    $hasExpired = true;
}else{
    $row = $database->fetch($results);
    $date = strtotime(date("Y-m-d H:i:s"));
    $expires = strtotime($row["EXPIRES"]);
    $hasExpired = ($date > $expires) ? true : false;
    
    if(!$hasExpired){
        $email = $row["EMAIL"];
    }

    if(DEBUG){
        echo $date . " > " . $expires;
        if($hasExpired){
            echo "Code has expired.";
        }
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
        <link rel="shortcut icon" href="<?php echo ELM_ROOT ?>elm/assets/img/elm_50px.png">
    </head>
    <body>
        <?php if (USE_CROSS_VERSION_LOGIN) { ?>
            <script src= "<?= ELM_ROOT ?>database/crypt/javascript-encrypt.js"></script>
        <?php } ?>
        <script src="<?= ELM_ROOT ?>database/common-functions.js"></script>
        <script>
            var gRoot = '<?= ELM_ROOT ?>';
            var email = '<?= $email ?>';

            /**
             * Start point for creating a new account
             */
            function createAccount() {
                var input = gatherInput();
                var errors = {};
                if (!validate(input, errors)) {
                    displayErrors(errors);
                } else {
                    submitCreds(input);
                }
            }

            /**
             * Display errors
             * @param {Object} errors
             * @param {string[]} errors.email - email errors
             * @param {string[]} errors.password - password errors
             * @param {string[]} errors.confirm - confirmation errors
             */
            function displayErrors(errors) {
                if (errors.password.length > 0) {
                    $("#password-error > small").html(errors.password[0]);
                    $("#password-error").addClass("visible");
                } else {
                    $("#password-error").removeClass("visible");
                }

                if (errors.confirm.length > 0) {
                    $("#confirm-error > small").html(errors.confirm[0]);
                    $("#confirm-error").addClass("visible");
                } else {
                    $("#confirm-error").removeClass("visible");
                }
            }

            /**
             * Gather form input
             * @return {Object} - the user input from the form
             */
            function gatherInput() {
                return {
                    email: $("#loginemail").val(),
                    password: $("#loginpassword").val(),
                    confirm: $("#loginconfirm").val()
                };
            }

            /**
             * Validate the input
             * @param {Object} input - the input
             * @param {string} input.email - the email
             * @param {string} input.password - the password
             * @param {string} input.confirm - the password confirmation
             * @param {Object} errors
             * @param {string[]} errors.email - email errors
             * @param {string[]} errors.password - password errors
             * @param {string[]} errors.confirm - confirmation errors
             * @return {bool} - true if valid, otherwise false
             */
            function validate(input, errors) {
                errors.password = [];
                errors.confirm = [];

                // Check for empty password
                if (input.password.trim().length === 0) {
                    errors.password.push("Please provide a valid password.");
                }

                // Check for empty confirmation
                if (input.confirm.trim().length === 0) {
                    errors.confirm.push("Please confirm the password by retyping it below.");
                } else {
                    if (input.password.trim().localeCompare(input.confirm.trim()) !== 0) {
                        errors.confirm.push("Passwords do not match.");
                    }
                }

                return Object.keys(errors).reduce(function (acc, val) {
                    return (acc && (errors[val].length === 0));
                }, true);
            }

            function submitCreds(options) {
                tryPBKDF2(email, options.password).then(function (hashed) {
                    options.password = hashed;
                    $.post('<?= ELM_ROOT ?>elm/corestate/templates/login/reset-passphrase.php', {
                        email: email,
                        password: options.password
                    }, function (ret) {
                        var json = JSON.parse(ret);
                        if (json.hasOwnProperty("error")) {
                            displayErrors(json.error);
                        } else {
                            window.location = "<?= ELM_ROOT ?>elm/corestate/templates/login/confirm-reset.php?email=" + email;
                        }
                    });
                }).catch(function (err) {
                    alert(err);
                });
            }

            var displayConfirm = false;
            $(document).ready(function () {
                $('#invalidloginmessage').hide();

                /**
                 * @listens 'click #loginsubmit' 
                 * @param {type} hashed
                 * @returns {undefined}
                 */
                $('body').on('click', '#createaccount', function (e) {
                    e.preventDefault();
                    createAccount();
                });

                /**
                 * Type in email field
                 */
                $('body').on('keydown', '#loginemail', function (e) {
                    var $el = $("#email-error");
                    if ($el.hasClass("visible")) {
                        $el.removeClass("visible");
                    }
                });

                /**
                 * Type in password field
                 */
                $('body').on('keydown', '#loginpassword', function (e) {
                    var $el = $("#password-error");
                    if ($el.hasClass("visible")) {
                        $el.removeClass("visible");
                    }
                });

                /**
                 * Type in confirm field
                 */
                $('body').on('keydown', '#loginconfirm', function (e) {
                    var $el = $("#confirm-error");
                    if ($el.hasClass("visible")) {
                        $el.removeClass("visible");
                    }
                });


                // Check for IE and disable login
                if (detectIE() !== false) {
                    $(".login-container").addClass("ie");
                }
            });
        </script>
        
        
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
                        <p><a href="<?=ELM_ROOT?>elm/corestate/templates/login/forgot.php">Reset Password</a><br />
                        <a href="<?=ELM_ROOT?>">Login</a></p>
                    <?php } else { ?>
                        <h2>Reset Password</h2>
                        <form id="loginform" method="post">
                            <div class="form-group">
                                <p id="ie-warning"><strong>Warning:</strong> Internet explorer is not yet supported by ELM. Please use an alternate browser. The ELM software was designed for and performs best on either Firefox or Google Chrome.</p>
                                <form class="form">   
                                    <div class="form-group">
                                        <label for="loginpassword">Enter New Passphrase:</label><div id="password-error" class="err-msg"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>
                                        <input type="password" name='passphrase' class="form-control" id="loginpassword" placeholder="Password">
                                    </div>    
                                    <div class="form-group">
                                        <label for="loginconfirm">Confirm New Passphrase:</label><div id="confirm-error" class="err-msg"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>
                                        <input type="password" class="form-control" id="loginconfirm" placeholder="Password">
                                    </div>    
                                    <div id="invalidloginmessage"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>  
                                    <button type="submit" class="btn btn-primary" id="createaccount">Reset</button>                          
                                </form>
                            </div>
                        </form>
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


