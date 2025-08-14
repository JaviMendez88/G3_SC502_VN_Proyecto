<?php
class Logger {
    private static $log_dir = __DIR__ . '/../logs/';
    private static $default_file = 'app.log';
    
    // Niveles de log
    const EMERGENCY = 'EMERGENCY';
    const ALERT = 'ALERT';
    const CRITICAL = 'CRITICAL';
    const ERROR = 'ERROR';
    const WARNING = 'WARNING';
    const NOTICE = 'NOTICE';
    const INFO = 'INFO';
    const DEBUG = 'DEBUG';

    // Escribir entrada de log
    private static function writeLog($level, $message, $context = [], $file = null) {
        // Crear directorio de logs si no existe
        if (!is_dir(self::$log_dir)) {
            mkdir(self::$log_dir, 0755, true);
        }

        $file = $file ?: self::$default_file;
        $log_file = self::$log_dir . $file;
        
        $timestamp = date('Y-m-d H:i:s');
        $ip = self::getClientIP();
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        
        // Formatear mensaje
        $log_entry = [
            'timestamp' => $timestamp,
            'level' => $level,
            'message' => $message,
            'ip' => $ip,
            'request_uri' => $request_uri,
            'user_agent' => $user_agent
        ];
        
        // Agregar contexto si existe
        if (!empty($context)) {
            $log_entry['context'] = $context;
        }
        
        // Convertir a JSON para facilitar el parsing
        $log_line = json_encode($log_entry, JSON_UNESCAPED_UNICODE) . PHP_EOL;
        
        // Escribir al archivo
        file_put_contents($log_file, $log_line, FILE_APPEND | LOCK_EX);
        
        // También escribir al log de errores de PHP si es un error crítico
        if (in_array($level, [self::EMERGENCY, self::ALERT, self::CRITICAL, self::ERROR])) {
            error_log("[$level] $message");
        }
    }

    // Métodos públicos para cada nivel
    public static function emergency($message, $context = []) {
        self::writeLog(self::EMERGENCY, $message, $context);
    }

    public static function alert($message, $context = []) {
        self::writeLog(self::ALERT, $message, $context);
    }

    public static function critical($message, $context = []) {
        self::writeLog(self::CRITICAL, $message, $context);
    }

    public static function error($message, $context = []) {
        self::writeLog(self::ERROR, $message, $context);
    }

    public static function warning($message, $context = []) {
        self::writeLog(self::WARNING, $message, $context);
    }

    public static function notice($message, $context = []) {
        self::writeLog(self::NOTICE, $message, $context);
    }

    public static function info($message, $context = []) {
        self::writeLog(self::INFO, $message, $context);
    }

    public static function debug($message, $context = []) {
        // Solo loggear debug en modo desarrollo
        if (self::isDebugMode()) {
            self::writeLog(self::DEBUG, $message, $context);
        }
    }

    // Logs específicos para la aplicación
    public static function loginAttempt($email, $success = true, $ip = null) {
        $ip = $ip ?: self::getClientIP();
        $status = $success ? 'SUCCESS' : 'FAILED';
        
        self::info("Login attempt: $status", [
            'email' => $email,
            'ip' => $ip,
            'success' => $success
        ]);
        
        // Log fallido en archivo separado para análisis de seguridad
        if (!$success) {
            self::writeLog(self::WARNING, "Failed login attempt for email: $email", [
                'email' => $email,
                'ip' => $ip
            ], 'security.log');
        }
    }

    public static function userRegistration($email, $success = true) {
        $status = $success ? 'SUCCESS' : 'FAILED';
        
        self::info("User registration: $status", [
            'email' => $email,
            'ip' => self::getClientIP(),
            'success' => $success
        ]);
    }

    public static function apiRequest($endpoint, $method, $user_id = null) {
        self::info("API Request: $method $endpoint", [
            'endpoint' => $endpoint,
            'method' => $method,
            'user_id' => $user_id,
            'ip' => self::getClientIP()
        ]);
    }

    public static function databaseError($query, $error) {
        self::error("Database error", [
            'query' => $query,
            'error' => $error,
            'ip' => self::getClientIP()
        ]);
    }

    public static function validationError($data, $errors) {
        self::warning("Validation error", [
            'data' => $data,
            'errors' => $errors,
            'ip' => self::getClientIP()
        ]);
    }

    // Obtener IP del cliente
    private static function getClientIP() {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    // Verificar si está en modo debug
    private static function isDebugMode() {
        // Verificar variable de entorno o configuración
        return isset($_ENV['DEBUG']) && $_ENV['DEBUG'] === 'true';
    }

    // Limpiar logs antiguos
    public static function cleanOldLogs($days = 30) {
        if (!is_dir(self::$log_dir)) {
            return;
        }

        $files = glob(self::$log_dir . '*.log');
        $cutoff_time = time() - ($days * 24 * 60 * 60);

        foreach ($files as $file) {
            if (filemtime($file) < $cutoff_time) {
                unlink($file);
                self::info("Deleted old log file: " . basename($file));
            }
        }
    }

    // Obtener logs recientes (para dashboard de admin)
    public static function getRecentLogs($file = null, $lines = 50) {
        $file = $file ?: self::$default_file;
        $log_file = self::$log_dir . $file;
        
        if (!file_exists($log_file)) {
            return [];
        }

        $logs = [];
        $handle = fopen($log_file, 'r');
        
        if ($handle) {
            // Leer las últimas líneas del archivo
            $line_count = 0;
            $lines_array = [];
            
            while (($line = fgets($handle)) !== false) {
                $lines_array[] = $line;
                $line_count++;
                
                // Mantener solo las últimas N líneas en memoria
                if ($line_count > $lines) {
                    array_shift($lines_array);
                }
            }
            
            fclose($handle);
            
            // Convertir cada línea JSON a array
            foreach ($lines_array as $line) {
                $log_entry = json_decode(trim($line), true);
                if ($log_entry) {
                    $logs[] = $log_entry;
                }
            }
        }
        
        return array_reverse($logs); // Más recientes primero
    }

    // Obtener estadísticas de logs
    public static function getLogStats($file = null, $hours = 24) {
        $file = $file ?: self::$default_file;
        $log_file = self::$log_dir . $file;
        
        if (!file_exists($log_file)) {
            return [];
        }

        $stats = [
            'total' => 0,
            'by_level' => [],
            'recent_errors' => 0,
            'unique_ips' => []
        ];

        $cutoff_time = time() - ($hours * 3600);
        $handle = fopen($log_file, 'r');
        
        if ($handle) {
            while (($line = fgets($handle)) !== false) {
                $log_entry = json_decode(trim($line), true);
                if ($log_entry) {
                    $timestamp = strtotime($log_entry['timestamp']);
                    
                    if ($timestamp >= $cutoff_time) {
                        $stats['total']++;
                        
                        $level = $log_entry['level'];
                        $stats['by_level'][$level] = ($stats['by_level'][$level] ?? 0) + 1;
                        
                        if (in_array($level, [self::ERROR, self::CRITICAL, self::ALERT, self::EMERGENCY])) {
                            $stats['recent_errors']++;
                        }
                        
                        if (isset($log_entry['ip'])) {
                            $stats['unique_ips'][$log_entry['ip']] = true;
                        }
                    }
                }
            }
            fclose($handle);
        }
        
        $stats['unique_ips'] = count($stats['unique_ips']);
        
        return $stats;
    }
}
?>