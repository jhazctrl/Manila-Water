<?php
// Include MongoDB connection
require_once __DIR__ . '/config.php';

try {
    $durations = [];
    $cursor = $db->Complaint_duration->find([], ['sort' => ['complaint_duration_id' => 1]]);
    
    foreach ($cursor as $doc) {
        $durations[] = [
            'id' => $doc['complaint_duration_id'],
            'name' => $doc['complaint_duration']
        ];
    }
    
    header('Content-Type: application/json');
    echo json_encode($durations);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
