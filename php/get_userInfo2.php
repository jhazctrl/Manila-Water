<?php
session_start();

$servername = "TANMINJA\\MSSQLSERVER01,1433";  
$database = "MNL_Water_Sampaloc";
$username = "Jhaz";     
$password = "jzadmin";

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
    ru.contact_no,
    ru.user_photo,
    ru.address_detail,
    s.street_id,
    b.brgy_id
FROM Registered_users ru
LEFT JOIN Streets s ON ru.street_id = s.street_id
LEFT JOIN Barangays b ON ru.brgy_id = b.brgy_id
WHERE ru.user_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo json_encode([
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'email' => $user['user_email'],
         'contact_no' => preg_replace('/^63/', '', $user['contact_no']),
        'address_detail' => $user['address_detail'],
        'street_id' => $user['street_id'],
        'brgy_id' => $user['brgy_id'],
        'user_photo' => $user['user_photo'] ?: '../img/ic_loginUser2.png',
        'masked_password' => '••••••••' 
    ]);
} else {
    echo json_encode(['error' => 'User not found']);
}
?>
