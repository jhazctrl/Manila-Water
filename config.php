<?php
// config.php - MongoDB Database configuration file

// Load MongoDB library
require_once __DIR__ . '/../vendor/autoload.php';

function getConnection() {
    try {
        // MongoDB connection
        $client = new MongoDB\Client("mongodb://localhost:27017");
        
        // Select database
        $db = $client->MNL_Water_Sampaloc;
        
        // Test connection
        $db->command(['ping' => 1]);
        
        return $db;
    } catch (Exception $e) {
        throw new Exception("Database connection failed: " . $e->getMessage());
    }
}

// Alternative: Simple connection (for files that use the inline connection pattern)
try {
    $client = new MongoDB\Client("mongodb://localhost:27017");
    $db = $client->MNL_Water_Sampaloc;
    
    // You can now use $db directly in your scripts
    // Example: $db->Barangays->find()
} catch (Exception $e) {
    error_log("MongoDB Connection failed: " . $e->getMessage());
    die(json_encode(['success' => false, 'message' => 'Database connection failed.']));
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
