<?php

declare(strict_types=1);

namespace Softify\Kernel;

final class Catalog
{
    public static function org(string $id): array
    {
        $row = Database::one('SELECT * FROM orgs WHERE id = ?', [$id]);
        if ($row === null) {
            Response::error('Org not found', 404);
        }
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'plan' => $row['plan'],
        ];
    }

    public static function members(string $orgId): array
    {
        $rows = Database::all(
            'SELECT id, name, email, role, hue FROM users WHERE org_id = ? ORDER BY name',
            [$orgId],
        );
        return array_map(static fn(array $row) => [
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $row['role'],
            'hue' => (int) $row['hue'],
        ], $rows);
    }

    public static function records(string $orgId, ?string $type = null): array
    {
        $sql = 'SELECT * FROM records WHERE org_id = ?';
        $params = [$orgId];
        if ($type) {
            $sql .= ' AND type = ?';
            $params[] = $type;
        }
        $sql .= ' ORDER BY updated_at DESC';
        $rows = Database::all($sql, $params);
        $relations = Database::all(
            'SELECT r.record_id, r.kind, r.related_id FROM record_relations r
             JOIN records rec ON rec.id = r.record_id WHERE rec.org_id = ?',
            [$orgId],
        );
        $byRecord = [];
        foreach ($relations as $rel) {
            $byRecord[$rel['record_id']][] = ['kind' => $rel['kind'], 'id' => $rel['related_id']];
        }
        return array_map(static fn(array $row) => self::presentRecord($row, $byRecord[$row['id']] ?? []), $rows);
    }

    public static function record(string $orgId, string $id): ?array
    {
        $row = Database::one('SELECT * FROM records WHERE org_id = ? AND id = ?', [$orgId, $id]);
        if ($row === null) {
            return null;
        }
        $relations = Database::all(
            'SELECT kind, related_id AS id FROM record_relations WHERE record_id = ?',
            [$id],
        );
        return self::presentRecord($row, $relations);
    }

    /** @param array<string, mixed> $input */
    public static function createRecord(string $orgId, array $input): array
    {
        $id = $input['id'] ?? ('rec_' . bin2hex(random_bytes(4)));
        $now = gmdate('c');
        Database::run(
            'INSERT INTO records (id, org_id, type, title, fields_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $orgId,
                (string) ($input['type'] ?? 'task'),
                (string) ($input['title'] ?? 'Untitled'),
                json_encode($input['fields'] ?? new \stdClass(), JSON_UNESCAPED_UNICODE),
                $now,
                $now,
            ],
        );
        foreach ($input['relations'] ?? [] as $rel) {
            Database::run(
                'INSERT INTO record_relations (record_id, kind, related_id) VALUES (?, ?, ?)',
                [$id, $rel['kind'], $rel['id']],
            );
        }
        return self::record($orgId, $id) ?? [];
    }

    /** @param array<string, mixed> $input */
    public static function updateRecord(string $orgId, string $id, array $input): ?array
    {
        $existing = Database::one('SELECT * FROM records WHERE org_id = ? AND id = ?', [$orgId, $id]);
        if ($existing === null) {
            return null;
        }
        $fields = json_decode($existing['fields_json'] ?: '{}', true) ?: [];
        if (isset($input['fields']) && is_array($input['fields'])) {
            $fields = array_merge($fields, $input['fields']);
        }
        $title = isset($input['title']) ? (string) $input['title'] : $existing['title'];
        Database::run(
            'UPDATE records SET title = ?, fields_json = ?, updated_at = ? WHERE id = ?',
            [$title, json_encode($fields, JSON_UNESCAPED_UNICODE), gmdate('c'), $id],
        );
        return self::record($orgId, $id);
    }

    public static function designs(string $table, string $orgId, ?string $module = null): array
    {
        $sql = "SELECT * FROM {$table} WHERE org_id = ?";
        $params = [$orgId];
        if ($module) {
            $sql .= ' AND module_id = ?';
            $params[] = $module;
        }
        $sql .= ' ORDER BY is_system DESC, name';
        $allowed = ['layouts' => true, 'views' => true, 'forms' => true];
        if (!isset($allowed[$table])) {
            Response::error('Invalid design type', 400);
        }
        return array_map([self::class, 'presentDesign'], Database::all($sql, $params));
    }

    /** @param array<string, mixed> $input */
    public static function saveDesign(string $table, string $orgId, array $input, ?string $id = null): array
    {
        $id = $id ?? (string) ($input['id'] ?? ($table[0] . '_' . bin2hex(random_bytes(4))));
        $existing = Database::one("SELECT id FROM {$table} WHERE org_id = ? AND id = ?", [$orgId, $id]);
        $schema = json_encode($input['schema'] ?? new \stdClass(), JSON_UNESCAPED_UNICODE);
        $name = (string) ($input['name'] ?? 'Untitled');
        $module = (string) ($input['moduleId'] ?? $input['module_id'] ?? 'crm');
        $isDefault = !empty($input['isDefault']) ? 1 : 0;
        $objectType = (string) ($input['objectType'] ?? '');
        $kind = (string) ($input['kind'] ?? $input['type'] ?? '');
        if ($existing) {
            Database::run(
                "UPDATE {$table} SET name = ?, module_id = ?, object_type = ?, kind = ?, is_default = ?, schema_json = ? WHERE id = ?",
                [$name, $module, $objectType, $kind, $isDefault, $schema, $id],
            );
        } else {
            Database::run(
                "INSERT INTO {$table} (id, org_id, module_id, name, object_type, kind, is_system, is_default, schema_json)
                 VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
                [$id, $orgId, $module, $name, $objectType, $kind, $isDefault, $schema],
            );
        }
        if ($isDefault) {
            Database::run(
                "UPDATE {$table} SET is_default = 0 WHERE org_id = ? AND module_id = ? AND id <> ?",
                [$orgId, $module, $id],
            );
            Database::run("UPDATE {$table} SET is_default = 1 WHERE id = ?", [$id]);
        }
        $row = Database::one("SELECT * FROM {$table} WHERE id = ?", [$id]);
        return self::presentDesign($row ?? []);
    }

    public static function deleteDesign(string $table, string $orgId, string $id): void
    {
        $row = Database::one("SELECT is_system FROM {$table} WHERE org_id = ? AND id = ?", [$orgId, $id]);
        if ($row === null) {
            Response::error('Not found', 404);
        }
        if ((int) $row['is_system'] === 1) {
            Response::error('System designs cannot be deleted', 400);
        }
        Database::run("DELETE FROM {$table} WHERE id = ?", [$id]);
    }

    /** @param array<string, mixed> $row */
    public static function presentDesign(array $row): array
    {
        $schema = json_decode($row['schema_json'] ?? '{}', true);
        return [
            'id' => $row['id'],
            'moduleId' => $row['module_id'],
            'name' => $row['name'],
            'objectType' => $row['object_type'] ?: null,
            'kind' => $row['kind'] ?: null,
            'isSystem' => (int) $row['is_system'] === 1,
            'isDefault' => (int) $row['is_default'] === 1,
            'schema' => is_array($schema) ? $schema : new \stdClass(),
        ];
    }

    /** @param array<string, mixed> $row */
    private static function presentRecord(array $row, array $relations): array
    {
        $fields = json_decode($row['fields_json'] ?: '{}', true);
        return [
            'id' => $row['id'],
            'type' => $row['type'],
            'title' => $row['title'],
            'fields' => is_array($fields) ? $fields : new \stdClass(),
            'relations' => $relations,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }
}
