<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

try {
    $pdo = db();
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(64) PRIMARY KEY,
            customer_name VARCHAR(255) NULL,
            customer_email VARCHAR(255) NULL,
            customer_phone VARCHAR(64) NULL,
            products JSON NOT NULL,
            total DECIMAL(10,2) NOT NULL DEFAULT 0,
            status VARCHAR(32) NOT NULL DEFAULT "pending",
            order_date DATETIME NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(status),
            INDEX(customer_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;'
    );
} catch (Throwable $e) {
    respond_error('Failed to ensure orders table: ' . $e->getMessage(), 500);
}

switch ($method) {
    case 'GET':
        if ($id !== '') {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) respond_error('Order not found', 404);
            respond(order_from_row($row));
        }
        $status = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
        $email = isset($_GET['email']) ? trim((string)$_GET['email']) : '';
        if ($email !== '' && $status !== '') {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE customer_email = ? AND status = ? ORDER BY order_date DESC');
            $stmt->execute([$email, $status]);
        } elseif ($email !== '') {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY order_date DESC');
            $stmt->execute([$email]);
        } elseif ($status !== '') {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE status = ? ORDER BY order_date DESC');
            $stmt->execute([$status]);
        } else {
            $stmt = $pdo->query('SELECT * FROM orders ORDER BY order_date DESC');
        }
        $rows = $stmt->fetchAll();
        respond(['items' => array_map('order_from_row', $rows)]);

    case 'POST':
        $body = json_input();
        $orderId = normalize_id($body['id'] ?? null, '#ORD-');
        $customerName = isset($body['customerName']) ? (string)$body['customerName'] : null;
        $customerEmail = isset($body['customerEmail']) ? (string)$body['customerEmail'] : null;
        $customerPhone = isset($body['customerPhone']) ? (string)$body['customerPhone'] : null;
        $products = $body['products'] ?? [];
        $total = (float)($body['total'] ?? 0);
        $status = (string)($body['status'] ?? 'pending');
        $dateIso = isset($body['date']) ? (string)$body['date'] : date(DATE_ATOM);
        $orderDate = date('Y-m-d H:i:s', strtotime($dateIso));

        if (!is_array($products) || count($products) === 0) {
            respond_error('Order products required', 422);
        }

        $stmt = $pdo->prepare('INSERT INTO orders (id, customer_name, customer_email, customer_phone, products, total, status, order_date, created_at, updated_at)
            VALUES (:id, :customer_name, :customer_email, :customer_phone, :products, :total, :status, :order_date, :created_at, :updated_at)
            ON DUPLICATE KEY UPDATE customer_name=VALUES(customer_name), customer_email=VALUES(customer_email), customer_phone=VALUES(customer_phone), products=VALUES(products), total=VALUES(total), status=VALUES(status), order_date=VALUES(order_date), updated_at=VALUES(updated_at)');
        $now = now();
        $stmt->execute([
            ':id' => $orderId,
            ':customer_name' => $customerName,
            ':customer_email' => $customerEmail,
            ':customer_phone' => $customerPhone,
            ':products' => json_encode($products, JSON_UNESCAPED_UNICODE),
            ':total' => $total,
            ':status' => $status,
            ':order_date' => $orderDate,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$orderId]);
        respond(order_from_row($stmt->fetch()), 201);

    case 'PUT':
        if ($id === '') respond_error('Missing id', 400);
        $body = json_input();
        $updates = [];
        $params = [':id' => $id, ':updated_at' => now()];
        if (isset($body['status'])) { $updates[] = 'status = :status'; $params[':status'] = (string)$body['status']; }
        if (isset($body['total'])) { $updates[] = 'total = :total'; $params[':total'] = (float)$body['total']; }
        if (isset($body['products'])) { $updates[] = 'products = :products'; $params[':products'] = json_encode($body['products'], JSON_UNESCAPED_UNICODE); }
        if (isset($body['customerName'])) { $updates[] = 'customer_name = :customer_name'; $params[':customer_name'] = (string)$body['customerName']; }
        if (isset($body['customerEmail'])) { $updates[] = 'customer_email = :customer_email'; $params[':customer_email'] = (string)$body['customerEmail']; }
        if (isset($body['customerPhone'])) { $updates[] = 'customer_phone = :customer_phone'; $params[':customer_phone'] = (string)$body['customerPhone']; }
        if (isset($body['date'])) { $updates[] = 'order_date = :order_date'; $params[':order_date'] = date('Y-m-d H:i:s', strtotime((string)$body['date'])); }
        if (empty($updates)) respond_error('Nothing to update', 400);
        $sql = 'UPDATE orders SET ' . implode(', ', $updates) . ', updated_at = :updated_at WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        respond(order_from_row($stmt->fetch()));

    case 'DELETE':
        if ($id === '') respond_error('Missing id', 400);
        $stmt = $pdo->prepare('DELETE FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        respond(['ok' => true]);

    default:
        respond_error('Method not allowed', 405);
}

function order_from_row(array $row): array {
    return [
        'id' => $row['id'],
        'customerName' => $row['customer_name'],
        'customerEmail' => $row['customer_email'],
        'customerPhone' => $row['customer_phone'],
        'products' => json_decode($row['products'] ?? '[]', true),
        'total' => (float)$row['total'],
        'status' => $row['status'],
        'date' => $row['order_date'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}


