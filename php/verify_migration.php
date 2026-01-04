<?php
/**
 * verify_migration.php
 * Run this to verify your data was imported correctly
 */

require_once __DIR__ . '/config.php';

try {
    $db = getConnection();
    
    echo "=== MongoDB Data Verification ===\n\n";
    
    $collections = [
        'Barangays' => 'brgy_id',
        'Streets' => 'street_id',
        'Users' => 'user_id',
        'Roles' => 'role_id',
        'Advisory_types' => 'advisory_type_id',
        'Advisories' => 'advisory_id',
        'Complaint_types' => 'complaint_type_id',
        'Complaint_duration' => 'complaint_duration_id',
        'Complaints' => 'complaint_id'
    ];
    
    foreach ($collections as $collection => $idField) {
        $count = $db->$collection->countDocuments();
        $sample = $db->$collection->findOne();
        
        echo "📊 $collection: $count documents\n";
        if ($sample) {
            echo "   Sample ID: " . ($sample[$idField] ?? 'N/A') . "\n";
        }
        echo "\n";
    }
    
    echo " Verification complete!\n";
    
} catch (Exception $e) {
    echo " Error: " . $e->getMessage() . "\n";
}
?>