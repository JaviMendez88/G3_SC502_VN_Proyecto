<?php
require_once '../config/database.php';
// require_once '../utils/Auth.php';
require_once '../utils/Validator.php';
require_once '../utils/Logger.php';
require_once '../config/cors.php';

setCorsHeaders();

// Solo permitir GET por ahora
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("message" => "Método no permitido."));
    exit();
}

$database = new Database();
$db = $database->getConnection();

 Validar token
$user_data = Auth::validateToken();
if (!$user_data) {
    exit(); // Auth::validateToken ya envió la respuesta de error
}

try {
    // Obtener parámetros de consulta
    $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : null;
    
    // Validar tipo si se proporciona
    if ($tipo && !in_array($tipo, ['ingreso', 'gasto'])) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'message' => "Tipo inválido. Debe ser 'ingreso' o 'gasto'."
        ));
        exit();
    }

    // Construir consulta
    $query = "SELECT id, nombre, tipo, color, icon FROM categories";
    $params = array();
    
    if ($tipo) {
        $query .= " WHERE tipo = ?";
        $params[] = $tipo;
    }
    
    $query .= " ORDER BY nombre ASC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $categories = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categories[] = array(
            'id' => intval($row['id']),
            'nombre' => $row['nombre'],
            'tipo' => $row['tipo'],
            'color' => $row['color'],
            'icon' => $row['icon']
        );
    }

    // Agrupar por tipo para mejor organización
    $categorized = array(
        'ingreso' => array(),
        'gasto' => array(),
        'all' => $categories
    );

    foreach ($categories as $category) {
        $categorized[$category['tipo']][] = $category;
    }

    // Si se pidió un tipo específico, devolver solo ese
    if ($tipo) {
        $response_data = $categorized[$tipo];
    } else {
        $response_data = $categorized;
    }

    http_response_code(200);
    echo json_encode(array(
        'success' => true,
        'data' => $response_data,
        'total' => count($categories),
        'filtered_by' => $tipo
    ));
    
    Logger::apiRequest('/categories', 'GET', $user_data->id);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Error interno del servidor.'
    ));
    
    Logger::error('Categories error', [
        'user_id' => $user_data->id,
        'error' => $e->getMessage()
    ]);
}
?>