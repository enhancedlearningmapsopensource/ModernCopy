<?php 

require_once("../../../../database/core.php"); 
$email = filter_input(INPUT_GET, "email", FILTER_SANITIZE_EMAIL);
$password = filter_input(INPUT_GET, "pass", FILTER_SANITIZE_STRING);

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
        <?php if (USE_CROSS_VERSION_LOGIN) { ?>
            <script src= "<?= ELM_ROOT ?>database/crypt/javascript-encrypt.js"></script>
        <?php } ?>
        <script src="<?= ELM_ROOT ?>database/common-functions.js"></script>
        <script>
            var gRoot = '<?= ELM_ROOT ?>';

            /**
             * Start point for creating a new account
             */
            function submitInformation() {
                var input = gatherInput();
                var errors = {};
                if (!validate(input, errors)) {
                    displayErrors(errors);
                } else {
                    var path = "<?= ELM_ROOT ?>elm/corestate/templates/login/waiver.php?email=" + input.email + "&pass=" + input.password;
                    ["state","role","org"].forEach(function(attr){
                        if(input.hasOwnProperty(attr)){
                            path += "&" + attr + "=" + input[attr];
                        }
                    });
                    window.location = path;
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
                var input = {
                    email: $("#email").val(),
                    password: $("#password").val()
                };
                if($("#state").val()){
                    input.state = $("#state").val();
                    if(input.state.localeCompare("other") === 0){
                        var otherStateVal = $("#other-state").val();
                        if(otherStateVal.trim().length > 0){
                            input.state = otherStateVal;
                        }
                    }
                }
                if($("#role").val()){
                    var org = null;
                    input.role = $("#role").val();
                    switch(input.role){
                        case "teacher":
                            org = $("#school").val();
                            break;
                        case "researcher":
                            org = $("#organization").val();
                            break;
                        case "commercial":
                            org = $("#company").val();
                            break;
                        case "other":
                            org = $("#other-role").val();
                            if(org.trim().length > 0){
                                input.role = org;
                            }
                            org = "";
                            break;
                        default:
                            throw Error("Unknown role: " + input.role);
                    }        
                    
                    if(org.trim().length > 0){
                        input.org = org;
                    }
                }
                
                return input;
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
                return true;
                
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
                    $.post('<?= ELM_ROOT ?>corestate/templates/login/submit-new-account.php', {
                        email: options.email,
                        password: options.password
                    }, function (ret) {
                        var json = JSON.parse(ret);
                        if (json.hasOwnProperty("error")) {
                            displayErrors(json.error);
                        } else {
                            window.location = "<?= ELM_ROOT ?>corestate/templates/login/waiver.php?email=" + options.email + "&pass=" + options.password;
                        }
                    });
                }).catch(function (err) {
                    alert(err);
                });
            }

            var displayConfirm = false;
            $(document).ready(function () {
                $('#invalidloginmessage').hide();
                
                $('body').on('click', '#submit', function (e) {
                    e.preventDefault();
                    submitInformation();
                });

                /**
                 * @listens 'click #loginsubmit' 
                 * @param {type} hashed
                 * @returns {undefined}
                 */
                $('body').on('change', '#state', function (e) {
                    var $el = $("#state");
                    if($el.val().localeCompare("other") === 0){
                        $(".other-state-box").removeClass("hidden");
                    }else if(!$(".other-state-box").hasClass("hidden")){
                        $(".other-state-box").addClass("hidden");
                    }
                });
                
                $('body').on('change', '#role', function (e) {
                    var $el = $("#role");
                    
                    if($el.val().localeCompare("other") === 0){
                        $(".other-role-box").removeClass("hidden");
                    }else if(!$(".other-role-box").hasClass("hidden")){
                        $(".other-role-box").addClass("hidden");
                    }
                    
                    if($el.val().localeCompare("teacher") === 0){
                        $(".school-box").removeClass("hidden");
                    }else if(!$(".school-box").hasClass("hidden")){
                        $(".school-box").addClass("hidden");
                    }
                    
                    if($el.val().localeCompare("researcher") === 0){
                        $(".organization-box").removeClass("hidden");
                    }else if(!$(".organization-box").hasClass("hidden")){
                        $(".organization-box").addClass("hidden");
                    }
                    
                    if($el.val().localeCompare("commercial") === 0){
                        $(".company-box").removeClass("hidden");
                    }else if(!$(".company-box").hasClass("hidden")){
                        $(".company-box").addClass("hidden");
                    }
                });

                /**
                 * Type in email field
                 */
                /*$('body').on('keydown', '#loginemail', function (e) {
                    var $el = $("#email-error");
                    if ($el.hasClass("visible")) {
                        $el.removeClass("visible");
                    }
                });

                /**
                 * Type in password field
                 */
                /*$('body').on('keydown', '#loginpassword', function (e) {
                    var $el = $("#password-error");
                    if ($el.hasClass("visible")) {
                        $el.removeClass("visible");
                    }
                });

                /**
                 * Type in confirm field
                 */
                /*$('body').on('keydown', '#loginconfirm', function (e) {
                    var $el = $("#confirm-error");
                    if ($el.hasClass("visible")) {
                        $el.removeClass("visible");
                    }
                });*/


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
                    <h2>User Information</h2>
                    <p id="ie-warning"><strong>Warning:</strong> Internet explorer is not yet supported by ELM. Please use an alternate browser. The ELM software was designed for and performs best on either Firefox or Google Chrome.</p>

                    <form id="loginform" class="form-horizontal" method="post">
                        <input type="hidden" value="<?= $email ?>" id="email" />
                        <input type="hidden" value="<?= $password ?>" id="password" />
                        
                        <p>Please indicate your home state.</p>
                        <div class="form-group">
                            <label for="state" class="col-xs-1 control-label">State:</label>
                            <div class="col-xs-5">
                                <select name="state" id="state" class="form-control">
                                    <option selected="selected" disabled="disabled">Choose State</option>
                                    <option value="alaska">Alaska</option>
                                    <option value="iowa">Iowa</option>
                                    <option value="kansas">Kansas</option>
                                    <option value="missouri">Missouri</option>
                                    <option value="wisconsin">Wisconsin</option>
                                    <option disabled="disabled"></option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="other-state-box hidden">
                                <label for="other-state" class="col-xs-1 control-label">Other:</label>
                                <div class="col-xs-5">
                                    <input type="text" class="form-control" name="other-state" id="other-state" placeholder="Enter Other State" />
                                </div>
                            </div>
                        </div>
                        
                        <p>Please indicate your role.</p>
                        <div class="form-group">
                            <label for="role" class="col-xs-1 control-label">Role:</label>
                            <div class="col-xs-5">
                                <select name="state" id="role" class="form-control">
                                    <option selected="selected" disabled="disabled">Choose Role</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="researcher">Researcher</option>
                                    <option value="commercial">Commercial</option>
                                    <option disabled="disabled"></option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="other-role-box hidden">
                                <label for="other-role" class="col-xs-1 control-label">Other:</label>
                                <div class="col-xs-5">
                                    <input type="text" class="form-control" name="other-role" id="other-role" placeholder="Enter Other Role" />
                                </div>
                            </div>
                            <div class="school-box hidden">
                                <label for="school" class="col-xs-1 control-label">School:</label>
                                <div class="col-xs-5">
                                    <input type="text" class="form-control" name="school" id="school" placeholder="School Name" />
                                </div>
                            </div>
                            <div class="organization-box hidden">
                                <label for="organization" class="col-xs-1 control-label">Organization:</label>
                                <div class="col-xs-5">
                                    <input type="text" class="form-control" name="organization" id="organization" placeholder="Organization Name" />
                                </div>
                            </div>
                            <div class="company-box hidden">
                                <label for="company" class="col-xs-1 control-label">Company:</label>
                                <div class="col-xs-5">
                                    <input type="text" class="form-control" name="company" id="company" placeholder="Company Name" />
                                </div>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" id="submit" style="float:right">Submit</button>  
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
