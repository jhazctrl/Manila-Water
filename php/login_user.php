<?php
session_start();

// Load MongoDB library
require_once __DIR__ . '/../vendor/autoload.php';

try {
    // MongoDB connection
    $client = new MongoDB\Client("mongodb://localhost:27017");
    $db = $client->MNL_Water_Sampaloc;

    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        header("Location: ../login.html?error=invalid");
        exit();
    }

    // Find user by email
    $user = $db->Users->findOne(['user_email' => $email]);

    if (!$user) {
        header("Location: ../login.html?error=invalid");
        exit();
    }

    // Verify password
    if (password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['role_id'] = $user['role_id'];
        $_SESSION['user_email'] = $user['user_email'];
        $_SESSION['barangay_id'] = $user['barangay_id'] ?? null;
        $_SESSION['street_id'] = $user['street_id'] ?? null;

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

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    header("Location: ../login.html?error=server");
    exit();
}
?>