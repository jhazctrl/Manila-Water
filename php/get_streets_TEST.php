<?php
// TEST VERSION - get_streets.php with debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Log the request
error_log("get_streets.php accessed at " . date('Y-m-d H:i:s'));

// Test 1: Is PHP even running?
echo "PHP is working! ";

// Test 2: Check if config exists
$configPath = __DIR__ . '/config.php';
error_log("Looking for config at: " . $configPath);

if (!file_exists($configPath)) {
    error_log("ERROR: config.php not found at: " . $configPath);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Config file not found",
        "looking_at" => $configPath,
        "current_dir" => __DIR__
    ]);
    exit;
}

// Test 3: Try to include config
try {
    require_once $configPath;
    error_log("Config loaded successfully");
} catch (Exception $e) {
    error_log("ERROR loading config: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Failed to load config",
        "message" => $e->getMessage()
    ]);
    exit;
}

// Test 4: Check if barangay_id parameter exists
if (!isset($_GET['barangay_id'])) {
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Missing barangay_id parameter",
        "request_method" => $_SERVER['REQUEST_METHOD'],
        "get_params" => $_GET,
        "post_params" => $_POST
    ]);
    exit;
}

// Test 5: Try database query
try {
    $barangay_id = intval($_GET['barangay_id']);
    error_log("Querying streets for barangay_id: " . $barangay_id);
    
    $db = getConnection();
    
    $streets = [];
    $cursor = $db->Streets->find(
        ['brgy_id' => $barangay_id],
        ['sort' => ['street_name' => 1]]
    );
    
    foreach ($cursor as $doc) {
        $streets[] = [
            'street_id' => $doc['street_id'],
            'street_name' => $doc['street_name']
        ];
    }
    
    error_log("Found " . count($streets) . " streets");
    
    header('Content-Type: application/json');
    echo json_encode($streets);
    
} catch (Exception $e) {
    error_log("ERROR in query: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Database error",
        "message" => $e->getMessage()
    ]);
}
?>
