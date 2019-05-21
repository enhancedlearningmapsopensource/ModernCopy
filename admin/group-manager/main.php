
<!-- SET UP COLOR SCHEME -->
<?php 
define("USER_SITE", "moderncopy");
define("COLORS", trim("['#f0f9e8','#bae4bc','#7bccc4','#43a2ca','#0868ac']"));
$colors = explode(",",substr(COLORS, 1, strlen(COLORS) - 2));
$trimmed = array_map(function($d){
    return substr($d, 1, strlen($d) - 2);
}, $colors);
$colorLst = array_reverse($trimmed);
?>
<style>
    body{
        <?php foreach($colorLst as $k => $v){ ?>
        --color-<?=$k+1?>: <?=$v ?>;
        <?php } ?>
    }
</style>

<!-- STYLE SHEETS -->
<link rel="stylesheet" href="main.css"/>
<link rel="stylesheet" href="lib/io/css/main.css"/>

<?php 

    /** Estimate Called Permissions **/
    $mainRoot = $gRoot . "../moderncopy/";
    //$adminRoot = $gRoot . "admin-main/";
    $groups = [];
    $preferences = [];
    
    echo "Admin: $adminRoot";
    echo "Main: $mainRoot";
    echo "<br />";
    
    /*function dirToArray($dir) {
        $result = array();
        $cdir = scandir($dir);
        foreach ($cdir as $key => $value) {
            if (!in_array($value, array(".", ".."))) {
                if (is_dir($dir . DIRECTORY_SEPARATOR . $value)) {
                    $result[$value] = dirToArray($dir . DIRECTORY_SEPARATOR . $value);
                } else {
                    $result[] = $value;
                }
            }
        }
        return $result;
    }*/
    
    function flatten($tree, $parent = null){
        if(!is_array($tree)){
            return flatten(array($tree));
        }
        
        $copy = array();
        foreach($tree as $k => $v){
            if(is_array($v)){
                $flattened = flatten($v, $k);
                if(is_array($flattened)){
                    foreach($flattened as $fv){
                        array_push($copy, $k . "/" . $fv);
                    }
                }
            }else{
                array_push($copy, $v);
            }
        }
        
        return $copy;
    }
    
    function findMissingPermissions($root, $files, &$missingPermissions){
        $pattern = "/HasPermission\s*\([^$]/";
        $patternFull = "/HasPermission\s*\(([^\)]*)\)/";
        foreach($files as $file){
            $extSplit = explode(".", $file);
            if(strcmp($extSplit[count($extSplit) - 1], "php") != 0){
                continue;
            }
            
            $content = file_get_contents($root . $file);
            $split = preg_split($pattern , $content);
            if(count($split) > 1){
                preg_match_all($patternFull, $content, $matches, PREG_PATTERN_ORDER);

                // Get the permissions
                $permissions = array_map(function($d){
                    $clean = $d;
                    while($clean[0] == '"'){
                        $clean = substr($clean,1);
                    }
                    while($clean[strlen($clean) - 1] == '"'){
                        $clean = substr($clean,0,strlen($clean)-1);
                    }
                    return $clean;
                }, $matches[1]);

                foreach($permissions as $p){
                    if(!isset($missingPermissions[$p])){
                        $missingPermissions[$p] = $p;
                    }
                }
            }
        }
    }
    
    
    $adminFiles = flatten(dirToArray($adminRoot));
    
    $missingPermissions = array();
    findMissingPermissions($adminRoot, $adminFiles, $missingPermissions);
    
    $subFolders = array(
        "corestate/",
    );
    
    foreach($subFolders as $s){
        $mainPath = $mainRoot . $s;
        $mainFiles = flatten(dirToArray($mainPath));
        findMissingPermissions($mainPath, $mainFiles, $missingPermissions);
    }
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_PERMISSION");
    $presentPermissions = array();
    while($row = $database->fetch($result)){
        $presentPermissions[$row["PROGRAM_CODE"]] = $row["PROGRAM_CODE"];
    }
    
    $presenceWarnings = array();
    foreach($missingPermissions as $missing){
        if(!isset($presentPermissions[$missing])){
            array_push($presenceWarnings, "<strong>Warning!</strong> Permission is used but is not currently present: '$missing'");
        }
    }
    
    //PreVarDump($missingPermissions);
    
            
            //array preg_split ( string $pattern , string $subject
    
    //PreVarDump($adminFiles);
