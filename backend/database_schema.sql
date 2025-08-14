-- Crear base de datos
CREATE DATABASE IF NOT EXISTS fidefinance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fidefinance;

-- Tabla de usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Tabla de movimientos financieros
CREATE TABLE movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    fecha DATE NOT NULL,
    tipo ENUM('ingreso', 'gasto') NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_fecha (user_id, fecha),
    INDEX idx_tipo (tipo),
    INDEX idx_categoria (categoria)
);

-- Tabla de categorías predefinidas
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('ingreso', 'gasto') NOT NULL,
    color VARCHAR(7) DEFAULT '#007bff',
    icon VARCHAR(50) DEFAULT 'fas fa-circle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_type (nombre, tipo)
);

-- Insertar categorías predefinidas
INSERT INTO categories (nombre, tipo, color, icon) VALUES
-- Categorías de gastos
('Alimentación', 'gasto', '#ff6b6b', 'fas fa-utensils'),
('Transporte', 'gasto', '#4ecdc4', 'fas fa-car'),
('Vivienda', 'gasto', '#45b7d1', 'fas fa-home'),
('Servicios', 'gasto', '#f9ca24', 'fas fa-bolt'),
('Salud', 'gasto', '#6c5ce7', 'fas fa-heartbeat'),
('Entretenimiento', 'gasto', '#fd79a8', 'fas fa-gamepad'),
('Educación', 'gasto', '#00b894', 'fas fa-graduation-cap'),
('Ropa', 'gasto', '#e17055', 'fas fa-tshirt'),
('Otros gastos', 'gasto', '#636e72', 'fas fa-shopping-cart'),

-- Categorías de ingresos
('Salario', 'ingreso', '#00b894', 'fas fa-money-bill-wave'),
('Freelance', 'ingreso', '#fdcb6e', 'fas fa-laptop'),
('Inversiones', 'ingreso', '#6c5ce7', 'fas fa-chart-line'),
('Ventas', 'ingreso', '#fd79a8', 'fas fa-tag'),
('Bonos', 'ingreso', '#55a3ff', 'fas fa-gift'),
('Otros ingresos', 'ingreso', '#00cec9', 'fas fa-plus-circle');

-- Crear índices adicionales para optimización
CREATE INDEX idx_movements_user_tipo_fecha ON movements(user_id, tipo, fecha);
CREATE INDEX idx_movements_categoria_tipo ON movements(categoria, tipo);

-- Vista para resumen de balance por usuario
CREATE VIEW user_balance_summary AS
SELECT 
    u.id as user_id,
    u.nombre,
    u.apellidos,
    u.email,
    COALESCE(SUM(CASE WHEN m.tipo = 'ingreso' THEN m.monto END), 0) as total_ingresos,
    COALESCE(SUM(CASE WHEN m.tipo = 'gasto' THEN m.monto END), 0) as total_gastos,
    COALESCE(SUM(CASE WHEN m.tipo = 'ingreso' THEN m.monto ELSE -m.monto END), 0) as balance_total,
    COUNT(m.id) as total_movimientos
FROM users u
LEFT JOIN movements m ON u.id = m.user_id
GROUP BY u.id, u.nombre, u.apellidos, u.email;