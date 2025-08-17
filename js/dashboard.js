let dashboardData = null;
let currentUser = null;
let monthlyChart = null;
let categoriesChart = null;
let allMovements = []; //array para almacenar movimientos

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando Dashboard...');
    
    // Verificar autenticación
    if (!api.isAuthenticated()) {
        alert('Debes iniciar sesión para acceder');
        window.location.href = 'user_logIn.html';
        return;
    }

    // Configurar modal
    preloadCategoriesOnModalOpen();
    
    // Cargar dashboard CORREGIDO
    await loadDashboard();
});

//Cargar todos los datos del dashboard
async function loadDashboard() {
    try {
        showLoading(true);
        
        // Obtener usuario actual
        currentUser = api.getCurrentUser();
        
        //Usar getMovements en lugar de getDashboard
        console.log('Cargando movimientos...');
        await loadMovements();
        
        // Procesar datos desde movimientos
        dashboardData = processMovementsData();
        
        // Actualizar UI
        updateUserHeader();
        updateQuickStats();
        updateCurrentMonthSummary();
        updateRecentMovements();
        updateTopCategories();
        
        //Crear gráficos siempre 
        createMonthlyChart();
        createCategoriesChart();
        
        showLoading(false);
        console.log('✅ Dashboard cargado correctamente');
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showError('Error al cargar el dashboard: ' + error.message);
        showLoading(false);
    }
}

//Cargar movimientos (igual que en charts.js)
async function loadMovements() {
    try {
        const response = await api.getMovements(1000);
        allMovements = response.movements || [];
        console.log(`Cargados ${allMovements.length} movimientos`);
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        // Generar datos de ejemplo
        allMovements = generateSampleMovements();
        console.log(`Generados ${allMovements.length} movimientos de ejemplo`);
    }
}

//Procesar movimientos para crear dashboardData
function processMovementsData() {
    console.log('Procesando datos de movimientos...');
    
    // Obtener últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentMovements = allMovements.filter(mov => 
        new Date(mov.fecha) >= sixMonthsAgo
    );
    
    // Calcular estadísticas básicas
    const totalIngresos = recentMovements
        .filter(mov => mov.tipo === 'ingreso')
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
        
    const totalGastos = recentMovements
        .filter(mov => mov.tipo === 'gasto')
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
    
    const balanceTotal = totalIngresos - totalGastos;
    const savingsRate = totalIngresos > 0 ? ((balanceTotal / totalIngresos) * 100).toFixed(1) : 0;
    
    // Generar estadísticas mensuales
    const monthlyStats = generateMonthlyStats();
    
    // Generar estadísticas de categorías
    const categoriesStats = generateCategoriesStats();
    
    // Obtener mes actual
    const currentMonthSummary = getCurrentMonthSummary();
    
    // Top categorías
    const topCategories = getTopCategories();
    
    return {
        balance: {
            total_ingresos: totalIngresos,
            total_gastos: totalGastos,
            balance_total: balanceTotal,
            savings_rate: savingsRate
        },
        monthly_stats: monthlyStats,
        categories_stats: categoriesStats,
        current_month_summary: currentMonthSummary,
        recent_movements: allMovements.slice(0, 20), // Últimos 20
        top_categories: topCategories
    };
}

//Generar estadísticas mensuales (igual que charts.js)
function generateMonthlyStats() {
    const months = [];
    const currentDate = new Date();
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(date);
    }
    
    return months.map(month => {
        const monthName = month.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
        const ingresos = getMonthlyTotal(month, 'ingreso');
        const gastos = getMonthlyTotal(month, 'gasto');
        
        return {
            mes: month.getMonth() + 1,
            ano: month.getFullYear(),
            mes_nombre: monthName,
            ingresos: ingresos,
            gastos: gastos
        };
    });
}

//Generar estadísticas de categorías
function generateCategoriesStats() {
    const last3Months = new Date();
    last3Months.setMonth(last3Months.getMonth() - 3);
    
    const recentMovements = allMovements.filter(mov => 
        new Date(mov.fecha) >= last3Months
    );
    
    const categoryTotals = {};
    recentMovements.forEach(mov => {
        const key = `${mov.categoria}_${mov.tipo}`;
        if (!categoryTotals[key]) {
            categoryTotals[key] = {
                categoria: mov.categoria,
                tipo: mov.tipo,
                total: 0,
                count: 0
            };
        }
        categoryTotals[key].total += parseFloat(mov.monto || 0);
        categoryTotals[key].count++;
    });
    
    return Object.values(categoryTotals);
}

