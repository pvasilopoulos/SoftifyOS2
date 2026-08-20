<?php

declare(strict_types=1);

namespace Softify\Kernel;

final class App
{
    public static function run(): void
    {
        Response::cors();
        $request = new Request();
        $router = new Router();
        self::routes($router);
        $router->dispatch($request);
    }

    private static function routes(Router $router): void
    {
        $router->add('GET', '/api/health', static function (Request $_req, ?array $_user, array $_params) {
            Response::json(['ok' => true, 'service' => 'softifyos']);
        }, false);

        $router->add('POST', '/api/auth/login', static function (Request $req, ?array $_user, array $_params) {
            $auth = Auth::login($req->str('username', $req->str('email')), $req->str('password'));
            if ($auth === null) {
                Response::error('Invalid credentials', 401);
            }
            Response::json($auth);
        }, false);

        $router->add('POST', '/api/auth/logout', static function (Request $req, ?array $_user, array $_params) {
            Auth::logout($req->token);
            Response::json(['ok' => true]);
        }, false);

        $router->add('GET', '/api/bootstrap', static function (Request $_req, ?array $user, array $_params) {
            $orgId = $user['orgId'];
            Response::json([
                'user' => $user,
                'org' => Catalog::org($orgId),
                'members' => Catalog::members($orgId),
                'records' => Catalog::records($orgId),
                'layouts' => Catalog::designs('layouts', $orgId),
                'views' => Catalog::designs('views', $orgId),
                'forms' => Catalog::designs('forms', $orgId),
                'modules' => [
                    ['id' => 'crm', 'path' => '/crm'],
                    ['id' => 'work', 'path' => '/work'],
                    ['id' => 'studio', 'path' => '/studio'],
                ],
            ]);
        });

        $router->add('GET', '/api/records', static function (Request $req, ?array $user, array $_params) {
            Response::json(['records' => Catalog::records($user['orgId'], $req->str('type') ?: null)]);
        });

        $router->add('POST', '/api/records', static function (Request $req, ?array $user, array $_params) {
            Response::json(['record' => Catalog::createRecord($user['orgId'], $req->body)], 201);
        });

        $router->add('PATCH', '/api/records/:id', static function (Request $req, ?array $user, array $params) {
            $record = Catalog::updateRecord($user['orgId'], $params['id'], $req->body);
            if ($record === null) {
                Response::error('Not found', 404);
            }
            Response::json(['record' => $record]);
        });

        foreach (['layouts', 'views', 'forms'] as $table) {
            $router->add('GET', "/api/{$table}", static function (Request $req, ?array $user, array $_params) use ($table) {
                Response::json([$table => Catalog::designs($table, $user['orgId'], $req->str('module') ?: null)]);
            });
            $router->add('POST', "/api/{$table}", static function (Request $req, ?array $user, array $_params) use ($table) {
                Response::json(['item' => Catalog::saveDesign($table, $user['orgId'], $req->body)], 201);
            });
            $router->add('PATCH', "/api/{$table}/:id", static function (Request $req, ?array $user, array $params) use ($table) {
                Response::json(['item' => Catalog::saveDesign($table, $user['orgId'], $req->body, $params['id'])]);
            });
            $router->add('DELETE', "/api/{$table}/:id", static function (Request $_req, ?array $user, array $params) use ($table) {
                Catalog::deleteDesign($table, $user['orgId'], $params['id']);
                Response::json(['ok' => true]);
            });
        }
    }
}
