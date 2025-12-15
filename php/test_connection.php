<?php
$serverName = "TANMINJA\\MSSQLSERVER01,1433";

$connectionOptions = array(
    "Database" => "MNL_Water_Sampaloc",
    "Uid" => "Jhaz",
    "PWD" => "jzadmin"
);

$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    echo "<pre>";
    print_r(sqlsrv_errors());
    echo "</pre>";
} else {
    echo "✅ Connected successfully to SQL Server!";
}
?>
