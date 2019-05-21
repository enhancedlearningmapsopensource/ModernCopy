<?php 
require_once("../../../../../../database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

if(!defined("ELM_PATH")){
    define("ELM_PATH", ELM_ROOT . "elm/");
}?>
<div id="overlays">
    <div id="feedback-overlay"></div>
    <div id="bugtracker-overlay"></div>
    <div id="dashboard-overlay"></div>
    <?php require_once(ELM_PATH . "corestate/templates/site/overlays/dashboard/dashboard.php"); ?>
    <?php require_once(ELM_PATH . "corestate/templates/site/overlays/user-guide/user-guide.php"); ?>
    <?php require_once(ELM_PATH . "corestate/templates/site/overlays/videos/videos.php"); ?>
    <?php require_once(ELM_PATH . "corestate/templates/site/overlays/people/people.php"); ?>
</div>