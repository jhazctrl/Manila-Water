<?php
session_start();

$serverName = "TANMINJA\\MSSQLSERVER01,1433";
$connectionOptions = [
    "Database" => "MNL_Water_Sampaloc",
    "Uid" => "Jhaz",
    "PWD" => "jzadmin",
    "TrustServerCertificate" => true,
    "CharacterSet" => "UTF-8"
];

$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    header("Location: ../login.html?error=server");
    exit();
}

$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    header("Location: ../login.html?error=invalid");
    exit();
}

// Changed from Registered_users to Users
$sql = "SELECT * FROM Users WHERE user_email = ?";
$params = [$email];
$options = ["Scrollable" => SQLSRV_CURSOR_KEYSET];
$stmt = sqlsrv_query($conn, $sql, $params, $options);

if ($stmt === false || sqlsrv_num_rows($stmt) !== 1) {
    header("Location: ../login.html?error=invalid");
    exit();
}

$user = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

if (password_verify($password, $user['password'])) {
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
    $_SESSION['role_id'] = $user['role_id'];
    $_SESSION['user_email'] = $user['user_email'];
    $_SESSION['barangay_id'] = $user['barangay_id'];
    $_SESSION['street_id'] = $user['street_id'];

    // Role-based redirection
    switch ($user['role_id']) {
        case 1: // account holder
            header("Location: ../homepage.html");
            break;
        case 2: // barangay admin
            header("Location: ../brgy_adm_dashboard.html");
            break;
        case 3: // central admin
            header("Location: ../central_adm_dashboard.html");
            break;
        default:
            header("Location: ../login.html?error=role");
            break;
    }
    exit();
}

header("Location: ../login.html?error=invalid");
exit();
?>