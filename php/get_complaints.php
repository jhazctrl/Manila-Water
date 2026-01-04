<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

try {
    // --- Complaint Details Query with JOINs using aggregation ---
    $pipeline = [
        [
            '$lookup' => [
                'from' => 'Complaint_types',
                'localField' => 'complaint_type',
                'foreignField' => 'complaint_type_id',
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
                'localField' => 'barangay_id',
                'foreignField' => 'brgy_id',
                'as' => 'barangay_info'
            ]
        ],
        [
            '$lookup' => [
                'from' => 'Users',
                'localField' => 'submitted_by',
                'foreignField' => 'user_id',
                'as' => 'user_info'
            ]
        ],
        [
            '$unwind' => [
                'path' => '$type_info',
                'preserveNullAndEmptyArrays' => true
            ]
        ],
        [
            '$unwind' => [
                'path' => '$street_info',
                'preserveNullAndEmptyArrays' => true
            ]
        ],
        [
            '$unwind' => [
                'path' => '$barangay_info',
                'preserveNullAndEmptyArrays' => true
            ]
        ],
        [
            '$unwind' => [
                'path' => '$user_info',
                'preserveNullAndEmptyArrays' => true
            ]
        ],
        [
            '$sort' => ['complaint_date' => -1]
        ]
    ];
    
    $complaintsData = [];
    $complaints = $db->Complaints->aggregate($pipeline);
    
    foreach ($complaints as $row) {
        // Format complaint date
        $complaintDate = '';
        if (isset($row['complaint_date'])) {
            if ($row['complaint_date'] instanceof MongoDB\BSON\UTCDateTime) {
                $complaintDate = $row['complaint_date']->toDateTime()->format('F j, Y - g:i A');
            } else {
                $complaintDate = date('F j, Y - g:i A', strtotime($row['complaint_date']));
            }
        }
        
        // Format submitted by name
        $submittedBy = '';
        if (isset($row['user_info']['first_name']) && isset($row['user_info']['last_name'])) {
            $submittedBy = $row['user_info']['first_name'] . ' ' . $row['user_info']['last_name'];
        }
        
        // Capitalize first letter of status
        $status = isset($row['status']) ? ucfirst($row['status']) : '';
        
        // Build full address
        $addressDetail = $row['address_detail'] ?? '';
        $streetName = $row['street_info']['street_name'] ?? '';
        $brgyNumber = $row['barangay_info']['brgy_number'] ?? '';
        $fullAddress = trim("$addressDetail, $streetName, $brgyNumber", ', ');
        
        $complaintsData[] = [
            'complaint_id' => $row['complaint_id'] ?? '',
            'complaint_description' => $row['complaint_description'] ?? '',
            'complaint_type' => $row['type_info']['complaint_type'] ?? '',
            'status' => $status,
            'complaint_date' => $complaintDate,
            'address_detail' => $addressDetail,
            'street_name' => $streetName,
            'brgy_number' => $brgyNumber,
            'contact_no' => $row['contact_no'] ?? '',
            'submitted_by' => $submittedBy,
            'supporting_img' => $row['supporting_img'] ?? '',
            'full_address' => $fullAddress
        ];
    }
    
    // --- Complaint Stats Query ---
    $allComplaints = $db->Complaints->find();
    
    $stats = [
        'total' => 0,
        'pending' => 0,
        'verified' => 0,
        'resolved' => 0,
        'rejected' => 0
    ];
    
    foreach ($allComplaints as $complaint) {
        $stats['total']++;
        $status = strtolower($complaint['status'] ?? '');
        if (isset($stats[$status])) {
            $stats[$status]++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $complaintsData,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_complaints.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Query error.',
        'debug' => $e->getMessage()
    ]);
}
?>
