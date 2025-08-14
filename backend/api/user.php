<?php
require_once '../config/database.php';
require_once '../models/User.php';
require_once '../utils/Auth.php';
require_once '../utils/Validator.php';
require_once '../utils/Logger.php';
require_once '../config/cors.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

// Validar token
$user_data = Auth::validateToken();
if (!$user_data) {
    exit(); // Auth::validateToken ya envió la respuesta de error
}

$user->id = $user_data->id;

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener información del usuario
        if ($user->getUserById()) {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "user" => array(
                    "id" => $user->id,
                    "nombre" => $user->nombre,
                    "apellidos" => $user->apellidos,
                    "email" => $user->email,
                    "created_at" => $user->created_at
                )
            ));
            Logger::apiRequest('/user', 'GET', $user->id);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Usuario no encontrado."));
            Logger::error('User not found', ['user_id' => $user->id]);
        }
        break;

    case 'PUT':
        // Actualizar información del usuario
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(array("message" => "Datos inválidos."));
            exit();
        }

        // Obtener datos actuales del usuario
        $user->getUserById();
        
        // Actualizar solo los campos proporcionados
        $user->nombre = $data->nombre ?? $user->nombre;
        $user->apellidos = $data->apellidos ?? $user->apellidos;

        // Validar nombres si fueron proporcionados
        if (isset($data->nombre)) {
            $nombre_validation = Validator::validateName($data->nombre, 'nombre');
            if ($nombre_validation !== true) {
                http_response_code(400);
                echo json_encode(array("message" => $nombre_validation));
                exit();
            }
        }

        if (isset($data->apellidos)) {
            $apellidos_validation = Validator::validateName($data->apellidos, 'apellidos');
            if ($apellidos_validation !== true) {
                http_response_code(400);
                echo json_encode(array("message" => $apellidos_validation));
                exit();
            }
        }

        if ($user->update()) {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Usuario actualizado exitosamente.",
                "user" => array(
                    "id" => $user->id,
                    "nombre" => $user->nombre,
                    "apellidos" => $user->apellidos,
                    "email" => $user->email
                )
            ));
            Logger::info('User updated', ['user_id' => $user->id]);
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Error al actualizar usuario."));
            Logger::error('Failed to update user', ['user_id' => $user->id]);
        }
        break;

    case 'DELETE':
        // Eliminar cuenta de usuario (funcionalidad futura)
        http_response_code(501);
        echo json_encode(array("message" => "Funcionalidad no implementada."));
        break;

    default:
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido."));
        break;
}
?>