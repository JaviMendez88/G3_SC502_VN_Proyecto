<?php
require_once 'JWT.php';

class Auth {
    
    // Validar token y devolver datos del usuario
    public static function validateToken() {
        $token = self::getAuthToken();
        
        if (!$token) {
            self::sendUnauthorizedResponse("Token de acceso requerido.");
            return false;
        }

        $decoded = JWT::validate($token);

        if (!$decoded) {
            self::sendUnauthorizedResponse("Token inválido o expirado.");
            return false;
        }

        return $decoded->data;
    }

    // Obtener token del header Authorization
    public static function getAuthToken() {
        $headers = getallheaders();
        
        // Verificar diferentes formas de enviar el header
        $auth_header = null;
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $auth_header = $headers['authorization'];
        } elseif (function_exists('apache_request_headers')) {
            $apache_headers = apache_request_headers();
            if (isset($apache_headers['Authorization'])) {
                $auth_header = $apache_headers['Authorization'];
            }
        }

        if ($auth_header && preg_match('/Bearer\s+(.+)$/i', $auth_header, $matches)) {
            return $matches[1];
        }

        return null;
    }

    // Verificar si el usuario está autenticado
    public static function isAuthenticated() {
        $token = self::getAuthToken();
        return $token && JWT::validate($token);
    }

    // Obtener ID del usuario autenticado
    public static function getCurrentUserId() {
        $user_data = self::validateToken();
        return $user_data ? $user_data->id : null;
    }

    // Obtener datos completos del usuario autenticado
    public static function getCurrentUser() {
        return self::validateToken();
    }

    // Verificar permisos (si el usuario puede acceder a un recurso)
    public static function canAccessResource($resource_user_id) {
        $current_user = self::getCurrentUser();
        
        if (!$current_user) {
            return false;
        }

        // El usuario solo puede acceder a sus propios recursos
        return $current_user->id == $resource_user_id;
    }

    // Middleware para rutas protegidas
    public static function requireAuth() {
        $user_data = self::validateToken();
        
        if (!$user_data) {
            exit(); // validateToken ya envió la respuesta de error
        }
        
        return $user_data;
    }

    // Middleware para verificar rol de admin (funcionalidad futura)
    public static function requireAdmin() {
        $user_data = self::requireAuth();
        
        // Por ahora, todos los usuarios son regulares
        // En el futuro se puede agregar un campo 'role' a la tabla users
        if (!isset($user_data->role) || $user_data->role !== 'admin') {
            self::sendForbiddenResponse("Acceso denegado. Se requieren permisos de administrador.");
            exit();
        }
        
        return $user_data;
    }

    // Generar token de acceso
    public static function generateToken($user_data) {
        return JWT::encode([
            'id' => $user_data['id'],
            'nombre' => $user_data['nombre'],
            'apellidos' => $user_data['apellidos'],
            'email' => $user_data['email']
        ]);
    }

    // Respuesta de no autorizado
    private static function sendUnauthorizedResponse($message) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            "success" => false,
            "message" => $message,
            "error_code" => "UNAUTHORIZED"
        ]);
    }

    // Respuesta de prohibido
    private static function sendForbiddenResponse($message) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            "success" => false,
            "message" => $message,
            "error_code" => "FORBIDDEN"
        ]);
    }

    // Verificar límite de intentos de login (funcionalidad futura)
    public static function checkLoginAttempts($email) {
        // Por ahora retorna true
        // En el futuro se puede implementar con Redis o base de datos
        return true;
    }

    // Registrar intento de login fallido
    public static function recordFailedLogin($email) {
        // Funcionalidad futura para rate limiting
        // Se puede guardar en cache o base de datos
    }

    // Limpiar intentos de login después de login exitoso
    public static function clearLoginAttempts($email) {
        // Funcionalidad futura
    }

    // Logout (invalidar token - funcionalidad futura con blacklist)
    public static function logout($token) {
        // Por ahora el logout se maneja en el frontend eliminando el token
        // En el futuro se puede implementar una blacklist de tokens
        return true;
    }

    // Verificar si el token necesita renovación
    public static function shouldRefreshToken($token) {
        return JWT::isExpiringSoon($token);
    }

    // Renovar token
    public static function refreshToken($token) {
        return JWT::refresh($token);
    }
}
?>