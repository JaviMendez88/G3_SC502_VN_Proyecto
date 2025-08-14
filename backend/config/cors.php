<?php
function setCorsHeaders() {
    // Permitir cualquier origen (en producción, especifica tu dominio)
    header("Access-Control-Allow-Origin: *");
    
    // Tipo de contenido
    header("Content-Type: application/json; charset=UTF-8");
    
    // Métodos permitidos
    header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
    
    // Tiempo máximo de cache para preflight
    header("Access-Control-Max-Age: 3600");
    
    // Headers permitidos
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
?>