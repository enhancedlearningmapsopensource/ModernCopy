<?php

// Enforce login
require_once("../../ajax.php");

// Get function 
require_once("../ajax/utility/sanitize.php");

$tests = array(
    array("in" => "a", "expected" => "a"),
    array("in" => "zZ", "expected" => "zZ"),
    array("in" => "a09z", "expected" => "a09z"),
    array("in" => "<", "expected" => "&#60;"),
    array("in" => ";", "expected" => ";"),
    array("in" => "&#", "expected" => "&#"),
    array("in" => "<script>", "expected" => "&#60;script&#62;"),
    array("in" => "<a href='#'>", "expected" => "&#60;a&#32;href&#61;&#39;#&#39;&#62;"),
    array("in" => "3+2", "expected" => "3&#43;2"),
    array("in" => "x-8", "expected" => "x&#45;8"),
    array("in" => "*#4", "expected" => "&#42;#4"),
    array("in" => "\'", "expected" => "&#92;&#39;"),
    array("in" => "(6)", "expected" => "&#40;6&#41;"),
    array("in" => ":,.?", "expected" => "&#58;&#44;&#46;&#63;"),
    array("in" => "\"/", "expected" => "&#34;&#47;"),
    array("in" => "[{}]|", "expected" => "&#91;&#123;&#125;&#93;&#124;")
);
$results = array();


foreach($tests as $test){
    $actual = Sanitize($test["in"]);
    echo "AC: " . implode(",",str_split($actual));
    $results[] = array(
        "in" => $test["in"],
        "expected" => $test["expected"],
        "actual" => $actual,
        "pass" => ($test["expected"] == $actual)
    );
}  

// Show results
?>

<html>
    <head>
        <title>Test Sanitize</title>
        <style>
            table{
                width: 50%;
            }
            th{
                text-align: left;
            }
        </style>
    </head>
    <body>
        <p>
            ord(a): '<?=ord("a")?>'<br />
            ord(z): '<?=ord("z")?>'<br />
            ord(A): '<?=ord("A")?>'<br />
            ord(Z): '<?=ord("Z")?>'<br />
            ord(0): '<?=ord("0")?>'<br />
            ord(9): '<?=ord("9")?>'<br />
        </p>
        <table>
            <tr>
                <th>Input</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Pass</th>
            </tr>
            <?php foreach($results as $r){ ?>
            <tr>
                <td><?=implode(" ",str_split($r["in"]))?></td>
                <td><?=implode(" ",str_split($r["expected"]))?></td>
                <td><?=implode(" ",str_split($r["actual"]))?></td>
                <td><?=$r["pass"] ? "TRUE" : "FALSE" ?></td>
            </tr>
            <?php } ?>
        </table>
    </body>
</html>