// Resumen del mes actual
function getCurrentMonthSummary() {
    const currentMonth = new Date();
    currentMonth.setDate(1); // Primer día del mes
    
    const currentMonthMovements = allMovements.filter(mov => {
        const movDate = new Date(mov.fecha);
        return movDate.getMonth() === currentMonth.getMonth() && 
               movDate.getFullYear() === currentMonth.getFullYear();
    });
    
    const recentIncome = currentMonthMovements
        .filter(mov => mov.tipo === 'ingreso')
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
        
    const recentExpenses = currentMonthMovements
        .filter(mov => mov.tipo === 'gasto')
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
    
    const daysInMonth = new Date().getDate(); // Días transcurridos del mes
    const dailyAverage = daysInMonth > 0 ? (recentIncome + recentExpenses) / daysInMonth : 0;
    
    return {
        total_movements: currentMonthMovements.length,
        recent_income: recentIncome,
        recent_expenses: recentExpenses,
        daily_average: dailyAverage
    };
}

// Top categorías
function getTopCategories() {
    const last3Months = new Date();
    last3Months.setMonth(last3Months.getMonth() - 3);
    
    const recentExpenses = allMovements.filter(mov => 
        mov.tipo === 'gasto' && new Date(mov.fecha) >= last3Months
    );
    
    const categoryTotals = {};
    recentExpenses.forEach(mov => {
        if (!categoryTotals[mov.categoria]) {
            categoryTotals[mov.categoria] = {
                categoria: mov.categoria,
                total: 0,
                count: 0
            };
        }
        categoryTotals[mov.categoria].total += parseFloat(mov.monto || 0);
        categoryTotals[mov.categoria].count++;
    });
    
    return Object.values(categoryTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
}

//Obtener total mensual
function getMonthlyTotal(month, tipo) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    return allMovements
        .filter(mov => {
            const movDate = new Date(mov.fecha);
            return mov.tipo === tipo && movDate >= startOfMonth && movDate <= endOfMonth;
        })
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
}

// Generar datos de ejemplo 
function generateSampleMovements() {
    const movements = [];
    const categories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Salario', 'Freelance'];
    
    // Generar datos para los últimos 6 meses
    for (let month = 0; month < 6; month++) {
        const date = new Date();
        date.setMonth(date.getMonth() - month);
        
        // Generar movimientos por mes
        for (let i = 0; i < Math.floor(Math.random() * 20) + 10; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const movDate = new Date(date.getFullYear(), date.getMonth(), day);
            
            const isIncome = Math.random() > 0.7;
            const categoria = categories[Math.floor(Math.random() * categories.length)];
            const monto = isIncome ? 
                Math.floor(Math.random() * 300000) + 50000 : 
                Math.floor(Math.random() * 30000) + 5000;
            
            movements.push({
                id: movements.length + 1,
                fecha: movDate.toISOString().split('T')[0],
                tipo: isIncome ? 'ingreso' : 'gasto',
                categoria: categoria,
                monto: monto,
                descripcion: `${isIncome ? 'Ingreso' : 'Gasto'} de ${categoria}`
            });
        }
    }
    
    return movements;
}


// Mostrar/ocultar loading
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const headerSection = document.getElementById('headerSection');
    
    if (loadingIndicator && headerSection) {
        if (show) {
            loadingIndicator.style.display = 'block';
            headerSection.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
            headerSection.style.display = 'block';
        }
    }
}

