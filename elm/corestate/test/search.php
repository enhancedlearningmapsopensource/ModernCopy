<?php

require_once("../ajax.php");

define("TEST_PATH", ELM_ROOT . "assets/searchdata/");

?>
<script>
    var workingCopyTests = [];

<?php $cdir = scandir(TEST_PATH); 
foreach ($cdir as $key => $value) { 
   if (!in_array($value,array(".",".."))) {?>
       var k = '<?=$value?>';
       workingCopyTests.push(<?php echo file_get_contents(TEST_PATH . $value) ?>);
   <?php }
}?>
    
</script>

