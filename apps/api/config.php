<?php

declare(strict_types=1);

return [
    'db' => [
        'host' => getenv('SOFTIFY_DB_HOST') ?: '127.0.0.1',
        'name' => getenv('SOFTIFY_DB_NAME') ?: 'softifyos',
        'user' => getenv('SOFTIFY_DB_USER') ?: 'softify',
        'pass' => getenv('SOFTIFY_DB_PASS') ?: 'softify',
        'charset' => 'utf8mb4',
    ],
    'tokenTtl' => 60 * 60 * 24 * 14,
];
