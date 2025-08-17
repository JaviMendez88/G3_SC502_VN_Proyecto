<?php
// categories.php - Manejo de categorías
require_once 'config.php';

// Función para obtener user ID desde token
function getUserIdFromToken($token)
{
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
    switch ($method) {
        case 'GET':
            getCategories();
            break;

        case 'POST':
            createCategory($userId, $input);
            break;

        case 'PUT':
            $categoryId = $_GET['id'] ?? null;
            updateCategory($userId, $categoryId, $input);
            break;

        case 'DELETE':
            $categoryId = $_GET['id'] ?? null;
            deleteCategory($userId, $categoryId, $input); 
            break;

        default:
            sendResponse(['error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    error_log("Error en categories.php: " . $e->getMessage());
    sendResponse(['error' => 'Error interno del servidor'], 500);
}

function getCategories()
{
    $db = getDB();

    try {
        // Obtener todas las categorías predefinidas
        $stmt = $db->prepare("
            SELECT nombre, tipo, color, icon 
            FROM categories 
            ORDER BY tipo, nombre
        ");

        $stmt->execute();
        $categories = $stmt->fetchAll();

        // Organizar por tipo
        $gastos = [];
        $ingresos = [];
        $all = [];

        foreach ($categories as $category) {
            $all[] = $category;
            if ($category['tipo'] === 'gasto') {
                $gastos[] = $category;
            } else {
                $ingresos[] = $category;
            }
        }

        sendResponse([
            'success' => true,
            'data' => [
                'all' => $all,
                'gastos' => $gastos,
                'ingresos' => $ingresos
            ],
            'total' => count($all)
        ]);
    } catch (PDOException $e) {
        error_log("Error getCategories: " . $e->getMessage());
        sendResponse(['error' => 'Error al obtener categorías'], 500);
    }
}

function createCategory($userId, $data)
{
    $db = getDB();

    // Validar datos requeridos
    if (!isset($data['nombre']) || !isset($data['tipo'])) {
        sendResponse(['error' => 'Nombre y tipo son requeridos'], 400);
    }

    // Validar tipo
    if (!in_array($data['tipo'], ['ingreso', 'gasto'])) {
        sendResponse(['error' => 'Tipo debe ser ingreso o gasto'], 400);
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO categories (nombre, tipo, color, icon) 
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([
            $data['nombre'],
            $data['tipo'],
            $data['color'] ?? '#007bff',
            $data['icon'] ?? 'fas fa-circle'
        ]);

        $categoryId = $db->lastInsertId();

        sendResponse([
            'success' => true,
            'message' => 'Categoría creada exitosamente',
            'category_id' => $categoryId
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            sendResponse(['error' => 'Esta categoría ya existe'], 400);
        } else {
            error_log("Error createCategory: " . $e->getMessage());
            sendResponse(['error' => 'Error al crear categoría'], 500);
        }
    }
}

function updateCategory($userId, $categoryId, $data)
{
    if (!$categoryId) {
        sendResponse(['error' => 'ID de categoría requerido'], 400);
    }

    $db = getDB();

    try {
        // Verificar que la categoría existe
        $stmt = $db->prepare("SELECT id FROM categories WHERE id = ?");
        $stmt->execute([$categoryId]);

        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Categoría no encontrada'], 404);
        }

        $stmt = $db->prepare("
            UPDATE categories 
            SET nombre = ?, tipo = ?, color = ?, icon = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $data['nombre'],
            $data['tipo'],
            $data['color'] ?? '#007bff',
            $data['icon'] ?? 'fas fa-circle',
            $categoryId
        ]);

        sendResponse([
            'success' => true,
            'message' => 'Categoría actualizada exitosamente'
        ]);
    } catch (PDOException $e) {
        error_log("Error updateCategory: " . $e->getMessage());
        sendResponse(['error' => 'Error al actualizar categoría'], 500);
    }
}

function deleteCategory($userId, $categoryId, $input)
{
    $db = getDB();

    try {
        // Debug temporal
        error_log("DELETE - categoryId: " . ($categoryId ?? 'null'));
        error_log("DELETE - input: " . print_r($input, true));

        if ($categoryId) {
            // Delete por ID (método query string)
            $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$categoryId]);
        } else if (isset($input['nombre'])) {
            // Delete por nombre (método JSON body)
            error_log("Eliminando por nombre: " . $input['nombre']);
            $stmt = $db->prepare("DELETE FROM categories WHERE nombre = ?");
            $stmt->execute([$input['nombre']]);
        } else {
            sendResponse(['error' => 'ID o nombre de categoría requerido'], 400);
            return;
        }

        $deletedRows = $stmt->rowCount();
        error_log("Filas eliminadas: " . $deletedRows);

        if ($deletedRows === 0) {
            sendResponse(['error' => 'Categoría no encontrada'], 404);
            return;
        }

        sendResponse([
            'success' => true,
            'message' => 'Categoría eliminada exitosamente',
            'deleted_rows' => $deletedRows
        ]);
    } catch (PDOException $e) {
        error_log("Error deleteCategory: " . $e->getMessage());
        sendResponse(['error' => 'Error al eliminar categoría'], 500);
    }
}
