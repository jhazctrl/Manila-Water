<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

// Handle preflight OPTIONS request
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
                        'from' => 'Streets',
                        'localField' => 'street_id',
                        'foreignField' => 'street_id',
                        'as' => 'street_info'
                    ]
                ],
                [
                    '$lookup' => [
                        'from' => 'Barangays',
                        'localField' => 'brgy_id',
                        'foreignField' => 'brgy_id',
                        'as' => 'barangay_info'
                    ]
                ],
                [
                    '$unwind' => '$street_info'
                ],
                [
                    '$unwind' => '$barangay_info'
                ],
                [
                    '$project' => [
                        'guest_user_id' => 1,
                        'guest_email' => 1,
                        'street_id' => 1,
                        'brgy_id' => 1,
                        'full_location' => [
                            '$concat' => [
                                '$street_info.street_name',
                                ', ',
                                '$barangay_info.brgy_number'
                            ]
                        ]
                    ]
                ],
                [
                    '$sort' => ['guest_user_id' => -1]
                ]
            ];
            
            $emails = $db->Guest_users->aggregate($pipeline)->toArray();
            
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
            $existingGuest = $db->Guest_users->findOne(['guest_email' => $email]);
            
            if ($existingGuest) {
                debugLog("Email already exists", ['email' => $email]);
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
            
            // Get next guest_user_id (auto-increment simulation)
            $lastGuest = $db->Guest_users->findOne([], ['sort' => ['guest_user_id' => -1]]);
            $nextGuestId = $lastGuest ? ($lastGuest['guest_user_id'] + 1) : 1;
            
            // Insert new guest user
            $insertData = [
                'guest_user_id' => $nextGuestId,
                'guest_email' => $email,
                'brgy_id' => $barangayId,
                'street_id' => $streetId,
                'created_at' => new MongoDB\BSON\UTCDateTime()
            ];
            
            $result = $db->Guest_users->insertOne($insertData);
            
            if (!$result->getInsertedId()) {
                throw new Exception("Failed to insert guest user");
            }
            
            debugLog("Guest user inserted successfully", [
                'guest_user_id' => $nextGuestId,
                'brgy_id' => $barangayId,
                'street_id' => $streetId
            ]);
            
            // Prepare response data
            $responseData = [
                'email' => $email,
                'guest_id' => $nextGuestId,
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
    
    // Method not allowed
    sendResponse(405, false, "Method not allowed");
    
} catch (Exception $e) {
    debugLog("Fatal error in email subscription API", $e->getMessage());
    sendResponse(500, false, "Server error occurred");
}

// Debug endpoint - add ?debug=tables to test database collections
if (isset($_GET['debug']) && $_GET['debug'] === 'tables') {
    try {
        // Count documents in each collection
        $guestUsersCount = $db->Guest_users->countDocuments();
        $streetCount = $db->Streets->countDocuments();
        $barangayCount = $db->Barangays->countDocuments();

        // Get sample data
        $sampleStreets = $db->Streets->find([], ['limit' => 3])->toArray();
        $sampleBarangays = $db->Barangays->find([], ['limit' => 3])->toArray();

        echo json_encode([
            'guest_users_count' => $guestUsersCount,
            'streets_count' => $streetCount,
            'barangays_count' => $barangayCount,
            'sample_streets' => $sampleStreets,
            'sample_barangays' => $sampleBarangays,
            'collections_exist' => true,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
?>
