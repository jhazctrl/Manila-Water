<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

try {
    $db = getConnection();
    
    // First query to get all advisories for stats
    $allAdvisories = $db->Advisories->find();
    
    $stats = [
        'total' => 0,
        'upcoming' => 0,
        'ongoing' => 0,
        'resolved' => 0
    ];
    
    foreach ($allAdvisories as $advisory) {
        $stats['total']++;
        $status = strtolower($advisory['status']);
        if (isset($stats[$status])) {
            $stats[$status]++;
        }
    }
    
    // Second query to get unresolved advisories for display
    $pipeline = [
    [
        '$match' => [
            'status' => [
                '$not' => [
                    '$regex' => '^resolved$',
                    '$options' => 'i'  // case-insensitive
                ]
            ]
        ]
    ],
    [
        '$lookup' => [
                'from' => 'Advisory_types',
                'localField' => 'advisory_type_id',
                'foreignField' => 'advisory_type_id',
                'as' => 'type_info'
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
                'from' => 'Barangays',
                'localField' => 'brgy_id',
                'foreignField' => 'brgy_id',
                'as' => 'barangay_info'
            ]
        ],
        [
            '$unwind' => '$type_info'
        ],
        [
            '$unwind' => '$street_info'
        ],
        [
            '$unwind' => '$barangay_info'
        ],
        [
            '$sort' => ['start_date' => -1, 'start_time' => -1]
        ]
    ];
    
    $displayAdvisories = $db->Advisories->aggregate($pipeline);
    
    $advisories = [];
    foreach ($displayAdvisories as $row) {
        $location = $row['street_info']['street_name'] . ', ' . $row['barangay_info']['brgy_number'];
        $start_datetime = $row['start_date'] . ' ' . $row['start_time'];
        $end_datetime = $row['end_date'] . ' ' . $row['end_time'];
        
        $advisories[] = [
            'advisory_id' => $row['advisory_id'],
            'advisory_type' => $row['type_info']['advisory_type'],
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
    error_log("Error in get_advisories2.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>