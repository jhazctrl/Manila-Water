<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['advisory_id'])) {
        throw new Exception("Advisory ID is required");
    }
    
    $advisory_id = intval($input['advisory_id']);
    
    $db = getConnection();

    $updateResult = $db->Advisories->updateOne(
        ['advisory_id' => $advisory_id],
        ['$set' => ['status' => 'Resolved']]
    );

    if ($updateResult->getModifiedCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Advisory has been resolved successfully'
        ]);
    } elseif ($updateResult->getMatchedCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Advisory is already marked as resolved'
        ]);
    } else {
        throw new Exception("Advisory not found");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>