<?php 
/**
 * Display a the login waiver.
 */

/**
 * Add ?debug=true to the url to debug this page.
 */

require_once("../../../../database/core.php"); 
define("DEBUG", (isset($_GET["debug"]) && filter_input(INPUT_GET, "debug", FILTER_SANITIZE_STRING) == "true"));
?>

<?php
$email = filter_input(INPUT_GET, "email", FILTER_SANITIZE_EMAIL);
$password = filter_input(INPUT_GET, "pass", FILTER_SANITIZE_STRING);
$state = filter_input(INPUT_GET, "state", FILTER_SANITIZE_STRING);
$role = filter_input(INPUT_GET, "role", FILTER_SANITIZE_STRING);
$org = filter_input(INPUT_GET, "org", FILTER_SANITIZE_STRING);

define("WAIVER_TEXT", "Subscriber, hereby acknowledges that the Enhanced Learning Map copyright materials are owned by The University of Kansas.  Subscriber hereby agrees that Subscriber has no right to edit, copy, distribute, sell any component of the copyright or develop products using the copyright.  The materials and maps are to be used for instructional or internal research purposes only.");
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
        
        <style>
            .waiver-text{
                border: 1px solid #00000040;
                padding: 15px;
                border-radius: 2px;
            }
        </style>
        
    </head>
    <body>
<?php if (USE_CROSS_VERSION_LOGIN) { ?>
            <script src= "<?= ELM_ROOT ?>database/crypt/javascript-encrypt.js"></script>
        <?php } ?>
        <script src="<?= ELM_ROOT ?>database/common-functions.js"></script>
        <script>
            var gRoot = '<?= ELM_ROOT ?>';

            /**
             * Start point for creating a new account
             */
            function createAccount() {
                var form = $("#waiverform").serialize();
                var options = form.split('&').reduce(function(acc, val){
                    var eq = val.split('=');
                    acc[eq[0].trim()] = eq[1].trim();
                    return acc;
                }, {});
                
                /*throw Error();
                var options = {
                    email: $("#email").val(),
                    password: $("#password").val(),
                    agree: 1
                };*/
                $.post('<?= ELM_ROOT ?>elm/corestate/templates/login/submit-new-account.php', options, function (ret) {
                    <?php if(DEBUG){ ?>
                        $(".waiver-text").before("<p>Results from account submission: <br />" + ret + "</p>");
                    <?php }else{ ?>
                        window.location = "<?= ELM_ROOT ?>elm/corestate/templates/login/confirm.php?email=<?=$email?>";
                    <?php } ?>
                });
            }

            function back() {
                window.location = "<?= ELM_ROOT ?>elm/corestate/templates/login/create-account.php?email=<?=$email?>";
            }


            /**
             * Display errors
             * @param {Object} errors
             * @param {string[]} errors.email - email errors
             * @param {string[]} errors.password - password errors
             * @param {string[]} errors.confirm - confirmation errors
             */
            function displayErrors(errors) {
                if (errors.email.length > 0) {
                    $("#email-error > small").html(errors.email[0]);
                    $("#email-error").addClass("visible");
                } else {
                    $("#email-error").removeClass("visible");
                }

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
                }
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
                errors.email = [];
                errors.password = [];
                errors.confirm = [];

                if (input.email.trim().length === 0) {
                    errors.email.push("Please provide a valid email address.");
                } else {
                    // Email Valid
                    var ck_email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
                    if (!ck_email.test(input.email)) {
                        errors.email.push("Invalid email address.");
                    }
                }

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

            var displayConfirm = false;
            $(document).ready(function () {
                $('#invalidloginmessage').hide();

                /**
                 * @listens 'click #loginsubmit' 
                 * @param {type} hashed
                 * @returns {undefined}
                 */
                $('body').on('click', '#agree', function (e) {
                    e.preventDefault();
                    createAccount();
                });

                /**
                 * Click 'Cancel' button
                 */
                $('body').on('click', '#cancel', function (e) {
                    back();
                });


                // Check for IE and disable login
                if (detectIE() !== false) {
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
                <div class="col-lg-12">
                    <form id="waiverform">
                        <input type="hidden" value="<?= $email ?>" name="email" />
                        <input type="hidden" value="<?= $password ?>" name="password" />
                        <input type="hidden" value="<?= $org ?>" name="org" />
                        <input type="hidden" value="<?= $role ?>" name="role" />
                        <input type="hidden" value="<?= $state ?>" name="state" />
                        <input type="hidden" value="1" name="agree" />

                        <h2>Create Account</h2>
                        <p id="ie-warning"><strong>Warning:</strong> Internet explorer is not yet supported by ELM. Please use an alternate browser. The ELM software was designed for and performs best on either Firefox or Google Chrome.</p>
                        <p><strong>By choosing “I agree” below you agree to the Enhanced Learning Maps Terms of Service.</strong></p>

                        <br clear="all" />
                        <br clear="all" />
                        <p class="waiver-text"><?=WAIVER_TEXT?></p>   
                        <br clear="all" />
                        <br clear="all" />

                        <button id="agree" class="btn btn-primary">I Agree</button>
                        <button id="cancel" class="btn">Cancel</button>
                    </form>
                </div>
                <br clear="all" />
            </div>
            <br clear="all" />
            <div class="row">
                <div class="col-lg-12">
                    <h2 class="h2-copyright">© 2016 University of Kansas Center for Research</h2>
                    <p class="login-small">Copyright Statement The Enhanced Learning Maps resources, products, graphs, and structures, including node names, descriptions, and connections, have been developed by the Achievement and Assessment Institute and are copyrighted by the University of Kansas Center for Research. Learning map information is available for use by educators but may not be used for commercial purposes (including being shared without cost when bundled in a commercial transaction) without written permission. Enhanced Learning Map nodes and connections may not be altered by anyone other than the staff of the Achievement and Assessment Institute at the University of Kansas.</p>
                </div>
            </div>
        </div>
    </body>
</html>