// Mostrar error
function showError(message) {
    const headerSection = document.getElementById('headerSection');
    if (headerSection) {
        headerSection.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-sync me-1"></i>Reintentar
                </button>
            </div>
        `;
        headerSection.style.display = 'block';
    }
}

// Actualizar header del usuario
function updateUserHeader() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = `${currentUser.nombre} ${currentUser.apellidos}`;
    }
}

// Actualizar estadísticas rápidas
function updateQuickStats() {
    if (!dashboardData || !dashboardData.balance) return;
    
    const balance = dashboardData.balance;
    
    // Actualizar elementos
    updateElement('totalIngresos', formatCurrency(balance.total_ingresos || 0));
    updateElement('totalGastos', formatCurrency(balance.total_gastos || 0));
    updateElement('balanceTotal', formatCurrency(balance.balance_total || 0));
    updateElement('tasaAhorro', `${balance.savings_rate || 0}%`);
    
    // Cambiar color de la tarjeta de balance según si es positivo o negativo
    const balanceCard = document.getElementById('balanceTotal')?.closest('.card');
    if (balanceCard) {
        const isPositive = (balance.balance_total || 0) >= 0;
        const borderColor = isPositive ? '#198754' : '#dc3545';
        balanceCard.style.borderLeft = `4px solid ${borderColor}`;
        
        const balanceElement = document.getElementById('balanceTotal');
        if (balanceElement) {
            balanceElement.className = isPositive ? 'mb-0 text-success' : 'mb-0 text-danger';
        }
    }
}

// Actualizar resumen del mes actual
function updateCurrentMonthSummary() {
    if (!dashboardData || !dashboardData.current_month_summary) return;
    
    const summary = dashboardData.current_month_summary;
    
    updateElement('currentMonthMovements', summary.total_movements || 0);
    updateElement('currentMonthIncome', formatCurrency(summary.recent_income || 0));
    updateElement('currentMonthExpenses', formatCurrency(summary.recent_expenses || 0));
    updateElement('dailyAverage', formatCurrency(summary.daily_average || 0));
}

// Actualizar movimientos recientes
function updateRecentMovements() {
    const tbody = document.querySelector('#recentMovementsTable tbody');
    if (!tbody) return;
    
    const movements = dashboardData?.recent_movements || [];
    
    tbody.innerHTML = '';
    
    if (movements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-inbox fa-2x mb-2 d-block text-muted"></i>
                    <p class="text-muted mb-2">No hay movimientos recientes</p>
                    <button class="btn btn-sm btn-success" data-bs-toggle="modal" data-bs-target="#modalNuevoMovimiento">
                        <i class="fas fa-plus me-1"></i>Agregar primer movimiento
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Mostrar últimos 8 movimientos
    movements.slice(0, 8).forEach(mov => {
        const fecha = formatDate(mov.fecha);
        const tipoClass = mov.tipo === 'ingreso' ? 'text-success' : 'text-danger';
        const tipoIcon = mov.tipo === 'ingreso' ? '💰' : '💸';
        
        tbody.innerHTML += `
            <tr>
                <td>${fecha}</td>
                <td class="${tipoClass}">
                    ${tipoIcon} ${capitalizeFirst(mov.tipo)}
                </td>
                <td><span class="badge bg-secondary">${mov.categoria}</span></td>
                <td class="${tipoClass} fw-bold">${formatCurrency(mov.monto)}</td>
                <td class="text-truncate" style="max-width: 200px;" title="${mov.descripcion || 'Sin descripción'}">
                    ${mov.descripcion || '-'}
                </td>
            </tr>
        `;
    });
}

// Actualizar top categorías
function updateTopCategories() {
    const container = document.getElementById('topCategoriesList');
    if (!container) return;
    
    const categories = dashboardData?.top_categories || [];
    
    if (categories.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-chart-pie fa-2x mb-2 d-block text-muted"></i>
                <small class="text-muted">No hay datos de categorías</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    categories.slice(0, 5).forEach((cat, index) => {
        const percentage = categories[0].count > 0 ? 
            Math.round((cat.count / categories[0].count) * 100) : 0;
        
        const progressColors = ['#ffc107', '#0d6efd', '#198754', '#6f42c1', '#fd7e14'];
        const progressColor = progressColors[index] || '#6c757d';
        
        container.innerHTML += `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <small class="fw-bold text-dark">${cat.categoria}</small>
                    <small class="text-muted">${cat.count} usos</small>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar" 
                         style="width: ${percentage}%; background-color: ${progressColor}"></div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                    <small class="text-muted">${formatCurrency(cat.total)}</small>
                    <small class="text-muted">${percentage}%</small>
                </div>
            </div>
        `;
    });
}

//Crear gráfico mensual (mini-versión)
function createMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) {
        console.warn('No se encontró canvas monthlyChart');
        return;
    }
    
    console.log('Creando gráfico mensual del dashboard...');
    
    const monthlyStats = dashboardData?.monthly_stats || [];
    
    // Si no hay datos, usar datos de ejemplo
    if (monthlyStats.length === 0) {
        console.log('No hay datos mensuales, saltando gráfico');
        ctx.parentElement.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-chart-line fa-3x mb-3 d-block"></i>
                <p>No hay datos suficientes</p>
                <a href="userProfile_charts.html" class="btn btn-sm btn-primary">Ver gráficas completas</a>
            </div>
        `;
        return;
    }
    
    // Preparar datos
    const labels = monthlyStats.map(m => m.mes_nombre?.split(' ')[0] || `Mes ${m.mes}`);
    const ingresos = monthlyStats.map(m => m.ingresos || 0);
    const gastos = monthlyStats.map(m => m.gastos || 0);
    
    // Destruir gráfico anterior si existe
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    // Crear nuevo gráfico 
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresos,
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Gastos',
                    data: gastos,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 10,
                        font: { size: 11 }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y: {
                    display: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: function(value) {
                            return api.formatCurrency ? api.formatCurrency(value) : formatCurrency(value);
                        },
                        font: { size: 10 }
                    }
                }
            }
        }
    });
    
    console.log('✅ Gráfico mensual creado');
}

