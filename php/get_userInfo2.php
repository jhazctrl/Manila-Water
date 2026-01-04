<?php
// get_userInfo2.php - MongoDB Version (for editing)
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
    
    // Simple find without join for editing
    $user = $db->Users->findOne(['user_id' => (int)$user_id]);
    
    if ($user) {
        echo json_encode([
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'email' => $user['user_email'],
            'contact_no' => isset($user['contact_no']) ? preg_replace('/^63/', '', (string)$user['contact_no']) : '',
            'address_detail' => $user['address'] ?? '',
            'street_id' => $user['street_id'] ?? null,
            'brgy_id' => $user['barangay_id'] ?? null,
            'user_photo' => $user['user_photo'] ?? '../img/ic_loginUser2.png',
            'masked_password' => '••••••••'
        ]);
    } else {
        echo json_encode(['error' => 'User not found']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>