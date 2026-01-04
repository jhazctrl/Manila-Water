<?php
/**
 * helpers.php
 * Common helper functions for MongoDB operations
 */

/**
 * Get next sequence value for auto-incrementing IDs
 */
function getNextSequence($db, $sequenceName) {
    $result = $db->counters->findOneAndUpdate(
        ['_id' => $sequenceName],
        ['$inc' => ['seq' => 1]],
        [
            'upsert' => true,
            'returnDocument' => MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER
        ]
    );
    return $result['seq'];
}

/**
 * Convert MongoDB date to PHP DateTime
 */
function mongoDateToDateTime($mongoDate) {
    if ($mongoDate instanceof MongoDB\BSON\UTCDateTime) {
        return $mongoDate->toDateTime();
    }
    return new DateTime($mongoDate);
}

/**
 * Convert PHP DateTime to MongoDB UTCDateTime
 */
function dateTimeToMongo($dateTime) {
    if (is_string($dateTime)) {
        $dateTime = new DateTime($dateTime);
    }
    return new MongoDB\BSON\UTCDateTime($dateTime->getTimestamp() * 1000);
}

/**
 * Safe integer conversion for MongoDB
 */
function toInt($value) {
    return $value !== null ? (int)$value : null;
}

/**
 * Format MongoDB date for display
 */
function formatMongoDate($mongoDate, $format = 'Y-m-d H:i:s') {
    $dt = mongoDateToDateTime($mongoDate);
    return $dt->format($format);
}
?>