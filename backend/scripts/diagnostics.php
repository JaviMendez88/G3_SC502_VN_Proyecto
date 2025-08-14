<?php
/**
 * Script de Diagnóstico para FideFinance Backend
 * 
 * Este script verifica el estado del sistema y reporta posibles problemas
 * Uso: php diagnostics.php [--json] [--verbose]
 */

// Configuración
$start_time = microtime(true);
$is_cli = php_sapi_name() === 'cli';
$output_json = in_array('--json', $argv ?? []);
$verbose = in_array('--verbose', $argv ?? []);

// Incluir archivos necesarios
require_once '../config/database.php';

// Clase para manejar diagnósticos
class SystemDiagnostics {
    private $checks = [];
    private $verbose = false;
    
    public function __construct($verbose = false) {
        $this->verbose = $verbose;
    }
    
    public function runAllChecks() {
        $this->checkPHPVersion();
        $this->checkPHPExtensions();
        $this->checkDatabase();
        $this->checkFilePermissions();
        $this->checkDirectories();
        $this->checkConfiguration();
        $this->checkSecurity();
        $this->checkPerformance();
        $this->checkLogs();
        
        return $this->checks;
    }
    
    private function addCheck($category, $name, $status, $message, $details = null) {
        $this->checks[] = [
            'category' => $category,
            'name' => $name,
            'status' => $status, // 'ok', 'warning', 'error'
            'message' => $message,
            'details' => $details,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    public function checkPHPVersion() {
        $version = phpversion();
        $min_version = '7.4.0';
        
        if (version_compare($version, $min_version, '>=')) {
            $this->addCheck('php', 'PHP Version', 'ok', "PHP $version (requerido >= $min_version)");
        } else {
            $this->addCheck('php', 'PHP Version', 'error', "PHP $version es muy antigua (requerido >= $min_version)");
        }
        
        // Verificar configuraciones importantes
        $memory_limit = ini_get('memory_limit');
        $max_execution = ini_get('max_execution_time');
        $upload_max = ini_get('upload_max_filesize');
        
        $this->addCheck('php', 'Memory Limit', 'ok', $memory_limit);
        $this->addCheck('php', 'Max Execution Time', 'ok', $max_execution . 's');
        $this->addCheck('php', 'Upload Max Size', 'ok', $upload_max);
    }
    
    public function checkPHPExtensions() {
        $required_extensions = [
            'pdo' => 'PDO (base de datos)',
            'pdo_mysql' => 'PDO MySQL',
            'json' => 'JSON',
            'curl' => 'cURL',
            'mbstring' => 'Multibyte String',
            'openssl' => 'OpenSSL (para JWT)'
        ];
        
        foreach ($required_extensions as $ext => $description) {
            if (extension_loaded($ext)) {
                $this->addCheck('extensions', $ext, 'ok', "$description - instalada");
            } else {
                $this->addCheck('extensions', $ext, 'error', "$description - NO instalada");
            }
        }
        
        // Verificar extensiones opcionales
        $optional_extensions = [
            'redis' => 'Redis (cache)',
            'memcached' => 'Memcached (cache)',
            'zip' => 'ZIP (backups)',
            'gd' => 'GD (imágenes)'
        ];
        
        foreach ($optional_extensions as $ext => $description) {
            if (extension_loaded($ext)) {
                $this->addCheck('extensions', $ext, 'ok', "$description - disponible");
            } else {
                $this->addCheck('extensions', $ext, 'warning', "$description - no disponible (opcional)");
            }
        }
    }
    
    public function checkDatabase() {
        try {
            $database = new Database();
            $db = $database->getConnection();
            
            if ($db) {
                $this->addCheck('database', 'Connection', 'ok', 'Conexión exitosa');
                
                // Verificar tablas
                $tables = ['users', 'movements', 'categories'];
                foreach ($tables as $table) {
                    $stmt = $db->query("SHOW TABLES LIKE '$table'");
                    if ($stmt->rowCount() > 0) {
                        // Contar registros
                        $count_stmt = $db->query("SELECT COUNT(*) as count FROM $table");
                        $count = $count_stmt->fetch(PDO::FETCH_ASSOC)['count'];
                        $this->addCheck('database', "Table $table", 'ok', "Existe ($count registros)");
                    } else {
                        $this->addCheck('database', "Table $table", 'error', 'No existe');
                    }
                }
                
                // Verificar versión de MySQL
                $version_stmt = $db->query("SELECT VERSION() as version");
                $mysql_version = $version_stmt->fetch(PDO::FETCH_ASSOC)['version'];
                $this->addCheck('database', 'MySQL Version', 'ok', $mysql_version);
                
                // Verificar charset
                $charset_stmt = $db->query("SELECT @@character_set_database as charset");
                $charset = $charset_stmt->fetch(PDO::FETCH_ASSOC)['charset'];
                
                if ($charset === 'utf8mb4') {
                    $this->addCheck('database', 'Charset', 'ok', $charset);
                } else {
                    $this->addCheck('database', 'Charset', 'warning', "$charset (recomendado: utf8mb4)");
                }
                
            } else {
                $this->addCheck('database', 'Connection', 'error', 'No se pudo conectar');
            }
        } catch (Exception $e) {
            $this->addCheck('database', 'Connection', 'error', 'Error: ' . $e->getMessage());
        }
    }
    
    public function checkFilePermissions() {
        $files_to_check = [
            '../config/database.php' => 'readable',
            '../api/login.php' => 'readable',
            '../logs' => 'writable',
            '../cache' => 'writable',
            '../uploads' => 'writable'
        ];
        
        foreach ($files_to_check as $path => $required_perm) {
            $full_path = __DIR__ . '/' . $path;
            
            if (!file_exists($full_path)) {
                $this->addCheck('permissions', basename($path), 'error', 'No existe');
                continue;
            }
            
            $is_readable = is_readable($full_path);
            $is_writable = is_writable($full_path);
            
            $status = 'ok';
            $message = '';
            
            if ($required_perm === 'readable' && !$is_readable) {
                $status = 'error';
                $message = 'No legible';
            } elseif ($required_perm === 'writable' && !$is_writable) {
                $status = 'error';
                $message = 'No escribible';
            } else {
                $perms = substr(sprintf('%o', fileperms($full_path)), -4);
                $message = "Permisos: $perms";
            }
            
            $this->addCheck('permissions', basename($path), $status, $message);
        }
    }
    
    public function checkDirectories() {
        $required_dirs = [
            '../api' => 'API endpoints',
            '../config' => 'Configuración',
            '../models' => 'Modelos',
            '../utils' => 'Utilidades',
            '../logs' => 'Logs',
            '../cache' => 'Cache',
            '../uploads' => 'Uploads'
        ];
        
        foreach ($required_dirs as $dir => $description) {
            $full_path = __DIR__ . '/' . $dir;
            
            if (is_dir($full_path)) {
                $file_count = count(scandir($full_path)) - 2; // Excluir . y ..
                $this->addCheck('directories', basename($dir), 'ok', "$description ($file_count archivos)");
            } else {
                $this->addCheck('directories', basename($dir), 'error', "$description - No existe");
            }
        }
    }
    
    public function checkConfiguration() {
        // Verificar archivos de configuración
        $config_files = [
            '../config/database.php',
            '../config/cors.php',
            '../composer.json'
        ];
        
        foreach ($config_files as $file) {
            $full_path = __DIR__ . '/' . $file;
            
            if (file_exists($full_path)) {
                $size = filesize($full_path);
                $this->addCheck('configuration', basename($file), 'ok', "Existe ($size bytes)");
            } else {
                $this->addCheck('configuration', basename($file), 'error', 'No existe');
            }
        }
        
        // Verificar vendor (Composer)
        $vendor_path = __DIR__ . '/../vendor';
        if (is_dir($vendor_path)) {
            $this->addCheck('configuration', 'Composer Dependencies', 'ok', 'Instaladas');
        } else {
            $this->addCheck('configuration', 'Composer Dependencies', 'warning', 'Ejecutar: composer install');
        }
        
        // Verificar .htaccess
        $htaccess_path = __DIR__ . '/../.htaccess';
        if (file_exists($htaccess_path)) {
            $content = file_get_contents($htaccess_path);
            if (strpos($content, 'RewriteEngine On') !== false) {
                $this->addCheck('configuration', '.htaccess', 'ok', 'Configurado correctamente');
            } else {
                $this->addCheck('configuration', '.htaccess', 'warning', 'Posible configuración incorrecta');
            }
        } else {
            $this->addCheck('configuration', '.htaccess', 'error', 'No existe');
        }
    }
    
    public function checkSecurity() {
        // Verificar configuraciones de seguridad de PHP
        $security_checks = [
            'expose_php' => ['expected' => 'Off', 'description' => 'Ocultar versión PHP'],
            'display_errors' => ['expected' => 'Off', 'description' => 'Ocultar errores'],
            'log_errors' => ['expected' => 'On', 'description' => 'Log de errores'],
            'allow_url_fopen' => ['expected' => 'Off', 'description' => 'Bloquear URL fopen']
        ];
        
        foreach ($security_checks as $setting => $config) {
            $current_value = ini_get($setting);
            $current_display = $current_value ? 'On' : 'Off';
            
            if ($current_display === $config['expected']) {
                $this->addCheck('security', $setting, 'ok', "{$config['description']}: $current_display");
            } else {
                $this->addCheck('security', $setting, 'warning', "{$config['description']}: $current_display (recomendado: {$config['expected']})");
            }
        }
        
        // Verificar permisos de archivos sensibles
        $sensitive_files = [
            '../config/database.php',
            '../config/env.php'
        ];
        
        foreach ($sensitive_files as $file) {
            $full_path = __DIR__ . '/' . $file;
            if (file_exists($full_path)) {
                $perms = substr(sprintf('%o', fileperms($full_path)), -4);
                if ($perms === '0644' || $perms === '0640') {
                    $this->addCheck('security', basename($file) . ' permissions', 'ok', "Permisos seguros: $perms");
                } else {
                    $this->addCheck('security', basename($file) . ' permissions', 'warning', "Permisos: $perms (revisar seguridad)");
                }
            }
        }
    }
    
    public function checkPerformance() {
        // Verificar memoria disponible
        $memory_limit = $this->parseSize(ini_get('memory_limit'));
        $memory_used = memory_get_usage(true);
        $memory_peak = memory_get_peak_usage(true);
        
        $memory_percentage = ($memory_used / $memory_limit) * 100;
        
        if ($memory_percentage < 70) {
            $this->addCheck('performance', 'Memory Usage', 'ok', 
                sprintf("%.2f%% usado (%s de %s)", 
                    $memory_percentage, 
                    $this->formatBytes($memory_used), 
                    $this->formatBytes($memory_limit)
                )
            );
        } else {
            $this->addCheck('performance', 'Memory Usage', 'warning', 
                sprintf("%.2f%% usado (%s de %s) - Alto uso", 
                    $memory_percentage, 
                    $this->formatBytes($memory_used), 
                    $this->formatBytes($memory_limit)
                )
            );
        }
        
        // Verificar OPcache si está disponible
        if (extension_loaded('opcache') && ini_get('opcache.enable')) {
            $opcache_status = opcache_get_status();
            if ($opcache_status !== false) {
                $hit_rate = $opcache_status['opcache_statistics']['opcache_hit_rate'];
                $this->addCheck('performance', 'OPcache', 'ok', "Activo (Hit rate: {$hit_rate}%)");
            } else {
                $this->addCheck('performance', 'OPcache', 'warning', 'Configurado pero no activo');
            }
        } else {
            $this->addCheck('performance', 'OPcache', 'warning', 'No configurado (recomendado para producción)');
        }
        
        // Verificar espacio en disco
        $disk_total = disk_total_space(__DIR__);
        $disk_free = disk_free_space(__DIR__);
        $disk_used_percentage = (($disk_total - $disk_free) / $disk_total) * 100;
        
        if ($disk_used_percentage < 85) {
            $this->addCheck('performance', 'Disk Space', 'ok', 
                sprintf("%.1f%% usado (%s libres)", 
                    $disk_used_percentage, 
                    $this->formatBytes($disk_free)
                )
            );
        } else {
            $this->addCheck('performance', 'Disk Space', 'warning', 
                sprintf("%.1f%% usado (%s libres) - Poco espacio", 
                    $disk_used_percentage, 
                    $this->formatBytes($disk_free)
                )
            );
        }
    }
    
    public function checkLogs() {
        $log_dir = __DIR__ . '/../logs';
        
        if (!is_dir($log_dir)) {
            $this->addCheck('logs', 'Log Directory', 'error', 'Directorio no existe');
            return;
        }
        
        $log_files = glob($log_dir . '/*.log');
        $total_size = 0;
        $file_count = count($log_files);
        
        foreach ($log_files as $file) {
            $total_size += filesize($file);
        }
        
        $this->addCheck('logs', 'Log Files', 'ok', 
            sprintf("%d archivos (%s total)", $file_count, $this->formatBytes($total_size))
        );
        
        // Verificar logs recientes
        if ($file_count > 0) {
            $recent_logs = array_filter($log_files, function($file) {
                return filemtime($file) > (time() - 86400); // Últimas 24 horas
            });
            
            $this->addCheck('logs', 'Recent Activity', 'ok', 
                sprintf("%d archivos con actividad reciente", count($recent_logs))
            );
        }
        
        // Verificar tamaño de logs individuales
        foreach ($log_files as $file) {
            $size = filesize($file);
            $filename = basename($file);
            
            if ($size > 10 * 1024 * 1024) { // 10MB
                $this->addCheck('logs', $filename, 'warning', 
                    sprintf("Archivo grande: %s (considerar rotación)", $this->formatBytes($size))
                );
            }
        }
    }
    
    private function parseSize($size) {
        $unit = preg_replace('/[^bkmgtpezy]/i', '', $size);
        $size = preg_replace('/[^0-9\.]/', '', $size);
        
        if ($unit) {
            return round($size * pow(1024, stripos('bkmgtpezy', $unit[0])));
        } else {
            return round($size);
        }
    }
    
    private function formatBytes($bytes, $precision = 2) {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
    
    public function getSummary() {
        $total = count($this->checks);
        $ok = count(array_filter($this->checks, function($check) { return $check['status'] === 'ok'; }));
        $warnings = count(array_filter($this->checks, function($check) { return $check['status'] === 'warning'; }));
        $errors = count(array_filter($this->checks, function($check) { return $check['status'] === 'error'; }));
        
        return [
            'total' => $total,
            'ok' => $ok,
            'warnings' => $warnings,
            'errors' => $errors,
            'health_score' => round(($ok / $total) * 100, 1)
        ];
    }
}

// Función para mostrar resultados en consola
function displayConsoleResults($checks, $summary, $verbose) {
    echo "\n=== DIAGNÓSTICO DEL SISTEMA FIDEFINANCE ===\n\n";
    
    // Mostrar resumen
    echo "RESUMEN:\n";
    echo "  Total de verificaciones: {$summary['total']}\n";
    echo "  Correctas: {$summary['ok']}\n";
    echo "   Advertencias: {$summary['warnings']}\n";
    echo "  Errores: {$summary['errors']}\n";
    echo "  Puntuación de salud: {$summary['health_score']}%\n\n";
    
    // Agrupar por categoría
    $categories = [];
    foreach ($checks as $check) {
        $categories[$check['category']][] = $check;
    }
    
    foreach ($categories as $category => $category_checks) {
        echo "📁 " . strtoupper($category) . ":\n";
        
        foreach ($category_checks as $check) {
            $icon = $check['status'] === 'ok' ? '✅' : ($check['status'] === 'warning' ? '⚠️' : '❌');
            echo "  $icon {$check['name']}: {$check['message']}\n";
            
            if ($verbose && $check['details']) {
                echo "     Detalles: {$check['details']}\n";
            }
        }
        echo "\n";
    }
    
    // Recomendaciones
    $errors = array_filter($checks, function($check) { return $check['status'] === 'error'; });
    if (!empty($errors)) {
        echo "ACCIONES RECOMENDADAS:\n";
        foreach ($errors as $error) {
            echo "  • Corregir: {$error['name']} - {$error['message']}\n";
        }
        echo "\n";
    }
    
    echo "Diagnóstico completado en " . round(microtime(true) - $GLOBALS['start_time'], 2) . " segundos\n";
    echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";
}

// Función principal
function runDiagnostics() {
    global $output_json, $verbose, $is_cli;
    
    $diagnostics = new SystemDiagnostics($verbose);
    $checks = $diagnostics->runAllChecks();
    $summary = $diagnostics->getSummary();
    
    // Agregar información del sistema
    $system_info = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'CLI',
        'os' => php_uname(),
        'timestamp' => date('c'),
        'execution_time' => round(microtime(true) - $GLOBALS['start_time'], 4)
    ];
    
    if ($output_json) {
        // Salida JSON
        $result = [
            'status' => $summary['errors'] > 0 ? 'error' : ($summary['warnings'] > 0 ? 'warning' : 'ok'),
            'summary' => $summary,
            'system_info' => $system_info,
            'checks' => $checks
        ];
        
        if ($is_cli) {
            echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
        } else {
            header('Content-Type: application/json');
            echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
    } else {
        if ($is_cli) {
            // Salida de consola
            displayConsoleResults($checks, $summary, $verbose);
        } else {
            // Salida HTML
            displayHTMLResults($checks, $summary, $system_info, $verbose);
        }
    }
    
    // Retornar código de salida apropiado para CLI
    if ($is_cli) {
        exit($summary['errors'] > 0 ? 1 : 0);
    }
}

// Función para mostrar resultados en HTML
function displayHTMLResults($checks, $summary, $system_info, $verbose) {
    ?>
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Diagnóstico FideFinance</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
            .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
            .health-score { font-size: 2em; font-weight: bold; }
            .health-good { color: #28a745; }
            .health-warning { color: #ffc107; }
            .health-danger { color: #dc3545; }
            .category { margin-bottom: 25px; }
            .category-title { background: #007bff; color: white; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
            .check-item { padding: 8px; margin: 2px 0; border-left: 4px solid; border-radius: 0 4px 4px 0; }
            .check-ok { background: #d4edda; border-color: #28a745; }
            .check-warning { background: #fff3cd; border-color: #ffc107; }
            .check-error { background: #f8d7da; border-color: #dc3545; }
            .system-info { background: #e9ecef; padding: 15px; border-radius: 4px; margin-top: 20px; font-size: 0.9em; }
            .icon { margin-right: 8px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Diagnóstico del Sistema FideFinance</h1>
                <p><?= date('Y-m-d H:i:s') ?></p>
            </div>
            
            <div class="summary">
                <div class="summary-card">
                    <div class="health-score <?= $summary['health_score'] >= 80 ? 'health-good' : ($summary['health_score'] >= 60 ? 'health-warning' : 'health-danger') ?>">
                        <?= $summary['health_score'] ?>%
                    </div>
                    <div>Puntuación de Salud</div>
                </div>
                <div class="summary-card">
                    <div style="color: #28a745; font-size: 1.5em; font-weight: bold;"><?= $summary['ok'] ?></div>
                    <div>Verificaciones OK</div>
                </div>
                <div class="summary-card">
                    <div style="color: #ffc107; font-size: 1.5em; font-weight: bold;"><?= $summary['warnings'] ?></div>
                    <div>Advertencias</div>
                </div>
                <div class="summary-card">
                    <div style="color: #dc3545; font-size: 1.5em; font-weight: bold;"><?= $summary['errors'] ?></div>
                    <div>Errores</div>
                </div>
            </div>
            
            <?php
            // Agrupar por categoría
            $categories = [];
            foreach ($checks as $check) {
                $categories[$check['category']][] = $check;
            }
            
            foreach ($categories as $category => $category_checks):
            ?>
            <div class="category">
                <div class="category-title"><?= strtoupper($category) ?></div>
                <?php foreach ($category_checks as $check): ?>
                    <div class="check-item check-<?= $check['status'] ?>">
                        <span class="icon"><?= $check['status'] === 'ok' ? 'bien' : ($check['status'] === 'warning' ? 'bad' : 'bad') ?></span>
                        <strong><?= htmlspecialchars($check['name']) ?>:</strong> 
                        <?= htmlspecialchars($check['message']) ?>
                        <?php if ($verbose && $check['details']): ?>
                            <br><small>Detalles: <?= htmlspecialchars($check['details']) ?></small>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
            <?php endforeach; ?>
            
            <div class="system-info">
                <h3>Información del Sistema</h3>
                <p><strong>PHP:</strong> <?= $system_info['php_version'] ?></p>
                <p><strong>Servidor:</strong> <?= $system_info['server_software'] ?></p>
                <p><strong>OS:</strong> <?= $system_info['os'] ?></p>
                <p><strong>Tiempo de ejecución:</strong> <?= $system_info['execution_time'] ?> segundos</p>
            </div>
        </div>
    </body>
    </html>
    <?php
}

// Ejecutar diagnósticos
if ($is_cli) {
    echo "Ejecutando diagnósticos del sistema FideFinance...\n";
}

runDiagnostics();
?>