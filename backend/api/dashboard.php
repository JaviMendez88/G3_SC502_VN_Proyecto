<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendResponse(['error' => 'Solo método GET permitido'], 405);
}

// Validar token
$token = validateToken();
$userId = getUserIdFromToken($token);

$action = $_GET['action'] ?? 'summary';

switch($action) {
    case 'summary':
        getDashboardSummary($userId);
        break;
        
    case 'monthly':
        getMonthlyData($userId);
        break;
        
    case 'categories':
        getCategoriesData($userId);
        break;
        
    default:
        sendResponse(['error' => 'Acción no válida'], 400);
}

function getUserIdFromToken($token) {
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    return intval($parts[0]);
}

function getDashboardSummary($userId) {
    $db = getDB();
    
    try {
        // Resumen total
        $stmt = $db->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto END), 0) as total_ingresos,
                COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto END), 0) as total_gastos,
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) as balance_total,
                COUNT(*) as total_movimientos
            FROM movements 
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $summary = $stmt->fetch();
        
        // Resumen del mes actual
        $stmt = $db->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto END), 0) as ingresos_mes,
                COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto END), 0) as gastos_mes,
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) as balance_mes
            FROM movements 
            WHERE user_id = ? 
            AND YEAR(fecha) = YEAR(CURDATE()) 
            AND MONTH(fecha) = MONTH(CURDATE())
        ");
        $stmt->execute([$userId]);
        $monthlyData = $stmt->fetch();
        
        // Últimos movimientos
        $stmt = $db->prepare("
            SELECT * FROM movements 
            WHERE user_id = ? 
            ORDER BY fecha DESC, created_at DESC 
            LIMIT 5
        ");
        $stmt->execute([$userId]);
        $recentMovements = $stmt->fetchAll();
        
        sendResponse([
    'success' => true,
    'data' => [
        'balance' => [
            'total_ingresos' => floatval($summary['total_ingresos']),
            'total_gastos' => floatval($summary['total_gastos']),
            'balance_total' => floatval($summary['balance_total']),
            'savings_rate' => $summary['total_ingresos'] > 0 ? 
                round((floatval($summary['balance_total']) / floatval($summary['total_ingresos'])) * 100, 1) : 0
        ],
        'recent_movements' => $recentMovements,
        'current_month_summary' => [
            'total_movements' => intval($summary['total_movimientos']),
            'recent_income' => floatval($monthlyData['ingresos_mes']),
            'recent_expenses' => floatval($monthlyData['gastos_mes']),
            'daily_average' => floatval($monthlyData['gastos_mes']) / max(1, date('j'))
        ],
        'monthly_stats' => [],
        'categories_stats' => [],
        'top_categories' => []
    ]
]);
        
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error al obtener resumen del dashboard'], 500);
    }
}

function getMonthlyData($userId) {
    $db = getDB();
    
    try {
        $months = $_GET['months'] ?? 12;
        
        $stmt = $db->prepare("
            SELECT 
                YEAR(fecha) as year,
                MONTH(fecha) as month,
                MONTHNAME(fecha) as month_name,
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto END), 0) as ingresos,
                COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto END), 0) as gastos,
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) as balance
            FROM movements 
            WHERE user_id = ? 
            AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY YEAR(fecha), MONTH(fecha)
            ORDER BY year DESC, month DESC
        ");
        $stmt->execute([$userId, $months]);
        $monthlyData = $stmt->fetchAll();
        
        sendResponse(['monthly_data' => $monthlyData]);
        
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error al obtener datos mensuales'], 500);
    }
}

function getCategoriesData($userId) {
    $db = getDB();
    
    try {
        // Gastos por categoría
        $stmt = $db->prepare("
            SELECT 
                categoria,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM movements 
            WHERE user_id = ? AND tipo = 'gasto'
            GROUP BY categoria
            ORDER BY total DESC
        ");
        $stmt->execute([$userId]);
        $expenseCategories = $stmt->fetchAll();
        
        // Ingresos por categoría
        $stmt = $db->prepare("
            SELECT 
                categoria,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM movements 
            WHERE user_id = ? AND tipo = 'ingreso'
            GROUP BY categoria
            ORDER BY total DESC
        ");
        $stmt->execute([$userId]);
        $incomeCategories = $stmt->fetchAll();
        
        sendResponse([
            'expense_categories' => $expenseCategories,
            'income_categories' => $incomeCategories
        ]);
        
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error al obtener datos de categorías'], 500);
    }
}
?>