<?php
define("ELM_ROOT", "../../");
require_once(ELM_ROOT . "database/core.php");

$json   = [];
$email  = filter_var(PostRecover("email", NULL), FILTER_SANITIZE_EMAIL);
$pass   = filter_var(PostRecover("pass", NULL), FILTER_SANITIZE_STRING);
$clear  = filter_var(PostRecover("clear", NULL), FILTER_SANITIZE_STRING);

// Connect to database
$database = Db();
$database->Connect();

if (!$database->TableExists("ELM_ACCOUNTCONFIRM")) {
    $database->CreateAccountConfirmTable();
}

// Check for pending user
$results = $database->PrototypeQuery("SELECT * FROM ELM_ACCOUNTCONFIRM AS AC LEFT JOIN ELM_USER AS U ON U.USERID=AC.USERID WHERE U.EMAIL LIKE '$email'");
if(isset($results["result"])){
    $json['valid'] = false;
    $json['log'] = "user account pending confirmation.";

    echo json_encode($json);
    exit();
}




// Check for user table
if(!$database->TableExists("ELM_USER")){
    if(strcmp(DbDatabase(), "elm_release") != 0){
        throw new Exception("No user table. Db: " . DbDatabase());
    }else{
        // Create the table
        $database->CreateUserTable();
    }
}


if($clear == NULL){
    // Verify user
    require_once("./connect-user.php");
    $json['valid'] = connectUser($database, $email, $pass, $log, true);
    $json['log'] = $log;
}else{
    // Connect using the clear password
    require_once("./connect-user.php");
    $json['valid'] = connectUser($database, $email, $clear, $log, true);
    if($json['valid']){
        // Clear password is valid so encrypt the client-encrypted password and replace the one in the database.
        $encryptedPass = encryptPassword($database, $email, $pass);
        $database->ChangePassword($email, $encryptedPass);

        // Reconnect user using the new password
        $json['valid'] = connectUser($database, $email, $pass, $log, true);
    }
    $json['log'] = $log;
}

echo json_encode($json);
?>

