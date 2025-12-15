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

    // First query to get all advisories for stats
    $stats_query = "SELECT status FROM Advisories";
    $stats_stmt = sqlsrv_query($conn, $stats_query);

    if ($stats_stmt === false) {
        throw new Exception("Error executing stats query: " . print_r(sqlsrv_errors(), true));
    }

    $stats = [
        'total' => 0,
        'upcoming' => 0,
        'ongoing' => 0,
        'resolved' => 0
    ];

    while ($row = sqlsrv_fetch_array($stats_stmt, SQLSRV_FETCH_ASSOC)) {
        $stats['total']++;
        $status = strtolower($row['status']);
        if (isset($stats[$status])) {
            $stats[$status]++;
        }
    }

    // Second query to get unresolved advisories for display
    $display_query = "SELECT 
        a.advisory_id,
        at.advisory_type as advisory_type,
        a.advisory_description,
        CONVERT(VARCHAR, a.start_date, 23) as start_date,
        CONVERT(VARCHAR, a.start_time, 108) as start_time,
        CONVERT(VARCHAR, a.end_date, 23) as end_date,
        CONVERT(VARCHAR, a.end_time, 108) as end_time,
        s.street_name,
        b.brgy_number,
        a.status
    FROM Advisories a
    INNER JOIN Advisory_types at ON a.advisory_type_id = at.advisory_type_id
    INNER JOIN Streets s ON a.street_id = s.street_id
    INNER JOIN Barangays b ON a.brgy_id = b.brgy_id
    WHERE a.status != 'resolved'
    ORDER BY a.start_date DESC, a.start_time DESC";

    $display_stmt = sqlsrv_query($conn, $display_query);

    if ($display_stmt === false) {
        throw new Exception("Error executing display query: " . print_r(sqlsrv_errors(), true));
    }

    $advisories = [];
    while ($row = sqlsrv_fetch_array($display_stmt, SQLSRV_FETCH_ASSOC)) {
        // Format the location as a single string
        $location = $row['street_name'] . ', ' . $row['brgy_number'];
        
        // Combine date and time
        $start_datetime = $row['start_date'] . ' ' . $row['start_time'];
        $end_datetime = $row['end_date'] . ' ' . $row['end_time'];

        $advisories[] = [
            'advisory_id' => $row['advisory_id'],
            'advisory_type' => $row['advisory_type'],
            'advisory_description' => $row['advisory_description'],
            'start_date' => $start_datetime,
            'end_date' => $end_datetime,
            'location' => $location,
            'status' => $row['status']
        ];
    }

    echo json_encode([
        'success' => true,
        'advisories' => $advisories,
        'stats' => $stats
    ]);

} catch (Exception $e) {
    error_log("Error in get_advisories.php: " . $e->getMessage());
    http_response_code(500); // Set proper error status code
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