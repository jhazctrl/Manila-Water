<?php
// ============================================
// Get Recurring Problems - MongoDB Version
// ============================================
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

// Use centralized config
require_once __DIR__ . '/config.php';

try {
    $db = getConnection();
    
    // Get barangay ID from session
    $barangay_id = $_SESSION['barangay_id'] ?? null;
    
    if (!$barangay_id) {
        echo json_encode([
            'success' => false, 
            'message' => 'Missing barangay_id in session.'
        ]);
        exit;
    }
    
    // MongoDB aggregation pipeline to group complaints by street and type
    $pipeline = [
        [
            '$match' => [
                'barangay_id' => (int)$barangay_id
            ]
        ],
        [
            '$lookup' => [
                'from' => 'Streets',
                'localField' => 'street_id',
                'foreignField' => 'street_id',
                'as' => 'street_info'
            ]
        ],
        [
            '$lookup' => [
                'from' => 'Complaint_types',
                'localField' => 'complaint_type',
                'foreignField' => 'complaint_type_id',
                'as' => 'type_info'
            ]
        ],
        [
            '$unwind' => '$street_info'
        ],
        [
            '$unwind' => '$type_info'
        ],
        [
            '$group' => [
                '_id' => [
                    'street_name' => '$street_info.street_name',
                    'complaint_type' => '$type_info.complaint_type'
                ],
                'total' => ['$sum' => 1]
            ]
        ],
        [
            '$sort' => [
                'total' => -1,
                '_id.street_name' => 1
            ]
        ],
        [
            '$project' => [
                '_id' => 0,
                'street_name' => '$_id.street_name',
                'complaint_type' => '$_id.complaint_type',
                'total' => 1
            ]
        ]
    ];
    
    $cursor = $db->Complaints->aggregate($pipeline);
    
    $data = [];
    foreach ($cursor as $doc) {
        $data[] = [
            'street_name' => $doc['street_name'],
            'complaint_type' => $doc['complaint_type'],
            'total' => (int)$doc['total']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>