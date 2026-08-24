<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

$wantsJson = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
    || strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

$respond = static function (bool $ok, string $message, int $status = 200) use ($wantsJson) {
    http_response_code($status);

    if ($wantsJson) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(
            ['ok' => $ok, 'message' => $message],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }

    header('Content-Type: text/html; charset=UTF-8');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $title = $ok ? 'Mensaje recibido' : 'No fue posible enviar el mensaje';
    $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    echo <<<HTML
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$safeTitle} | Smeke Zarazúa Asociados</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8f8f7;color:#161718;font-family:Arial,sans-serif}.panel{width:min(620px,100%);padding:48px;border:1px solid #d8dadd;background:#fff;box-shadow:0 24px 70px rgba(21,24,27,.09)}p{color:#55595d;line-height:1.7}a{display:inline-block;margin-top:18px;padding:14px 20px;background:#161718;color:#fff;font-size:12px;letter-spacing:.12em;text-decoration:none}
  </style>
</head>
<body>
  <main class="panel">
    <h1>{$safeTitle}</h1>
    <p>{$safeMessage}</p>
    <a href="index.html#contacto">VOLVER AL SITIO</a>
  </main>
</body>
</html>
HTML;
    exit;
};

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    $respond(false, 'Este recurso acepta únicamente solicitudes enviadas desde el formulario.', 405);
}

if (trim((string) ($_POST['website'] ?? '')) !== '') {
    $respond(true, 'Mensaje recibido. Gracias por contactarnos.');
}

$nombre = trim((string) ($_POST['nombre'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$telefono = trim((string) ($_POST['telefono'] ?? ''));
$servicio = trim((string) ($_POST['servicio'] ?? ''));
$mensaje = trim((string) ($_POST['mensaje'] ?? ''));
$consentimiento = (string) ($_POST['consentimiento'] ?? '');

$length = static fn (string $value): int => function_exists('mb_strlen')
    ? mb_strlen($value, 'UTF-8')
    : strlen($value);

$serviceLabels = [
    'consultoria' => 'Consultoría fiscal',
    'impuestos' => 'Impuestos y seguridad social',
    'controversia' => 'Controversia',
    'otro' => 'Otro asunto fiscal',
];

if ($length($nombre) < 2 || $length($nombre) > 80) {
    $respond(false, 'Ingrese un nombre válido de entre 2 y 80 caracteres.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)) {
    $respond(false, 'Ingrese una dirección de correo válida.', 422);
}

if ($length($email) > 120) {
    $respond(false, 'La dirección de correo es demasiado larga.', 422);
}

if ($telefono !== '' && ($length($telefono) > 40 || !preg_match('/^[0-9+().\-\s]+$/', $telefono))) {
    $respond(false, 'Ingrese un número telefónico válido.', 422);
}

if (!array_key_exists($servicio, $serviceLabels)) {
    $respond(false, 'Seleccione un área de interés válida.', 422);
}

if ($length($mensaje) < 20 || $length($mensaje) > 1500) {
    $respond(false, 'El mensaje debe contener entre 20 y 1500 caracteres.', 422);
}

if ($consentimiento !== '1') {
    $respond(false, 'Debe aceptar el uso de sus datos para atender la solicitud.', 422);
}

$safeName = preg_replace('/[\r\n]+/', ' ', $nombre) ?? $nombre;
$whatsappMessage = implode("\n", [
    'Hola, quiero solicitar información a Smeke Zarazúa Asociados, S.C.',
    '',
    'Nombre: ' . $safeName,
    'Correo: ' . $email,
    'Teléfono: ' . ($telefono !== '' ? $telefono : 'No proporcionado'),
    'Área de interés: ' . $serviceLabels[$servicio],
    '',
    'Mensaje:',
    $mensaje,
]);
$whatsappUrl = 'https://wa.me/528131426548?text=' . rawurlencode($whatsappMessage);

if ($wantsJson) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(
        [
            'ok' => true,
            'message' => 'WhatsApp preparado. Confirme el envío en la aplicación.',
            'url' => $whatsappUrl,
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

header('Location: ' . $whatsappUrl, true, 303);
exit;
