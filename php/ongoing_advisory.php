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
        // Update the advisory status to ongoing
        $update_query = "UPDATE Advisories SET status = 'ongoing' WHERE advisory_id = ?";
        $params = array($advisory_id);
        
        $stmt = sqlsrv_query($conn, $update_query, $params);
        
        if ($stmt === false) {
            throw new Exception("Error updating advisory: " . print_r(sqlsrv_errors(), true));
        }

        /*
        // Update the analytics table (commented out - table doesn't exist)
        $analytics_query = "UPDATE Analytics 
                          SET status = 'ongoing',
                              updated_at = GETDATE()
                          WHERE analytics_type_id = 2 
                          AND analytics_ref_id = ?";
        
        $stmt = sqlsrv_query($conn, $analytics_query, $params);
        
        if ($stmt === false) {
            throw new Exception("Error updating analytics: " . print_r(sqlsrv_errors(), true));
        }
        */

        // Commit transaction
        if (!sqlsrv_commit($conn)) {
            throw new Exception("Failed to commit transaction");
        }

        echo json_encode([
            'success' => true,
            'message' => 'Advisory has been marked as ongoing successfully'
        ]);

    } catch (Exception $e) {
        // Rollback transaction on error
        sqlsrv_rollback($conn);
        throw $e;
    }

} catch (Exception $e) {
    error_log("Error in ongoing_advisory.php: " . $e->getMessage());
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