?>


<?php 
    if(!$database->TableExists("ELM_PREFERENCE")){
        $database->CreatePreferenceTable();
    }
    if(!$database->TableExists("ELM_PERMISSION")){
        $database->CreatePermissionTable();
    }

    $database->PrototypeQueryQuiet("START TRANSACTION");
    
    // USERS
    $result = $database->PrototypeQuery("SELECT EMAIL, U.USERID, GROUPID FROM ELM_USER AS U LEFT JOIN ELM_USERGROUP AS UG ON U.USERID=UG.USERID");
    $users = array();
    while($row = $database->fetch($result)){
        if(!isset($users[$row["USERID"]])){
            $users[$row["USERID"]] = array(
                "EMAIL" => $row["EMAIL"],
                "GROUPS" => array()
            );
        }
        array_push($users[$row["USERID"]]["GROUPS"], $row["GROUPID"]);
    }
    
    // GROUPS
    $result = $database->PrototypeQuery("SELECT GROUPID, NAME FROM ELM_GROUP");
    $groups = array();
    while($row = $database->fetch($result)){
        $groups[$row["GROUPID"]] = array("NAME" => $row["NAME"]);
    }
    
    // PREFERENCES
    $result = $database->PrototypeQuery("SELECT * FROM ELM_PREFERENCE LIMIT 1");
    if(isset($result) && isset($result["result"])){
        $row = $database->fetch($result);

        // Get column names
        $colNames = array();
        foreach($row as $k => $v){
            $colNames[$k] = $k;
        }
        if(!isset($colNames["PROGRAM_CODE"])){
            $result = $database->PrototypeQueryQuiet("ALTER TABLE ELM_PREFERENCE ADD PROGRAM_CODE VARCHAR(10)");
        }
        if(isset($colNames["GROUPID"])){
            $result = $database->PrototypeQueryQuiet("ALTER TABLE ELM_PREFERENCE DROP COLUMN GROUPID");
        }
        if(!$database->TableExists("ELM_GROUPPREFERENCE")){
            $result = $database->PrototypeQueryQuiet("CREATE TABLE ELM_GROUPPREFERENCE (
                                                                            PREFERENCEID INT (6),
                                                                            GROUPID INT (6),
                                                                            DATECREATED DATETIME,
                                                                            PRIMARY KEY (PREFERENCEID,GROUPID));");
        }
    
    
        $result = $database->PrototypeQuery("SELECT P.PREFERENCEID AS PREFID, NAME,FORMTYPE,CHOICES,GROUPID,DEFAULTVALUE,PROGRAM_CODE FROM ELM_PREFERENCE AS P LEFT JOIN ELM_GROUPPREFERENCE AS GP ON P.PREFERENCEID=GP.PREFERENCEID");
        $preferences = array();
        while($row = $database->fetch($result)){
            if(!isset($preferences[$row["PREFID"]])){
                $preferences[$row["PREFID"]] = array(
                    "NAME" => $row["NAME"],
                    "FORMTYPE" => $row["FORMTYPE"],
                    "CHOICES" => $row["CHOICES"],
                    "DEFAULTVALUE" => $row["DEFAULTVALUE"],
                    "PROGRAM_CODE" => $row["PROGRAM_CODE"],
                    "GROUPS" => array()
                );
            }
            if($row["GROUPID"] != NULL){
                array_push($preferences[$row["PREFID"]]["GROUPS"], $row["GROUPID"]);
            }
        }
    }
    
    // PERMISSIONSS
    if(!$database->TableExists("ELM_GROUPPERMISSION")){
        echo "no group permissions";
        $database->CreatePermissionTable();
    }
    $result = $database->PrototypeQuery("SELECT P.PERMISSIONID,NAME,DESCRIPTION,PROGRAM_CODE,GROUPID FROM ELM_PERMISSION AS P LEFT JOIN ELM_GROUPPERMISSION AS GP ON P.PERMISSIONID=GP.PERMISSIONID");
    
    $permissions = array();
    while($row = $database->fetch($result)){
        if(!isset($permissions[$row["PERMISSIONID"]])){
            $permissions[$row["PERMISSIONID"]] = array(
                "NAME" => $row["NAME"],
                "DESCRIPTION" => $row["DESCRIPTION"],
                "PROGRAM_CODE" => $row["PROGRAM_CODE"],
                "GROUPS" => array()
            );
        }
        array_push($permissions[$row["PERMISSIONID"]]["GROUPS"], $row["GROUPID"]);
    }
    
    $database->PrototypeQueryQuiet("COMMIT");
