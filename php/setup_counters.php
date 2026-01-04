<?php
/**
 * setup_counters.php
 * Run this ONCE after importing your data to initialize counter sequences
 */

require_once __DIR__ . '/config.php';

try {
    $db = getConnection();
    
    // Get the highest user_id from Users collection
    $maxUser = $db->Users->findOne(
        [],
        ['sort' => ['user_id' => -1], 'projection' => ['user_id' => 1]]
    );
    $maxUserId = $maxUser ? $maxUser['user_id'] : 0;
    
    // Get the highest advisory_id from Advisories collection
    $maxAdvisory = $db->Advisories->findOne(
        [],
        ['sort' => ['advisory_id' => -1], 'projection' => ['advisory_id' => 1]]
    );
    $maxAdvisoryId = $maxAdvisory ? $maxAdvisory['advisory_id'] : 0;
    
    // Initialize counters
    $db->counters->updateOne(
        ['_id' => 'user_id'],
        ['$set' => ['seq' => $maxUserId]],
        ['upsert' => true]
    );
    
    $db->counters->updateOne(
        ['_id' => 'advisory_id'],
        ['$set' => ['seq' => $maxAdvisoryId]],
        ['upsert' => true]
    );
    
    echo " Counters initialized:\n";
    echo "   - user_id: $maxUserId\n";
    echo "   - advisory_id: $maxAdvisoryId\n";
    echo "\nYou can now use the application!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>