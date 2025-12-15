<?php
// config.php - Database configuration file

function getConnection() {
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
        $errors = sqlsrv_errors();
        throw new Exception("Database connection failed: " . print_r($errors, true));
    }

    return $conn;
}

// Error logging function
function logError($message, $context = []) {
    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message;
    if (!empty($context)) {
        $logMessage .= " | Context: " . json_encode($context);
    }
    error_log($logMessage);
}

// Set timezone
date_default_timezone_set('Asia/Manila');
?>