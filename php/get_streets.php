<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (isset($_POST['barangay_id'])) {
    $barangay_id = intval($_POST['barangay_id']);

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

    $query = "SELECT street_id AS id, street_name AS name FROM Streets WHERE brgy_id = ?";
    $params = [$barangay_id];

    $stmt = sqlsrv_query($conn, $query, $params);

    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(["error" => "Query failed", "details" => sqlsrv_errors()]);
        exit;
    }

    $streets = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $streets[] = $row;
    }

    header('Content-Type: application/json');
    echo json_encode($streets ?? []);
    exit;
} else {
    http_response_code(400);
    echo json_encode(["error" => "Missing barangay_id"]);
    exit;
}
?>
