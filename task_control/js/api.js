// Configuración de la API
class FideFinanceAPI {
    constructor(baseURL = 'http://localhost/G3_SC502_VN_Proyecto/backend/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('fidefinance_token');
    }

    // Método genérico para hacer requests
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
                // Manejar errores específicos
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
                }
                throw new Error(result.message || `Error ${response.status}: ${response.statusText}`);
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

    // Métodos de autenticación
    async register(userData) {
        try {
            const result = await this.makeRequest('/register', 'POST', userData);
            return result;
        } catch (error) {
            throw new Error('Error en el registro: ' + error.message);
        }
    }

    async login(credentials) {
        try {
            const result = await this.makeRequest('/login', 'POST', credentials);
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('fidefinance_token', result.token);
                localStorage.setItem('fidefinance_user', JSON.stringify(result.user));
                // Mantener compatibilidad con código existente
                sessionStorage.setItem('usuarioActivo', result.user.email);
            }
            return result;
        } catch (error) {
            throw new Error('Error en el login: ' + error.message);
        }
    }

    // Métodos de usuario
    async getUser() {
        try {
            return await this.makeRequest('/user');
        } catch (error) {
            throw new Error('Error al obtener datos del usuario: ' + error.message);
        }
    }

    async updateUser(userData) {
        try {
            return await this.makeRequest('/user', 'PUT', userData);
        } catch (error) {
            throw new Error('Error al actualizar usuario: ' + error.message);
        }
    }

    // Métodos de movimientos
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

            return await this.makeRequest('/movements', 'POST', movementData);
        } catch (error) {
            throw new Error('Error al crear movimiento: ' + error.message);
        }
    }

    async getMovements(limit = 50, offset = 0) {
        try {
            return await this.makeRequest(`/movements?limit=${limit}&offset=${offset}`);
        } catch (error) {
            throw new Error('Error al obtener movimientos: ' + error.message);
        }
    }

    async deleteMovement(id) {
        try {
            if (!id) {
                throw new Error('ID del movimiento es requerido');
            }
            return await this.makeRequest(`/movements?id=${id}`, 'DELETE');
        } catch (error) {
            throw new Error('Error al eliminar movimiento: ' + error.message);
        }
    }

    // Dashboard
    async getDashboard() {
        try {
            return await this.makeRequest('/dashboard');
        } catch (error) {
            throw new Error('Error al cargar dashboard: ' + error.message);
        }
    }

    // Categorías
    async getCategories(type = null) {
        try {
            const url = type ? `/categories?tipo=${type}` : '/categories';
            return await this.makeRequest(url);
        } catch (error) {
            throw new Error('Error al cargar categorías: ' + error.message);
        }
    }

    // Estadísticas
    async getStats(type = 'general', year = null, month = null) {
        try {
            let url = `/stats?type=${type}`;
            if (year) url += `&year=${year}`;
            if (month) url += `&month=${month}`;
            return await this.makeRequest(url);
        } catch (error) {
            throw new Error('Error al cargar estadísticas: ' + error.message);
        }
    }

    // Recomendaciones
    async getRecommendations() {
        try {
            return await this.makeRequest('/recommendations');
        } catch (error) {
            throw new Error('Error al cargar recomendaciones: ' + error.message);
        }
    }

    // Verificar autenticación
    isAuthenticated() {
        const token = this.token || localStorage.getItem('fidefinance_token');
        if (!token) return false;

        try {
            // Verificar si el token no ha expirado (básico)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            
            if (payload.exp && payload.exp < now) {
                this.logout();
                return false;
            }
            
            return true;
        } catch (error) {
            // Si no se puede decodificar el token, es inválido
            this.logout();
            return false;
        }
    }

    // Obtener usuario actual
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('fidefinance_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error al obtener usuario actual:', error);
            return null;
        }
    }

    // Logout mejorado
    logout() {
        try {
            // Limpiar todos los datos de sesión
            this.token = null;
            localStorage.removeItem('fidefinance_token');
            localStorage.removeItem('fidefinance_user');
            localStorage.removeItem('fidefinance_user_extra');
            sessionStorage.removeItem('usuarioActivo');
            
            // Redireccionar al login
            window.location.href = 'user_logIn.html';
        } catch (error) {
            console.error('Error durante logout:', error);
            // Forzar redirección aún con error
            window.location.href = 'user_logIn.html';
        }
    }

    // Función mejorada para mostrar mensajes
    showMessage(message, type = 'info', duration = 5000) {
        try {
            // Crear contenedor de mensajes si no existe
            let messageContainer = document.getElementById('message-container');
            if (!messageContainer) {
                messageContainer = document.createElement('div');
                messageContainer.id = 'message-container';
                messageContainer.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    min-width: 300px;
                    max-width: 500px;
                `;
                document.body.appendChild(messageContainer);
            }

            // Crear elemento de mensaje
            const messageDiv = document.createElement('div');
            const alertClass = {
                'error': 'alert-danger',
                'success': 'alert-success',
                'warning': 'alert-warning',
                'info': 'alert-info'
            }[type] || 'alert-info';

            const icon = {
                'error': 'fas fa-exclamation-circle',
                'success': 'fas fa-check-circle',
                'warning': 'fas fa-exclamation-triangle',
                'info': 'fas fa-info-circle'
            }[type] || 'fas fa-info-circle';

            messageDiv.className = `alert ${alertClass} alert-dismissible fade show shadow`;
            messageDiv.style.marginBottom = '10px';
            
            messageDiv.innerHTML = `
                <i class="${icon} me-2"></i>
                ${message}
                <button type="button" class="btn-close" onclick="this.parentElement.remove()" aria-label="Cerrar"></button>
            `;

            // Agregar animación de entrada
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100%)';
            messageContainer.appendChild(messageDiv);

            // Animar entrada
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.3s ease-in-out';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateX(0)';
            }, 10);

            // Auto-remover después del tiempo especificado
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.style.opacity = '0';
                    messageDiv.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (messageDiv.parentNode) {
                            messageDiv.parentNode.removeChild(messageDiv);
                        }
                    }, 300);
                }
            }, duration);

        } catch (error) {
            console.error('Error mostrando mensaje:', error);
            // Fallback a alert nativo
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Método para verificar conectividad con el backend
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Método para formatear moneda
    formatCurrency(amount, currency = '₡') {
        try {
            const number = parseFloat(amount) || 0;
            return `${currency} ${number.toLocaleString('es-CR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        } catch (error) {
            return `${currency} 0.00`;
        }
    }

    // Método para formatear fechas
    formatDate(dateString, locale = 'es-CR') {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    // Método para validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Método para sanitizar inputs
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }

    // Método para manejar errores de red
    handleNetworkError(error) {
        if (!navigator.onLine) {
            this.showMessage('Sin conexión a internet. Verifica tu conexión.', 'error');
            return;
        }

        if (error.message.includes('fetch')) {
            this.showMessage('Error de conexión con el servidor. Inténtalo más tarde.', 'error');
            return;
        }

        this.showMessage(error.message || 'Error desconocido', 'error');
    }
}

// Instancia global
const api = new FideFinanceAPI();

// Función de compatibilidad para verificar autenticación
function checkAuth() {
    if (!api.isAuthenticated() && !sessionStorage.getItem('usuarioActivo')) {
        window.location.href = 'user_logIn.html';
        return false;
    }
    return true;
}

// Funciones globales de utilidad
window.cerrarSesion = function() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
};

// Manejo global de errores no capturados
window.addEventListener('unhandledrejection', function(event) {
    console.error('Error no capturado:', event.reason);
    if (api && typeof api.handleNetworkError === 'function') {
        api.handleNetworkError(event.reason);
    }
});

// Verificar conexión al cargar
document.addEventListener('DOMContentLoaded', async function() {
    if (api && typeof api.checkConnection === 'function') {
        const isConnected = await api.checkConnection();
        if (!isConnected && api.isAuthenticated()) {
            api.showMessage('Problemas de conexión con el servidor', 'warning', 8000);
        }
    }
});