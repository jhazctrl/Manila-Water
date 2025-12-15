<?php
$serverName = "TANMINJA\\MSSQLSERVER01,1433";
$connectionOptions = [
    "Database" => "MNL_Water_Sampaloc",
    "Uid" => "Jhaz",    
    "PWD" => "jzadmin",   
    "TrustServerCertificate" => true
];

$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed", "details" => sqlsrv_errors()]);
    exit;
}

$query = "SELECT brgy_id AS id, brgy_number AS name FROM Barangays";
$stmt = sqlsrv_query($conn, $query);

$barangays = [];
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $barangays[] = $row;
}

header('Content-Type: application/json');
echo json_encode($barangays);
?>
