<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/autoload.php';

use Softify\Kernel\Database;

$pdo = Database::pdo();
$hash = password_hash('prodromos', PASSWORD_DEFAULT);
$now = gmdate('c');

$pdo->exec('DELETE FROM record_relations');
$pdo->exec('DELETE FROM sessions');
$pdo->exec('DELETE FROM records');
$pdo->exec('DELETE FROM layouts');
$pdo->exec('DELETE FROM views');
$pdo->exec('DELETE FROM forms');
$pdo->exec('DELETE FROM users');
$pdo->exec('DELETE FROM orgs');

$pdo->prepare('INSERT INTO orgs (id, name, plan) VALUES (?, ?, ?)')
    ->execute(['org_softify', 'Softify', 'Studio']);

$users = [
    ['user_panos', 'Πρόδρομος Βασιλόπουλος', 'info@softify.gr', 'Founder', 250, $hash],
    ['user_maria', 'Μαρία Κώστα', 'maria@helix.studio', 'Sales', 20, $hash],
    ['user_nikos', 'Νίκος Ανδρέου', 'nikos@helix.studio', 'Delivery', 160, $hash],
    ['user_elena', 'Elena Rossi', 'elena@helix.studio', 'Success', 300, $hash],
    ['user_jordan', 'Jordan Lee', 'jordan@helix.studio', 'Finance', 45, $hash],
];
$u = $pdo->prepare('INSERT INTO users (id, org_id, name, email, password_hash, role, hue) VALUES (?,?,?,?,?,?,?)');
foreach ($users as $user) {
    $u->execute([$user[0], 'org_softify', $user[1], $user[2], $user[5], $user[3], $user[4]]);
}

$insert = $pdo->prepare(
    'INSERT INTO records (id, org_id, type, title, fields_json, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
);
$rel = $pdo->prepare('INSERT INTO record_relations (record_id, kind, related_id) VALUES (?,?,?)');

function rec(PDOStatement $insert, PDOStatement $rel, string $id, string $type, string $title, array $fields, array $relations, string $now): void
{
    $insert->execute([$id, 'org_softify', $type, $title, json_encode($fields, JSON_UNESCAPED_UNICODE), $now, $now]);
    foreach ($relations as $item) {
        $rel->execute([$id, $item[0], $item[1]]);
    }
}

rec($insert, $rel, 'co_helios', 'company', 'Helios Bank', ['domain' => 'heliosbank.gr', 'industry' => 'Finance', 'size' => '2,400', 'city' => 'Athens', 'health' => 'strong'], [], $now);
rec($insert, $rel, 'co_aegean', 'company', 'Aegean Logistics', ['domain' => 'aegeanlog.com', 'industry' => 'Logistics', 'city' => 'Piraeus', 'health' => 'ok'], [], $now);
rec($insert, $rel, 'co_nimbus', 'company', 'Nimbus Health', ['domain' => 'nimbus.health', 'industry' => 'Health', 'city' => 'Thessaloniki', 'health' => 'strong'], [], $now);
rec($insert, $rel, 'co_polar', 'company', 'Polar Studio', ['domain' => 'polar.studio', 'industry' => 'Media', 'city' => 'Lisbon', 'health' => 'ok'], [], $now);
rec($insert, $rel, 'co_orion', 'company', 'Orion Retail', ['domain' => 'orion-retail.eu', 'industry' => 'Retail', 'city' => 'Milan', 'health' => 'risk'], [], $now);
rec($insert, $rel, 'co_kite', 'company', 'Kite Coffee', ['domain' => 'kitecoffee.gr', 'industry' => 'Hospitality', 'city' => 'Athens', 'health' => 'strong'], [], $now);

rec($insert, $rel, 'ct_sofia', 'contact', 'Sofia Markou', ['role' => 'CTO', 'email' => 'sofia.markou@heliosbank.gr'], [['company', 'co_helios']], $now);
rec($insert, $rel, 'ct_andreas', 'contact', 'Andreas Vlachos', ['role' => 'Head of Ops', 'email' => 'andreas@aegeanlog.com'], [['company', 'co_aegean']], $now);
rec($insert, $rel, 'ct_irene', 'contact', 'Irene Papadimitriou', ['role' => 'CPO', 'email' => 'irene@nimbus.health'], [['company', 'co_nimbus']], $now);

