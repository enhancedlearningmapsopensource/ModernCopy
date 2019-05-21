<?php

require_once("../../../../database/core.php");

define("USE_FAKE_CLIENT", (file_exists("../../../../modernadmin/admin-main/managers/fake-email-client/email.php")));
if(USE_FAKE_CLIENT){
    require_once("../../../../modernadmin/admin-main/managers/fake-email-client/email.php");
}

$email = filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL);
$password = filter_input(INPUT_POST, "password", FILTER_SANITIZE_STRING);

// Connect to the database
$database = Db();
$database->Connect();

$userID = $database->GetUserIDFromEmail($email);
$database->PrototypeQueryQuiet("DELETE FROM ELM_PASSWORDRESET WHERE USERID=" . $userID);

$hashed = encryptPassword($database, $email, $password);

$database->ChangePassword($email, $hashed);
echo json_encode(array());