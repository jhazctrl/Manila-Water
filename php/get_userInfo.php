<?php
session_start();

$servername = "TANMINJA\\MSSQLSERVER01,1433";  
$database   = "MNL_Water_Sampaloc";
$username   = "Jhaz";     
$password   = "jzadmin";

try {
    $conn = new PDO("sqlsrv:Server=$servername;Database=$database", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

$sql = "
SELECT 
    ru.first_name, 
    ru.last_name,
    ru.user_email,
    ru.password,
    ru.contact_no,
    ru.user_photo,
    ru.address_detail,
    s.street_name,
    b.brgy_number AS brgy_name
FROM Registered_users ru
LEFT JOIN Streets s ON ru.street_id = s.street_id
LEFT JOIN Barangays b ON ru.brgy_id = b.brgy_id
WHERE ru.user_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    $response = [
        'fullname'        => $user['first_name'] . ' ' . $user['last_name'],
        'address'         => $user['address_detail'] . ', ' . $user['street_name'] . ', ' . $user['brgy_name'],
        'email'           => $user['user_email'],
        'contact'         => $user['contact_no'],
        'photo'           => $user['user_photo'] ?: '../img/ic_loginUser2.png',
        'masked_password' => '••••••••' 
    ];

    echo json_encode($response);
} else {
    echo json_encode(['error' => 'User not found']);
}
?>
