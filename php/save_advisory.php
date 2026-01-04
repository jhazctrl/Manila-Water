<?php
// save_advisory.php - MongoDB Version
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

// Validation functions
function validateAndFormatTime($timeString) {
    if (empty($timeString)) {
        throw new Exception("Time cannot be empty");
    }
    
    $timeString = trim($timeString);
    
    // Check if it matches HH:MM:SS format
    if (preg_match('/^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/', $timeString, $matches)) {
        $hours = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $minutes = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        $seconds = str_pad($matches[3], 2, '0', STR_PAD_LEFT);
        return "$hours:$minutes:$seconds";
    }
    
    // Check if it matches HH:MM format and add seconds
    if (preg_match('/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/', $timeString, $matches)) {
        $hours = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $minutes = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        return "$hours:$minutes:00";
    }
    
    throw new Exception("Invalid time format: $timeString. Expected HH:MM:SS or HH:MM");
}

function validateAndFormatDate($dateString) {
    if (empty($dateString)) {
        throw new Exception("Date cannot be empty");
    }
    
    $dateString = trim($dateString);
    
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
        throw new Exception("Invalid date format: $dateString. Expected YYYY-MM-DD");
    }
    
    $dateParts = explode('-', $dateString);
    if (!checkdate($dateParts[1], $dateParts[2], $dateParts[0])) {
        throw new Exception("Invalid date: $dateString");
    }
    
    return $dateString;
}

try {
    // Get JSON data from request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data received']);
        exit;
    }

    $db = getConnection();

    // Validate required fields
    $required_fields = [
        'advisory_type_id', 'advisory_description', 'start_date', 'start_time', 
        'end_date', 'end_time', 'brgy_id', 'street_id', 'status'
    ];
    
    $missing_fields = [];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        throw new Exception("Missing required fields: " . implode(', ', $missing_fields));
    }

    // Validate data types
    if (!is_numeric($data['advisory_type_id'])) {
        throw new Exception("Invalid advisory_type_id");
    }
    if (!is_numeric($data['brgy_id'])) {
        throw new Exception("Invalid brgy_id");
    }
    if (!is_numeric($data['street_id'])) {
        throw new Exception("Invalid street_id");
    }

    // Validate status
    $valid_statuses = ['upcoming', 'ongoing', 'resolved', 'Upcoming', 'Ongoing', 'Resolved'];
    if (!in_array($data['status'], $valid_statuses)) {
        throw new Exception("Invalid status. Must be one of: upcoming, ongoing, resolved");
    }

    // Validate and format dates and times
    $start_date = validateAndFormatDate($data['start_date']);
    $start_time = validateAndFormatTime($data['start_time']);
    $end_date = validateAndFormatDate($data['end_date']);
    $end_time = validateAndFormatTime($data['end_time']);

    // Create datetime objects for comparison
    $start_datetime_str = $start_date . ' ' . $start_time;
    $end_datetime_str = $end_date . ' ' . $end_time;
    
    $start_datetime_obj = DateTime::createFromFormat('Y-m-d H:i:s', $start_datetime_str);
    $end_datetime_obj = DateTime::createFromFormat('Y-m-d H:i:s', $end_datetime_str);

    if (!$start_datetime_obj || !$end_datetime_obj) {
        throw new Exception("Invalid date/time combination");
    }

    // Check if end is after start
    if ($end_datetime_obj <= $start_datetime_obj) {
        throw new Exception("End date/time must be after start date/time");
    }

    // Get the next advisory_id
    $lastAdvisory = $db->Advisories->findOne(
        [],
        ['sort' => ['advisory_id' => -1], 'projection' => ['advisory_id' => 1]]
    );
    $newAdvisoryId = ($lastAdvisory['advisory_id'] ?? 0) + 1;

    // Prepare document for insertion
    $advisoryDoc = [
        'advisory_id' => $newAdvisoryId,
        'advisory_type_id' => (int)$data['advisory_type_id'],
        'advisory_description' => $data['advisory_description'],
        'start_date' => $start_date,
        'start_time' => $start_time,
        'end_date' => $end_date,
        'end_time' => $end_time,
        'status' => $data['status'],
        'street_id' => (int)$data['street_id'],
        'brgy_id' => (int)$data['brgy_id'],
        'created_at' => new MongoDB\BSON\UTCDateTime()
    ];

    // Insert into MongoDB
    $result = $db->Advisories->insertOne($advisoryDoc);

    if ($result->getInsertedCount() > 0) {
        echo json_encode([
            'success' => true, 
            'message' => 'Advisory created successfully',
            'advisory_id' => $newAdvisoryId
        ], JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception("Failed to insert advisory");
    }

} catch (Exception $e) {
    logError("Save advisory error", ['error' => $e->getMessage()]);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>