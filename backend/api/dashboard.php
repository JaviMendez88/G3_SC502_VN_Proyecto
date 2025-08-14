<?php
require_once '../config/database.php';
require_once '../models/Movement.php';
require_once '../models/User.php';
require_once '../utils/Auth.php';
require_once '../utils/Logger.php';
require_once '../config/cors.php';

setCorsHeaders();

// Solo permitir GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("message" => "Método no permitido."));
    exit();
}

$database = new Database();
$db = $database->getConnection();
$movement = new Movement($db);
$user = new User($db);

// Validar token
$user_data = Auth::validateToken();
if (!$user_data) {
    exit(); // Auth::validateToken ya envió la respuesta de error
}

$movement->user_id = $user_data->id;
$user->id = $user_data->id;

try {
    // Obtener balance general
    $balance = $movement->getBalance();
    
    // Obtener estadísticas por categorías
    $categories_stmt = $movement->getCategoriesStats();
    $categories = array();
    while ($row = $categories_stmt->fetch(PDO::FETCH_ASSOC)) {
        $categories[] = array(
            'categoria' => $row['categoria'],
            'tipo' => $row['tipo'],
            'total' => floatval($row['total']),
            'cantidad' => intval($row['cantidad'])
        );
    }

    // Obtener estadísticas mensuales del año actual
    $year = date('Y');
    $monthly_stmt = $movement->getMonthlyStats($year);
    $monthly = array();
    
    // Inicializar todos los meses con 0
    for ($i = 1; $i <= 12; $i++) {
        $monthly[] = array(
            'mes' => $i,
            'mes_nombre' => date('F', mktime(0, 0, 0, $i, 1)),
            'ingresos' => 0,
            'gastos' => 0,
            'balance' => 0
        );
    }
    
    // Llenar con datos reales
    while ($row = $monthly_stmt->fetch(PDO::FETCH_ASSOC)) {
        $mes = intval($row['mes']) - 1; // Array es 0-indexado
        $monthly[$mes]['ingresos'] = floatval($row['ingresos']);
        $monthly[$mes]['gastos'] = floatval($row['gastos']);
        $monthly[$mes]['balance'] = floatval($row['ingresos']) - floatval($row['gastos']);
    }

    // Obtener últimos movimientos (últimos 10)
    $recent_stmt = $movement->getByUserId(10, 0);
    $recent_movements = array();
    while ($row = $recent_stmt->fetch(PDO::FETCH_ASSOC)) {
        $recent_movements[] = array(
            'id' => intval($row['id']),
            'fecha' => $row['fecha'],
            'tipo' => $row['tipo'],
            'categoria' => $row['categoria'],
            'monto' => floatval($row['monto']),
            'descripcion' => $row['descripcion'],
            'created_at' => $row['created_at']
        );
    }

    // Obtener resumen del mes actual
    $current_month_summary = $movement->getRecentSummary(30);
    
    // Obtener categorías más utilizadas
    $top_categories_stmt = $movement->getTopCategories(5);
    $top_categories = array();
    while ($row = $top_categories_stmt->fetch(PDO::FETCH_ASSOC)) {
        $top_categories[] = array(
            'categoria' => $row['categoria'],
            'count' => intval($row['count']),
            'total' => floatval($row['total'])
        );
    }

    // Calcular algunas métricas adicionales
    $total_ingresos = floatval($balance['total_ingresos'] ?? 0);
    $total_gastos = floatval($balance['total_gastos'] ?? 0);
    $balance_total = $total_ingresos - $total_gastos;
    
    // Calcular tasa de ahorro
    $savings_rate = $total_ingresos > 0 ? (($balance_total / $total_ingresos) * 100) : 0;
    
    // Promedio de gastos diarios (últimos 30 días)
    $recent_expenses = floatval($current_month_summary['recent_expenses'] ?? 0);
    $daily_average = $recent_expenses / 30;

    // Preparar respuesta
    $dashboard_data = array(
        'balance' => array(
            'total_ingresos' => $total_ingresos,
            'total_gastos' => $total_gastos,
            'balance_total' => $balance_total,
            'savings_rate' => round($savings_rate, 2)
        ),
        'monthly_stats' => $monthly,
        'categories_stats' => $categories,
        'recent_movements' => $recent_movements,
        'current_month_summary' => array(
            'total_movements' => intval($current_month_summary['total_movements'] ?? 0),
            'recent_income' => floatval($current_month_summary['recent_income'] ?? 0),
            'recent_expenses' => $recent_expenses,
            'daily_average' => round($daily_average, 2),
            'avg_income' => floatval($current_month_summary['avg_income'] ?? 0),
            'avg_expense' => floatval($current_month_summary['avg_expense'] ?? 0)
        ),
        'top_categories' => $top_categories,
        'user' => array(
            'id' => $user_data->id,
            'nombre' => $user_data->nombre,
            'apellidos' => $user_data->apellidos,
            'email' => $user_data->email
        ),
        'generated_at' => date('Y-m-d H:i:s')
    );

    http_response_code(200);
    echo json_encode(array(
        'success' => true,
        'data' => $dashboard_data
    ));
    
    Logger::apiRequest('/dashboard', 'GET', $user_data->id);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Error interno del servidor.'
    ));
    
    Logger::error('Dashboard error', [
        'user_id' => $user_data->id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>