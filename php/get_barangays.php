<?php
// Prevent any output before headers
ob_start();

// Include MongoDB connection
require_once __DIR__ . '/config.php';

try {
    // Get all barangays
    $barangays = [];
    $cursor = $db->Barangays->find([], ['sort' => ['brgy_id' => 1]]);
    
    foreach ($cursor as $doc) {
        $barangays[] = [
            'barangay_id' => $doc['brgy_id'],  
            'barangay_name' => $doc['brgy_number']  
        ];
    }
    
    // Clear any accidental output
    ob_end_clean();
    
    header('Content-Type: application/json');
    echo json_encode($barangays);
    
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Database query failed", 
        "details" => $e->getMessage()
    ]);
}
?>