<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
require_once 'config.php';

try {
    // Get the advisory ID from POST request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['advisory_id'])) {
        throw new Exception("Advisory ID is required");
    }
    
    $advisory_id = intval($input['advisory_id']);
    
    $conn = getConnection();
    
    if ($conn === false) {
        throw new Exception("Database connection failed");
    }

    // Begin transaction
    if (!sqlsrv_begin_transaction($conn)) {
        throw new Exception("Failed to begin transaction");
    }

    try {
        // Update the advisory status to resolved
        $update_query = "UPDATE Advisories SET status = 'Resolved' WHERE advisory_id = ?";
        $params = array($advisory_id);
        
        $stmt = sqlsrv_query($conn, $update_query, $params);
        
        if ($stmt === false) {
            throw new Exception("Error updating advisory: " . print_r(sqlsrv_errors(), true));
        }
        
        $stmt = sqlsrv_query($conn, $analytics_query, $params);
        
        if ($stmt === false) {
            throw new Exception("Error updating analytics: " . print_r(sqlsrv_errors(), true));
        }

        // Commit transaction
        if (!sqlsrv_commit($conn)) {
            throw new Exception("Failed to commit transaction");
        }

        echo json_encode([
            'success' => true,
            'message' => 'Advisory has been resolved successfully'
        ]);

    } catch (Exception $e) {
        // Rollback transaction on error
        sqlsrv_rollback($conn);
        throw $e;
    }

} catch (Exception $e) {
    error_log("Error in resolve_advisory.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?> 