rec($insert, $rel, 'dl_helios_core', 'deal', 'Core banking portal', ['stage' => 'negotiation', 'amount' => 84000, 'ownerId' => 'user_maria', 'probability' => 70, 'sort' => 0], [['company', 'co_helios'], ['contact', 'ct_sofia']], $now);
rec($insert, $rel, 'dl_nimbus_app', 'deal', 'Patient experience app', ['stage' => 'qualified', 'amount' => 120000, 'ownerId' => 'user_panos', 'probability' => 45, 'sort' => 0], [['company', 'co_nimbus']], $now);
rec($insert, $rel, 'dl_aegean_fleet', 'deal', 'Fleet operating system', ['stage' => 'proposal', 'amount' => 46500, 'ownerId' => 'user_maria', 'probability' => 55, 'sort' => 0], [['company', 'co_aegean']], $now);
rec($insert, $rel, 'dl_orion_pos', 'deal', 'POS modernization', ['stage' => 'proposal', 'amount' => 62000, 'ownerId' => 'user_elena', 'probability' => 40, 'sort' => 1], [['company', 'co_orion']], $now);
rec($insert, $rel, 'dl_polar_brand', 'deal', 'Brand system & site', ['stage' => 'lead', 'amount' => 18000, 'ownerId' => 'user_panos', 'probability' => 25, 'sort' => 0], [['company', 'co_polar']], $now);
rec($insert, $rel, 'dl_kite_loyalty', 'deal', 'Loyalty & ordering', ['stage' => 'lead', 'amount' => 9400, 'ownerId' => 'user_maria', 'probability' => 20, 'sort' => 1], [['company', 'co_kite']], $now);
rec($insert, $rel, 'dl_helios_kyc', 'deal', 'Mobile KYC', ['stage' => 'won', 'amount' => 36000, 'ownerId' => 'user_maria', 'probability' => 100, 'sort' => 0], [['company', 'co_helios']], $now);

rec($insert, $rel, 'pr_helios', 'project', 'Helios Core Portal', ['status' => 'active', 'ownerId' => 'user_nikos', 'color' => '#7c9cff'], [['company', 'co_helios'], ['deal', 'dl_helios_core']], $now);
rec($insert, $rel, 'pr_nimbus', 'project', 'Nimbus Patient App', ['status' => 'active', 'ownerId' => 'user_panos', 'color' => '#5eead4'], [['company', 'co_nimbus']], $now);
rec($insert, $rel, 'pr_internal', 'project', 'SoftifyOS studio build', ['status' => 'active', 'ownerId' => 'user_panos', 'color' => '#c4a6ff'], [], $now);

rec($insert, $rel, 'tk_1', 'task', 'Map Helios SSO + role matrix', ['status' => 'in_progress', 'priority' => 'high', 'ownerId' => 'user_nikos', 'sort' => 0], [['project', 'pr_helios']], $now);
rec($insert, $rel, 'tk_2', 'task', 'Proposal deck for Aegean ops team', ['status' => 'review', 'priority' => 'urgent', 'ownerId' => 'user_maria', 'sort' => 0], [['project', 'pr_internal']], $now);
rec($insert, $rel, 'tk_3', 'task', 'Patient onboarding flow, v2', ['status' => 'backlog', 'priority' => 'medium', 'ownerId' => 'user_panos', 'sort' => 0], [['project', 'pr_nimbus']], $now);
rec($insert, $rel, 'tk_4', 'task', 'Design OS command palette', ['status' => 'done', 'priority' => 'high', 'ownerId' => 'user_panos', 'sort' => 0], [['project', 'pr_internal']], $now);
rec($insert, $rel, 'tk_5', 'task', 'Contract redlines with legal', ['status' => 'in_progress', 'priority' => 'urgent', 'ownerId' => 'user_jordan', 'sort' => 1], [['project', 'pr_helios']], $now);

rec($insert, $rel, 'doc_handbook', 'doc', 'Studio handbook', ['emoji' => '◈', 'body' => 'Helix / Softify is a product studio. If it is not in SoftifyOS, it did not happen.'], [], $now);
rec($insert, $rel, 'doc_playbook', 'doc', 'Sales playbook', ['emoji' => '◎', 'body' => 'We sell outcomes, not hours. Demo the graph: a deal that becomes a project without export.'], [], $now);

rec($insert, $rel, 'in_1', 'inbox', 'Board wants a live portal date', ['channel' => 'email', 'read' => false, 'from' => 'Sofia Markou', 'preview' => 'Can we lock a public beta before 12 Oct?'], [['deal', 'dl_helios_core']], $now);
rec($insert, $rel, 'ac_1', 'activity', 'moved deal to Negotiation', ['actorId' => 'user_maria', 'verb' => 'moved'], [['deal', 'dl_helios_core']], $now);
rec($insert, $rel, 'ev_1', 'event', 'Helios negotiation', ['start' => (new DateTimeImmutable('+2 hours'))->format('c'), 'end' => (new DateTimeImmutable('+3 hours'))->format('c'), 'location' => 'Meet · Sofia'], [['deal', 'dl_helios_core']], $now);
rec($insert, $rel, 'ev_2', 'event', 'Studio standup', ['start' => (new DateTimeImmutable('-1 hour'))->format('c'), 'end' => (new DateTimeImmutable('+15 minutes'))->format('c'), 'location' => 'Helix HQ'], [['project', 'pr_internal']], $now);
rec($insert, $rel, 'ev_3', 'event', 'Nimbus workshop', ['start' => (new DateTimeImmutable('+1 day 3 hours'))->format('c'), 'end' => (new DateTimeImmutable('+1 day 5 hours'))->format('c'), 'location' => 'Thessaloniki'], [['deal', 'dl_nimbus_app']], $now);

