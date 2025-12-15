<?php
session_start(); 

$role_id = $_SESSION['role_id'] ?? null;

$_SESSION = [];
session_unset();
session_destroy();

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Redirect based on role_id
if ($role_id == 1) {
    header("Location: ../index.html");
} else if ($role_id == 2 || $role_id == 3) {
    header("Location: ../login.html");
} else {
    header("Location: ../index.html");
}
exit;
?>