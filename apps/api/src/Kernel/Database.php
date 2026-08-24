<?php

declare(strict_types=1);

namespace Softify\Kernel;

use PDO;
use PDOException;
use RuntimeException;

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }
        /** @var array{db: array{host:string,name:string,user:string,pass:string,charset:string}} $config */
        $config = require dirname(__DIR__, 2) . '/config.php';
        $db = $config['db'];
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $db['host'], $db['name'], $db['charset']);
        try {
            self::$pdo = new PDO($dsn, $db['user'], $db['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            throw new RuntimeException('Database connection failed: ' . $e->getMessage(), 0, $e);
        }
        return self::$pdo;
    }

    /** @param array<int|string, mixed> $params */
    public static function all(string $sql, array $params = []): array
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute(array_values($params));
        return $stmt->fetchAll();
    }

    /** @param array<int|string, mixed> $params */
    public static function one(string $sql, array $params = []): ?array
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute(array_values($params));
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @param array<int|string, mixed> $params */
    public static function run(string $sql, array $params = []): void
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute(array_values($params));
    }
}
