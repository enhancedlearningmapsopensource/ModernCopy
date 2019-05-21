<?php

/**
 * Creates and sends email to user for 
 */

require_once("../../../../database/core.php");
define("USE_FAKE_CLIENT", (file_exists("../../../../modernadmin/admin-main/managers/fake-email-client/email.php")));

if(USE_FAKE_CLIENT){
    require_once("../../../../modernadmin/admin-main/managers/fake-email-client/email.php");
}

$email = filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL);
$password = filter_input(INPUT_POST, "password", FILTER_SANITIZE_STRING);
$state = filter_input(INPUT_POST, "state", FILTER_SANITIZE_STRING);
$role = filter_input(INPUT_POST, "role", FILTER_SANITIZE_STRING);
$org = filter_input(INPUT_POST, "org", FILTER_SANITIZE_STRING);
$agree = isset($_POST["agree"]) ? filter_input(INPUT_POST, "agree", FILTER_SANITIZE_NUMBER_INT) : 0;
$server = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";

$email = str_replace("%40", "@", $email);

//echo $email;
//echo strcmp($email, "dvermaakwork@gmail.com") == 0 ? "true" : "false";

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


if (strlen(trim($email)) == 0) {
    echo json_encode(array(
        "error" => array(
            "email" => array("Username is empty."),
            "password" => array(),
            "confirm" => array()
        )
    ));
    exit();
}

if (strlen(trim($password)) == 0) {
    echo json_encode(array(
        "error" => array(
            "email" => array("Password is empty."),
            "password" => array(),
            "confirm" => array()
        )
    ));
    exit();
}

/**
 * For security do not report a username in use. Instead complete the process then notify the user
 * that someone attempted to make a new account for their email and give them access to the reset
 * password link.
 */
$userExists = false;
$result = $database->PrototypeQuery("SELECT USERID FROM ELM_USER WHERE EMAIL LIKE ?;", array(&$email));
if ($result != null && isset($result["result"])) {
    $confirm = $database->PrototypeQuery("SELECT * FROM ELM_ACCOUNTCONFIRM AS AC LEFT JOIN ELM_USER AS U ON U.USERID=AC.USERID WHERE U.EMAIL LIKE '$email'");

    // This user is waiting for a confirmation. We assume that the previous application failed and 
    // remove the user.
    if(isset($confirm["result"])){
        $row = $database->fetch($result);
        $userID = $row["USERID"];
        $database->DeleteUser($userID);
    }else{
        $userExists = true;
    }
}

if ($agree) {        
    // Get the current date
    $date = date("Y-m-d H:i:s");
    
    // Set up the email headers
    $headers = 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'From: ' . $contactEmail . "\r\n";
    $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";

    // Create the account
    if(!$userExists){
        createUser($database, $email, $password, "KS");

        // Get the user id
        $userID = $database->GetUserIDFromEmail($email);
        
        // Add the user role
        if(isset($role)){
            $database->PrototypeQueryQuiet("UPDATE ELM_USER SET ROLE='$role' WHERE USERID=$userID");
        }
        
        // Add the user state
        if(isset($state)){
            $database->PrototypeQueryQuiet("UPDATE ELM_USER SET STATE='$state' WHERE USERID=$userID");
        }
        
        // Add the user organization
        if(isset($org)){
            $database->PrototypeQueryQuiet("UPDATE ELM_USER SET ORGANIZATION='$org' WHERE USERID=$userID");
        }

        $code = md5($date . "ELM_ACCOUNT" . $userID . "CREATION");
        $expires = date("Y-m-d H:i:s", strtotime('+24 hours'));

        // Add to the account table
        $database->PrototypeQueryQuiet("INSERT INTO ELM_ACCOUNTCONFIRM(USERID,EXPIRES,CODE) VALUES(?,?,?)", array(&$userID, &$expires, &$code));

        // The message
        $messageText = array(
            "Your email address ('$email') was used to create a new account on $date. To complete the account creation process, please follow the link below:",
            "<a href=\"$server/elm/complete.php?code=$code\">Confirm Account</a>",
            "",
            "The link above will expire on $expires.",
            "",
            "If you've received this mail in error, it's likely that another user mistakenly entered your email address while attempting to reset a password. If you didn't initiate the request, you don't need to take further action and can safely disregard this email.",
            "",
            "If you would like to reset your password, please use the link below:",
            "<a href=\"$server/elm/corestate/templates/login/forgot.php\">Reset password.</a>",
            "",
            "If you are in one of our member states and would like to join the ELM project as a Cohort teacher, please use the link below:",
            "<a href=\"$server/elm/corestate/templates/login/survey-reflect.php\">Join ELM Project.</a>"
        );
        
        if(USE_FAKE_CLIENT){
            sendEmail("elmmaster@ku.edu", "elmmodernemail@ku.edu", "Test email.", str_replace("\"", "^", str_replace("'", "^", implode("NEWLINE",$messageText))));
        }

        echo json_encode(array("code" => array(
            "expires" => $expires,
            "code"=>$code
        )));
    }else{
        // Get the user id
        $userID = $database->GetUserIDFromEmail($email);
        
        // Notify the user that their email address was used and send reset link
        $messageText = array(
            "Your email address ('$email') was used to create a new account on $date. There is already an account with this email address.",
            "",
            "If you've received this mail in error, it's likely that another user mistakenly entered your email address while attempting to reset a password. If you didn't initiate the request, you don't need to take further action and can safely disregard this email.",
            "",
            "If you would like to reset your password, please use the link below:",
            "<a href=\"$server/elm/corestate/templates/login/forgot.php\">Reset password.</a>",
            "",
            "If you are in one of our member states and would like to join the ELM project as a Cohort teacher, please use the link below:",
            "<a href=\"$server/elm/corestate/templates/login/survey-reflect.php\">Join ELM Project.</a>"
        );     
        
        if(USE_FAKE_CLIENT){
            sendEmail("elmmaster@ku.edu", "elmmodernemail@ku.edu", "Login Test.", str_replace("\"", "^", str_replace("'", "^", implode("NEWLINE",$messageText))));
        }
        echo json_encode(array("emailtext"=>join("<br />",$messageText)));
    }
    
    // The message
    $message = join("<br />",$messageText);//()"Line 1\r\nLine 2\r\nLine 3";
    
    // In case any of our lines are larger than 70 characters, we should use wordwrap()
    $message = wordwrap($message, 70, "\r\n");

    // Send
    mail($email, 'ELM (Enhanced Learning Maps) Account Creation', $message, $headers);
    
    
} else {
    echo json_encode(array());
}
?>