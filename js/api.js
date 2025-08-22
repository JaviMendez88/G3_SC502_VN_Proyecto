class FideFinanceAPI {
    constructor() {
        this.baseURL = '../backend/api';
        this.token = localStorage.getItem('fidefinance_token');
    }

    // === VALIDAR TOKEN ===
    async validateToken() {
        if (!this.token) {
            return false;
        }

        try {
            // Hacer una petición simple para validar el token
            const response = await fetch(`${this.baseURL}/auth.php?action=validate`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.status === 401) {
                console.log('Token expirado o inválido, limpiando sesión');
                this.clearSession();
                return false;
            }

            return response.ok;
        } catch (error) {
            console.warn('Error validando token:', error);
            return false;
        }
    }

    // === LIMPIAR SESIÓN ===
    clearSession() {
        this.token = null;
        localStorage.removeItem('fidefinance_token');
        localStorage.removeItem('fidefinance_user');
    }

    // === MANEJAR RESPUESTA 401 ===
    handleUnauthorized() {
        console.log('Sesión expirada, redirigiendo al login');
        this.clearSession();
        alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        window.location.href = 'user_logIn.html';
    }

    // === HACER REQUEST CON MANEJO DE 401 ===
    async makeAuthenticatedRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                    ...options.headers
                }
            });

            // Manejar error 401
            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('Sesión expirada');
            }

            return response;
        } catch (error) {
            console.error('Error en request autenticado:', error);
            throw error;
        }
    }

    // === REGISTRO DE USUARIO ===
    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth.php?action=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Usuario registrado exitosamente');
                return result;
            } else {
                alert('Error: ' + (result.error || 'Error desconocido'));
                throw new Error(result.error || 'Error en registro');
            }
        } catch (error) {
            alert('Error de conexión: ' + error.message);
            throw error;
        }
    }

    // === LOGIN DE USUARIO ===
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/auth.php?action=login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();
            
            if (result.success) {
                // Guardar datos de sesión
                this.token = result.token;
                localStorage.setItem('fidefinance_token', result.token);
                localStorage.setItem('fidefinance_user', JSON.stringify(result.user));
                
                console.log('Login exitoso, token guardado:', this.token ? 'SÍ' : 'NO');
                alert('Login exitoso. ¡Bienvenido ' + result.user.nombre + '!');
                return result;
            } else {
                alert('Error: ' + (result.error || 'Credenciales incorrectas'));
                throw new Error(result.error || 'Error en login');
            }
        } catch (error) {
            alert('Error de conexión: ' + error.message);
            throw error;
        }
    }

    // === CREAR MOVIMIENTO ===
    async createMovement(movementData) {
        try {
            const response = await this.makeAuthenticatedRequest(`${this.baseURL}/movements.php`, {
                method: 'POST',
                body: JSON.stringify(movementData)
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Movimiento guardado exitosamente');
                return result;
            } else {
                alert('Error: ' + (result.error || 'Error al guardar'));
                throw new Error(result.error || 'Error al crear movimiento');
            }
        } catch (error) {
            if (error.message === 'Sesión expirada') {
                return; // Ya se maneja la redirección
            }
            alert('Error: ' + error.message);
            throw error;
        }
    }

    // === OBTENER MOVIMIENTOS  ===
    async getMovements(limit = 100, offset = 0) {
        try {
            console.log('Obteniendo movimientos, token disponible:', !!this.token);
            
            const url = `${this.baseURL}/movements.php?limit=${limit}&offset=${offset}`;
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'GET'
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('Movimientos cargados exitosamente:', result.movements?.length || 0);
                return result;
            } else {
                throw new Error(result.error || 'Error al cargar movimientos');
            }
        } catch (error) {
            console.error('Error cargando movimientos:', error);
            
            if (error.message === 'Sesión expirada') {
                // No mostrar alert adicional, ya se maneja en handleUnauthorized
                return { success: false, movements: [], error: 'Sesión expirada' };
            }
            
            // Para otros errores, devolver respuesta con datos vacíos
            console.warn('Usando datos de fallback debido a error:', error.message);
            return { success: false, movements: [], error: error.message };
        }
    }

    // === ELIMINAR MOVIMIENTO ===
    async deleteMovement(id) {
        try {
            const response = await this.makeAuthenticatedRequest(`${this.baseURL}/movements.php?id=${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Movimiento eliminado exitosamente');
                return result;
            } else {
                alert('Error: ' + (result.error || 'Error al eliminar'));
                throw new Error(result.error || 'Error al eliminar movimiento');
            }
        } catch (error) {
            if (error.message === 'Sesión expirada') {
                return;
            }
            alert('Error: ' + error.message);
            throw error;
        }
    }

    // === OBTENER RESUMEN DEL DASHBOARD ===
    async getDashboardSummary() {
        try {
            const response = await this.makeAuthenticatedRequest(`${this.baseURL}/dashboard.php?action=summary`, {
                method: 'GET'
            });

            const result = await response.json();
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.error || 'Error al cargar dashboard');
            }
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            
            if (error.message === 'Sesión expirada') {
                return { success: false, error: 'Sesión expirada' };
            }
            
            // Devolver datos por defecto en caso de error
            return {
                success: true,
                summary: {
                    total_ingresos: 0,
                    total_gastos: 0,
                    balance_total: 0,
                    total_movimientos: 0
                }
            };
        }
    }

    // === OBTENER DATOS COMPLETOS DEL DASHBOARD ===
async getDashboard() {
    try {
        const response = await this.makeAuthenticatedRequest(`${this.baseURL}/dashboard.php`, {
            method: 'GET'
        });
        
        const responseText = await response.text();
        
        // Intentar parsear JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Respuesta del servidor no es JSON válido');
        }
        
        if (result.success) {
            return result;
        } else {
            throw new Error(result.error || 'Error al cargar dashboard completo');
        }
    } catch (error) {
        
        if (error.message === 'Sesión expirada') {
            return { success: false, error: 'Sesión expirada' };
        }
        
        // Devolver estructura básica en caso de error
        return {
            success: true,
            data: {
                user: this.getCurrentUser(),
                balance: {
                    total_ingresos: 0,
                    total_gastos: 0,
                    balance_total: 0,
                    savings_rate: 0
                },
                recent_movements: [],
                monthly_stats: [],
                categories_stats: [],
                current_month_summary: {
                    total_movements: 0,
                    recent_income: 0,
                    recent_expenses: 0,
                    daily_average: 0
                },
                top_categories: []
            }
        };
    }
}

  // === OBTENER CATEGORÍAS  ===
async getCategories() {
    try {
        console.log('Obteniendo categorías...');
        
        const response = await this.makeAuthenticatedRequest(`${this.baseURL}/categories.php`, {
            method: 'GET'
        })
        
        const result = await response.json();
        
        console.log('Respuesta categorías:', result);
        
        if (result.success) {
            console.log('Categorías cargadas exitosamente:', result.data?.all?.length || 0);
            return result;
        } else {
            throw new Error(result.error || 'Error al cargar categorías');
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        
        if (error.message === 'Sesión expirada') {
            return { success: false, error: 'Sesión expirada' };
        }
        
        // Devolver categorías por defecto con el formato correcto
        console.warn('Usando categorías de fallback');
        return {
            success: true,
            data: {
                all: [
                    { nombre: 'Alimentación', tipo: 'gasto', icon: 'fas fa-utensils', color: '#ff6b6b' },
                    { nombre: 'Transporte', tipo: 'gasto', icon: 'fas fa-car', color: '#4ecdc4' },
                    { nombre: 'Entretenimiento', tipo: 'gasto', icon: 'fas fa-gamepad', color: '#fd79a8' },
                    { nombre: 'Servicios', tipo: 'gasto', icon: 'fas fa-bolt', color: '#f9ca24' },
                    { nombre: 'Salario', tipo: 'ingreso', icon: 'fas fa-money-bill-wave', color: '#00b894' },
                    { nombre: 'Freelance', tipo: 'ingreso', icon: 'fas fa-laptop', color: '#fdcb6e' },
                    { nombre: 'Otros ingresos', tipo: 'ingreso', icon: 'fas fa-plus-circle', color: '#00cec9' }
                ]
            },
            total: 7
        };
    }
}

// ALTERNATIVA: Si makeAuthenticatedRequest YA hace .json() internamente
async getCategoriesAlternative() {
    try {
        console.log('Obteniendo categorías (alternativa)...');
        
        const result = await this.makeAuthenticatedRequest(`${this.baseURL}/categories.php`, {
            method: 'GET'
        });
        
        console.log('Respuesta categorías (alternativa):', result);
        
        if (result.success) {
            console.log('Categorías cargadas exitosamente:', result.data?.all?.length || 0);
            return result;
        } else {
            throw new Error(result.error || 'Error al cargar categorías');
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

    // === OBTENER RECOMENDACIONES ===
    async getRecommendations() {
        try {
            const response = await this.makeAuthenticatedRequest(`${this.baseURL}/recommendations.php`, {
                method: 'GET'
            });

            const result = await response.json();
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.error || 'Error al cargar recomendaciones');
            }
        } catch (error) {
            console.error('Error cargando recomendaciones:', error);
            
            if (error.message === 'Sesión expirada') {
                return { success: false, error: 'Sesión expirada' };
            }
            
            // Devolver recomendaciones por defecto
            return {
                success: true,
                recommendations: [
                    {
                        titulo: 'Controla tus gastos',
                        mensaje: 'Revisa tus gastos semanalmente para mantener un mejor control.',
                        prioridad: 'media',
                        icono: 'fas fa-chart-pie'
                    },
                    {
                        titulo: 'Aumenta tus ahorros',
                        mensaje: 'Intenta ahorrar al menos el 20% de tus ingresos mensuales.',
                        prioridad: 'alta',
                        icono: 'fas fa-piggy-bank'
                    }
                ]
            };
        }
    }

    // === VERIFICAR SI ESTÁ LOGUEADO (MEJORADO) ===
    isAuthenticated() {
        const hasToken = !!this.token;
        const hasUser = !!this.getCurrentUser();
        
        console.log('Verificando autenticación:', {
            hasToken,
            hasUser,
            tokenLength: this.token ? this.token.length : 0
        });
        
        return hasToken && hasUser;
    }

    // === OBTENER USUARIO ACTUAL ===
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('fidefinance_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    }

    // === CERRAR SESIÓN ===
    logout() {
        this.clearSession();
        alert('Sesión cerrada exitosamente');
        window.location.href = 'user_logIn.html';
    }

    // === VALIDAR EMAIL ===
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // === FORMATEAR MONEDA ===
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

    // === MOSTRAR MENSAJE (PARA COMPATIBILIDAD) ===
    showMessage(message, type = 'info', duration = 3000) {
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        alert(`${emoji} ${message}`);
    }

    // === HACER REQUEST GENÉRICO (MEJORADO) ===
    async makeRequest(endpoint, method = 'GET', data = null) {
        try {
            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (this.token) {
                config.headers['Authorization'] = `Bearer ${this.token}`;
            }

            if (data && method !== 'GET') {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            // Manejar 401
            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('Sesión expirada');
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error en request:', error);
            throw error;
        }
    }
}

// Crear instancia global
const api = new FideFinanceAPI();

// Función global para cerrar sesión (para compatibilidad)
window.cerrarSesion = function() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
};

// Verificar autenticación simple (función de utilidad MEJORADA)
function checkAuth() {
    if (!api.isAuthenticated()) {
        console.log('Usuario no autenticado, redirigiendo al login');
        alert('Debes iniciar sesión para acceder');
        window.location.href = 'user_logIn.html';
        return false;
    }
    return true;
}

// Función de inicialización opcional (MEJORADA)
function initializeAPI() {
    console.log('FideFinance API inicializada');
    console.log('Usuario autenticado:', api.isAuthenticated());
    
    if (api.isAuthenticated()) {
        const user = api.getCurrentUser();
        console.log('Usuario actual:', user?.nombre || 'Desconocido');
        console.log('Token presente:', !!api.token);
    } else {
        console.log('No hay sesión activa');
    }
}

// Auto-inicializar cuando se carga el script
document.addEventListener('DOMContentLoaded', initializeAPI);