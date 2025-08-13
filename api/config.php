<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Basic CORS support if needed (same-origin on Hostinger usually doesn't require this)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: 'localhost';
    $name = getenv('DB_NAME') ?: 'u217282312_codestudios';
    $user = getenv('DB_USER') ?: 'u217282312_codestudios';
    $pass = getenv('DB_PASS') ?: 'Codestudiosdxb2025';

    $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed', 'detail' => $e->getMessage()]);
        exit;
    }

    return $pdo;
}

function json_input(): array {
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respond_error(string $message, int $code = 400): void {
    respond(['error' => $message], $code);
}

function normalize_id(?string $id, string $prefix = 'id_'): string {
    $id = trim((string)($id ?? ''));
    if ($id === '') {
        return $prefix . (string)round(microtime(true) * 1000);
    }
    return $id;
}

function now(): string {
    return date('Y-m-d H:i:s');
}


