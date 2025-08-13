<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

// Stripe webhook endpoint
// For simplicity we skip signature verification here. In production, verify using STRIPE_WEBHOOK_SECRET.

$raw = file_get_contents('php://input') ?: '';
$event = json_decode($raw, true);
if (!is_array($event)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

$type = (string)($event['type'] ?? '');
$obj = $event['data']['object'] ?? [];

if ($type === 'checkout.session.completed') {
    $orderId = (string)($obj['metadata']['order_id'] ?? '');
    if ($orderId !== '') {
        try {
            $pdo = db();
            $upd = $pdo->prepare('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?');
            $upd->execute(['delivered', $orderId]); // or 'paid'
        } catch (Throwable $e) {
            // Log locally if needed
        }
    }
}

http_response_code(200);
echo json_encode(['ok' => true]);


