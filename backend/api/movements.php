<?php
// movements.php - Manejo de movimientos financieros
require_once 'config.php';

// Función para obtener user ID desde token
function getUserIdFromToken($token) {
    // Decodificar token simple (ajusta según tu implementación)
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    return intval($parts[0]);
}

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    // Validar token para todas las operaciones
    $token = validateToken();
    $userId = getUserIdFromToken($token);

    // Router principal
    switch($method) {
        case 'GET':
            getMovements($userId);
            break;
            
        case 'POST':
            createMovement($userId, $input);
            break;
            
        case 'PUT':
            $movementId = $_GET['id'] ?? null;
            updateMovement($userId, $movementId, $input);
            break;
            
        case 'DELETE':
            $movementId = $_GET['id'] ?? null;
            deleteMovement($userId, $movementId);
            break;
            
        default:
            sendResponse(['error' => 'Método no permitido'], 405);
    }

} catch (Exception $e) {
    error_log("Error en movements.php: " . $e->getMessage());
    sendResponse(['error' => 'Error interno del servidor'], 500);
}

function getMovements($userId) {
    $db = getDB();
    
    try {
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);
        $tipo = $_GET['tipo'] ?? null;
        $categoria = $_GET['categoria'] ?? null;
        
        $where = "WHERE user_id = ?";
        $params = [$userId];
        
        if ($tipo) {
            $where .= " AND tipo = ?";
            $params[] = $tipo;
        }
        
        if ($categoria) {
            $where .= " AND categoria = ?";
            $params[] = $categoria;
        }
        
        // Query principal
        $stmt = $db->prepare("
            SELECT * FROM movements 
            $where 
            ORDER BY fecha DESC, created_at DESC 
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt->execute($params);
        $movements = $stmt->fetchAll();
        
        // Obtener total para paginación
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM movements $where");
        $countStmt->execute(array_slice($params, 0, -2));
        $total = $countStmt->fetch()['total'];
        
        sendResponse([
            'success' => true,
            'movements' => $movements,
            'total' => intval($total),
            'limit' => $limit,
            'offset' => $offset
        ]);
        
    } catch (PDOException $e) {
        error_log("Error getMovements: " . $e->getMessage());
        sendResponse(['error' => 'Error al obtener movimientos'], 500);
    }
}

function createMovement($userId, $data) {
    $db = getDB();
    
    // Validar datos requeridos
    if (!isset($data['fecha']) || !isset($data['tipo']) || 
        !isset($data['categoria']) || !isset($data['monto'])) {
        sendResponse(['error' => 'Datos incompletos'], 400);
    }
    
    // Validar tipo
    if (!in_array($data['tipo'], ['ingreso', 'gasto'])) {
        sendResponse(['error' => 'Tipo debe ser ingreso o gasto'], 400);
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO movements (user_id, fecha, tipo, categoria, monto, descripcion) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['fecha'],
            $data['tipo'],
            $data['categoria'],
            floatval($data['monto']),
            $data['descripcion'] ?? null
        ]);
        
        $movementId = $db->lastInsertId();
        
        sendResponse([
            'success' => true,
            'message' => 'Movimiento creado exitosamente',
            'movement_id' => $movementId
        ]);
        
    } catch (PDOException $e) {
        error_log("Error createMovement: " . $e->getMessage());
        sendResponse(['error' => 'Error al crear movimiento'], 500);
    }
}

function updateMovement($userId, $movementId, $data) {
    if (!$movementId) {
        sendResponse(['error' => 'ID de movimiento requerido'], 400);
    }
    
    $db = getDB();
    
    try {
        // Verificar que el movimiento pertenece al usuario
        $stmt = $db->prepare("SELECT id FROM movements WHERE id = ? AND user_id = ?");
        $stmt->execute([$movementId, $userId]);
        
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Movimiento no encontrado'], 404);
        }
        
        $stmt = $db->prepare("
            UPDATE movements 
            SET fecha = ?, tipo = ?, categoria = ?, monto = ?, descripcion = ?
            WHERE id = ? AND user_id = ?
        ");
        
        $stmt->execute([
            $data['fecha'],
            $data['tipo'],
            $data['categoria'],
            floatval($data['monto']),
            $data['descripcion'] ?? null,
            $movementId,
            $userId
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Movimiento actualizado exitosamente'
        ]);
        
    } catch (PDOException $e) {
        error_log("Error updateMovement: " . $e->getMessage());
        sendResponse(['error' => 'Error al actualizar movimiento'], 500);
    }
}

function deleteMovement($userId, $movementId) {
    if (!$movementId) {
        sendResponse(['error' => 'ID de movimiento requerido'], 400);
    }
    
    $db = getDB();
    
    try {
        $stmt = $db->prepare("DELETE FROM movements WHERE id = ? AND user_id = ?");
        $stmt->execute([$movementId, $userId]);
        
        if ($stmt->rowCount() === 0) {
            sendResponse(['error' => 'Movimiento no encontrado'], 404);
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Movimiento eliminado exitosamente'
        ]);
        
    } catch (PDOException $e) {
        error_log("Error deleteMovement: " . $e->getMessage());
        sendResponse(['error' => 'Error al eliminar movimiento'], 500);
    }
}
?>