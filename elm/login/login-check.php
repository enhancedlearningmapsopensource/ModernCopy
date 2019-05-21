<?php

require_once("../../database/core.php");

session_start();
session_write_close();
?>

<html>
    <head>
        <title>moderncopy login api</title>
    </head>
    <body>
        Login Result:
        <div id="login-result"><?=$_SESSION["ELM_EMAIL"]?></div>
        <div id="session-id"><?=$_SESSION["ELM_PASS"]?></div>
    </body>
</html>

