<?php
echo "=== Instalador de FideFinance Backend ===\n\n";

// Verificar conexión a la base de datos
try {
    require_once 'config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    echo "✓ Conexión a la base de datos exitosa\n";
} catch (Exception $e) {
    echo "✗ Error de conexión: " . $e->getMessage() . "\n";
    echo "Por favor verifica la configuración en config/database.php\n";
    exit(1);
}

// Leer y ejecutar el schema SQL
$schema_file = 'database_schema.sql';
if (file_exists($schema_file)) {
    $sql = file_get_contents($schema_file);
    $statements = explode(';', $sql);
    
    echo "Ejecutando schema de base de datos...\n";
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            try {
                $db->exec($statement);
            } catch (PDOException $e) {
                // Solo mostrar advertencias para statements que no sean críticos
                if (strpos($e->getMessage(), 'already exists') === false) {
                    echo "Advertencia: " . $e->getMessage() . "\n";
                }
            }
        }
    }
    
    echo "✓ Schema de base de datos ejecutado\n";
} else {
    echo "✗ Archivo de schema no encontrado: {$schema_file}\n";
}

// Verificar instalación de Composer
if (file_exists('vendor/autoload.php')) {
    echo "✓ Dependencias de Composer instaladas\n";
} else {
    echo "⚠ Ejecuta 'composer install' para instalar las dependencias\n";
}

// Verificar y crear directorios necesarios
$writable_dirs = ['logs', 'cache', 'uploads'];
foreach ($writable_dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
        echo "✓ Directorio {$dir} creado\n";
    }
    if (is_writable($dir)) {
        echo "✓ Directorio {$dir} tiene permisos de escritura\n";
    } else {
        echo "✗ Directorio {$dir} no tiene permisos de escritura\n";
    }
}

// Verificar archivos de configuración
if (file_exists('config/env.example.php') && !file_exists('config/env.php')) {
    copy('config/env.example.php', 'config/env.php');
    echo "✓ Archivo de configuración env.php creado (revisar configuración)\n";
}

// Verificar extensiones PHP requeridas
$required_extensions = ['pdo', 'pdo_mysql', 'json', 'curl', 'mbstring'];
echo "\nVerificando extensiones PHP:\n";
foreach ($required_extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✓ {$ext}\n";
    } else {
        echo "✗ {$ext} - REQUERIDA\n";
    }
}

echo "\n=== Instalación completada ===\n";
echo "Tu backend de FideFinance está listo para usar.\n";
echo "API Base URL: http://tu-dominio/backend/api/\n";
echo "\nPróximos pasos:\n";
echo "1. Ejecutar 'composer install' si no lo has hecho\n";
echo "2. Configurar config/database.php con tus credenciales\n";
echo "3. Probar los endpoints de la API\n";
?>