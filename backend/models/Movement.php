<?php
class Movement {
    private $conn;
    private $table_name = "movements";

    public $id;
    public $user_id;
    public $fecha;
    public $tipo; // ingreso o gasto
    public $categoria;
    public $monto;
    public $descripcion;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear nuevo movimiento
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                 SET user_id=:user_id, fecha=:fecha, tipo=:tipo, categoria=:categoria, 
                     monto=:monto, descripcion=:descripcion";

        $stmt = $this->conn->prepare($query);

        // Limpiar datos
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->fecha = htmlspecialchars(strip_tags($this->fecha));
        $this->tipo = htmlspecialchars(strip_tags($this->tipo));
        $this->categoria = htmlspecialchars(strip_tags($this->categoria));
        $this->monto = htmlspecialchars(strip_tags($this->monto));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":fecha", $this->fecha);
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":categoria", $this->categoria);
        $stmt->bindParam(":monto", $this->monto);
        $stmt->bindParam(":descripcion", $this->descripcion);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Obtener movimientos por usuario
    public function getByUserId($limit = 50, $offset = 0) {
        $query = "SELECT * FROM " . $this->table_name . " 
                 WHERE user_id = ? 
                 ORDER BY fecha DESC, created_at DESC 
                 LIMIT ? OFFSET ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id, PDO::PARAM_INT);
        $stmt->bindParam(2, $limit, PDO::PARAM_INT);
        $stmt->bindParam(3, $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt;
    }

    // Obtener balance del usuario
    public function getBalance() {
        $query = "SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance
                  FROM " . $this->table_name . " 
                  WHERE user_id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Obtener estadísticas por categorías
    public function getCategoriesStats() {
        $query = "SELECT categoria, tipo, SUM(monto) as total, COUNT(*) as cantidad
                  FROM " . $this->table_name . " 
                  WHERE user_id = ? 
                  GROUP BY categoria, tipo
                  ORDER BY total DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->execute();

        return $stmt;
    }

    // Obtener estadísticas mensuales
    public function getMonthlyStats($year) {
        $query = "SELECT 
                    MONTH(fecha) as mes,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
                  FROM " . $this->table_name . " 
                  WHERE user_id = ? AND YEAR(fecha) = ?
                  GROUP BY MONTH(fecha)
                  ORDER BY mes";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $year);
        $stmt->execute();

        return $stmt;
    }

    // Obtener movimientos por rango de fechas
    public function getByDateRange($start_date, $end_date) {
        $query = "SELECT * FROM " . $this->table_name . " 
                 WHERE user_id = ? AND fecha BETWEEN ? AND ?
                 ORDER BY fecha DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $start_date);
        $stmt->bindParam(3, $end_date);
        $stmt->execute();

        return $stmt;
    }

    // Obtener movimientos por categoría
    public function getByCategory($categoria) {
        $query = "SELECT * FROM " . $this->table_name . " 
                 WHERE user_id = ? AND categoria = ?
                 ORDER BY fecha DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $categoria);
        $stmt->execute();

        return $stmt;
    }

    // Obtener movimientos por tipo
    public function getByType($tipo) {
        $query = "SELECT * FROM " . $this->table_name . " 
                 WHERE user_id = ? AND tipo = ?
                 ORDER BY fecha DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $tipo);
        $stmt->execute();

        return $stmt;
    }

    // Actualizar movimiento
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                 SET fecha=:fecha, tipo=:tipo, categoria=:categoria, 
                     monto=:monto, descripcion=:descripcion
                 WHERE id=:id AND user_id=:user_id";

        $stmt = $this->conn->prepare($query);

        // Limpiar datos
        $this->fecha = htmlspecialchars(strip_tags($this->fecha));
        $this->tipo = htmlspecialchars(strip_tags($this->tipo));
        $this->categoria = htmlspecialchars(strip_tags($this->categoria));
        $this->monto = htmlspecialchars(strip_tags($this->monto));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));

        // Bind values
        $stmt->bindParam(":fecha", $this->fecha);
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":categoria", $this->categoria);
        $stmt->bindParam(":monto", $this->monto);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Eliminar movimiento
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->bindParam(2, $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Obtener resumen financiero de los últimos N días
    public function getRecentSummary($days = 30) {
        $query = "SELECT 
                    COUNT(*) as total_movements,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as recent_income,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as recent_expenses,
                    AVG(CASE WHEN tipo = 'ingreso' THEN monto END) as avg_income,
                    AVG(CASE WHEN tipo = 'gasto' THEN monto END) as avg_expense
                  FROM " . $this->table_name . " 
                  WHERE user_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $days);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Obtener las categorías más utilizadas
    public function getTopCategories($limit = 5) {
        $query = "SELECT categoria, COUNT(*) as count, SUM(monto) as total
                  FROM " . $this->table_name . " 
                  WHERE user_id = ?
                  GROUP BY categoria
                  ORDER BY count DESC
                  LIMIT ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt;
    }
}
?>