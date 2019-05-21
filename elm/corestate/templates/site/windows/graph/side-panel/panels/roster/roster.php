<?php 
require_once("../../../../../../../../../database/core.php");
require_once(SITE_ROOT . "database/ajax.php");

echo "<script>var atsRosterOn = true;</script>";
echo file_get_contents(SITE_ROOT . "nodelocater/public/index.ejs");