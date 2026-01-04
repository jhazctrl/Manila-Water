<?php
require_once __DIR__ . '/config.php';

try {
    $db = getConnection();
    
    echo "Creating indexes...\n\n";
    
    // Barangays indexes
    $db->Barangays->createIndex(['brgy_id' => 1], ['unique' => true]);
    $db->Barangays->createIndex(['brgy_number' => 1]);
    echo " Barangays indexes created\n";
    
    // Streets indexes
    $db->Streets->createIndex(['street_id' => 1], ['unique' => true]);
    $db->Streets->createIndex(['brgy_id' => 1]);
    $db->Streets->createIndex(['street_name' => 1]);
    echo " Streets indexes created\n";
    
    // Users indexes
    $db->Users->createIndex(['user_id' => 1], ['unique' => true]);
    $db->Users->createIndex(['user_email' => 1], ['unique' => true]);
    $db->Users->createIndex(['role_id' => 1]);
    $db->Users->createIndex(['barangay_id' => 1]);
    echo " Users indexes created\n";
    
    // Roles indexes
    $db->Roles->createIndex(['role_id' => 1], ['unique' => true]);
    echo " Roles indexes created\n";
    
    // Advisory_types indexes
    $db->Advisory_types->createIndex(['advisory_type_id' => 1], ['unique' => true]);
    echo " Advisory_types indexes created\n";
    
    // Advisories indexes
    $db->Advisories->createIndex(['advisory_id' => 1], ['unique' => true]);
    $db->Advisories->createIndex(['brgy_id' => 1]);
    $db->Advisories->createIndex(['street_id' => 1]);
    $db->Advisories->createIndex(['status' => 1]);
    $db->Advisories->createIndex(['start_date' => -1]);
    $db->Advisories->createIndex(['advisory_type_id' => 1]);
    echo " Advisories indexes created\n";
    
    // Complaint_types indexes
    $db->Complaint_types->createIndex(['complaint_type_id' => 1], ['unique' => true]);
    echo " Complaint_types indexes created\n";
    
    // Complaint_duration indexes
    $db->Complaint_duration->createIndex(['complaint_duration_id' => 1], ['unique' => true]);
    echo " Complaint_duration indexes created\n";
    
    // Complaints indexes
    $db->Complaints->createIndex(['complaint_id' => 1], ['unique' => true]);
    $db->Complaints->createIndex(['barangay_id' => 1]);
    $db->Complaints->createIndex(['street_id' => 1]);
    $db->Complaints->createIndex(['submitted_by' => 1]);
    $db->Complaints->createIndex(['status' => 1]);
    $db->Complaints->createIndex(['complaint_date' => -1]);
    $db->Complaints->createIndex(['complaint_type' => 1]);
    echo " Complaints indexes created\n";
    
    // Guest_emails indexes (if you use this)
    $db->Guest_emails->createIndex(['guest_email' => 1], ['unique' => true]);
    echo "✅ Guest_emails indexes created\n";
    
    echo "\n All indexes created successfully!\n";
    
} catch (Exception $e) {
    echo " Error creating indexes: " . $e->getMessage() . "\n";
}
?>