// Crear gráfico de categorías (mini-versión)
function createCategoriesChart() {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) {
        console.warn('⚠️ No se encontró canvas categoriesChart');
        return;
    }
    
    console.log('🥧 Creando gráfico de categorías del dashboard...');
    
    // Filtrar solo gastos para el gráfico
    const gastos = (dashboardData?.categories_stats || []).filter(cat => cat.tipo === 'gasto');
    
    if (gastos.length === 0) {
        console.log('🥧 No hay datos de gastos, mostrando mensaje');
        ctx.parentElement.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-chart-pie fa-3x mb-3 d-block"></i>
                <p>No hay gastos por categoría</p>
                <button class="btn btn-sm btn-success" data-bs-toggle="modal" data-bs-target="#modalNuevoMovimiento">
                    <i class="fas fa-plus me-1"></i>Agregar gasto
                </button>
            </div>
        `;
        return;
    }
    
    // Preparar datos (top 6 categorías)
    const topGastos = gastos.sort((a, b) => b.total - a.total).slice(0, 6);
    const labels = topGastos.map(cat => cat.categoria);
    const data = topGastos.map(cat => cat.total);
    const colors = [
        '#ffc107', '#dc3545', '#198754', '#0d6efd',
        '#6f42c1', '#fd7e14'
    ];
    
    // Destruir gráfico anterior si existe
    if (categoriesChart) {
        categoriesChart.destroy();
    }
    
    // Crear nuevo gráfico (versión simple para dashboard)
    categoriesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        usePointStyle: true,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('✅ Gráfico de categorías creado');
}

// === FUNCIONES DE UTILIDAD ===

// Actualizar elemento del DOM
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Formatear moneda
function formatCurrency(amount) {
    if (api && api.formatCurrency) {
        return api.formatCurrency(amount);
    }
    // Fallback
    return `₡ ${new Intl.NumberFormat('es-CR').format(amount)}`;
}

// Formatear fecha
function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString('es-CR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

// Capitalizar primera letra
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

let dashboardCategories = []; // Cache de categorías

// Cargar categorías cuando se selecciona el tipo
async function loadCategoriesForType() {
    const tipoSelect = document.getElementById('tipoMovimiento');
    const categoriaSelect = document.getElementById('categoriaMovimiento');
    const loadingIndicator = document.getElementById('categoriesLoadingIndicator');
    
    const selectedType = tipoSelect.value;
    
    if (!selectedType) {
        categoriaSelect.disabled = true;
        categoriaSelect.innerHTML = '<option value="">Selecciona un tipo primero</option>';
        return;
    }
    
    try {
        loadingIndicator.style.display = 'block';
        categoriaSelect.disabled = true;
        categoriaSelect.innerHTML = '<option value="">Cargando categorías...</option>';
        
        if (dashboardCategories.length === 0) {
            const response = await api.getCategories();
            if (response.success && response.data) {
                dashboardCategories = response.data.all || [];
            } else {
                throw new Error('Error al cargar categorías');
            }
        }
        
        const filteredCategories = dashboardCategories.filter(cat => cat.tipo === selectedType);
        populateCategoriesSelect(categoriaSelect, filteredCategories, selectedType);
        categoriaSelect.disabled = false;
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
        const defaultCategories = getDefaultCategories(selectedType);
        populateCategoriesSelect(categoriaSelect, defaultCategories, selectedType);
        categoriaSelect.disabled = false;
        showCategoriesError();
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Poblar el select con las categorías
function populateCategoriesSelect(selectElement, categories, type) {
    selectElement.innerHTML = '';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Seleccionar categoría de ${type}`;
    selectElement.appendChild(defaultOption);
    
    if (categories.length === 0) {
        const noCategories = document.createElement('option');
        noCategories.value = '';
        noCategories.textContent = `No hay categorías de ${type}`;
        noCategories.disabled = true;
        selectElement.appendChild(noCategories);
        return;
    }
    
    const sortedCategories = categories.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.nombre;
        
        let iconText = '';
        if (category.icon && !category.icon.startsWith('fas ')) {
            iconText = `${category.icon} `;
        }
        
        option.textContent = `${iconText}${category.nombre}`;
        selectElement.appendChild(option);
    });
}

