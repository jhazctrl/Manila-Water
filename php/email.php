<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include MongoDB connection
require_once __DIR__ . '/../config.php';

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
        $street = $db->Streets->findOne(['street_id' => (int)$streetId]);
        
        if (!$street) {
            return ['error' => "Invalid street selection (ID: $streetId)"];
        }
        
        // Check if barangay exists
        $barangay = $db->Barangays->findOne(['brgy_id' => (int)$barangayId]);
        
        if (!$barangay) {
            return ['error' => "Invalid barangay selection (ID: $barangayId)"];
        }
        
        return [
            'street' => [
                'street_id' => $street['street_id'],
                'street_name' => $street['street_name']
            ],
            'barangay' => [
                'brgy_id' => $barangay['brgy_id'],
                'brgy_number' => $barangay['brgy_number']
            ]
        ];
        
    } catch (Exception $e) {
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
    // $db is already available from config.php
    
    if ($method === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'emails') {
            // Get all emails with their locations using aggregation
            $pipeline = [
                [
                    '$lookup' => [
                        'from' => 'GuestUsers_Address',
                        'localField' => 'guest_id',
                        'foreignField' => 'guest_id',
                        'as' => 'address'
                    ]
                ],
                [
                    '$unwind' => [
                        'path' => '$address',
                        'preserveNullAndEmptyArrays' => true
                    ]
                ],
                [
                    '$lookup' => [
                        'from' => 'Streets',
                        'localField' => 'address.street_id',
                        'foreignField' => 'street_id',
                        'as' => 'street_info'
                    ]
                ],
                [
                    '$lookup' => [
                        'from' => 'Barangays',
                        'localField' => 'address.brgy_id',
                        'foreignField' => 'brgy_id',
                        'as' => 'barangay_info'
                    ]
                ],
                [
                    '$unwind' => [
                        'path' => '$street_info',
                        'preserveNullAndEmptyArrays' => true
                    ]
                ],
                [
                    '$unwind' => [
                        'path' => '$barangay_info',
                        'preserveNullAndEmptyArrays' => true
                    ]
                ],
                [
                    '$project' => [
                        'guest_id' => 1,
                        'guest_email' => 1,
                        'street_name' => '$street_info.street_name',
                        'brgy_number' => '$barangay_info.brgy_number',
                        'full_location' => [
                            '$concat' => [
                                ['$ifNull' => ['$street_info.street_name', 'N/A']],
                                ', ',
                                ['$ifNull' => ['$barangay_info.brgy_number', 'N/A']]
                            ]
                        ]
                    ]
                ],
                [
                    '$sort' => ['guest_id' => -1]
                ]
            ];
            
            $emails = $db->Guest_emails->aggregate($pipeline)->toArray();
            
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
        
        try {
            // Check if email already exists
            $existingGuest = $db->Guest_emails->findOne(['guest_email' => $email]);
            
            if ($existingGuest) {
                debugLog("Email already exists", ['email' => $email, 'guest_id' => $existingGuest['guest_id']]);
                sendResponse(409, false, "Email is already subscribed", ['email' => $email]);
            }
            
            // Validate location IDs exist in database
            $locationValidation = validateLocationIds($db, $streetId, $barangayId);
            
            if (isset($locationValidation['error'])) {
                debugLog("Location validation failed", $locationValidation['error']);
                sendResponse(400, false, $locationValidation['error']);
            }
            
            $street = $locationValidation['street'];
            $barangay = $locationValidation['barangay'];
            
            debugLog("Location validation passed", [
                'street' => $street,
                'barangay' => $barangay
            ]);
            
            // Get next guest_id (auto-increment simulation)
            $lastGuest = $db->Guest_emails->findOne([], ['sort' => ['guest_id' => -1]]);
            $guestId = $lastGuest ? ($lastGuest['guest_id'] + 1) : 1;
            
            // Insert new email into Guest_emails collection
            $emailInsertData = [
                'guest_id' => $guestId,
                'guest_email' => $email,
                'created_at' => new MongoDB\BSON\UTCDateTime()
            ];
            
            $result = $db->Guest_emails->insertOne($emailInsertData);
            
            if (!$result->getInsertedId()) {
                throw new Exception("Failed to insert email into Guest_emails collection");
            }
            
            debugLog("Email inserted successfully with guest ID", ['guest_id' => $guestId]);
            
            // Insert location data into GuestUsers_Address collection
            $addressInsertData = [
                'guest_id' => $guestId,
                'brgy_id' => $barangayId,
                'street_id' => $streetId,
                'created_at' => new MongoDB\BSON\UTCDateTime()
            ];
            
            $addressResult = $db->GuestUsers_Address->insertOne($addressInsertData);
            
            if (!$addressResult->getInsertedId()) {
                // Rollback: delete the guest email we just inserted
                $db->Guest_emails->deleteOne(['guest_id' => $guestId]);
                throw new Exception("Failed to insert address data");
            }
            
            debugLog("Address inserted successfully", [
                'guest_id' => $guestId,
                'brgy_id' => $barangayId,
                'street_id' => $streetId
            ]);
            
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
            
        } catch (Exception $e) {
            debugLog("Error occurred", $e->getMessage());
            
            // Check for duplicate key
            if (strpos($e->getMessage(), 'duplicate') !== false || 
                strpos($e->getMessage(), 'E11000') !== false) {
                sendResponse(409, false, "Email is already subscribed");
            } else {
                sendResponse(500, false, "An error occurred while processing your subscription: " . $e->getMessage());
            }
        }
    }
    
    
    sendResponse(405, false, "Method not allowed");
    
} catch (Exception $e) {
    debugLog("Fatal error in email subscription API", $e->getMessage());
    sendResponse(500, false, "Server error occurred");
}

if (isset($_GET['debug']) && $_GET['debug'] === 'tables') {
    try {
        // Count documents in collections
        $emailCount = $db->Guest_emails->countDocuments();
        $addressCount = $db->GuestUsers_Address->countDocuments();
        $streetCount = $db->Streets->countDocuments();
        $barangayCount = $db->Barangays->countDocuments();
        
        // Get sample data
        $sampleStreets = $db->Streets->find([], ['limit' => 3])->toArray();
        $sampleBarangays = $db->Barangays->find([], ['limit' => 3])->toArray();
        
        echo json_encode([
            'guest_emails_count' => $emailCount,
            'guest_address_count' => $addressCount,
            'streets_count' => $streetCount,
            'barangays_count' => $barangayCount,
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
