<?php
session_start(); // Start the session to access role and barangay

header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include MongoDB connection
require_once __DIR__ . '/config.php';

try {
    // Retrieve user role and barangay ID from session
    $role_id = $_SESSION['role_id'] ?? null;
    $barangay_id = $_SESSION['barangay_id'] ?? null;
    
    // Build filter for MongoDB query
    $filter = [
       'status' => [
            '$regex' => '^(ongoing|upcoming)$',
            '$options' => 'i'  // case-insensitive
       ]
    ];
    
    // Filter advisories: if the user is a barangay admin (role_id = 2), limit to their barangay
    if ($role_id == 2 && $barangay_id) {
        $filter['brgy_id'] = (int)$barangay_id;
    
    }
    
    // Use MongoDB aggregation to JOIN collections
    $pipeline = [
        [
            '$match' => $filter
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
            '$sort' => ['start_date' => -1]
        ]
    ];
    
    $advisories = $db->Advisories->aggregate($pipeline);
    
    foreach ($advisories as $row) {
        // Format dates and times
        $startDate = isset($row['start_date']) ? date('F j, Y', strtotime($row['start_date'])) : '';
        $startTime = isset($row['start_time']) ? date('g:i A', strtotime($row['start_time'])) : '';
        $endDate = isset($row['end_date']) ? date('F j, Y', strtotime($row['end_date'])) : '';
        $endTime = isset($row['end_time']) ? date('g:i A', strtotime($row['end_time'])) : '';
        
        // Format location based on role
        if (isset($_SESSION['role_id']) && $_SESSION['role_id'] == 2) {
            $location = htmlspecialchars($row['street_info']['street_name']);
        } else {
            $location = htmlspecialchars($row['street_info']['street_name'] . ', ' . $row['barangay_info']['brgy_number']);
        }
        
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['type_info']['advisory_type']) . "</td>";
        echo "<td>" . htmlspecialchars($row['advisory_description']) . "</td>";
        echo "<td>" . htmlspecialchars(trim("$startDate - $startTime")) . "</td>";
        echo "<td>" . htmlspecialchars(trim("$endDate - $endTime")) . "</td>";
        echo "<td>" . $location . "</td>";
        echo "<td>" . htmlspecialchars($row['status']) . "</td>";
        echo "</tr>";
    }
    
} catch (Exception $e) {
    echo "<tr><td colspan='6'>Error: " . htmlspecialchars($e->getMessage()) . "</td></tr>";
}
?>
