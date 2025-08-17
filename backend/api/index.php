<?php
header('Content-Type: application/json; charset=utf-8');

$routes = [
    'API FideFinance v1.0' => 'Backend simple para gestión financiera personal',
    'endpoints' => [
        'POST /api/auth?action=register' => 'Registrar nuevo usuario',
        'POST /api/auth?action=login' => 'Iniciar sesión',
        'GET /api/movements' => 'Obtener movimientos (requiere token)',
        'POST /api/movements' => 'Crear movimiento (requiere token)',
        'PUT /api/movements?id=X' => 'Actualizar movimiento (requiere token)',
        'DELETE /api/movements?id=X' => 'Eliminar movimiento (requiere token)',
        'GET /api/dashboard?action=summary' => 'Resumen del dashboard (requiere token)',
        'GET /api/dashboard?action=monthly' => 'Datos mensuales (requiere token)',
        'GET /api/dashboard?action=categories' => 'Datos por categorías (requiere token)',
        'GET /api/categories' => 'Obtener todas las categorías',
        'GET /api/categories?tipo=ingreso' => 'Obtener categorías de ingresos',
        'GET /api/categories?tipo=gasto' => 'Obtener categorías de gastos'
    ],
    'authentication' => [
        'method' => 'Bearer Token',
        'header' => 'Authorization: Bearer [token]',
        'note' => 'El token se obtiene al hacer login'
    ],
    'example_requests' => [
        'register' => [
            'url' => 'POST /api/auth?action=register',
            'body' => [
                'nombre' => 'Juan',
                'apellidos' => 'Pérez',
                'email' => 'juan@example.com',
                'password' => 'mi_password'
            ]
        ],
        'login' => [
            'url' => 'POST /api/auth?action=login',
            'body' => [
                'email' => 'juan@example.com',
                'password' => 'mi_password'
            ]
        ],
        'create_movement' => [
            'url' => 'POST /api/movements',
            'headers' => ['Authorization: Bearer [token]'],
            'body' => [
                'fecha' => '2025-08-15',
                'tipo' => 'gasto',
                'categoria' => 'Alimentación',
                'monto' => 25.50,
                'descripcion' => 'Almuerzo'
            ]
        ]
    ]
];

echo json_encode($routes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>