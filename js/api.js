// Configuración optimizada de la API para FideFinance
class FideFinanceAPI {
    constructor(baseURL = '../Backend/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('fidefinance_token');
    }

    // Método genérico optimizado para hacer requests
    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        // Agregar token si existe
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method,
            headers,
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const result = await response.json();

            if (!response.ok) {
                // Manejar errores del backend PHP
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
                }
                throw new Error(result.error || `Error ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            
            // Si es un error de red
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Error de conexión. Verifica que el servidor esté funcionando.');
            }
            
            throw error;
        }
    }

    // === MÉTODOS DE AUTENTICACIÓN ===
    async register(userData) {
        try {
            // Validaciones básicas
            if (!userData.email || !this.isValidEmail(userData.email)) {
                throw new Error('Email inválido');
            }
            if (!userData.password || userData.password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }
            if (!userData.nombre || !userData.apellidos) {
                throw new Error('Nombre y apellidos son requeridos');
            }

            // Sanitizar datos
            const cleanData = {
                nombre: this.sanitizeInput(userData.nombre),
                apellidos: this.sanitizeInput(userData.apellidos),
                email: this.sanitizeInput(userData.email).toLowerCase(),
                password: userData.password
            };

            const result = await this.makeRequest('/auth?action=register', 'POST', cleanData);
            
            if (result.success) {
                this.showMessage('Usuario registrado exitosamente', 'success');
            }
            
            return result;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    async login(credentials) {
        try {
            // Validaciones
            if (!credentials.email || !credentials.password) {
                throw new Error('Email y contraseña son requeridos');
            }

            const cleanCredentials = {
                email: this.sanitizeInput(credentials.email).toLowerCase(),
                password: credentials.password
            };

            const result = await this.makeRequest('/auth?action=login', 'POST', cleanCredentials);
            
            if (result.success && result.token) {
                this.token = result.token;
                localStorage.setItem('fidefinance_token', result.token);
                localStorage.setItem('fidefinance_user', JSON.stringify(result.user));
                this.showMessage(`Bienvenido ${result.user.nombre}!`, 'success');
            }
            
            return result;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // === MÉTODOS DE MOVIMIENTOS ===
    async createMovement(movementData) {
        try {
            // Validaciones del lado cliente
            if (!movementData.fecha || !movementData.tipo || !movementData.categoria || !movementData.monto) {
                throw new Error('Todos los campos obligatorios deben estar completos');
            }

            if (parseFloat(movementData.monto) <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }

            if (!['ingreso', 'gasto'].includes(movementData.tipo)) {
                throw new Error('El tipo debe ser "ingreso" o "gasto"');
            }

            // Sanitizar y formatear datos
            const cleanData = {
                fecha: movementData.fecha,
                tipo: movementData.tipo,
                categoria: this.sanitizeInput(movementData.categoria),
                monto: parseFloat(movementData.monto),
                descripcion: movementData.descripcion ? this.sanitizeInput(movementData.descripcion) : null
            };

            const result = await this.makeRequest('/movements', 'POST', cleanData);
            
            if (result.success) {
                this.showMessage('Movimiento guardado exitosamente', 'success');
            }
            
            return result;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    async getMovements(params = {}) {
        try {
            const { limit = 50, offset = 0, tipo = null, categoria = null } = params;
            
            let url = `/movements?limit=${limit}&offset=${offset}`;
            if (tipo) url += `&tipo=${tipo}`;
            if (categoria) url += `&categoria=${encodeURIComponent(categoria)}`;
            
            return await this.makeRequest(url);
        } catch (error) {
            this.showMessage('Error al cargar movimientos', 'error');
            throw error;
        }
    }

    async updateMovement(id, movementData) {
        try {
            if (!id) {
                throw new Error('ID del movimiento es requerido');
            }

            const result = await this.makeRequest(`/movements?id=${id}`, 'PUT', movementData);
            
            if (result.success) {
                this.showMessage('Movimiento actualizado exitosamente', 'success');
            }
            
            return result;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    async deleteMovement(id) {
        try {
            if (!id) {
                throw new Error('ID del movimiento es requerido');
            }
            
            const result = await this.makeRequest(`/movements?id=${id}`, 'DELETE');
            
            if (result.success) {
                this.showMessage('Movimiento eliminado exitosamente', 'success');
            }
            
            return result;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // === MÉTODOS DE DASHBOARD ===
    async getDashboardSummary() {
        try {
            return await this.makeRequest('/dashboard?action=summary');
        } catch (error) {
            this.showMessage('Error al cargar resumen del dashboard', 'error');
            throw error;
        }
    }

    async getMonthlyData(months = 12) {
        try {
            return await this.makeRequest(`/dashboard?action=monthly&months=${months}`);
        } catch (error) {
            this.showMessage('Error al cargar datos mensuales', 'error');
            throw error;
        }
    }

    async getCategoriesData() {
        try {
            return await this.makeRequest('/dashboard?action=categories');
        } catch (error) {
            this.showMessage('Error al cargar datos de categorías', 'error');
            throw error;
        }
    }

    // === MÉTODOS DE CATEGORÍAS ===
    async getCategories(tipo = null) {
        try {
            const url = tipo ? `/categories?tipo=${tipo}` : '/categories';
            return await this.makeRequest(url);
        } catch (error) {
            this.showMessage('Error al cargar categorías', 'error');
            throw error;
        }
    }

    // === MÉTODOS DE AUTENTICACIÓN Y SESIÓN ===
    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('fidefinance_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error al obtener usuario actual:', error);
            return null;
        }
    }

    logout() {
        try {
            this.token = null;
            localStorage.removeItem('fidefinance_token');
            localStorage.removeItem('fidefinance_user');
            this.showMessage('Sesión cerrada exitosamente', 'info');
            
            // Redireccionar después de un momento
            setTimeout(() => {
                window.location.href = 'user_logIn.html';
            }, 1000);
        } catch (error) {
            console.error('Error durante logout:', error);
            window.location.href = 'user_logIn.html';
        }
    }

    // === UTILIDADES ===
    showMessage(message, type = 'info', duration = 4000) {
        try {
            // Crear contenedor si no existe
            let container = document.getElementById('message-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'message-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    min-width: 300px;
                    max-width: 500px;
                `;
                document.body.appendChild(container);
            }

