<?php

declare(strict_types=1);

namespace Softify\Kernel;

final class Router
{
    /** @var list<array{method:string,pattern:string,auth:bool,handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $path, callable $handler, bool $auth = true): void
    {
        $pattern = preg_replace('#:([a-zA-Z_]+)#', '(?P<$1>[^/]+)', $path) ?? $path;
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => '#^' . $pattern . '$#',
            'auth' => $auth,
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): mixed
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }
            if (!preg_match($route['pattern'], $request->path, $matches)) {
                continue;
            }
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            $user = null;
            if ($route['auth']) {
                $user = Auth::user($request->token);
                if ($user === null) {
                    Response::error('Unauthorized', 401);
                }
            }
            return ($route['handler'])($request, $user, $params);
        }
        Response::error('Not found', 404);
    }
}
