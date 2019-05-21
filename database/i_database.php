<?php

interface IDatabase{
    public function Connect();
    public function Disconnect();
    public function CreateTable($sqlCreateQuery);
    public function CreateView($viewName, $query);
    public function GetConnection();
    public function GetDatabaseUsed();
    public function GetPrimaryKeyColumns($table);
    public function ImportMode($on = NULL);
    public function ProtectedQuery($query, $params, $username, $password);
    public function RealEscapeString($str);
    public function StressTest($input);
    public function TableExists($table);
    public function ViewExistsGeneral($table, $output=false);
}
?>