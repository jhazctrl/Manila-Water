<?php
// Prevent any output before headers
ob_start();

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// FIXED: Config is in the SAME directory
require_once __DIR__ . '/config.php';

try {
    // Check for barangay_id in both GET and POST (to support both methods)
    $barangay_id = null;
    if (isset($_GET['barangay_id'])) {
        $barangay_id = intval($_GET['barangay_id']);
    } elseif (isset($_POST['barangay_id'])) {
        $barangay_id = intval($_POST['barangay_id']);
    }
    
    if (!$barangay_id) {
        ob_end_clean();
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(["error" => "Missing barangay_id"]);
        exit;
    }
    
    // Use $db from config.php (already initialized)
    
    // Find streets by barangay_id
    $streets = [];
    $cursor = $db->Streets->find(
        ['brgy_id' => $barangay_id],
        ['sort' => ['street_name' => 1]]
    );
    
    foreach ($cursor as $doc) {
        $streets[] = [
            'street_id' => $doc['street_id'],      
            'street_name' => $doc['street_name']
        ];
    }
    
    // Clear any accidental output
    ob_end_clean();
    
    header('Content-Type: application/json');
    echo json_encode($streets);
    
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Database error", 
        "details" => $e->getMessage()
    ]);
}
?>