<?php

declare(strict_types=1);

namespace Softify\Kernel;

final class Request
{
    public string $method;
    public string $path;
    /** @var array<string, string> */
    public array $query;
    /** @var array<string, mixed> */
    public array $body;
    public ?string $token;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $this->path = rtrim(parse_url($uri, PHP_URL_PATH) ?: '/', '/') ?: '/';
        $this->query = $_GET;
        $raw = file_get_contents('php://input') ?: '';
        $decoded = json_decode($raw, true);
        $this->body = is_array($decoded) ? $decoded : [];
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $this->token = preg_match('/Bearer\s+(.+)/i', $header, $m) ? trim($m[1]) : ($_COOKIE['softify_token'] ?? null);
    }

    public function str(string $key, string $fallback = ''): string
    {
        $value = $this->body[$key] ?? $this->query[$key] ?? $fallback;
        return is_string($value) ? $value : $fallback;
    }
}
