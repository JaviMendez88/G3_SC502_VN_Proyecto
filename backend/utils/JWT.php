<?php
require_once __DIR__ . '/../vendor/autoload.php';

class JWT {
    private static $secret_key = "tu_clave_secreta_muy_segura_aqui_2024";
    private static $issuer = "fidefinance";
    private static $audience = "fidefinance-users";
    private static $expiration_time = 86400; // 24 horas en segundos

    // Crear token JWT
    public static function encode($user_data) {
        $issued_at = time();
        $expiration = $issued_at + self::$expiration_time;

        $payload = array(
            "iss" => self::$issuer,
            "aud" => self::$audience,
            "iat" => $issued_at,
            "exp" => $expiration,
            "data" => $user_data
        );

        return \Firebase\JWT\JWT::encode($payload, self::$secret_key, 'HS256');
    }

    // Decodificar token JWT
    public static function decode($jwt) {
        try {
            $decoded = \Firebase\JWT\JWT::decode($jwt, new \Firebase\JWT\Key(self::$secret_key, 'HS256'));
            return $decoded;
        } catch (Exception $e) {
            return false;
        }
    }

    // Validar token JWT
    public static function validate($jwt) {
        try {
            $decoded = self::decode($jwt);
            
            if (!$decoded) {
                return false;
            }

            // Verificar si el token ha expirado
            if ($decoded->exp < time()) {
                return false;
            }

            // Verificar issuer y audience
            if ($decoded->iss !== self::$issuer || $decoded->aud !== self::$audience) {
                return false;
            }

            return $decoded;
        } catch (Exception $e) {
            return false;
        }
    }

    // Obtener datos del usuario desde el token
    public static function getUserData($jwt) {
        $decoded = self::validate($jwt);
        
        if ($decoded && isset($decoded->data)) {
            return $decoded->data;
        }
        
        return false;
    }

    // Verificar si el token está próximo a expirar (menos de 1 hora)
    public static function isExpiringSoon($jwt) {
        $decoded = self::decode($jwt);
        
        if (!$decoded) {
            return true;
        }

        $time_left = $decoded->exp - time();
        return $time_left < 3600; // Menos de 1 hora
    }

    // Renovar token (crear uno nuevo con los mismos datos)
    public static function refresh($jwt) {
        $user_data = self::getUserData($jwt);
        
        if ($user_data) {
            return self::encode($user_data);
        }
        
        return false;
    }

    // Extraer token del header Authorization
    public static function getBearerToken() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }

    // Configurar clave secreta personalizada
    public static function setSecretKey($key) {
        self::$secret_key = $key;
    }

    // Configurar tiempo de expiración
    public static function setExpirationTime($time) {
        self::$expiration_time = $time;
    }
}
?>