<?php
// Copia este archivo como env.php y configura tus variables

return [
    'database' => [
        'host' => 'localhost',
        'name' => 'fidefinance',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4'
    ],
    'jwt' => [
        'secret_key' => 'tu_clave_secreta_muy_segura_aqui_2024_cambiar_en_produccion',
        'expiration_hours' => 24
    ],
    'app' => [
        'name' => 'FideFinance',
        'version' => '1.0.0',
        'debug' => true, // Cambiar a false en producción
        'url' => 'http://localhost/tu-proyecto/backend'
    ],
    'security' => [
        'rate_limit' => 100, // requests por hora por IP
        'max_login_attempts' => 5
    ]
];
?>