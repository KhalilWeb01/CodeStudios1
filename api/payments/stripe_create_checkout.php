<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

// Create Stripe Checkout session for an existing order
$body = json_input();
$orderId = trim((string)($body['orderId'] ?? ''));
if ($orderId === '') {
    respond_error('orderId required', 422);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$orderId]);
$order = $stmt->fetch();
if (!$order) {
    respond_error('Order not found', 404);
}

$items = json_decode($order['products'] ?? '[]', true);
if (!is_array($items) || count($items) === 0) {
    respond_error('Order has no items', 400);
}

$secret = getenv('STRIPE_SECRET');
if (!$secret) {
    respond_error('Stripe secret missing. Define STRIPE_SECRET via .htaccess SetEnv.', 500);
}

// Build line items for Stripe Checkout
$lineItems = [];
foreach ($items as $i) {
    $name = (string)($i['name'] ?? 'Item');
    $price = (float)($i['price'] ?? 0);
    $qty = (int)($i['quantity'] ?? 1);
    if ($price <= 0 || $qty <= 0) continue;
    $lineItems[] = [
        'name' => $name,
        'amount' => (int)round($price * 100), // AED in fils
        'quantity' => $qty,
        'currency' => 'aed',
    ];
}
if (count($lineItems) === 0) {
    respond_error('No valid line items', 400);
}

$appUrl = rtrim(getenv('APP_URL') ?: (($_SERVER['REQUEST_SCHEME'] ?? 'https').'://'.$_SERVER['HTTP_HOST']), '/');
$successUrl = $appUrl . '/payment-success.html?order_id=' . rawurlencode($orderId) . '&session_id={CHECKOUT_SESSION_ID}';
$cancelUrl  = $appUrl . '/payment-cancel.html?order_id=' . rawurlencode($orderId);

// Prepare payload per Stripe API (without SDK)
$payload = [
    'mode' => 'payment',
    'success_url' => $successUrl,
    'cancel_url' => $cancelUrl,
    'metadata[order_id]' => $orderId,
];

foreach ($lineItems as $idx => $li) {
    $payload["line_items[$idx][price_data][currency]"] = $li['currency'];
    $payload["line_items[$idx][price_data][product_data][name]"] = $li['name'];
    $payload["line_items[$idx][price_data][unit_amount]"] = (string)$li['amount'];
    $payload["line_items[$idx][quantity]"] = (string)$li['quantity'];
}

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($payload),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $secret,
        'Content-Type: application/x-www-form-urlencoded',
    ],
    CURLOPT_RETURNTRANSFER => true,
]);
$res = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ($res === false) {
    $err = curl_error($ch);
    curl_close($ch);
    respond_error('Stripe connection error: '.$err, 502);
}
curl_close($ch);

if ($status < 200 || $status >= 300) {
    respond_error('Stripe error: '.$res, 502);
}

$data = json_decode($res, true);
if (!is_array($data) || empty($data['url'])) {
    respond_error('Stripe response invalid', 502);
}

// Mark order as processing
$upd = $pdo->prepare('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?');
$upd->execute(['processing', $orderId]);

respond(['id' => $data['id'] ?? null, 'url' => $data['url']]);


