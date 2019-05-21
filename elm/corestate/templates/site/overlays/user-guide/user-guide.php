<?php 

if(!defined("ELM_PATH")){
    throw new Exception("ELM_PATH is not defined");
}

ob_start(); // Start recording the html ?>

<?php 

$MAX_CHARS = 20;
$MAX_RECENT = 4;
?>

<?php // TITLE SECTION ?>
User Guide
<?php $title = ob_get_contents(); ob_end_clean();// Gather the html ?>


<?php // CONTENT SECTION ?>
<?php ob_start(); // Start recording the html ?>
<!--div class="row">
    <div class="col-xs-12"--> 
        <embed src="<?=ELM_ROOT?>elm/assets/user-guide/user-guide.pdf" width="100%" height="100%" type='application/pdf'>
        <!--?php echo file_get_contents(ELM_ROOT . "corestate/templates/site/overlays/user-guide/content.html") ?-->
    <!--/div>
</div-->
<?php $content = ob_get_contents(); ob_end_clean();// Stop recording the html ?>

<?php // FOOTER SECTION ?>
<?php ob_start(); // Start recording the html ?>
<h4>Click to close</h4>
<?php $footer = ob_get_contents(); ob_end_clean();// Gather the html ?>

<?php // OUTPUT TO PAGE ?>
<?php require_once(ELM_PATH . "corestate/templates/site/overlays/layout/layout.php"); ?>
<?php overlay($title, $content, $footer); ?>