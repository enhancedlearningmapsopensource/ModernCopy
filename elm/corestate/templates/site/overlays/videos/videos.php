<?php 

// Content for the vidoes overlay

// Check for ELM_PATH constant
if(!defined("ELM_PATH")){
    throw new Exception("ELM_PATH is not defined");
}
ob_start(); // Start recording the html ?>


<?php // TITLE SECTION ?>
Videos
<?php $title = ob_get_contents(); ob_end_clean();// Gather the html ?>


<?php // CONTENT SECTION ?>
<?php ob_start(); // Start recording the html ?>

<?php echo  htmlspecialchars_decode($database->FetchHtmlContent("VIDEO")); ?>
    
<?php $content = ob_get_contents(); ob_end_clean();// Stop recording the html ?>

<?php // FOOTER SECTION ?>
<?php ob_start(); // Start recording the html ?>
<h4>Click to close</h4>
<?php $footer = ob_get_contents(); ob_end_clean();// Gather the html ?>

<?php // OUTPUT TO PAGE ?>
<?php require_once(ELM_PATH . "corestate/templates/site/overlays/layout/layout.php"); ?>
<?php overlay($title, $content, $footer); ?>