<?php
// auth.php - Manejo de autenticación
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'POST':
        $action = $_GET['action'] ?? '';
        
        if ($action === 'register') {
            register($input);
        } elseif ($action === 'login') {
            login($input);
        } else {
            sendResponse(['error' => 'Acción no válida'], 400);
        }
        break;
        
    default:
        sendResponse(['error' => 'Método no permitido'], 405);
}

function register($data) {
    $db = getDB();
    
    // Validar datos requeridos
    if (!isset($data['nombre']) || !isset($data['apellidos']) || 
        !isset($data['email']) || !isset($data['password'])) {
        sendResponse(['error' => 'Datos incompletos'], 400);
    }
    
    try {
        // Verificar si el email ya existe
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        
        if ($stmt->fetch()) {
            sendResponse(['error' => 'El email ya está registrado'], 409);
        }
        
        // Crear usuario
        $stmt = $db->prepare("
            INSERT INTO users (nombre, apellidos, email, password) 
            VALUES (?, ?, ?, ?)
        ");
        
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt->execute([
            $data['nombre'],
            $data['apellidos'], 
            $data['email'],
            $hashedPassword
        ]);
        
        $userId = $db->lastInsertId();
        
        sendResponse([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'user_id' => $userId
        ]);
        
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error al registrar usuario'], 500);
    }
}

function login($data) {
    $db = getDB();
    
    if (!isset($data['email']) || !isset($data['password'])) {
        sendResponse(['error' => 'Email y contraseña requeridos'], 400);
    }
    
    try {
        $stmt = $db->prepare("SELECT id, nombre, apellidos, email, password FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            sendResponse(['error' => 'Credenciales incorrectas'], 401);
        }
        
        // Token simple (en producción usar JWT)
        $token = base64_encode($user['id'] . ':' . time());
        
        sendResponse([
            'success' => true,
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'apellidos' => $user['apellidos'],
                'email' => $user['email']
            ]
        ]);
        
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error en el login'], 500);
    }
}
?>