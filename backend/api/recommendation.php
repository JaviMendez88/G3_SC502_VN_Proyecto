<?php
require_once '../config/database.php';
require_once '../models/Movement.php';
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

// Validar token
$user_data = Auth::validateToken();
if (!$user_data) {
    exit(); // Auth::validateToken ya envió la respuesta de error
}

$movement->user_id = $user_data->id;

class RecommendationEngine {
    private $db;
    private $user_id;
    private $movement;

    public function __construct($database, $userId, $movementModel) {
        $this->db = $database;
        $this->user_id = $userId;
        $this->movement = $movementModel;
    }

    public function generateRecommendations() {
        $recommendations = array();

        // Analizar balance
        $balance_recs = $this->analyzeBalance();
        $recommendations = array_merge($recommendations, $balance_recs);

        // Analizar gastos por categoría
        $category_recs = $this->analyzeCategorySpending();
        $recommendations = array_merge($recommendations, $category_recs);

        // Analizar tendencias
        $trend_recs = $this->analyzeTrends();
        $recommendations = array_merge($recommendations, $trend_recs);

        // Recomendaciones de ahorro
        $saving_recs = $this->generateSavingRecommendations();
        $recommendations = array_merge($recommendations, $saving_recs);

        // Recomendaciones de frecuencia
        $frequency_recs = $this->analyzeFrequency();
        $recommendations = array_merge($recommendations, $frequency_recs);

        return $recommendations;
    }

