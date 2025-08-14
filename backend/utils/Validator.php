<?php
class Validator {
    
    // Validar email
    public static function validateEmail($email) {
        if (empty($email)) {
            return "El email es requerido.";
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return "El formato del email no es válido.";
        }
        
        if (strlen($email) > 255) {
            return "El email es demasiado largo.";
        }
        
        return true;
    }

    // Validar contraseña
    public static function validatePassword($password) {
        if (empty($password)) {
            return "La contraseña es requerida.";
        }
        
        if (strlen($password) < 6) {
            return "La contraseña debe tener al menos 6 caracteres.";
        }
        
        if (strlen($password) > 255) {
            return "La contraseña es demasiado larga.";
        }
        
        return true;
    }

    // Validar nombre
    public static function validateName($name, $field_name = "nombre") {
        if (empty($name)) {
            return "El {$field_name} es requerido.";
        }
        
        if (strlen($name) < 2) {
            return "El {$field_name} debe tener al menos 2 caracteres.";
        }
        
        if (strlen($name) > 100) {
            return "El {$field_name} es demasiado largo.";
        }
        
        if (!preg_match("/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/", $name)) {
            return "El {$field_name} solo puede contener letras y espacios.";
        }
        
        return true;
    }

    // Validar campos requeridos
    public static function validateRequired($fields) {
        $errors = [];
        
        foreach ($fields as $field_name => $value) {
            if (empty($value) || (is_string($value) && trim($value) === '')) {
                $errors[] = "El campo {$field_name} es requerido.";
            }
        }
        
        return empty($errors) ? true : $errors;
    }

    // Validar tipo de movimiento
    public static function validateMovementType($tipo) {
        if (empty($tipo)) {
            return "El tipo de movimiento es requerido.";
        }
        
        if (!in_array($tipo, ['ingreso', 'gasto'])) {
            return "El tipo de movimiento debe ser 'ingreso' o 'gasto'.";
        }
        
        return true;
    }

    // Validar monto
    public static function validateAmount($amount) {
        if (empty($amount) && $amount !== 0 && $amount !== '0') {
            return "El monto es requerido.";
        }
        
        if (!is_numeric($amount)) {
            return "El monto debe ser un número válido.";
        }
        
        $amount = floatval($amount);
        
        if ($amount <= 0) {
            return "El monto debe ser mayor a 0.";
        }
        
        if ($amount > 999999999.99) {
            return "El monto es demasiado grande.";
        }
        
        return true;
    }

    // Validar fecha
    public static function validateDate($date, $format = 'Y-m-d') {
        if (empty($date)) {
            return "La fecha es requerida.";
        }
        
        $d = DateTime::createFromFormat($format, $date);
        
        if (!$d || $d->format($format) !== $date) {
            return "El formato de fecha no es válido. Use YYYY-MM-DD.";
        }
        
        // Verificar que la fecha no sea muy antigua (más de 10 años)
        $ten_years_ago = new DateTime('-10 years');
        if ($d < $ten_years_ago) {
            return "La fecha no puede ser anterior a " . $ten_years_ago->format('Y-m-d') . ".";
        }
        
        // Verificar que la fecha no sea futura (más de 1 día)
        $tomorrow = new DateTime('+1 day');
        if ($d > $tomorrow) {
            return "La fecha no puede ser futura.";
        }
        
        return true;
    }

    // Validar categoría
    public static function validateCategory($categoria) {
        if (empty($categoria)) {
            return "La categoría es requerida.";
        }
        
        if (strlen($categoria) < 2) {
            return "La categoría debe tener al menos 2 caracteres.";
        }
        
        if (strlen($categoria) > 100) {
            return "La categoría es demasiado larga.";
        }
        
        return true;
    }

    // Validar descripción
    public static function validateDescription($descripcion) {
        // La descripción es opcional
        if (empty($descripcion)) {
            return true;
        }
        
        if (strlen($descripcion) > 500) {
            return "La descripción es demasiado larga (máximo 500 caracteres).";
        }
        
        return true;
    }

    // Validar datos de registro de usuario
    public static function validateUserRegistration($data) {
        $errors = [];
        
        // Validar nombre
        $nombre_validation = self::validateName($data['nombre'] ?? '', 'nombre');
        if ($nombre_validation !== true) {
            $errors[] = $nombre_validation;
        }
        
        // Validar apellidos
        $apellidos_validation = self::validateName($data['apellidos'] ?? '', 'apellidos');
        if ($apellidos_validation !== true) {
            $errors[] = $apellidos_validation;
        }
        
        // Validar email
        $email_validation = self::validateEmail($data['email'] ?? '');
        if ($email_validation !== true) {
            $errors[] = $email_validation;
        }
        
        // Validar contraseña
        $password_validation = self::validatePassword($data['password'] ?? '');
        if ($password_validation !== true) {
            $errors[] = $password_validation;
        }
        
        return empty($errors) ? true : $errors;
    }

    // Validar datos de login
    public static function validateUserLogin($data) {
        $errors = [];
        
        // Validar email
        $email_validation = self::validateEmail($data['email'] ?? '');
        if ($email_validation !== true) {
            $errors[] = $email_validation;
        }
        
        // Validar contraseña
        if (empty($data['password'])) {
            $errors[] = "La contraseña es requerida.";
        }
        
        return empty($errors) ? true : $errors;
    }

    // Validar datos de movimiento
    public static function validateMovement($data) {
        $errors = [];
        
        // Validar fecha
        $fecha_validation = self::validateDate($data['fecha'] ?? '');
        if ($fecha_validation !== true) {
            $errors[] = $fecha_validation;
        }
        
        // Validar tipo
        $tipo_validation = self::validateMovementType($data['tipo'] ?? '');
        if ($tipo_validation !== true) {
            $errors[] = $tipo_validation;
        }
        
        // Validar categoría
        $categoria_validation = self::validateCategory($data['categoria'] ?? '');
        if ($categoria_validation !== true) {
            $errors[] = $categoria_validation;
        }
        
        // Validar monto
        $monto_validation = self::validateAmount($data['monto'] ?? '');
        if ($monto_validation !== true) {
            $errors[] = $monto_validation;
        }
        
        // Validar descripción (opcional)
        $descripcion_validation = self::validateDescription($data['descripcion'] ?? '');
        if ($descripcion_validation !== true) {
            $errors[] = $descripcion_validation;
        }
        
        return empty($errors) ? true : $errors;
    }

    // Sanitizar entrada de texto
    public static function sanitizeInput($input) {
        if (is_string($input)) {
            return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
        }
        return $input;
    }

    // Validar ID numérico
    public static function validateId($id, $field_name = "ID") {
        if (empty($id)) {
            return "El {$field_name} es requerido.";
        }
        
        if (!is_numeric($id)) {
            return "El {$field_name} debe ser un número válido.";
        }
        
        if (intval($id) <= 0) {
            return "El {$field_name} debe ser un número positivo.";
        }
        
        return true;
    }

    // Validar límite y offset para paginación
    public static function validatePagination($limit, $offset) {
        $errors = [];
        
        if (!is_numeric($limit) || intval($limit) <= 0 || intval($limit) > 100) {
            $errors[] = "El límite debe ser un número entre 1 y 100.";
        }
        
        if (!is_numeric($offset) || intval($offset) < 0) {
            $errors[] = "El offset debe ser un número mayor o igual a 0.";
        }
        
        return empty($errors) ? true : $errors;
    }
}
?>