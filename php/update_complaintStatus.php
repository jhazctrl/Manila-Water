<?php
// update_complaintStatus.php - MongoDB Version
session_start();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

try {
    $input = json_decode(file_get_contents("php://input"), true);
    $complaint_id = $input['complaint_id'] ?? null;
    $status = $input['status'] ?? null;
    $role_id = $_SESSION['role_id'] ?? null;

    if (!$complaint_id || !$status || !$role_id) {
        echo json_encode([
            'success' => false, 
            'message' => 'Missing complaint_id, status, or role_id (session)'
        ]);
        exit;
    }

    $status_lower = strtolower($status);

    // Determine status based on role
    if ($role_id == 2) {
        // If role_id is 2 (Barangay Admin), only allow 'Verified' or 'Rejected'
        if (!in_array($status_lower, ['verified', 'rejected'])) {
            echo json_encode([
                'success' => false, 
                'message' => 'Invalid status for Barangay Admin. Must be Verified or Rejected.'
            ]);
            exit;
        }
        $status = ucfirst($status_lower);
    } elseif ($role_id == 3) {
        // If role_id is 3 (Central Admin), force status to 'Resolved'
        $status = 'Resolved';
    } else {
        echo json_encode(['success' => false, 'message' => 'Unauthorized role_id']);
        exit;
    }

    // Get MongoDB connection
    $db = getConnection();

    // Update complaint status
    $updateResult = $db->Complaints->updateOne(
        ['complaint_id' => $complaint_id],
        ['$set' => ['status' => $status]]
    );

    if ($updateResult->getModifiedCount() > 0) {
        echo json_encode([
            'success' => true, 
            'message' => "Complaint status updated to $status",
            'rows_affected' => $updateResult->getModifiedCount()
        ]);
    } elseif ($updateResult->getMatchedCount() > 0) {
        echo json_encode([
            'success' => true, 
            'message' => "Complaint already has status $status (no change needed)",
            'rows_affected' => 0
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'No complaint found with that ID'
        ]);
    }

} catch (Exception $e) {
    logError("Update complaint status error", ['error' => $e->getMessage()]);
    echo json_encode([
        'success' => false, 
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>