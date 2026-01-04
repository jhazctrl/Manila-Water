<?php
$password = "Mele#2025";  // Sample password
$hashed = password_hash($password, PASSWORD_DEFAULT);
echo "Password hash: " . $hashed;
?> 