// Obtener categorías por defecto en caso de error
function getDefaultCategories(type) {
    if (type === 'gasto') {
        return [
            { nombre: 'Alimentación', tipo: 'gasto', icon: '🍔' },
            { nombre: 'Transporte', tipo: 'gasto', icon: '🚗' },
            { nombre: 'Entretenimiento', tipo: 'gasto', icon: '🎬' },
            { nombre: 'Servicios', tipo: 'gasto', icon: '💡' },
            { nombre: 'Compras', tipo: 'gasto', icon: '🛒' },
            { nombre: 'Otros gastos', tipo: 'gasto', icon: '📦' }
        ];
    } else {
        return [
            { nombre: 'Salario', tipo: 'ingreso', icon: '💰' },
            { nombre: 'Freelance', tipo: 'ingreso', icon: '💻' },
            { nombre: 'Ventas', tipo: 'ingreso', icon: '🏷️' },
            { nombre: 'Inversiones', tipo: 'ingreso', icon: '📈' },
            { nombre: 'Otros ingresos', tipo: 'ingreso', icon: '➕' }
        ];
    }
}

// Mostrar error sutil
function showCategoriesError() {
    const formText = document.querySelector('#categoriaMovimiento + .form-text small');
    if (formText) {
        formText.innerHTML = '<i class="fas fa-exclamation-triangle text-warning me-1"></i>Error cargando categorías. Usando categorías por defecto.';
        
        setTimeout(() => {
            formText.innerHTML = '<i class="fas fa-info-circle me-1"></i>Las categorías se cargan según el tipo seleccionado';
        }, 5000);
    }
}

// Limpiar formulario de movimiento
function limpiarFormularioMovimiento() {
    document.getElementById('formNuevoMovimiento').reset();
    
    const categoriaSelect = document.getElementById('categoriaMovimiento');
    categoriaSelect.disabled = true;
    categoriaSelect.innerHTML = '<option value="">Selecciona un tipo primero</option>';
    
    document.getElementById('categoriesLoadingIndicator').style.display = 'none';
    
    const fechaInput = document.getElementById('fechaMovimiento');
    const today = new Date().toISOString().split('T')[0];
    fechaInput.value = today;
}

// Pre-cargar categorías cuando se abre el modal
function preloadCategoriesOnModalOpen() {
    const modal = document.getElementById('modalNuevoMovimiento');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            limpiarFormularioMovimiento();
            
            if (dashboardCategories.length === 0) {
                api.getCategories().then(response => {
                    if (response.success && response.data) {
                        dashboardCategories = response.data.all || [];
                    }
                }).catch(error => {
                    console.warn('⚠️ Error pre-cargando categorías:', error);
                });
            }
        });
    }
}

