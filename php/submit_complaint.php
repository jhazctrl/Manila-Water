<?php
// submit_complaint.php - MongoDB Version
session_start();
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

try {
    $db = getConnection();

    // Fetch form data
    $contact_no = $_POST['contact_no'] ?? '';
    $address_detail = $_POST['address_detail'] ?? '';
    $brgy_id = $_POST['brgy_id'] ?? '';
    $street_id = $_POST['street_id'] ?? '';
    $complaint_type = $_POST['complaint_type'] ?? '';
    $complaint_duration = $_POST['complaint_duration'] ?? '';
    $complaint_description = $_POST['complaint_description'] ?? null;
    $submitted_by = $_SESSION['user_id'] ?? $_POST['submitted_by'] ?? null;
    $status = 'pending';

    // Handle optional image upload
    $supporting_img = null;
    if (isset($_FILES['supporting_img']) && $_FILES['supporting_img']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $fileTmpPath = $_FILES['supporting_img']['tmp_name'];
        $fileName = uniqid('complaint_') . '_' . basename($_FILES['supporting_img']['name']);
        $destPath = $uploadDir . $fileName;

        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $supporting_img = $fileName;
        }
    }

    // Validate required fields
    if (empty($contact_no) || empty($address_detail) || empty($brgy_id) || empty($street_id) || 
        empty($complaint_type) || empty($complaint_duration)) {
        echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
        exit;
    }

    // Generate complaint ID: MWC-YYYY-MM-00001
    $year = date('Y');
    $month = date('m');
    $prefix = "MWC-$year-$month";

    // Find the latest complaint ID for this month
    $latestComplaint = $db->Complaints->findOne(
        ['complaint_id' => new MongoDB\BSON\Regex("^$prefix")],
        ['sort' => ['complaint_id' => -1]]
    );

    $latestNumber = 0;
    if ($latestComplaint && isset($latestComplaint['complaint_id'])) {
        $lastId = $latestComplaint['complaint_id']; // e.g., MWC-2025-01-00007
        $lastParts = explode('-', $lastId);
        if (count($lastParts) === 4) {
            $latestNumber = (int)$lastParts[3];
        }
    }

    $newNumber = str_pad($latestNumber + 1, 5, '0', STR_PAD_LEFT);
    $complaint_id = "$prefix-$newNumber";

    // Prepare document for insertion
    $complaintDoc = [
        'complaint_id' => $complaint_id,
        'complaint_description' => $complaint_description,
        'complaint_type' => (int)$complaint_type,
        'complaint_duration' => (int)$complaint_duration,
        'status' => $status,
        'complaint_date' => new MongoDB\BSON\UTCDateTime(),
        'contact_no' => (int)$contact_no,
        'address_detail' => $address_detail,
        'street_id' => (int)$street_id,
        'barangay_id' => (int)$brgy_id,
        'submitted_by' => (int)$submitted_by,
        'supporting_img' => $supporting_img
    ];

    // Insert into MongoDB
    $result = $db->Complaints->insertOne($complaintDoc);

    if ($result->getInsertedCount() > 0) {
        echo json_encode([
            'success' => true, 
            'message' => 'Complaint submitted successfully!', 
            'complaint_id' => $complaint_id
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'Failed to submit complaint.'
        ]);
    }

} catch (Exception $e) {
    logError("Submit complaint error", ['error' => $e->getMessage()]);
    echo json_encode([
        'success' => false, 
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>