<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $nombre;
    public $apellidos;
    public $email;
    public $password;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear nuevo usuario
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                 SET nombre=:nombre, apellidos=:apellidos, email=:email, password=:password";

        $stmt = $this->conn->prepare($query);

        // Limpiar datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->apellidos = htmlspecialchars(strip_tags($this->apellidos));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->password = password_hash($this->password, PASSWORD_BCRYPT);

        // Bind values
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":apellidos", $this->apellidos);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password", $this->password);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Verificar si el email ya existe
    public function emailExists() {
        $query = "SELECT id, nombre, apellidos, password FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        $num = $stmt->rowCount();
        if($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->nombre = $row['nombre'];
            $this->apellidos = $row['apellidos'];
            $this->password = $row['password'];
            return true;
        }
        return false;
    }

    // Obtener usuario por ID
    public function getUserById() {
        $query = "SELECT id, nombre, apellidos, email, created_at FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->nombre = $row['nombre'];
            $this->apellidos = $row['apellidos'];
            $this->email = $row['email'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    // Actualizar datos del usuario
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                 SET nombre=:nombre, apellidos=:apellidos 
                 WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        // Limpiar datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->apellidos = htmlspecialchars(strip_tags($this->apellidos));

        // Bind values
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":apellidos", $this->apellidos);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Cambiar contraseña
    public function changePassword($new_password) {
        $query = "UPDATE " . $this->table_name . " 
                 SET password=:password 
                 WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Validar credenciales
    public function validateCredentials($email, $password) {
        $this->email = $email;
        if($this->emailExists()) {
            if(password_verify($password, $this->password)) {
                return true;
            }
        }
        return false;
    }

    // Obtener estadísticas del usuario
    public function getUserStats() {
        $query = "SELECT 
                    COUNT(m.id) as total_movements,
                    SUM(CASE WHEN m.tipo = 'ingreso' THEN m.monto ELSE 0 END) as total_income,
                    SUM(CASE WHEN m.tipo = 'gasto' THEN m.monto ELSE 0 END) as total_expenses
                  FROM users u 
                  LEFT JOIN movements m ON u.id = m.user_id 
                  WHERE u.id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>