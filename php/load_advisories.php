<?php
header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load MongoDB library
require_once __DIR__ . '/../vendor/autoload.php';

try {
    // MongoDB connection
    $client = new MongoDB\Client("mongodb://localhost:27017");
    $db = $client->MNL_Water_Sampaloc;
    
    // MongoDB aggregation pipeline to join collections (similar to SQL JOIN)
    $pipeline = [
        // Filter by status (WHERE clause)
        [
            '$match' => [
                'status' => ['$in' => ['Ongoing', 'Upcoming', 'upcoming']]
            ]
        ],
        // Lookup Advisory_types (JOIN Advisory_types)
        [
            '$lookup' => [
                'from' => 'Advisory_types',
                'localField' => 'advisory_type_id',
                'foreignField' => 'advisory_type_id',
                'as' => 'advisory_type_info'
            ]
        ],
        // Lookup Streets (JOIN Streets)
        [
            '$lookup' => [
                'from' => 'Streets',
                'localField' => 'street_id',
                'foreignField' => 'street_id',
                'as' => 'street_info'
            ]
        ],
        // Lookup Barangays (JOIN Barangays)
        [
            '$lookup' => [
                'from' => 'Barangays',
                'localField' => 'brgy_id',
                'foreignField' => 'brgy_id',
                'as' => 'barangay_info'
            ]
        ],
        // Unwind arrays (convert array results to single objects)
        ['$unwind' => '$advisory_type_info'],
        ['$unwind' => '$street_info'],
        ['$unwind' => '$barangay_info'],
        // Sort by start_date descending (ORDER BY)
        [
            '$sort' => ['start_date' => -1]
        ],
        // Project only needed fields (SELECT clause)
        [
            '$project' => [
                'type_name' => '$advisory_type_info.advisory_type',
                'advisory_description' => 1,
                'start_date' => 1,
                'end_date' => 1,
                'start_time' => 1,
                'end_time' => 1,
                'status' => 1,
                'street_name' => '$street_info.street_name',
                'brgy_number' => '$barangay_info.brgy_number'
            ]
        ]
    ];
    
    // Execute aggregation
    $advisories = $db->Advisories->aggregate($pipeline);
    
    // Loop through results
    foreach ($advisories as $row) {
        // Format dates and times
        $startDate = isset($row['start_date']) ? $row['start_date'] : '';
        $startTime = isset($row['start_time']) ? $row['start_time'] : '';
        $endDate   = isset($row['end_date']) ? $row['end_date'] : '';
        $endTime   = isset($row['end_time']) ? $row['end_time'] : '';
        
        $schedule = "$startDate $startTime to $endDate $endTime";
        $location = htmlspecialchars($row['street_name'] . ',  ' . $row['brgy_number']);

        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['type_name']) . "</td>";
        echo "<td>" . htmlspecialchars($row['advisory_description']) . "</td>";
        echo "<td>" . htmlspecialchars($schedule) . "</td>";
        echo "<td>" . $location . "</td>";
        echo "<td>" . htmlspecialchars($row['status']) . "</td>";
        echo "</tr>";
    }
    
} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}
?>