<?php
require_once '../config/database.php';
require_once '../models/User.php';
require_once '../utils/Auth.php';
require_once '../utils/Validator.php';
require_once '../utils/Logger.php';
require_once '../config/cors.php';

setCorsHeaders();

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Método no permitido."));
    exit();
}

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

// Obtener datos JSON
$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    http_response_code(400);
    echo json_encode(array("message" => "Datos inválidos."));
    exit();
}

// Convertir objeto a array para validación
$login_data = [
    'email' => $data->email ?? '',
    'password' => $data->password ?? ''
];

// Validar datos de login
$validation = Validator::validateUserLogin($login_data);
if ($validation !== true) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Datos de login inválidos.",
        "errors" => $validation
    ));
    Logger::validationError('Login validation failed', [
        'email' => $login_data['email'],
        'errors' => $validation
    ]);
    exit();
}

// Intentar login
$user->email = $login_data['email'];

if ($user->emailExists() && password_verify($login_data['password'], $user->password)) {
    // Login exitoso
    $user_data = [
        'id' => $user->id,
        'nombre' => $user->nombre,
        'apellidos' => $user->apellidos,
        'email' => $user->email
    ];

    $token = Auth::generateToken($user_data);

    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "message" => "Login exitoso.",
        "token" => $token,
        "user" => $user_data
    ));
    
    Logger::loginAttempt($login_data['email'], true);
} else {
    // Login fallido
    http_response_code(401);
    echo json_encode(array(
        "success" => false,
        "message" => "Credenciales incorrectas."
    ));
    
    Logger::loginAttempt($login_data['email'], false);
}
?>