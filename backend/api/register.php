<?php
require_once '../config/database.php';
require_once '../models/User.php';
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
    Logger::validationError('Invalid JSON', ['raw_input' => file_get_contents("php://input")]);
    exit();
}

// Convertir objeto a array para validación
$user_data = [
    'nombre' => $data->nombre ?? '',
    'apellidos' => $data->apellidos ?? '',
    'email' => $data->email ?? '',
    'password' => $data->password ?? ''
];

// Validar datos
$validation = Validator::validateUserRegistration($user_data);
if ($validation !== true) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Datos de registro inválidos.",
        "errors" => $validation
    ));
    Logger::validationError('User registration validation failed', [
        'email' => $user_data['email'],
        'errors' => $validation
    ]);
    exit();
}

// Verificar si el email ya existe
$user->email = $user_data['email'];
if ($user->emailExists()) {
    http_response_code(400);
    echo json_encode(array("message" => "El email ya está registrado."));
    Logger::warning('Registration attempt with existing email', ['email' => $user_data['email']]);
    exit();
}

// Crear usuario
$user->nombre = $user_data['nombre'];
$user->apellidos = $user_data['apellidos'];
$user->password = $user_data['password'];

if ($user->create()) {
    http_response_code(201);
    echo json_encode(array(
        "success" => true,
        "message" => "Usuario registrado exitosamente."
    ));
    Logger::userRegistration($user_data['email'], true);
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Error al registrar usuario. Inténtalo de nuevo."));
    Logger::error('Failed to create user', ['email' => $user_data['email']]);
}
?>