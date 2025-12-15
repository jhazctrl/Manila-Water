<?php
session_start();
header('Content-Type: application/json');

$serverName = "TANMINJA\\MSSQLSERVER01,1433";
$connectionOptions = [
    "Database" => "MNL_Water_Sampaloc",
    "Uid" => "Jhaz",
    "PWD" => "jzadmin"
];

$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    echo json_encode(['success' => false, 'error' => 'Connection failed: ' . print_r(sqlsrv_errors(), true)]);
    exit;
}

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'Not logged in.']);
    exit;
}

$fields = [];
$params = [];

// Only update fields that are set
if (isset($_POST['first_name'])) {
    $fields[] = "first_name = ?";
    $params[] = $_POST['first_name'];
}
if (isset($_POST['last_name'])) {
    $fields[] = "last_name = ?";
    $params[] = $_POST['last_name'];
}
if (isset($_POST['user_email'])) {
    $fields[] = "user_email = ?";
    $params[] = $_POST['user_email'];
}
if (isset($_POST['contact_no'])) {
    $fields[] = "contact_no = ?";
    $params[] = $_POST['contact_no'];
}
if (isset($_POST['address_detail'])) {
    $fields[] = "address_detail = ?";
    $params[] = $_POST['address_detail'];
}
if (isset($_POST['street_id'])) {
    $fields[] = "street_id = ?";
    $params[] = $_POST['street_id'];
}
if (isset($_POST['brgy_id'])) {
    $fields[] = "brgy_id = ?";
    $params[] = $_POST['brgy_id'];
}
if (isset($_POST['new_password']) && !empty($_POST['new_password'])) {
    $fields[] = "password = ?";
    $params[] = password_hash($_POST['new_password'], PASSWORD_DEFAULT);
}

// Handle file upload (save path, not binary)
if (isset($_FILES['user_photo']) && $_FILES['user_photo']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $fileName = uniqid('profile_', true) . '_' . basename($_FILES['user_photo']['name']);
    $targetPath = $uploadDir . $fileName;S
    if (move_uploaded_file($_FILES['user_photo']['tmp_name'], $targetPath)) {
        // Save the relative path for use in <img src="">
        $fields[] = "user_photo = ?";
        $params[] = '../uploads/' . $fileName;
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to save uploaded file.']);
        exit;
    }
}

if (empty($fields)) {
    echo json_encode(['success' => false, 'error' => 'No fields to update.']);
    exit;
}

$params[] = $user_id;
$sql = "UPDATE Registered_users SET " . implode(", ", $fields) . " WHERE user_id = ?";

$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    echo json_encode(['success' => false, 'error' => 'Update failed: ' . print_r(sqlsrv_errors(), true)]);
    exit;
}

echo json_encode(['success' => true]);
sqlsrv_free_stmt($stmt);
sqlsrv_close($conn);