// Guardar movimiento
async function guardarMovimiento() {
    try {
        const fecha = document.getElementById('fechaMovimiento').value;
        const tipo = document.getElementById('tipoMovimiento').value;
        const categoria = document.getElementById('categoriaMovimiento').value;
        const monto = document.getElementById('montoMovimiento').value;
        const descripcion = document.getElementById('descripcionMovimiento').value.trim();
        
        // Validaciones
        if (!fecha) {
            alert('Por favor selecciona una fecha');
            document.getElementById('fechaMovimiento').focus();
            return;
        }
        
        if (!tipo) {
            alert('Por favor selecciona un tipo (Ingreso o Gasto)');
            document.getElementById('tipoMovimiento').focus();
            return;
        }
        
        if (!categoria) {
            alert('Por favor selecciona una categoría');
            document.getElementById('categoriaMovimiento').focus();
            return;
        }
        
        if (!monto || parseFloat(monto) <= 0) {
            alert('Por favor ingresa un monto válido mayor a 0');
            document.getElementById('montoMovimiento').focus();
            return;
        }
        
        // Validar fecha futura
        const fechaSeleccionada = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999);
        
        if (fechaSeleccionada > hoy) {
            const confirmar = confirm('⚠️ La fecha seleccionada es futura. ¿Deseas continuar?');
            if (!confirmar) {
                return;
            }
        }
        
        // Mostrar loading en el botón
        const saveButton = document.querySelector('#modalNuevoMovimiento .btn-success');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        saveButton.disabled = true;
        
        // Preparar datos
        const movementData = {
            fecha: fecha,
            tipo: tipo,
            categoria: categoria,
            monto: parseFloat(monto),
            descripcion: descripcion || null
        };
        
        console.log('Guardando movimiento:', movementData);
        
        // Enviar al backend
        const response = await api.createMovement(movementData);
        
        if (response.success) {
            console.log('✅ Movimiento guardado con ID:', response.movement_id);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoMovimiento'));
            modal.hide();
            
            // Limpiar formulario
            limpiarFormularioMovimiento();
            
            // Actualizar dashboard
            await loadDashboard();
            
            // Mostrar mensaje de éxito
            showSuccessMessage('Movimiento guardado exitosamente');
            
        } else {
            throw new Error(response.error || 'Error al guardar movimiento');
        }
        
    } catch (error) {
        console.error('Error guardando movimiento:', error);
        
        let errorMessage = 'Error al guardar el movimiento';
        if (error.message.includes('Sesión expirada')) {
            errorMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        alert('' + errorMessage);
        
    } finally {
        // Restaurar botón
        const saveButton = document.querySelector('#modalNuevoMovimiento .btn-success');
        if (saveButton) {
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        }
    }
}

// Mostrar mensaje de éxito
function showSuccessMessage(message) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toastHtml = `
            <div class="toast align-items-center text-white bg-success border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-check-circle me-2"></i>${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        const toastContainer = document.querySelector('.toast-container') || document.body;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = toastHtml;
        const toastElement = tempDiv.firstElementChild;
        toastContainer.appendChild(toastElement);
        
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    } else {
        alert('✅ ' + message);
    }
}

// Actualizar dashboard
async function refreshDashboard() {
    const btn = event?.target;
    let originalText = '';
    
    if (btn) {
        originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...';
    }
    
    try {
        await loadDashboard();
        showSuccessMessage('Dashboard actualizado exitosamente');
    } catch (error) {
        alert('Error al actualizar dashboard');
        console.error(error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// Exportar datos
function exportData() {
    try {
        if (!dashboardData || !dashboardData.recent_movements) {
            alert('⚠️ No hay datos para exportar');
            return;
        }
        
        let csv = 'Fecha,Tipo,Categoría,Monto,Descripción\n';
        
        dashboardData.recent_movements.forEach(mov => {
            const fecha = formatDate(mov.fecha);
            const descripcion = (mov.descripcion || '').replace(/,/g, ';');
            csv += `${fecha},${mov.tipo},${mov.categoria},${mov.monto},"${descripcion}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `fidefinance-movimientos-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccessMessage('Datos exportados exitosamente');
        
    } catch (error) {
        console.error('Error exportando datos:', error);
        alert('Error al exportar datos');
    }
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
}

// Hacer funciones disponibles globalmente
window.loadCategoriesForType = loadCategoriesForType;
window.limpiarFormularioMovimiento = limpiarFormularioMovimiento;
window.guardarMovimiento = guardarMovimiento;
window.refreshDashboard = refreshDashboard;
window.exportData = exportData;
window.cerrarSesion = cerrarSesion;