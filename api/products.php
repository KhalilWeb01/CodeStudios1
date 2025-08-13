<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

try {
    $pdo = db();
    // Ensure table exists (lightweight guard)
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            old_price DECIMAL(10,2) NULL,
            discount INT NULL,
            category VARCHAR(64) NULL,
            quantity INT NOT NULL DEFAULT 0,
            rating DECIMAL(3,1) NULL,
            colors JSON NULL,
            sizes JSON NULL,
            photos JSON NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;'
    );
} catch (Throwable $e) {
    respond_error('Failed to ensure products table: ' . $e->getMessage(), 500);
}

switch ($method) {
    case 'GET':
        if ($id !== '') {
            $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) {
                respond_error('Product not found', 404);
            }
            respond(product_from_row($row));
        }
        // Optional filters: category
        $category = isset($_GET['category']) ? trim((string)$_GET['category']) : '';
        if ($category !== '') {
            $stmt = $pdo->prepare('SELECT * FROM products WHERE category = ? ORDER BY created_at DESC');
            $stmt->execute([$category]);
        } else {
            $stmt = $pdo->query('SELECT * FROM products ORDER BY created_at DESC');
        }
        $rows = $stmt->fetchAll();
        $data = array_map('product_from_row', $rows);
        respond(['items' => $data]);

    case 'POST':
        $body = json_input();
        $productId = normalize_id($body['id'] ?? null, 'prod_');
        $name = trim((string)($body['name'] ?? ''));
        $price = (float)($body['price'] ?? 0);
        $oldPrice = isset($body['oldPrice']) ? (float)$body['oldPrice'] : null;
        $discount = isset($body['discount']) ? (int)$body['discount'] : null;
        $description = isset($body['description']) ? (string)$body['description'] : null;
        $category = isset($body['category']) ? (string)$body['category'] : null;
        $quantity = isset($body['quantity']) ? (int)$body['quantity'] : 0;
        $rating = isset($body['rating']) ? (float)$body['rating'] : null;
        $colors = $body['colors'] ?? null; // array|null
        $sizes = $body['sizes'] ?? null;   // array|null
        $photos = $body['photos'] ?? null; // array|null

        if ($name === '' || $price <= 0) {
            respond_error('Invalid name or price', 422);
        }

        $stmt = $pdo->prepare('INSERT INTO products (id, name, description, price, old_price, discount, category, quantity, rating, colors, sizes, photos, created_at, updated_at)
            VALUES (:id, :name, :description, :price, :old_price, :discount, :category, :quantity, :rating, :colors, :sizes, :photos, :created_at, :updated_at)
            ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), old_price=VALUES(old_price), discount=VALUES(discount), category=VALUES(category), quantity=VALUES(quantity), rating=VALUES(rating), colors=VALUES(colors), sizes=VALUES(sizes), photos=VALUES(photos), updated_at=VALUES(updated_at)');
        $now = now();
        $stmt->execute([
            ':id' => $productId,
            ':name' => $name,
            ':description' => $description,
            ':price' => $price,
            ':old_price' => $oldPrice,
            ':discount' => $discount,
            ':category' => $category,
            ':quantity' => $quantity,
            ':rating' => $rating,
            ':colors' => $colors !== null ? json_encode($colors, JSON_UNESCAPED_UNICODE) : null,
            ':sizes' => $sizes !== null ? json_encode($sizes, JSON_UNESCAPED_UNICODE) : null,
            ':photos' => $photos !== null ? json_encode($photos, JSON_UNESCAPED_UNICODE) : null,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        $row = $stmt->fetch();
        respond(product_from_row($row), 201);

    case 'PUT':
        if ($id === '') {
            respond_error('Missing id', 400);
        }
        $body = json_input();
        // Fetch existing
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            respond_error('Product not found', 404);
        }
        $merged = array_merge(product_from_row($row), $body);
        // Reuse POST insertion logic
        $_GET['id'] = $id;
        $_SERVER['REQUEST_METHOD'] = 'POST';
        // call back into POST branch would be messy; instead, do direct update
        $stmt = $pdo->prepare('UPDATE products SET name=:name, description=:description, price=:price, old_price=:old_price, discount=:discount, category=:category, quantity=:quantity, rating=:rating, colors=:colors, sizes=:sizes, photos=:photos, updated_at=:updated_at WHERE id=:id');
        $stmt->execute([
            ':id' => $id,
            ':name' => (string)($merged['name'] ?? $row['name']),
            ':description' => $merged['description'] ?? $row['description'],
            ':price' => (float)($merged['price'] ?? $row['price']),
            ':old_price' => isset($merged['oldPrice']) ? (float)$merged['oldPrice'] : $row['old_price'],
            ':discount' => isset($merged['discount']) ? (int)$merged['discount'] : $row['discount'],
            ':category' => $merged['category'] ?? $row['category'],
            ':quantity' => isset($merged['quantity']) ? (int)$merged['quantity'] : $row['quantity'],
            ':rating' => isset($merged['rating']) ? (float)$merged['rating'] : $row['rating'],
            ':colors' => array_key_exists('colors', $merged) ? json_encode($merged['colors'], JSON_UNESCAPED_UNICODE) : $row['colors'],
            ':sizes' => array_key_exists('sizes', $merged) ? json_encode($merged['sizes'], JSON_UNESCAPED_UNICODE) : $row['sizes'],
            ':photos' => array_key_exists('photos', $merged) ? json_encode($merged['photos'], JSON_UNESCAPED_UNICODE) : $row['photos'],
            ':updated_at' => now(),
        ]);
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        respond(product_from_row($stmt->fetch()));

    case 'DELETE':
        if ($id === '') {
            respond_error('Missing id', 400);
        }
        $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$id]);
        respond(['ok' => true]);

    default:
        respond_error('Method not allowed', 405);
}

function product_from_row(array $row): array {
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'description' => $row['description'],
        'price' => (float)$row['price'],
        'oldPrice' => isset($row['old_price']) ? (float)$row['old_price'] : null,
        'discount' => isset($row['discount']) ? (int)$row['discount'] : null,
        'category' => $row['category'],
        'quantity' => (int)$row['quantity'],
        'rating' => isset($row['rating']) ? (float)$row['rating'] : null,
        'colors' => json_decode($row['colors'] ?? 'null', true),
        'sizes' => json_decode($row['sizes'] ?? 'null', true),
        'photos' => json_decode($row['photos'] ?? 'null', true),
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}