            // Crear mensaje
            const messageDiv = document.createElement('div');
            const colors = {
                'error': '#dc3545',
                'success': '#28a745',
                'warning': '#ffc107',
                'info': '#17a2b8'
            };

            const icons = {
                'error': '⚠️',
                'success': '✅',
                'warning': '⚠️',
                'info': 'ℹ️'
            };

            messageDiv.style.cssText = `
                background: ${colors[type] || colors.info};
                color: white;
                padding: 12px 16px;
                border-radius: 6px;
                margin-bottom: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: Arial, sans-serif;
                font-size: 14px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;

            messageDiv.innerHTML = `
                <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
                ${message}
                <button onclick="this.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    float: right;
                    cursor: pointer;
                    font-size: 16px;
                    margin-left: 10px;
                ">×</button>
            `;

            container.appendChild(messageDiv);

            // Animar entrada
            setTimeout(() => {
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateX(0)';
            }, 10);

            // Auto-remover
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.style.opacity = '0';
                    messageDiv.style.transform = 'translateX(100%)';
                    setTimeout(() => messageDiv.remove(), 300);
                }
            }, duration);

        } catch (error) {
            console.error('Error mostrando mensaje:', error);
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    formatCurrency(amount) {
        try {
            const number = parseFloat(amount) || 0;
            return `₡${number.toLocaleString('es-CR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        } catch (error) {
            return '₡0.00';
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-CR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }

    // Verificar conexión con el backend
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/../index.php`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Instancia global
const api = new FideFinanceAPI();

// Función simple para verificar autenticación
function checkAuth() {
    if (!api.isAuthenticated()) {
        window.location.href = 'user_logIn.html';
        return false;
    }
    return true;
}

// Función global para cerrar sesión
window.cerrarSesion = function() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
};

// Verificar conexión al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    const isConnected = await api.checkConnection();
    if (!isConnected && api.isAuthenticated()) {
        api.showMessage('Problemas de conexión con el servidor', 'warning', 8000);
    }
});