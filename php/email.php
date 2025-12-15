<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");


if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
function getConnection() {
    try {
        $pdo = new PDO("sqlsrv:Server=Claire\MNL_Waater;Database=MNL_Water_Sampaloc", "sa", "jhazsql");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        sendResponse(500, false, "Database connection failed");
    }
}

// Send JSON response
function sendResponse($code, $success, $message, $data = null) {
    http_response_code($code);
    $response = [
        'success' => $success, 
        'message' => $message, 
        'statusCode' => $code
    ];
    if ($data) $response['data'] = $data;
    
    echo json_encode($response);
    exit;
}

// Validate street and barangay IDs exist in database
function validateLocationIds($db, $streetId, $barangayId) {
    try {
        // Check if street exists
        $stmt = $db->prepare("SELECT street_id, street_name FROM Streets WHERE street_id = ?");
        $stmt->execute([$streetId]);
        $street = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$street) {
            return ['error' => "Invalid street selection (ID: $streetId)"];
        }
        
        // Check if barangay exists
        $stmt = $db->prepare("SELECT brgy_id, brgy_number FROM Barangays WHERE brgy_id = ?");
        $stmt->execute([$barangayId]);
        $barangay = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$barangay) {
            return ['error' => "Invalid barangay selection (ID: $barangayId)"];
        }
        
        return [
            'street' => $street,
            'barangay' => $barangay
        ];
        
    } catch (PDOException $e) {
        error_log("Error validating location IDs: " . $e->getMessage());
        return ['error' => 'Database error while validating location'];
    }
}

