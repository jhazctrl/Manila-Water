<?php
// filepath: c:\xampp\htdocs\MNL_Water_MongoDB\php\check_password.php
session_start();
header('Content-Type: application/json');

// Use the centralized config file
require_once __DIR__ . '/config.php';

// Get user_id from session and password from POST
$user_id = $_SESSION['user_id'] ?? null;
$password = $_POST['password'] ?? '';

// Validate input
if (!$user_id || !$password) {
    echo json_encode(['success' => false, 'error' => 'Missing data.']);
    exit;
}

try {
    // Query MongoDB for user
    // Note: Changed from 'Registered_users' to 'Users' based on your database structure
    // If your collection is actually called 'Registered_users', change it back
    $user = $db->Users->findOne(['user_id' => (int)$user_id]);
    
    if ($user) {
        $hashed_password = $user['password'];
        
        // Verify password
        if (password_verify($password, $hashed_password)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Incorrect password.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'User not found.']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
