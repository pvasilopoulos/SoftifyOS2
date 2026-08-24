<?php

declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/index.php';
    return;
}

$local = __DIR__ . $uri;
if ($uri !== '/' && is_file($local)) {
    return false;
}

$dist = dirname(__DIR__, 2) . '/web/dist';
if (is_dir($dist)) {
    $file = distFile($dist, $uri);
    if ($file !== null) {
        sendFile($file);
    }
    $index = $dist . '/index.html';
    if (is_file($index) && in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) {
        sendFile($index);
    }
}

if (in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "SoftifyOS: run `pnpm build` then reload.\n";
    return true;
}

require __DIR__ . '/index.php';

function distFile(string $dist, string $uri): ?string
{
    $relative = ltrim($uri, '/');
    if ($relative === '' || str_contains($relative, "\0")) {
        return is_file($dist . '/index.html') ? $dist . '/index.html' : null;
    }
    $root = realpath($dist);
    if ($root === false) {
        return null;
    }
    $candidate = realpath($dist . '/' . $relative);
    if ($candidate === false || !is_file($candidate)) {
        return null;
    }
    if (!str_starts_with($candidate, $root . DIRECTORY_SEPARATOR) && $candidate !== $root) {
        return null;
    }
    return $candidate;
}

function sendFile(string $path): never
{
    $types = [
        'css' => 'text/css; charset=utf-8',
        'html' => 'text/html; charset=utf-8',
        'ico' => 'image/x-icon',
        'js' => 'text/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'map' => 'application/json; charset=utf-8',
        'mjs' => 'text/javascript; charset=utf-8',
        'png' => 'image/png',
        'svg' => 'image/svg+xml',
        'txt' => 'text/plain; charset=utf-8',
        'webp' => 'image/webp',
        'woff2' => 'font/woff2',
    ];
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    if ($ext !== 'html') {
        header('Cache-Control: public, max-age=31536000, immutable');
    }
    header('Content-Length: ' . (string) filesize($path));
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') {
        readfile($path);
    }
    exit;
}
