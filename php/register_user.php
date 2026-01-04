<?php
// Prevent any HTML output that would break JSON
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';


try {
    // Get and decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Extract and sanitize input data
    $firstName = trim($input['firstName'] ?? '');
    $lastName = trim($input['lastName'] ?? '');
    $address = trim($input['address'] ?? '');
    $barangayId = $input['barangayId'] ?? null;
    $streetId = $input['streetId'] ?? null;
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    // Validate required fields
    if (empty($firstName) || empty($lastName) || empty($email) || empty($password) || empty($barangayId) || empty($streetId)) {
        echo json_encode(["success" => false, "message" => "All fields are required."]);
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Get MongoDB connection
    $db = getConnection();

    // Check if email already exists in Users collection
    $existingUser = $db->Users->findOne(['user_email' => $email]);
    
    if ($existingUser) {
        echo json_encode(["success" => false, "message" => "Email is already in use."]);
        exit;
    }

    // Check if email exists in Guest_emails collection
    $existingGuest = $db->Guest_emails->findOne(['guest_email' => $email]);
    
    if ($existingGuest) {
        echo json_encode(["success" => false, "message" => "Email is already in use."]);
        exit;
    }

    // Get the next user_id (auto-increment simulation)
    $lastUser = $db->Users->findOne(
        [],
        ['sort' => ['user_id' => -1], 'projection' => ['user_id' => 1]]
    );
    $newUserId = ($lastUser['user_id'] ?? 0) + 1;

    // Insert new user
    $insertResult = $db->Users->insertOne([
        'user_id' => $newUserId,
        'role_id' => 1,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'address' => $address,
        'street_id' => (int)$streetId,
        'barangay_id' => (int)$barangayId,
        'user_email' => $email,
        'contact_no' => null,
        'password' => $hashedPassword,
        'user_photo' => null,
        'created_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    if ($insertResult->getInsertedCount() > 0) {
        echo json_encode(["success" => true, "message" => "Registration successful"]);
    } else {
        echo json_encode(["success" => false, "message" => "Registration failed"]);
    }

} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "message" => "Registration failed: " . $e->getMessage()
    ]);
}
?>