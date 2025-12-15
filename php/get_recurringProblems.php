<?php
session_start();
header('Content-Type: application/json');

// Database connection configuration
$serverName = "TANMINJA\\MSSQLSERVER01,1433";
$database = "MNL_Water_Sampaloc";
$username = "Jhaz";
$password = "jzadmin";

try {
    // Set up the PDO connection
    $conn = new PDO("sqlsrv:Server=$serverName;Database=$database", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get the user's barangay ID from the session
    $barangay_id = isset($_SESSION['barangay_id']) ? (int)$_SESSION['barangay_id'] : null;
    if (!$barangay_id) {
        echo json_encode(['error' => 'Missing barangay_id']);
        exit();
    }

    $sql = "
        SELECT 
            s.street_name,
            ct.complaint_type,
            COUNT(*) as total
        FROM Analytics a
        JOIN Complaint_types ct ON a.complaint_type_id = ct.complaint_type_id
        JOIN Streets s ON a.street_id = s.street_id
        WHERE a.analytics_type_id = 1 AND a.brgy_id = :brgy_id AND a.street_id IS NOT NULL
        GROUP BY s.street_name, ct.complaint_type
        ORDER BY total DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':brgy_id' => $barangay_id]);

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $data]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
    exit();
}
?>
