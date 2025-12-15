<?php
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

// Add validation functions
function validateAndFormatTime($timeString) {
    if (empty($timeString)) {
        throw new Exception("Time cannot be empty");
    }
    
    // Remove any extra whitespace
    $timeString = trim($timeString);
    
    // Check if it matches HH:MM:SS format
    if (preg_match('/^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/', $timeString, $matches)) {
        // Ensure two-digit format
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
    
    // Validate YYYY-MM-DD format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
        throw new Exception("Invalid date format: $dateString. Expected YYYY-MM-DD");
    }
    
    // Check if it's a valid date
    $dateParts = explode('-', $dateString);
    if (!checkdate($dateParts[1], $dateParts[2], $dateParts[0])) {
        throw new Exception("Invalid date: $dateString");
    }
    
    return $dateString;
}

// Get JSON data from request
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log the received data for debugging
error_log("Received data: " . print_r($data, true));

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data received']);
    exit;
}

try {
    $conn = getConnection();
    
    if ($conn === false) {
        throw new Exception("Database connection failed");
    }

    // Validate required fields
    $required_fields = ['advisory_type_id', 'advisory_description', 'start_date', 'start_time', 
                       'end_date', 'end_time', 'brgy_id', 'street_id', 'status'];
    
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
    $valid_statuses = ['upcoming', 'ongoing', 'resolved'];
    if (!in_array(strtolower($data['status']), $valid_statuses)) {
        throw new Exception("Invalid status. Must be one of: " . implode(', ', $valid_statuses));
    }

    try {
        // Validate and format dates and times
        $start_date = validateAndFormatDate($data['start_date']);
        $start_time = validateAndFormatTime($data['start_time']);
        $end_date = validateAndFormatDate($data['end_date']);
        $end_time = validateAndFormatTime($data['end_time']);

        // Log the formatted values for debugging
        error_log("Formatted start_date: " . $start_date);
        error_log("Formatted start_time: " . $start_time);
        error_log("Formatted end_date: " . $end_date);
        error_log("Formatted end_time: " . $end_time);

        // Create datetime objects for comparison
        $start_datetime_str = $start_date . ' ' . $start_time;
        $end_datetime_str = $end_date . ' ' . $end_time;
        
        $start_datetime_obj = DateTime::createFromFormat('Y-m-d H:i:s', $start_datetime_str);
        $end_datetime_obj = DateTime::createFromFormat('Y-m-d H:i:s', $end_datetime_str);

        if (!$start_datetime_obj) {
            error_log("Failed to create start datetime from: " . $start_datetime_str);
            throw new Exception("Invalid start date/time combination: " . $start_datetime_str);
        }
        
        if (!$end_datetime_obj) {
            error_log("Failed to create end datetime from: " . $end_datetime_str);
            throw new Exception("Invalid end date/time combination: " . $end_datetime_str);
        }

        // Check if end is after start
        if ($end_datetime_obj <= $start_datetime_obj) {
            throw new Exception("End date/time must be after start date/time");
        }

        // Ensure UTF-8 encoding for string data
        $advisory_description = mb_convert_encoding($data['advisory_description'], 'UTF-8', 'auto');
        $status = mb_convert_encoding(strtolower($data['status']), 'UTF-8', 'auto');

        // Begin transaction
        if (!sqlsrv_begin_transaction($conn)) {
            throw new Exception("Failed to begin transaction");
        }

        try {
            // Insert into Advisories table using validated date and time values
            $insert_query = "
    INSERT INTO Advisories (
        advisory_type_id,
        advisory_description,
        start_date,
        start_time,
        end_date,
        end_time,
        status,
        street_id,
        brgy_id
    )
    VALUES (?, ?, CONVERT(DATE, ?), CONVERT(TIME, ?), CONVERT(DATE, ?), CONVERT(TIME, ?), ?, ?, ?);
    SELECT SCOPE_IDENTITY() AS advisory_id;
";

            $params = array(
                intval($data['advisory_type_id']),
                $advisory_description,
                $start_date,        // Validated and formatted
                $start_time,        // Validated and formatted 
                $end_date,          // Validated and formatted
                $end_time,          // Validated and formatted
                $status,
                intval($data['street_id']),
                intval($data['brgy_id'])
            );

            error_log("Final SQL Parameters: " . print_r($params, true));

            $stmt = sqlsrv_query($conn, $insert_query, $params);

            if ($stmt === false) {
                $errors = sqlsrv_errors();
                throw new Exception("Error inserting advisory: " . print_r($errors, true));
            }

            // Move to the second result set to get the ID
            sqlsrv_next_result($stmt);
            sqlsrv_fetch($stmt);
            $advisory_id = sqlsrv_get_field($stmt, 0);

            if ($advisory_id === false || $advisory_id === null) {
                throw new Exception("Failed to get advisory ID after insert");
            }

            // Insert into Analytics table using stored procedure
            $sp_query = "{CALL sp_InsertAnalytics (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
            $analytics_params = array(
                2, // analytics_type_id for advisories
                $advisory_id,
                intval($data['brgy_id']),
                intval($data['street_id']),
                null, // complaint_type_id
                intval($data['advisory_type_id']),
                $status,
                date('Y-m-d H:i:s'), // posted_at
                null, // verified_at
                $start_datetime_obj->format('Y-m-d H:i:s'), // scheduled_start
                $end_datetime_obj->format('Y-m-d H:i:s') // scheduled_end
            );

            $stmt = sqlsrv_query($conn, $sp_query, $analytics_params);

            if ($stmt === false) {
                $errors = sqlsrv_errors();
                error_log("Analytics insertion failed: " . print_r($errors, true));
                // Don't throw error here - advisory was created successfully
            }

            // Commit transaction
            if (!sqlsrv_commit($conn)) {
                throw new Exception("Failed to commit transaction");
            }

            echo json_encode([
                'success' => true, 
                'message' => 'Advisory created successfully',
                'advisory_id' => $advisory_id
            ], JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            // Rollback transaction on error
            sqlsrv_rollback($conn);
            throw $e;
        }

    } catch (Exception $e) {
        error_log("Date/Time validation error: " . $e->getMessage());
        throw $e;
    }

} catch (Exception $e) {
    error_log("Error in save_advisory.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>