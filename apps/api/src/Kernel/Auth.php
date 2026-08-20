<?php

declare(strict_types=1);

namespace Softify\Kernel;

final class Auth
{
    public static function login(string $username, string $password): ?array
    {
        $user = Database::one('SELECT * FROM users WHERE email = ? LIMIT 1', [strtolower(trim($username))]);
        if ($user === null || !password_verify($password, $user['password_hash'])) {
            return null;
        }
        $config = require dirname(__DIR__, 2) . '/config.php';
        $raw = bin2hex(random_bytes(32));
        $hash = hash('sha256', $raw);
        $expires = (new \DateTimeImmutable('+' . (int) $config['tokenTtl'] . ' seconds'))->format('Y-m-d H:i:s');
        Database::run(
            'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
            [bin2hex(random_bytes(8)), $user['id'], $hash, $expires],
        );
        unset($user['password_hash']);
        return ['token' => $raw, 'user' => self::present($user)];
    }

    public static function user(?string $token): ?array
    {
        if ($token === null || $token === '') {
            return null;
        }
        $row = Database::one(
            'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token_hash = ? AND s.expires_at > NOW() LIMIT 1',
            [hash('sha256', $token)],
        );
        if ($row === null) {
            return null;
        }
        unset($row['password_hash']);
        return self::present($row);
    }

    public static function logout(?string $token): void
    {
        if ($token) {
            Database::run('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $token)]);
        }
    }

    /** @param array<string, mixed> $user */
    private static function present(array $user): array
    {
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'hue' => (int) $user['hue'],
            'orgId' => $user['org_id'],
        ];
    }
}
