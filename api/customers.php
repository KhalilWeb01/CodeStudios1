<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

try {
    $pdo = db();
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS customers (
            id VARCHAR(64) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NULL,
            phone VARCHAR(64) NULL,
            address VARCHAR(255) NULL,
            password_hash VARCHAR(255) NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;'
    );
} catch (Throwable $e) {
    respond_error('Failed to ensure customers table: ' . $e->getMessage(), 500);
}

switch ($method) {
    case 'GET':
        if ($id !== '') {
            $stmt = $pdo->prepare('SELECT * FROM customers WHERE id = ? OR email = ?');
            $stmt->execute([$id, $id]);
            $row = $stmt->fetch();
            if (!$row) respond_error('Customer not found', 404);
            respond(customer_from_row($row));
        }
        $stmt = $pdo->query('SELECT * FROM customers ORDER BY created_at DESC');
        $rows = $stmt->fetchAll();
        respond(['items' => array_map('customer_from_row', $rows)]);

    case 'POST':
        $body = json_input();
        $email = strtolower(trim((string)($body['email'] ?? '')));
        if ($email === '') respond_error('Email required', 422);
        $id = normalize_id($body['id'] ?? null, 'cus_');
        $name = isset($body['name']) ? (string)$body['name'] : null;
        $phone = isset($body['phone']) ? (string)$body['phone'] : null;
        $address = isset($body['address']) ? (string)$body['address'] : null;
        $passwordHash = isset($body['passwordHash']) ? (string)$body['passwordHash'] : null; // Client-side hash or use PHP password_hash if you build real auth
        $now = now();
        $stmt = $pdo->prepare('INSERT INTO customers (id, email, name, phone, address, password_hash, created_at, updated_at)
            VALUES (:id, :email, :name, :phone, :address, :password_hash, :created_at, :updated_at)
            ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), address=VALUES(address), password_hash=VALUES(password_hash), updated_at=VALUES(updated_at)');
        $stmt->execute([
            ':id' => $id,
            ':email' => $email,
            ':name' => $name,
            ':phone' => $phone,
            ':address' => $address,
            ':password_hash' => $passwordHash,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);
        $stmt = $pdo->prepare('SELECT * FROM customers WHERE email = ?');
        $stmt->execute([$email]);
        respond(customer_from_row($stmt->fetch()), 201);

    case 'PUT':
        if ($id === '') respond_error('Missing id or email', 400);
        $body = json_input();
        $stmt = $pdo->prepare('SELECT * FROM customers WHERE id = ? OR email = ?');
        $stmt->execute([$id, $id]);
        $row = $stmt->fetch();
        if (!$row) respond_error('Customer not found', 404);
        $updates = [];
        $params = [':updated_at' => now(), ':id' => $row['id']];
        if (isset($body['name'])) { $updates[] = 'name = :name'; $params[':name'] = (string)$body['name']; }
        if (isset($body['phone'])) { $updates[] = 'phone = :phone'; $params[':phone'] = (string)$body['phone']; }
        if (isset($body['address'])) { $updates[] = 'address = :address'; $params[':address'] = (string)$body['address']; }
        if (isset($body['passwordHash'])) { $updates[] = 'password_hash = :password_hash'; $params[':password_hash'] = (string)$body['passwordHash']; }
        if (empty($updates)) respond_error('Nothing to update', 400);
        $sql = 'UPDATE customers SET ' . implode(', ', $updates) . ', updated_at = :updated_at WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stmt = $pdo->prepare('SELECT * FROM customers WHERE id = ?');
        $stmt->execute([$row['id']]);
        respond(customer_from_row($stmt->fetch()));

    case 'DELETE':
        if ($id === '') respond_error('Missing id or email', 400);
        $stmt = $pdo->prepare('DELETE FROM customers WHERE id = ? OR email = ?');
        $stmt->execute([$id, $id]);
        respond(['ok' => true]);

    default:
        respond_error('Method not allowed', 405);
}

function customer_from_row(array $row): array {
    return [
        'id' => $row['id'],
        'email' => $row['email'],
        'name' => $row['name'],
        'phone' => $row['phone'],
        'address' => $row['address'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}


