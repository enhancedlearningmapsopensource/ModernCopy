<?php
echo "Setting up database framework.<br />";

require_once("core.php");
$database = Db();
$database->Connect();
echo "Database loaded.<br />";

$databases = ["elm_debug", "elm_release"];

$database->PrototypeQueryQuiet("START TRANSACTION");
foreach($databases as $d){
    echo "Configuring database: '$d'<br />";
    $database->PrototypeQueryQuiet("USE $d");
    $database->CreateUserTable();
    $database->CreateGroupTable();
    $database->CreateUserGroupTable();
    $database->CreatePermissionTable();
    $database->CreatePreferenceTable();
    $database->CreateUserPreferenceTable();
    $database->CreateDiscussionTable();
    $database->CreateDiscussionPostTable();
    $database->CreateDiscussionPostMsgTable();
    $database->CreateStandardSetTable();
    $database->CreateSubjectTable();
    $database->CreateDomainTable();
    $database->CreateGradeLevelTable();
    $database->CreateCrosswalkedStandardTable();
    $database->CreateEdgeTable();
    $database->CreateNodeTable();
    $database->CreateMapTable();
    $database->CreateHtmlContentTable();
    $database->CreateMapNodesTable();
    $database->CreateResourceTable();
    $database->CreateMapResourceTable();
    $database->CreateNodeStandardTable();
    $database->CreateNamingRuleTable();
    $database->CreateSharedResourceTable();
}
$database->PrototypeQueryQuiet("COMMIT");
?>
