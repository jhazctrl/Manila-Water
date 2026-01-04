<?php
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

try {
    // Get current user info
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    // Get user details including role and barangay
    $user = $db->Users->findOne(['user_id' => intval($userId)]);
    
    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    $roleId = $user['role_id'] ?? null;
    $userBarangayId = $user['barangay_id'] ?? $user['brgy_id'] ?? null;
    
    // Build query based on role
    $query = [];
    
    if ($roleId == 1) {
        // Account Holder - show only VERIFIED complaints from their barangay
        $query = [
            'status' => 'Verified',
            'barangay_id' => $userBarangayId
        ];
        
        // Optional: Also filter by street if user has a specific street
        if (isset($user['street_id']) && $user['street_id']) {
            $query['street_id'] = $user['street_id'];
        }
        
    } elseif ($roleId == 2) {
        // Barangay Admin - show all complaints from their barangay
        $query = [
            'barangay_id' => $userBarangayId
        ];
        
    } elseif ($roleId == 3) {
        // Central Admin - show all complaints
        $query = [];
    } else {
        // Unknown role - show nothing
        echo json_encode(['success' => true, 'data' => []]);
        exit;
    }
    
    // Fetch complaints
    $complaints = [];
    $cursor = $db->Complaints->find(
        $query,
        ['sort' => ['complaint_date' => -1]]
    );
    
    foreach ($cursor as $doc) {
        // Get barangay name
        $barangay = $db->Barangays->findOne(['barangay_id' => $doc['barangay_id']]);
        $barangayName = $barangay ? $barangay['barangay_name'] : 'Unknown';
        
        // Get street name
        $street = $db->Streets->findOne(['street_id' => $doc['street_id']]);
        $streetName = $street ? $street['street_name'] : 'Unknown';
        
        // Get submitter name
        $submitter = $db->Users->findOne(['user_id' => $doc['submitted_by']]);
        $submitterName = $submitter ? ($submitter['full_name'] ?? $submitter['username'] ?? 'Unknown') : 'Unknown';
        
        // Get complaint type name
        $complaintType = $db->Complaint_types->findOne(['complaint_type_id' => $doc['complaint_type']]);
        $complaintTypeName = $complaintType ? $complaintType['complaint_type'] : 'Unknown';
        
        $complaints[] = [
            'complaint_id' => $doc['complaint_id'],
            'complaint_type' => $complaintTypeName,
            'complaint_description' => $doc['complaint_description'] ?? '',
            'complaint_date' => $doc['complaint_date'],
            'status' => $doc['status'],
            'full_address' => $doc['address_detail'] . ', ' . $streetName . ', ' . $barangayName,
            'barangay_name' => $barangayName,
            'street_name' => $streetName,
            'submitted_by' => $submitterName,
            'supporting_img' => $doc['supporting_img'] ?? ''
        ];
    }
    
    echo json_encode(['success' => true, 'data' => $complaints]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>