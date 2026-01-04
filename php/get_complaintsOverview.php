<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set headers FIRST before any output
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Include MongoDB connection
require_once __DIR__ . '/config.php';

try {
    session_start();
    $barangay_id = $_SESSION['barangay_id'] ?? null;
    
    if (!$barangay_id) {
        echo json_encode(["error" => "Unauthorized. No barangay assigned."]);
        exit;
    }
    
    // Range filter (week, month, year)
    $range = $_GET['range'] ?? 'week';
    
    // Calculate date threshold
    $now = new DateTime();
    switch ($range) {
        case 'month':
            $threshold = $now->modify('-1 month');
            break;
        case 'year':
            $threshold = $now->modify('-1 year');
            break;
        default: // week
            $threshold = $now->modify('-7 days');
            break;
    }
    
    // Convert to MongoDB date format
    $thresholdDate = new MongoDB\BSON\UTCDateTime($threshold->getTimestamp() * 1000);
    
    // Base filter for MongoDB
    $baseFilter = [
        'barangay_id' => (int)$barangay_id,
        'complaint_date' => ['$gte' => $thresholdDate]
    ];
    
    // Helper function to count complaints by status
    function getCount($db, $status, $baseFilter) {
        $filter = array_merge($baseFilter, ['status' => $status]);
        return $db->Complaints->countDocuments($filter);
    }
    
    // Get counts for each status
    $verifiedCount = getCount($db, 'verified', $baseFilter);
    $resolvedCount = getCount($db, 'resolved', $baseFilter);
    $rejectedCount = getCount($db, 'rejected', $baseFilter);
    $pendingCount = getCount($db, 'pending', $baseFilter);
    
    // New pending within 24 hrs
    $now24hrs = new DateTime();
    $threshold24hrs = $now24hrs->modify('-24 hours');
    $thresholdDate24hrs = new MongoDB\BSON\UTCDateTime($threshold24hrs->getTimestamp() * 1000);
    
    $pendingNewCount = $db->Complaints->countDocuments([
        'status' => 'pending',
        'barangay_id' => (int)$barangay_id,
        'complaint_date' => ['$gte' => $thresholdDate24hrs]
    ]);
    
    // Output JSON
    echo json_encode([
        "verified" => $verifiedCount,
        "resolved" => $resolvedCount,
        "rejected" => $rejectedCount,
        "pending" => $pendingCount,
        "pending_new" => $pendingNewCount
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_complaintsOverview.php: " . $e->getMessage());
    echo json_encode([
        "error" => "Query failed",
        "details" => $e->getMessage()
    ]);
}
?>