$design = $pdo->prepare(
    'INSERT INTO layouts (id, org_id, module_id, name, object_type, kind, is_system, is_default, schema_json)
     VALUES (?,?,?,?,?,?,?,?,?)',
);
$view = $pdo->prepare(
    'INSERT INTO views (id, org_id, module_id, name, object_type, kind, is_system, is_default, schema_json)
     VALUES (?,?,?,?,?,?,?,?,?)',
);
$form = $pdo->prepare(
    'INSERT INTO forms (id, org_id, module_id, name, object_type, kind, is_system, is_default, schema_json)
     VALUES (?,?,?,?,?,?,?,?,?)',
);

$org = 'org_softify';

$design->execute(['lay_crm_board', $org, 'crm', 'Board + inspector', 'deal', 'split', 1, 1, json_encode([
    'preset' => 'split',
    'zones' => [
        ['id' => 'main', 'slot' => 'primary', 'flex' => 1],
        ['id' => 'inspector', 'slot' => 'inspector', 'width' => 420],
    ],
])]);
$design->execute(['lay_crm_list', $org, 'crm', 'List + inspector', 'company', 'split', 1, 0, json_encode([
    'preset' => 'split',
    'zones' => [
        ['id' => 'main', 'slot' => 'primary', 'flex' => 1],
        ['id' => 'inspector', 'slot' => 'inspector', 'width' => 380],
    ],
])]);
$design->execute(['lay_work_board', $org, 'work', 'Kanban', 'task', 'board', 1, 1, json_encode([
    'preset' => 'board',
    'zones' => [['id' => 'main', 'slot' => 'primary', 'flex' => 1]],
])]);

$view->execute(['view_crm_pipeline', $org, 'crm', 'Pipeline', 'deal', 'board', 1, 1, json_encode([
    'type' => 'board',
    'columnField' => 'stage',
    'columns' => ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
    'titleField' => 'title',
    'metricField' => 'amount',
])]);
$view->execute(['view_crm_companies', $org, 'crm', 'Companies', 'company', 'table', 1, 0, json_encode([
    'type' => 'table',
    'columns' => ['title', 'industry', 'health', 'city'],
])]);
$view->execute(['view_crm_contacts', $org, 'crm', 'Contacts', 'contact', 'table', 1, 0, json_encode([
    'type' => 'table',
    'columns' => ['title', 'role', 'email'],
])]);
$view->execute(['view_work_board', $org, 'work', 'Task board', 'task', 'board', 1, 1, json_encode([
    'type' => 'board',
    'columnField' => 'status',
    'columns' => ['backlog', 'in_progress', 'review', 'done'],
    'titleField' => 'title',
])]);

$form->execute(['form_deal', $org, 'crm', 'Deal', 'deal', 'modal', 1, 1, json_encode([
    'surface' => 'modal',
    'sections' => [[
        'id' => 'main',
        'title' => 'Deal',
        'fields' => [
            ['key' => 'title', 'label' => 'Title', 'type' => 'text', 'required' => true, 'width' => 2],
            ['key' => 'amount', 'label' => 'Amount', 'type' => 'money', 'width' => 1],
            ['key' => 'stage', 'label' => 'Stage', 'type' => 'select', 'options' => ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], 'width' => 1],
        ],
    ]],
])]);
$form->execute(['form_task', $org, 'work', 'Task', 'task', 'modal', 1, 1, json_encode([
    'surface' => 'modal',
    'sections' => [[
        'id' => 'main',
        'title' => 'Task',
        'fields' => [
            ['key' => 'title', 'label' => 'Title', 'type' => 'text', 'required' => true, 'width' => 2],
            ['key' => 'status', 'label' => 'Status', 'type' => 'select', 'options' => ['backlog', 'in_progress', 'review', 'done'], 'width' => 1],
            ['key' => 'priority', 'label' => 'Priority', 'type' => 'select', 'options' => ['low', 'medium', 'high', 'urgent'], 'width' => 1],
        ],
    ]],
])]);

echo "Seeded SoftifyOS MySQL.\n";
