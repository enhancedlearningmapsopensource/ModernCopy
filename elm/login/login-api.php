<?php

require_once("../../database/core.php");

$json = [];
$email = filter_var(GetRecover("email", NULL), FILTER_SANITIZE_STRING);
$pass = filter_var(GetRecover("pass", NULL), FILTER_SANITIZE_STRING);


//echo "em: $email, pa: $pass<br /><br />";

// Connect to database
$database = Db();
$database->Connect();

// Verify user
require_once(ELM_ROOT . "login/connect-user.php");
$loginSuccess = connectUser($database, $email, $pass, $log, true);
$json['log'] = $log;

//header('Location:' . ELM_ROOT . "corestate/");
?>

<html>
    <head>
        <title>moderncopy login api</title>
    </head>
    <body>
        Login Result:
        <div id="login-result"><?=$loginSuccess?></div>
        <div id="session-id"><?=session_id()?></div>
        <div id="log"><?php PreVarDump($log) ?></div>
    </body>
</html>