// Log debugging information
function debugLog($message, $data = null) {
    $logEntry = "[" . date('Y-m-d H:i:s') . "] EMAIL_SUBSCRIPTION: $message";
    if ($data !== null) {
        $logEntry .= " | Data: " . json_encode($data);
    }
    error_log($logEntry);
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getConnection();
    
    if ($method === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'emails') {
            // Get all emails with their locations
            $stmt = $db->query("
                SELECT 
                    ge.guest_id, 
                    ge.guest_email,
                    s.street_name,
                    b.brgy_number,
                    CONCAT(s.street_name, ', ', b.brgy_number) as full_location
                FROM Guest_emails ge
                LEFT JOIN GuestUsers_Address gua ON ge.guest_id = gua.guest_id
                LEFT JOIN Streets s ON gua.street_id = s.street_id
                LEFT JOIN Barangays b ON gua.brgy_id = b.brgy_id
                ORDER BY ge.guest_id DESC
            ");
            $emails = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse(200, true, "Emails retrieved successfully", [
                'emails' => $emails, 
                'count' => count($emails)
            ]);
        } else {
            // API status
            sendResponse(200, true, "Email subscription API is running");
        }
    }
    
    if ($method === 'POST') {
        // Get raw input
        $rawInput = file_get_contents('php://input');
        debugLog("Raw input received", $rawInput);
        
        // Parse JSON data
        $input = json_decode($rawInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            debugLog("JSON decode error", json_last_error_msg());
            sendResponse(400, false, "Invalid JSON data: " . json_last_error_msg());
        }
        
        debugLog("Parsed input data", $input);
        
        // Extract and validate required fields
        $email = isset($input['email']) ? trim($input['email']) : '';
        $streetId = isset($input['street_id']) ? intval($input['street_id']) : 0;
        $barangayId = isset($input['barangay_id']) ? intval($input['barangay_id']) : 0;
        
        debugLog("Extracted fields", [
            'email' => $email,
            'street_id' => $streetId,
            'barangay_id' => $barangayId
        ]);
        
        // Validate email
        if (empty($email)) {
            sendResponse(400, false, "Email address is required");
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendResponse(400, false, "Invalid email format");
        }
        
        // Validate location IDs are provided
        if ($streetId <= 0) {
            sendResponse(400, false, "Please select a valid street");
        }
        
        if ($barangayId <= 0) {
            sendResponse(400, false, "Please select a valid barangay");
        }
        
        // Normalize email
        $email = strtolower($email);
        
        // Start transaction
        $db->beginTransaction();
        debugLog("Transaction started");
        
        try {
            // Check if email already exists
            $stmt = $db->prepare("SELECT guest_id FROM Guest_emails WHERE guest_email = ?");
            $stmt->execute([$email]);
            $existingGuest = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingGuest) {
                $db->rollBack();
                debugLog("Email already exists", ['email' => $email, 'guest_id' => $existingGuest['guest_id']]);
                sendResponse(409, false, "Email is already subscribed", ['email' => $email]);
            }
            
            // Validate location IDs exist in database
            $locationValidation = validateLocationIds($db, $streetId, $barangayId);
            
            if (isset($locationValidation['error'])) {
                $db->rollBack();
                debugLog("Location validation failed", $locationValidation['error']);
                sendResponse(400, false, $locationValidation['error']);
            }
            
            $street = $locationValidation['street'];
            $barangay = $locationValidation['barangay'];
            
            debugLog("Location validation passed", [
                'street' => $street,
                'barangay' => $barangay
            ]);
            
            // Insert new email into Guest_emails table
            $stmt = $db->prepare("INSERT INTO Guest_emails (guest_email) OUTPUT INSERTED.guest_id VALUES (?)");
            $insertResult = $stmt->execute([$email]);
            
            if (!$insertResult) {
                throw new Exception("Failed to insert email into Guest_emails table");
            }
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $guestId = $result['guest_id'] ?? 0;
            
            if (!$guestId || $guestId <= 0) {
                throw new Exception("Failed to get valid guest ID after insertion");
            }
            
            debugLog("Email inserted successfully with guest ID", ['guest_id' => $guestId]);
            
            // Insert location data into GuestUsers_Address
            $stmt = $db->prepare("
                INSERT INTO GuestUsers_Address (guest_id, brgy_id, street_id) 
                VALUES (?, ?, ?)
            ");
            
            $addressInsertResult = $stmt->execute([$guestId, $barangayId, $streetId]);
            
            if (!$addressInsertResult) {
                $errorInfo = $stmt->errorInfo();
                debugLog("Failed to insert address", $errorInfo);
                throw new Exception("Failed to insert address data: " . implode(' | ', $errorInfo));
            }
            
            debugLog("Address inserted successfully", [
                'guest_id' => $guestId,
                'brgy_id' => $barangayId,
                'street_id' => $streetId
            ]);
            
            // Commit transaction
            $db->commit();
            debugLog("Transaction committed successfully");
            
            // Prepare response data
            $responseData = [
                'email' => $email,
                'guest_id' => $guestId,
                'location' => $street['street_name'] . ', ' . $barangay['brgy_number'],
                'street_id' => $streetId,
                'street_name' => $street['street_name'],
                'brgy_id' => $barangayId,
                'brgy_number' => $barangay['brgy_number']
            ];
            
            debugLog("Subscription completed successfully", $responseData);
            sendResponse(200, true, "Subscription successful! You will receive water interruption advisories for your area.", $responseData);
            
        } catch (PDOException $e) {
           
            $db->rollBack();
            debugLog("Database error occurred", [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            
            // Check for duplicate key violation
            if (strpos(strtolower($e->getMessage()), 'duplicate') !== false || 
                strpos(strtolower($e->getMessage()), 'unique') !== false) {
                sendResponse(409, false, "Email is already subscribed");
            } else {
                sendResponse(500, false, "Database error occurred while processing subscription");
            }
        } catch (Exception $e) {
            $db->rollBack();
            debugLog("General error occurred", $e->getMessage());
            sendResponse(500, false, "An error occurred while processing your subscription: " . $e->getMessage());
        }
    }
    
    
    sendResponse(405, false, "Method not allowed");
    
} catch (Exception $e) {
    debugLog("Fatal error in email subscription API", $e->getMessage());
    sendResponse(500, false, "Server error occurred");
}

if (isset($_GET['debug']) && $_GET['debug'] === 'tables') {
    try {
        $db = getConnection();
        
        // Test Guest_emails table
        $stmt = $db->query("SELECT COUNT(*) as count FROM Guest_emails");
        $emailCount = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Test GuestUsers_Address table
        $stmt = $db->query("SELECT COUNT(*) as count FROM GuestUsers_Address");
        $addressCount = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Test Streets table
        $stmt = $db->query("SELECT COUNT(*) as count FROM Streets");
        $streetCount = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Test Barangays table
        $stmt = $db->query("SELECT COUNT(*) as count FROM Barangays");
        $barangayCount = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get sample data
        $stmt = $db->query("SELECT TOP 3 street_id, street_name FROM Streets");
        $sampleStreets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stmt = $db->query("SELECT TOP 3 brgy_id, brgy_number FROM Barangays");
        $sampleBarangays = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'guest_emails_count' => $emailCount['count'],
            'guest_address_count' => $addressCount['count'],
            'streets_count' => $streetCount['count'],
            'barangays_count' => $barangayCount['count'],
            'sample_streets' => $sampleStreets,
            'sample_barangays' => $sampleBarangays,
            'tables_exist' => true,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
?>