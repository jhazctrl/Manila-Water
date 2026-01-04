<?php
// Load MongoDB library
require_once __DIR__ . '/../vendor/autoload.php';

try {
    // MongoDB connection
    $client = new MongoDB\Client("mongodb://localhost:27017");
    
    // Select database
    $db = $client->MNL_Water_Sampaloc;
    
    // Test connection by pinging
    $db->command(['ping' => 1]);
    
    echo "✅ Connected successfully to MongoDB!<br>";
    echo "Database: MNL_Water_Sampaloc<br>";
    
    // List all collections
    $collections = $db->listCollections();
    echo "<br><strong>Available Collections:</strong><br>";
    foreach ($collections as $collection) {
        $collectionName = $collection->getName();
        $count = $db->$collectionName->countDocuments([]);
        echo "- $collectionName ($count documents)<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Connection failed!<br>";
    echo "<pre>";
    echo "Error: " . $e->getMessage();
    echo "</pre>";
}
?>