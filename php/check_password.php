<?php
// filepath: c:\xampp\htdocs\MNL_Water\php\check_password.php
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
$password = $_POST['password'] ?? '';

if (!$user_id || !$password) {
    echo json_encode(['success' => false, 'error' => 'Missing data.']);
    exit;
}

$sql = "SELECT password FROM Registered_users WHERE user_id = ?";
$params = [$user_id];
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    echo json_encode(['success' => false, 'error' => 'Query failed: ' . print_r(sqlsrv_errors(), true)]);
    exit;
}

if ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $hashed_password = $row['password'];
    if (password_verify($password, $hashed_password)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Incorrect password.']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'User not found.']);
}

sqlsrv_free_stmt($stmt);
sqlsrv_close($conn);
?>