?>

<?php WriteTemplate($gRoot . "admin-main/managers/group-manager/templates/page.html", "page-template") ?>
<?php WriteTemplate($gRoot . "admin-main/managers/group-manager/templates/category.html", "category-template") ?>
<?php WriteTemplate($gRoot . "admin-main/managers/group-manager/templates/table.html", "table-template") ?>
<?php WriteTemplate($gRoot . "admin-main/managers/group-manager/templates/edit-user-group.html", "edit-user-group") ?>
<?php WriteTemplate($gRoot . "admin-main/managers/group-manager/templates/new-permission.html", "new-permission") ?>
<?php WriteTemplate($gRoot . "admin-main/managers/group-manager/templates/edit-string.html", "edit-string") ?>
<?php WriteTemplate($gRoot . "admin-main/managers/group-manager/templates/delete-confirm.html", "delete-confirm") ?>

<div class="container" id="io-container">
    
</div>

<div class="container">
    <?= implode("<br />", $presenceWarnings) ?>
</div>

<div class="container" id="page-container">
    
</div>

<script>
    var data = {
        groups: JSON.parse('<?=json_encode($groups)?>'),
        users: JSON.parse('<?=json_encode($users)?>'),
        permissions: JSON.parse('<?=json_encode($permissions)?>'),
        preferences: JSON.parse('<?=json_encode($preferences)?>')
    };
</script>

<script src='velocity-class.js'></script>
<script>
    var gRoot = '<?=$gRoot?>';
    var dataVersion = JSON.parse('<?= json_encode($database->GetModernDataVersionComplete()) ?>');
    var userID = <?=$userID?>;
    var sessionID = '<?=session_id()?>';
    var userSite = "<?=USER_SITE?>";
</script>
<script src="<?=ELM_ROOT?>/database/common-functions.js"></script>
<script data-main='<?= $gRoot ?>admin-main/managers/group-manager/require-config-group-manager.js' src='<?= ELM_ROOT ?>external-lib/require/debug/v2.2.0/requirejs.js'></script>
<script>
    function loadComplete(){
        
    }
</script>


<p>Manage groups.</p>
<ul>
    <li>Add new groups</li>
    <li>Add new permissions</li>
    <li>Add new preferences</li>
    <li>Assign preferences to groups</li>
    <li>Assign privileges to groups</li>
</ul>

<ul>
    <li>Group
        <ul>
            <li>User
                <ul>
                    <li>Email</li>
                </ul>
            </li>
            <li>Preference
                <ul>
                    <li>Name</li>
                    <li>Type</li>
                    <li>Choices</li>
                    <li>Default</li>
                    <li>Program Code</li>
                    <li>Groups</li>
                    <li>Delete</li>
                </ul>
            </li>
            <li>Permission
                <ul>
                    <li>Name</li>
                    <li>Description</li>
                    <li>Program Code</li>
                    <li>Groups</li>
                    <li>Delete</li>
                </ul>
            </li>
        </ul>
    </li>
</ul>