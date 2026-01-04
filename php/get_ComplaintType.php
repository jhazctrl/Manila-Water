<?php
// Include MongoDB connection
require_once __DIR__ . '/config.php';

try {
    $types = [];
    $cursor = $db->Complaint_types->find([], ['sort' => ['complaint_type_id' => 1]]);
    
    foreach ($cursor as $doc) {
        $types[] = [
            'complaint_type_id' => $doc['complaint_type_id'],
            'complaint_type' => $doc['complaint_type']
        ];
    }
    
    header('Content-Type: application/json');
    echo json_encode($types);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
