<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable HTML error output
require_once 'config.php';

try {
    $conn = getConnection();
    
    if ($conn === false) {
        throw new Exception("Database connection failed: " . print_r(sqlsrv_errors(), true));
    }

    // Get Advisory Types
    $advisoryTypesQuery = "SELECT advisory_type_id AS advisory_type_id, advisory_type AS advisory_type_name FROM Advisory_types ORDER BY advisory_type";
    $advisoryTypesStmt = sqlsrv_query($conn, $advisoryTypesQuery);
    
    if ($advisoryTypesStmt === false) {
        throw new Exception("Failed to fetch advisory types: " . print_r(sqlsrv_errors(), true));
    }

    $advisoryTypes = [];
    while ($row = sqlsrv_fetch_array($advisoryTypesStmt, SQLSRV_FETCH_ASSOC)) {
        $advisoryTypes[] = $row;
    }

    // Get Barangays
    $barangaysQuery = "SELECT brgy_id, brgy_number FROM Barangays ORDER BY brgy_number";
    $barangaysStmt = sqlsrv_query($conn, $barangaysQuery);
    
    if ($barangaysStmt === false) {
        throw new Exception("Failed to fetch barangays: " . print_r(sqlsrv_errors(), true));
    }

    $barangays = [];
    while ($row = sqlsrv_fetch_array($barangaysStmt, SQLSRV_FETCH_ASSOC)) {
        $barangays[] = $row;
    }

    // Get All Streets
    $streetsQuery = "SELECT street_id, street_name, brgy_id FROM Streets ORDER BY street_name";
    $streetsStmt = sqlsrv_query($conn, $streetsQuery);
    
    if ($streetsStmt === false) {
        throw new Exception("Failed to fetch streets: " . print_r(sqlsrv_errors(), true));
    }

    $streets = [];
    while ($row = sqlsrv_fetch_array($streetsStmt, SQLSRV_FETCH_ASSOC)) {
        $streets[] = $row;
    }

    echo json_encode([
        'success' => true,
        'advisoryTypes' => $advisoryTypes,
        'barangays' => $barangays,
        'streets' => $streets
    ]);

} catch (Exception $e) {
    error_log("Error in get_locations.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>