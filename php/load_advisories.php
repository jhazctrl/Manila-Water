<?php
header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$serverName = "TANMINJA\\MSSQLSERVER01,1433";
$connectionOptions = array(
    "Database" => "MNL_Water_Sampaloc",
    "Uid" => "Jhaz",
    "PWD" => "jzadmin"
);
$conn = sqlsrv_connect($serverName, $connectionOptions);

if (!$conn) {
    die("Connection failed: " . print_r(sqlsrv_errors(), true));
}

$sql = "
SELECT
    AT.advisory_type AS type_name,
    A.advisory_description,
    A.start_date,
    A.end_date,
    A.start_time,
    A.end_time,
    A.status,
    S.street_name,
    B.brgy_number
FROM Advisories A
JOIN Advisory_types AT ON A.advisory_type_id = AT.advisory_type_id
JOIN Streets S ON A.street_id = S.street_id
JOIN Barangays B ON A.brgy_id = B.brgy_id
WHERE A.status IN ('Ongoing', 'Upcoming')
ORDER BY A.start_date DESC
";

$stmt = sqlsrv_query($conn, $sql);
if ($stmt === false) {
    die("Query failed: " . print_r(sqlsrv_errors(), true));
}

while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $startDate = $row['start_date'] instanceof DateTime ? $row['start_date']->format('Y-m-d') : '';
    $startTime = $row['start_time'] instanceof DateTime ? $row['start_time']->format('H:i') : '';
    $endDate   = $row['end_date'] instanceof DateTime ? $row['end_date']->format('Y-m-d') : '';
    $endTime   = $row['end_time'] instanceof DateTime ? $row['end_time']->format('H:i') : '';
    
    $schedule = "$startDate $startTime to $endDate $endTime";
    $location = htmlspecialchars($row['street_name'] . ',  ' . $row['brgy_number']);

    echo "<tr>";
    echo "<td>" . htmlspecialchars($row['type_name']) . "</td>";
    echo "<td>" . htmlspecialchars($row['advisory_description']) . "</td>";
    echo "<td>" . htmlspecialchars($schedule) . "</td>";
    echo "<td>" . $location . "</td>";
    echo "<td>" . htmlspecialchars($row['status']) . "</td>";
    echo "</tr>";
}
?>