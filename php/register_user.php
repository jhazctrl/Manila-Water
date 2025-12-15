<?php
// Prevent any HTML output that would break JSON
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

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

// Database connection
$serverName = "TANMINJA\\MSSQLSERVER01,1433";
$connectionInfo = array(
  "Database" => "MNL_Water_Sampaloc",
  "UID" => "Jhaz",
  "PWD" => "jzadmin",
  "CharacterSet" => "UTF-8",
  "TrustServerCertificate" => true
);

$conn = sqlsrv_connect($serverName, $connectionInfo);

if (!$conn) {
  $errors = sqlsrv_errors();
  echo json_encode([
    "success" => false, 
    "message" => "Database connection failed: " . ($errors[0]['message'] ?? 'Unknown error')
  ]);
  exit;
}

// Check if email already exists in Users or Guest_emails tables
$emailCheckSQL = "
  SELECT user_email FROM Users WHERE user_email = ?
  UNION
  SELECT guest_email FROM Guest_emails WHERE guest_email = ?
";

$emailCheckStmt = sqlsrv_query($conn, $emailCheckSQL, [$email, $email]);

if ($emailCheckStmt === false) {
  $errors = sqlsrv_errors();
  echo json_encode([
    "success" => false, 
    "message" => "Email check failed: " . ($errors[0]['message'] ?? 'Unknown error')
  ]);
  sqlsrv_close($conn);
  exit;
}

// Check if email is already in use
if (sqlsrv_has_rows($emailCheckStmt)) {
  echo json_encode(["success" => false, "message" => "Email is already in use."]);
  sqlsrv_close($conn);
  exit;
}

// Insert new user
$insertSQL = "INSERT INTO Users 
  (role_id, first_name, last_name, address, street_id, barangay_id, user_email, contact_no, password)
  VALUES (1, ?, ?, ?, ?, ?, ?, NULL, ?)";

$params = [$firstName, $lastName, $address, $streetId, $barangayId, $email, $hashedPassword];

$insertStmt = sqlsrv_query($conn, $insertSQL, $params);

if ($insertStmt) {
  echo json_encode(["success" => true, "message" => "Registration successful"]);
} else {
  $errors = sqlsrv_errors();
  echo json_encode([
    "success" => false, 
    "message" => "Registration failed: " . ($errors[0]['message'] ?? 'Unknown error')
  ]);
}

sqlsrv_close($conn);
?>