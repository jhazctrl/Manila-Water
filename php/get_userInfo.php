<?php
// get_userInfo.php - MongoDB Version
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';


try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    $user_id = $_SESSION['user_id'];
    $db = getConnection();
    
    // Aggregation to join Users with Streets and Barangays
    $pipeline = [
        [
            '$match' => ['user_id' => (int)$user_id]
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
                'as' => 'brgy_info'
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
                'path' => '$brgy_info',
                'preserveNullAndEmptyArrays' => true
            ]
        ]
    ];
    
    $cursor = $db->Users->aggregate($pipeline);
    $user = $cursor->toArray()[0] ?? null;
    
    if ($user) {
        $response = [
            'fullname' => $user['first_name'] . ' ' . $user['last_name'],
            'address' => ($user['address'] ?? '') . ', ' . 
                        ($user['street_info']['street_name'] ?? '') . ', ' . 
                        ($user['brgy_info']['brgy_number'] ?? ''),
            'email' => $user['user_email'],
            'contact' => $user['contact_no'] ?? '',
            'photo' => $user['user_photo'] ?? '../img/ic_loginUser2.png',
            'masked_password' => '••••••••'
        ];
        
        echo json_encode($response);
    } else {
        echo json_encode(['error' => 'User not found']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>