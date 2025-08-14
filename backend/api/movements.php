<?php
require_once '../config/database.php';
require_once '../models/Movement.php';
require_once '../utils/Auth.php';
require_once '../utils/Validator.php';
require_once '../utils/Logger.php';
require_once '../config/cors.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();
$movement = new Movement($db);

// Validar token
$user_data = Auth::validateToken();
if (!$user_data) {
    exit(); // Auth::validateToken ya envió la respuesta de error
}

$movement->user_id = $user_data->id;

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // Crear movimiento
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(array("message" => "Datos inválidos."));
            exit();
        }

        // Convertir objeto a array para validación
        $movement_data = [
            'fecha' => $data->fecha ?? '',
            'tipo' => $data->tipo ?? '',
            'categoria' => $data->categoria ?? '',
            'monto' => $data->monto ?? '',
            'descripcion' => $data->descripcion ?? ''
        ];

        // Validar datos del movimiento
        $validation = Validator::validateMovement($movement_data);
        if ($validation !== true) {
            http_response_code(400);
            echo json_encode(array(
                "message" => "Datos del movimiento inválidos.",
                "errors" => $validation
            ));
            Logger::validationError('Movement validation failed', [
                'user_id' => $movement->user_id,
                'data' => $movement_data,
                'errors' => $validation
            ]);
            exit();
        }

        // Asignar datos al movimiento
        $movement->fecha = $movement_data['fecha'];
        $movement->tipo = $movement_data['tipo'];
        $movement->categoria = $movement_data['categoria'];
        $movement->monto = $movement_data['monto'];
        $movement->descripcion = $movement_data['descripcion'];

        if ($movement->create()) {
            http_response_code(201);
            echo json_encode(array(
                "success" => true,
                "message" => "Movimiento registrado exitosamente."
            ));
            Logger::info('Movement created', [
                'user_id' => $movement->user_id,
                'tipo' => $movement->tipo,
                'monto' => $movement->monto
            ]);
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Error al registrar movimiento."));
            Logger::error('Failed to create movement', ['user_id' => $movement->user_id]);
        }
        break;

    case 'GET':
        // Obtener movimientos
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        
        // Validar paginación
        $pagination_validation = Validator::validatePagination($limit, $offset);
        if ($pagination_validation !== true) {
            http_response_code(400);
            echo json_encode(array(
                "message" => "Parámetros de paginación inválidos.",
                "errors" => $pagination_validation
            ));
            exit();
        }

        $stmt = $movement->getByUserId($limit, $offset);
        $num = $stmt->rowCount();

        if ($num >= 0) {
            $movements_arr = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $movements_arr[] = array(
                    "id" => $row['id'],
                    "fecha" => $row['fecha'],
                    "tipo" => $row['tipo'],
                    "categoria" => $row['categoria'],
                    "monto" => floatval($row['monto']),
                    "descripcion" => $row['descripcion'],
                    "created_at" => $row['created_at']
                );
            }

            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "data" => $movements_arr,
                "total" => $num,
                "limit" => $limit,
                "offset" => $offset
            ));
            Logger::apiRequest('/movements', 'GET', $movement->user_id);
        } else {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "data" => array(),
                "total" => 0
            ));
        }
        break;

    case 'PUT':
        // Actualizar movimiento
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(array("message" => "ID del movimiento requerido."));
            exit();
        }

        $id_validation = Validator::validateId($_GET['id'], 'ID del movimiento');
        if ($id_validation !== true) {
            http_response_code(400);
            echo json_encode(array("message" => $id_validation));
            exit();
        }

        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(array("message" => "Datos inválidos."));
            exit();
        }

        $movement_data = [
            'fecha' => $data->fecha ?? '',
            'tipo' => $data->tipo ?? '',
            'categoria' => $data->categoria ?? '',
            'monto' => $data->monto ?? '',
            'descripcion' => $data->descripcion ?? ''
        ];

        $validation = Validator::validateMovement($movement_data);
        if ($validation !== true) {
            http_response_code(400);
            echo json_encode(array(
                "message" => "Datos del movimiento inválidos.",
                "errors" => $validation
            ));
            exit();
        }

        $movement->id = $_GET['id'];
        $movement->fecha = $movement_data['fecha'];
        $movement->tipo = $movement_data['tipo'];
        $movement->categoria = $movement_data['categoria'];
        $movement->monto = $movement_data['monto'];
        $movement->descripcion = $movement_data['descripcion'];

        if ($movement->update()) {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Movimiento actualizado exitosamente."
            ));
            Logger::info('Movement updated', [
                'user_id' => $movement->user_id,
                'movement_id' => $movement->id
            ]);
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Error al actualizar movimiento."));
        }
        break;

    case 'DELETE':
        // Eliminar movimiento
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(array("message" => "ID del movimiento requerido."));
            exit();
        }

        $id_validation = Validator::validateId($_GET['id'], 'ID del movimiento');
        if ($id_validation !== true) {
            http_response_code(400);
            echo json_encode(array("message" => $id_validation));
            exit();
        }

        $movement->id = $_GET['id'];
        if ($movement->delete()) {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Movimiento eliminado exitosamente."
            ));
            Logger::info('Movement deleted', [
                'user_id' => $movement->user_id,
                'movement_id' => $movement->id
            ]);
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Error al eliminar movimiento."));
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido."));
        break;
}
?>