    private function analyzeBalance() {
        $query = "SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
                  FROM movements 
                  WHERE user_id = ? 
                  AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([$this->user_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $recommendations = array();
        $ingresos = floatval($result['ingresos'] ?? 0);
        $gastos = floatval($result['gastos'] ?? 0);
        $balance = $ingresos - $gastos;

        if ($balance < 0) {
            $recommendations[] = array(
                'tipo' => 'alerta',
                'titulo' => 'Balance Negativo Detectado',
                'mensaje' => sprintf('Tus gastos (₡%.2f) han superado tus ingresos (₡%.2f) en los últimos 30 días por ₡%.2f. Es importante revisar y reducir gastos innecesarios.', 
                                   $gastos, $ingresos, abs($balance)),
                'prioridad' => 'alta',
                'icono' => 'fas fa-exclamation-triangle',
                'accion' => 'Revisar gastos del último mes'
            );
        } elseif ($ingresos > 0 && ($balance / $ingresos) < 0.1) {
            $savings_rate = ($balance / $ingresos) * 100;
            $recommendations[] = array(
                'tipo' => 'advertencia',
                'titulo' => 'Capacidad de Ahorro Limitada',
                'mensaje' => sprintf('Solo estás ahorrando el %.1f%% de tus ingresos. Intenta alcanzar al menos un 20%% para tener una mejor salud financiera.', $savings_rate),
                'prioridad' => 'media',
                'icono' => 'fas fa-chart-line',
                'accion' => 'Identificar gastos reducibles'
            );
        } elseif ($ingresos > 0) {
            $savings_rate = ($balance / $ingresos) * 100;
            if ($savings_rate >= 20) {
                $recommendations[] = array(
                    'tipo' => 'felicitacion',
                    'titulo' => '¡Excelente Capacidad de Ahorro!',
                    'mensaje' => sprintf('Estás ahorrando el %.1f%% de tus ingresos. ¡Mantén este buen hábito! Considera invertir parte de estos ahorros.', $savings_rate),
                    'prioridad' => 'baja',
                    'icono' => 'fas fa-trophy',
                    'accion' => 'Explorar opciones de inversión'
                );
            }
        }

        return $recommendations;
    }

    private function analyzeCategorySpending() {
        $query = "SELECT categoria, SUM(monto) as total, COUNT(*) as frecuencia
                  FROM movements 
                  WHERE user_id = ? 
                  AND tipo = 'gasto'
                  AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                  GROUP BY categoria
                  ORDER BY total DESC
                  LIMIT 5";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([$this->user_id]);

        $recommendations = array();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($categories)) {
            $top_category = $categories[0];
            $total_gastado = floatval($top_category['total']);
            $frecuencia = intval($top_category['frecuencia']);
            $promedio = $total_gastado / $frecuencia;

            $recommendations[] = array(
                'tipo' => 'analisis',
                'titulo' => 'Categoría con Mayor Gasto',
                'mensaje' => sprintf('Tu mayor gasto este mes es en "%s" con ₡%.2f (%d transacciones, promedio ₡%.2f). Analiza si puedes optimizar estos gastos.', 
                                   $top_category['categoria'], $total_gastado, $frecuencia, $promedio),
                'prioridad' => 'media',
                'icono' => 'fas fa-chart-pie',
                'accion' => 'Revisar gastos en ' . $top_category['categoria']
            );

            // Detectar gastos frecuentes pequeños que suman mucho
            foreach ($categories as $category) {
                $freq = intval($category['frecuencia']);
                $total = floatval($category['total']);
                $avg = $total / $freq;
                
                if ($freq >= 10 && $avg < 5000 && $total > 30000) { // Más de 10 transacciones, promedio < ₡5000, total > ₡30000
                    $recommendations[] = array(
                        'tipo' => 'consejo',
                        'titulo' => 'Gastos Pequeños Frecuentes',
                        'mensaje' => sprintf('Tienes %d gastos pequeños en "%s" que suman ₡%.2f. Estos "gastos hormiga" pueden controlarse con mejor planificación.', 
                                           $freq, $category['categoria'], $total),
                        'prioridad' => 'media',
                        'icono' => 'fas fa-coins',
                        'accion' => 'Planificar gastos en ' . $category['categoria']
                    );
                    break; // Solo mostrar una recomendación de este tipo
                }
            }
        }

        return $recommendations;
    }

    private function analyzeTrends() {
        $query = "SELECT 
                    DATE_FORMAT(fecha, '%Y-%m') as mes,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos
                  FROM movements 
                  WHERE user_id = ? 
                  AND fecha >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                  GROUP BY DATE_FORMAT(fecha, '%Y-%m')
                  ORDER BY mes DESC
                  LIMIT 3";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([$this->user_id]);
        $monthly_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $recommendations = array();
        
        if (count($monthly_data) >= 2) {
            $current_month = $monthly_data[0];
            $previous_month = $monthly_data[1];
            
            $current_gastos = floatval($current_month['gastos']);
            $previous_gastos = floatval($previous_month['gastos']);
            $current_ingresos = floatval($current_month['ingresos']);
            $previous_ingresos = floatval($previous_month['ingresos']);
            
            // Analizar tendencia de gastos
            if ($previous_gastos > 0 && $current_gastos > $previous_gastos * 1.2) {
                $increase = (($current_gastos - $previous_gastos) / $previous_gastos) * 100;
                $recommendations[] = array(
                    'tipo' => 'alerta',
                    'titulo' => 'Incremento Significativo en Gastos',
                    'mensaje' => sprintf('Tus gastos han aumentado %.1f%% respecto al mes anterior (de ₡%.2f a ₡%.2f). Revisa qué ha cambiado en tus hábitos de gasto.', 
                                       $increase, $previous_gastos, $current_gastos),
                    'prioridad' => 'alta',
                    'icono' => 'fas fa-arrow-up',
                    'accion' => 'Analizar incremento en gastos'
                );
            } elseif ($previous_gastos > 0 && $current_gastos < $previous_gastos * 0.8) {
                $decrease = (($previous_gastos - $current_gastos) / $previous_gastos) * 100;
                $recommendations[] = array(
                    'tipo' => 'felicitacion',
                    'titulo' => '¡Reducción de Gastos Exitosa!',
                    'mensaje' => sprintf('¡Excelente! Has reducido tus gastos en %.1f%% este mes (de ₡%.2f a ₡%.2f). Mantén este control.', 
                                       $decrease, $previous_gastos, $current_gastos),
                    'prioridad' => 'baja',
                    'icono' => 'fas fa-arrow-down',
                    'accion' => 'Mantener disciplina financiera'
                );
            }

            // Analizar tendencia de ingresos
            if ($previous_ingresos > 0 && $current_ingresos < $previous_ingresos * 0.9) {
                $decrease = (($previous_ingresos - $current_ingresos) / $previous_ingresos) * 100;
                $recommendations[] = array(
                    'tipo' => 'advertencia',
                    'titulo' => 'Reducción en Ingresos',
                    'mensaje' => sprintf('Tus ingresos han disminuido %.1f%% este mes. Considera ajustar tus gastos o buscar fuentes adicionales de ingresos.', $decrease),
                    'prioridad' => 'media',
                    'icono' => 'fas fa-chart-line-down',
                    'accion' => 'Evaluar fuentes de ingresos'
                );
            }
        }

        return $recommendations;
    }

    private function generateSavingRecommendations() {
        $recommendations = array();

        // Obtener datos del usuario para recomendaciones personalizadas
        $balance_data = $this->movement->getBalance();
        $total_ingresos = floatval($balance_data['total_ingresos'] ?? 0);
        $total_gastos = floatval($balance_data['total_gastos'] ?? 0);

        $general_tips = array(
            array(
                'tipo' => 'consejo',
                'titulo' => 'Regla 50/30/20',
                'mensaje' => 'Aplica la regla 50/30/20: 50% para necesidades básicas, 30% para gustos y 20% para ahorro e inversión. Esta estrategia te ayudará a mantener un balance financiero saludable.',
                'prioridad' => 'baja',
                'icono' => 'fas fa-balance-scale',
                'accion' => 'Categorizar gastos según la regla'
            ),
            array(
                'tipo' => 'consejo',
                'titulo' => 'Fondo de Emergencia',
                'mensaje' => 'Construye un fondo de emergencia equivalente a 3-6 meses de gastos esenciales. Esto te dará tranquilidad financiera ante imprevistos.',
                'prioridad' => 'media',
                'icono' => 'fas fa-shield-alt',
                'accion' => 'Calcular gastos esenciales mensuales'
            ),
            array(
                'tipo' => 'consejo',
                'titulo' => 'Revisa Suscripciones',
                'mensaje' => 'Evalúa todas tus suscripciones mensuales (streaming, gimnasio, software). Cancela las que no uses frecuentemente. Pueden estar costándote más de lo que imaginas.',
                'prioridad' => 'media',
                'icono' => 'fas fa-cut',
                'accion' => 'Auditar suscripciones activas'
            ),
            array(
                'tipo' => 'consejo',
                'titulo' => 'Automatiza tu Ahorro',
                'mensaje' => 'Configura transferencias automáticas a una cuenta de ahorros cada vez que recibas ingresos. "Págarte a ti mismo primero" es clave para el éxito financiero.',
                'prioridad' => 'media',
                'icono' => 'fas fa-robot',
                'accion' => 'Configurar ahorro automático'
            ),
            array(
                'tipo' => 'consejo',
                'titulo' => 'Presupuesto por Categorías',
                'mensaje' => 'Establece límites mensuales para cada categoría de gastos. Esto te ayudará a mantener el control y evitar gastos impulsivos.',
                'prioridad' => 'baja',
                'icono' => 'fas fa-tags',
                'accion' => 'Definir presupuesto por categoría'
            )
        );

        // Seleccionar 1-2 recomendaciones generales aleatoriamente
        $selected_tips = array_rand($general_tips, min(2, count($general_tips)));
        if (!is_array($selected_tips)) {
            $selected_tips = array($selected_tips);
        }

        foreach ($selected_tips as $index) {
            $recommendations[] = $general_tips[$index];
        }

        // Recomendación específica basada en el comportamiento
        if ($total_ingresos > 0) {
            $balance = $total_ingresos - $total_gastos;
            $savings_rate = ($balance / $total_ingresos) * 100;

            if ($savings_rate < 10) {
                $recommendations[] = array(
                    'tipo' => 'meta',
                    'titulo' => 'Meta de Ahorro Personalizada',
                    'mensaje' => sprintf('Tu tasa de ahorro actual es %.1f%%. Te recomendamos establecer una meta inicial del 15%% de tus ingresos (₡%.2f mensuales).', 
                                       $savings_rate, $total_ingresos * 0.15),
                    'prioridad' => 'alta',
                    'icono' => 'fas fa-target',
                    'accion' => 'Establecer meta de ahorro'
                );
            }
        }

        return $recommendations;
    }

    private function analyzeFrequency() {
        $query = "SELECT 
                    COUNT(*) as total_movements,
                    AVG(monto) as avg_amount,
                    COUNT(CASE WHEN tipo = 'gasto' AND monto < 2000 THEN 1 END) as small_expenses
                  FROM movements 
                  WHERE user_id = ? 
                  AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([$this->user_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $recommendations = array();
        $total_movements = intval($result['total_movements'] ?? 0);
        $small_expenses = intval($result['small_expenses'] ?? 0);
        $avg_amount = floatval($result['avg_amount'] ?? 0);

        // Analizar frecuencia de registro
        if ($total_movements < 5) {
            $recommendations[] = array(
                'tipo' => 'habito',
                'titulo' => 'Registra Más Movimientos',
                'mensaje' => 'Has registrado pocos movimientos este mes. Para un mejor control financiero, intenta registrar todos tus ingresos y gastos, incluso los pequeños.',
                'prioridad' => 'media',
                'icono' => 'fas fa-plus-circle',
                'accion' => 'Registrar movimientos diarios'
            );
        }

        // Analizar gastos pequeños
        if ($small_expenses > 10) {
            $recommendations[] = array(
                'tipo' => 'patron',
                'titulo' => 'Muchos Gastos Pequeños',
                'mensaje' => sprintf('Tienes %d gastos menores a ₡2,000 este mes. Aunque individualmente son pequeños, juntos pueden sumar una cantidad significativa.', $small_expenses),
                'prioridad' => 'baja',
                'icono' => 'fas fa-coins',
                'accion' => 'Controlar gastos menores'
            );
        }

        return $recommendations;
    }
}

try {
    $engine = new RecommendationEngine($db, $user_data->id, $movement);
    $recommendations = $engine->generateRecommendations();

    // Ordenar por prioridad
    $priority_order = array('alta' => 1, 'media' => 2, 'baja' => 3);
    usort($recommendations, function($a, $b) use ($priority_order) {
        return $priority_order[$a['prioridad']] <=> $priority_order[$b['prioridad']];
    });

    // Limitar a máximo 8 recomendaciones
    $recommendations = array_slice($recommendations, 0, 8);

    http_response_code(200);
    echo json_encode(array(
        'success' => true,
        'recommendations' => $recommendations,
        'total' => count($recommendations),
        'generated_at' => date('Y-m-d H:i:s'),
        'user_id' => $user_data->id
    ));
    
    Logger::apiRequest('/recommendations', 'GET', $user_data->id);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Error interno del servidor.'
    ));
    
    Logger::error('Recommendations error', [
        'user_id' => $user_data->id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>