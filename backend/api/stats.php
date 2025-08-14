<?php
require_once '../config/database.php';
require_once '../models/Movement.php';
require_once '../utils/Auth.php';
require_once '../utils/Validator.php';
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

// Validar token
$user_data = Auth::validateToken();
if (!$user_data) {
    exit(); // Auth::validateToken ya envió la respuesta de error
}

$movement->user_id = $user_data->id;

// Obtener parámetros
$type = $_GET['type'] ?? 'general';
$year = $_GET['year'] ?? date('Y');
$month = $_GET['month'] ?? null;

try {
    switch ($type) {
        case 'monthly':
            // Estadísticas mensuales detalladas
            $year_validation = Validator::validateId($year, 'año');
            if ($year_validation !== true) {
                http_response_code(400);
                echo json_encode(array('message' => $year_validation));
                exit();
            }

            $stmt = $movement->getMonthlyStats($year);
            $monthly_stats = array();
            
            // Inicializar todos los meses
            for ($i = 1; $i <= 12; $i++) {
                $monthly_stats[] = array(
                    'mes' => $i,
                    'mes_nombre' => date('F', mktime(0, 0, 0, $i, 1)),
                    'mes_nombre_es' => array(
                        1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
                        5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
                        9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
                    )[$i],
                    'ingresos' => 0,
                    'gastos' => 0,
                    'balance' => 0,
                    'movimientos' => 0
                );
            }
            
            // Llenar con datos reales
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $mes = intval($row['mes']) - 1;
                $ingresos = floatval($row['ingresos']);
                $gastos = floatval($row['gastos']);
                
                $monthly_stats[$mes]['ingresos'] = $ingresos;
                $monthly_stats[$mes]['gastos'] = $gastos;
                $monthly_stats[$mes]['balance'] = $ingresos - $gastos;
                
                // Contar movimientos del mes
                $count_query = "SELECT COUNT(*) as count FROM movements 
                               WHERE user_id = ? AND YEAR(fecha) = ? AND MONTH(fecha) = ?";
                $count_stmt = $db->prepare($count_query);
                $count_stmt->execute([$movement->user_id, $year, $row['mes']]);
                $count_result = $count_stmt->fetch(PDO::FETCH_ASSOC);
                $monthly_stats[$mes]['movimientos'] = intval($count_result['count']);
            }
            
            $response_data = $monthly_stats;
            break;

        case 'categories':
            // Estadísticas detalladas por categorías
            $stmt = $movement->getCategoriesStats();
            $categories_stats = array();
            $total_ingresos = 0;
            $total_gastos = 0;
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $total = floatval($row['total']);
                if ($row['tipo'] === 'ingreso') {
                    $total_ingresos += $total;
                } else {
                    $total_gastos += $total;
                }
            }
            
            // Reset para segunda pasada
            $stmt = $movement->getCategoriesStats();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $total = floatval($row['total']);
                $tipo = $row['tipo'];
                $total_tipo = $tipo === 'ingreso' ? $total_ingresos : $total_gastos;
                $porcentaje = $total_tipo > 0 ? ($total / $total_tipo) * 100 : 0;
                
                $categories_stats[] = array(
                    'categoria' => $row['categoria'],
                    'tipo' => $tipo,
                    'total' => $total,
                    'cantidad' => intval($row['cantidad']),
                    'porcentaje' => round($porcentaje, 2),
                    'promedio' => round($total / intval($row['cantidad']), 2)
                );
            }
            
            $response_data = array(
                'categories' => $categories_stats,
                'totals' => array(
                    'total_ingresos' => $total_ingresos,
                    'total_gastos' => $total_gastos
                )
            );
            break;

        case 'trends':
            // Tendencias de los últimos 6 meses
            $query = "SELECT 
                        DATE_FORMAT(fecha, '%Y-%m') as periodo,
                        YEAR(fecha) as año,
                        MONTH(fecha) as mes,
                        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
                        SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
                        COUNT(*) as total_movimientos
                      FROM movements 
                      WHERE user_id = ? 
                      AND fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
                      ORDER BY periodo";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$movement->user_id]);
            
            $trends = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $ingresos = floatval($row['ingresos']);
                $gastos = floatval($row['gastos']);
                
                $trends[] = array(
                    'periodo' => $row['periodo'],
                    'año' => intval($row['año']),
                    'mes' => intval($row['mes']),
                    'ingresos' => $ingresos,
                    'gastos' => $gastos,
                    'balance' => $ingresos - $gastos,
                    'total_movimientos' => intval($row['total_movimientos'])
                );
            }
            
            $response_data = $trends;
            break;

        case 'comparison':
            // Comparación entre períodos
            $current_year = date('Y');
            $previous_year = $current_year - 1;
            
            // Datos del año actual
            $current_stmt = $movement->getMonthlyStats($current_year);
            $current_data = array();
            while ($row = $current_stmt->fetch(PDO::FETCH_ASSOC)) {
                $current_data[intval($row['mes'])] = array(
                    'ingresos' => floatval($row['ingresos']),
                    'gastos' => floatval($row['gastos'])
                );
            }
            
            // Datos del año anterior
            $previous_stmt = $movement->getMonthlyStats($previous_year);
            $previous_data = array();
            while ($row = $previous_stmt->fetch(PDO::FETCH_ASSOC)) {
                $previous_data[intval($row['mes'])] = array(
                    'ingresos' => floatval($row['ingresos']),
                    'gastos' => floatval($row['gastos'])
                );
            }
            
            $comparison = array();
            for ($i = 1; $i <= 12; $i++) {
                $current = $current_data[$i] ?? array('ingresos' => 0, 'gastos' => 0);
                $previous = $previous_data[$i] ?? array('ingresos' => 0, 'gastos' => 0);
                
                $comparison[] = array(
                    'mes' => $i,
                    'current_year' => $current_year,
                    'previous_year' => $previous_year,
                    'current' => $current,
                    'previous' => $previous,
                    'growth' => array(
                        'ingresos' => $previous['ingresos'] > 0 ? 
                            round((($current['ingresos'] - $previous['ingresos']) / $previous['ingresos']) * 100, 2) : 0,
                        'gastos' => $previous['gastos'] > 0 ? 
                            round((($current['gastos'] - $previous['gastos']) / $previous['gastos']) * 100, 2) : 0
                    )
                );
            }
            
            $response_data = $comparison;
            break;

        default:
            // Estadísticas generales
            $balance = $movement->getBalance();
            $recent_summary = $movement->getRecentSummary(30);
            
            $response_data = array(
                'balance_total' => array(
                    'total_ingresos' => floatval($balance['total_ingresos'] ?? 0),
                    'total_gastos' => floatval($balance['total_gastos'] ?? 0),
                    'balance' => floatval($balance['balance'] ?? 0)
                ),
                'mes_actual' => array(
                    'total_movements' => intval($recent_summary['total_movements'] ?? 0),
                    'recent_income' => floatval($recent_summary['recent_income'] ?? 0),
                    'recent_expenses' => floatval($recent_summary['recent_expenses'] ?? 0),
                    'avg_income' => floatval($recent_summary['avg_income'] ?? 0),
                    'avg_expense' => floatval($recent_summary['avg_expense'] ?? 0)
                )
            );
            break;
    }

    http_response_code(200);
    echo json_encode(array(
        'success' => true,
        'type' => $type,
        'data' => $response_data,
        'generated_at' => date('Y-m-d H:i:s')
    ));
    
    Logger::apiRequest('/stats', 'GET', $user_data->id);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Error interno del servidor.'
    ));
    
    Logger::error('Stats error', [
        'user_id' => $user_data->id,
        'type' => $type,
        'error' => $e->getMessage()
    ]);
}
?>