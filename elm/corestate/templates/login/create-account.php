<?php require_once("../../../../database/core.php"); ?>
<html>
    <head>
        <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
        <script src="<?= ELM_ROOT ?>external-lib/jquery/v3.2.1/jquery.min.js"></script>

        <!-- Bootstrap -->
        <link href="<?= ELM_ROOT ?>external-lib/bootstrap/bootstrap-3.3.7/css/bootstrap.min.css" rel="stylesheet" />

        <!-- Login Page styles -->
        <link href='<?= ELM_ROOT ?>elm/corestate/templates/login/login.css' rel='stylesheet' />
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

            function submitCreds(options) {
                tryPBKDF2(options.email, options.password).then(function (hashed) {
                    options.password = hashed;
                    $.post('<?= ELM_ROOT ?>elm/corestate/templates/login/submit-new-account.php', {
                        email: options.email,
                        password: options.password
                    }, function (ret) {
                        var json = JSON.parse(ret);
                        if (json.hasOwnProperty("error")) {
                            displayErrors(json.error);
                        } else {
                            window.location = "<?= ELM_ROOT ?>elm/corestate/templates/login/user-information.php?email=" + options.email + "&pass=" + options.password;
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

        <div id="logindebug"></div>
        <div class="container login-container">
            <div class="row">
                <div class="col-lg-12">
                    <img src="<?= ELM_ROOT ?>elm/assets/img/elmfull.svg" class="img-logo" />
                </div>
            </div>
            <div class="row">
                <div class="col-lg-12">
                    <h2>Create Account</h2>
                    <form id="loginform" method="post">
                        <div class="form-group">
                            <p id="ie-warning"><strong>Warning:</strong> Internet explorer is not yet supported by ELM. Please use an alternate browser. The ELM software was designed for and performs best on either Firefox or Google Chrome.</p>
                            <form class="form">
                                <div class="form-group">
                                    <label for="loginemail">Email:</label><div id="email-error" class="err-msg"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>
                                    <input type="email" name='email' class="form-control" id="loginemail" placeholder="Email">
                                </div>   
                                <div class="form-group">
                                    <label for="loginpassword">Passphrase:</label><div id="password-error" class="err-msg"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>
                                    <input type="password" name='passphrase' class="form-control" id="loginpassword" placeholder="Password">
                                </div>    
                                <div class="form-group">
                                    <label for="loginconfirm">Confirm Passphrase:</label><div id="confirm-error" class="err-msg"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>
                                    <input type="password" class="form-control" id="loginconfirm" placeholder="Password">
                                </div>    
                                <div id="invalidloginmessage"><small>Invalid username/password combination. Please try again or reset your password using the link below.</small></div>  
                                <button type="submit" class="btn btn-primary" id="createaccount">Create</button>                          
                            </form>
                        </div>
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
