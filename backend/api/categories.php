<?php
// categories.php - Manejo de categorías
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendResponse(['error' => 'Solo método GET permitido'], 405);
}

try {
    $db = getDB();
    $tipo = $_GET['tipo'] ?? null;
    
    $where = "";
    $params = [];
    
    if ($tipo && in_array($tipo, ['ingreso', 'gasto'])) {
        $where = "WHERE tipo = ?";
        $params[] = $tipo;
    }
    
    $stmt = $db->prepare("
        SELECT id, nombre, tipo, color, icon 
        FROM categories 
        $where 
        ORDER BY tipo, nombre
    ");
    $stmt->execute($params);
    $categories = $stmt->fetchAll();
    
    sendResponse(['categories' => $categories]);
    
} catch (PDOException $e) {
    sendResponse(['error' => 'Error al obtener categorías'], 500);
}
?>