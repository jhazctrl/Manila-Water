<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

try {
    $db = getConnection();
    
    // Get Advisory Types
    $advisoryTypes = [];
    $cursor = $db->Advisory_types->find([], ['sort' => ['advisory_type' => 1]]);
    
    foreach ($cursor as $doc) {
        $advisoryTypes[] = [
            'advisory_type_id' => $doc['advisory_type_id'],
            'advisory_type_name' => $doc['advisory_type']
        ];
    }
    
    // Get Barangays
    $barangays = [];
    $cursor = $db->Barangays->find([], ['sort' => ['brgy_number' => 1]]);
    
    foreach ($cursor as $doc) {
        $barangays[] = [
            'brgy_id' => $doc['brgy_id'],
            'brgy_number' => $doc['brgy_number']
        ];
    }
    
    // Get All Streets
    $streets = [];
    $cursor = $db->Streets->find([], ['sort' => ['street_name' => 1]]);
    
    foreach ($cursor as $doc) {
        $streets[] = [
            'street_id' => $doc['street_id'],
            'street_name' => $doc['street_name'],
            'brgy_id' => $doc['brgy_id']
        ];
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
}
?>