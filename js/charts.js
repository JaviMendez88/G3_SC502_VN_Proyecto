// charts.js - Gestión de gráficas
let currentUser = null;
let allMovements = [];
let charts = {}; // Almacenar instancias de gráficas
let currentView = 'weekly';

// Inicializar gráficas
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    if (!api.isAuthenticated()) {
        alert('❌ Debes iniciar sesión para acceder');
        window.location.href = 'user_logIn.html';
        return;
    }

    await loadCharts();
});

// Cargar datos y crear gráficas
async function loadCharts() {
    try {
        showLoading(true);
        
        // Obtener usuario actual
        currentUser = api.getCurrentUser();
        
        // Cargar movimientos
        await loadMovements();
        
        // Crear todas las gráficas
        await createAllCharts();
        
        // Actualizar métricas
        updateMetrics();
        
        // Generar insights
        generateInsights();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error cargando gráficas:', error);
        showError('Error al cargar las gráficas');
    }
}

// Cargar movimientos
async function loadMovements() {
    try {
        const response = await api.getMovements(1000);
        allMovements = response.movements || [];
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        // Generar datos de ejemplo
        allMovements = generateSampleData();
    }
}

// Crear todas las gráficas
async function createAllCharts() {
    // Destruir gráficas existentes
    destroyAllCharts();
    
    // Crear gráficas principales
    await Promise.all([
        createMainChart(),
        createCategoryChart(),
        createBalanceChart(),
        createComparisonChart()
    ]);
}

// Crear gráfica principal
async function createMainChart() {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;
    
    const data = prepareMainChartData();
    const chartType = document.getElementById('chartType').value;
    
    charts.main = new Chart(ctx, {
        type: chartType === 'area' ? 'line' : chartType,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ffc107',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${api.formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Periodo',
                        color: '#6c757d'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Monto (₡)',
                        color: '#6c757d'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return api.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Crear gráfica de categorías
async function createCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const data = prepareCategoryData();
    
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ffc107',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${api.formatCurrency(context.raw)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Crear gráfica de balance
async function createBalanceChart() {
    const ctx = document.getElementById('balanceChart');
    if (!ctx) return;
    
    const data = prepareBalanceData();
    
    charts.balance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 6,
                    hoverRadius: 8
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ffc107',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Balance: ${api.formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return api.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Crear gráfica de comparación
async function createComparisonChart() {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    
    const data = prepareComparisonData();
    
    charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ffc107',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${api.formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return api.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// === PREPARACIÓN DE DATOS ===

// Preparar datos para gráfica principal
function prepareMainChartData() {
    const months = getLast6Months();
    const dataView = document.getElementById('dataView').value;
    
    const datasets = [];
    
    if (dataView === 'both' || dataView === 'income') {
        const incomeData = months.map(month => getMonthlyTotal(month, 'ingreso'));
        datasets.push({
            label: 'Ingresos',
            data: incomeData,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.1)',
            borderWidth: 3,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.4,
            pointBackgroundColor: '#198754',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
        });
    }
    
    if (dataView === 'both' || dataView === 'expense') {
        const expenseData = months.map(month => getMonthlyTotal(month, 'gasto'));
        datasets.push({
            label: 'Gastos',
            data: expenseData,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            borderWidth: 3,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.4,
            pointBackgroundColor: '#dc3545',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
        });
    }
    
    if (dataView === 'balance') {
        const balanceData = months.map(month => {
            const income = getMonthlyTotal(month, 'ingreso');
            const expense = getMonthlyTotal(month, 'gasto');
            return income - expense;
        });
        datasets.push({
            label: 'Balance',
            data: balanceData,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderWidth: 3,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.4,
            pointBackgroundColor: '#ffc107',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
        });
    }
    
    return {
        labels: months.map(month => month.toLocaleDateString('es-CR', { month: 'short', year: 'numeric' })),
        datasets: datasets
    };
}

// Preparar datos de categorías
function prepareCategoryData() {
    const last3Months = new Date();
    last3Months.setMonth(last3Months.getMonth() - 3);
    
    const recentMovements = allMovements.filter(mov => 
        mov.tipo === 'gasto' && new Date(mov.fecha) >= last3Months
    );
    
    const categoryTotals = {};
    recentMovements.forEach(mov => {
        categoryTotals[mov.categoria] = (categoryTotals[mov.categoria] || 0) + parseFloat(mov.monto || 0);
    });
    
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Top 8 categorías
    
    const colors = [
        '#ffc107', '#dc3545', '#198754', '#0d6efd',
        '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'
    ];
    
    return {
        labels: sortedCategories.map(([categoria]) => categoria),
        datasets: [{
            data: sortedCategories.map(([, total]) => total),
            backgroundColor: colors.slice(0, sortedCategories.length),
            borderWidth: 3,
            borderColor: '#fff',
            hoverBorderWidth: 4
        }]
    };
}

// Preparar datos de balance
function prepareBalanceData() {
    const months = getLast6Months();
    
    const balanceData = months.map(month => {
        const income = getMonthlyTotal(month, 'ingreso');
        const expense = getMonthlyTotal(month, 'gasto');
        return income - expense;
    });
    
    return {
        labels: months.map(month => month.toLocaleDateString('es-CR', { month: 'short' })),
        datasets: [{
            label: 'Balance Mensual',
            data: balanceData,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: balanceData.map(val => val >= 0 ? '#198754' : '#dc3545'),
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6
        }]
    };
}

// Preparar datos de comparación
function prepareComparisonData() {
    const months = getLast6Months();
    
    const incomeData = months.map(month => getMonthlyTotal(month, 'ingreso'));
    const expenseData = months.map(month => getMonthlyTotal(month, 'gasto'));
    
    return {
        labels: months.map(month => month.toLocaleDateString('es-CR', { month: 'short' })),
        datasets: [
            {
                label: 'Ingresos',
                data: incomeData,
                backgroundColor: '#198754',
                borderColor: '#198754',
                borderWidth: 1
            },
            {
                label: 'Gastos',
                data: expenseData,
                backgroundColor: '#dc3545',
                borderColor: '#dc3545',
                borderWidth: 1
            }
        ]
    };
}

// === FUNCIONES DE CONTROL ===

// Actualizar todas las gráficas
function updateCharts() {
    createAllCharts();
    updateMetrics();
    generateInsights();
    
    // Actualizar periodo en el header
    const period = document.getElementById('chartPeriod').value;
    const periodText = {
        '3': 'Últimos 3 meses',
        '6': 'Últimos 6 meses',
        '12': 'Último año',
        '24': 'Últimos 2 años'
    };
    document.getElementById('analysisPeriod').textContent = periodText[period];
}

// Actualizar gráfica principal
function updateMainChart() {
    if (charts.main) {
        charts.main.destroy();
    }
    createMainChart();
    
    // Actualizar título
    const dataView = document.getElementById('dataView').value;
    const titles = {
        'both': 'Tendencia de Ingresos y Gastos',
        'income': 'Tendencia de Ingresos',
        'expense': 'Tendencia de Gastos',
        'balance': 'Evolución del Balance'
    };
    document.getElementById('mainChartTitle').textContent = titles[dataView] || 'Análisis Financiero';
}

// Cambiar vista de la gráfica principal
function changeChartView(view) {
    currentView = view;
    
    // Actualizar botones activos
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Recrear gráfica principal con nueva vista
    updateMainChart();
}

// === MÉTRICAS Y CÁLCULOS ===

// Actualizar métricas clave
function updateMetrics() {
    const last6Months = getLast6Months();
    
    // Calcular totales de los últimos 6 meses
    const totalIncome = last6Months.reduce((sum, month) => sum + getMonthlyTotal(month, 'ingreso'), 0);
    const totalExpense = last6Months.reduce((sum, month) => sum + getMonthlyTotal(month, 'gasto'), 0);
    const balance = totalIncome - totalExpense;
    
    // Tasa de ahorro
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    document.getElementById('savingsRate').textContent = `${Math.max(0, savingsRate).toFixed(1)}%`;
    document.getElementById('savingsProgress').style.width = `${Math.min(100, Math.max(0, savingsRate))}%`;
    
    // Crecimiento (comparar últimos 3 vs anteriores 3 meses)
    const recent3Months = last6Months.slice(-3);
    const previous3Months = last6Months.slice(0, 3);
    
    const recentIncome = recent3Months.reduce((sum, month) => sum + getMonthlyTotal(month, 'ingreso'), 0);
    const previousIncome = previous3Months.reduce((sum, month) => sum + getMonthlyTotal(month, 'ingreso'), 0);
    
    const growthRate = previousIncome > 0 ? (((recentIncome - previousIncome) / previousIncome) * 100) : 0;
    document.getElementById('growthRate').textContent = `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
    document.getElementById('growthProgress').style.width = `${Math.min(100, Math.abs(growthRate))}%`;
    
    // Estabilidad (consistencia de ingresos)
    const incomeVariation = calculateVariation(last6Months.map(month => getMonthlyTotal(month, 'ingreso')));
    const stabilityRate = Math.max(0, 100 - incomeVariation);
    document.getElementById('stabilityRate').textContent = `${stabilityRate.toFixed(1)}%`;
    document.getElementById('stabilityProgress').style.width = `${stabilityRate}%`;
    
    // Puntuación financiera
    const financialScore = Math.round((Math.max(0, savingsRate) + stabilityRate + Math.min(50, Math.abs(growthRate))) / 2);
    document.getElementById('financialScore').textContent = Math.min(100, financialScore);
}

// Calcular variación porcentual
function calculateVariation(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? (stdDev / mean) * 100 : 0;
}

// === INSIGHTS AUTOMÁTICOS ===

// Generar insights automáticos
function generateInsights() {
    const insights = [];
    const last6Months = getLast6Months();
    
    // Analizar tendencias
    const monthlyBalances = last6Months.map(month => {
        const income = getMonthlyTotal(month, 'ingreso');
        const expense = getMonthlyTotal(month, 'gasto');
        return income - expense;
    });
    
    // Insight 1: Tendencia del balance
    const trend = calculateTrend(monthlyBalances);
    if (trend > 5) {
        insights.push({
            icon: 'fas fa-trending-up',
            color: 'success',
            title: 'Tendencia Positiva',
            description: 'Tu balance ha mejorado consistentemente en los últimos meses. ¡Excelente trabajo!'
        });
    } else if (trend < -5) {
        insights.push({
            icon: 'fas fa-trending-down',
            color: 'danger',
            title: 'Atención Requerida',
            description: 'Tu balance ha estado disminuyendo. Considera revisar tus gastos.'
        });
    }
    
    // Insight 2: Mejor mes
    const bestMonthIndex = monthlyBalances.indexOf(Math.max(...monthlyBalances));
    const bestMonth = last6Months[bestMonthIndex];
    insights.push({
        icon: 'fas fa-star',
        color: 'warning',
        title: 'Mejor Mes',
        description: `${bestMonth.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })} fue tu mejor mes con ${api.formatCurrency(monthlyBalances[bestMonthIndex])} de balance.`
    });
    
    // Insight 3: Categoría dominante
    const topCategory = getTopExpenseCategory();
    if (topCategory) {
        insights.push({
            icon: 'fas fa-chart-pie',
            color: 'info',
            title: 'Categoría Principal',
            description: `${topCategory.categoria} representa el ${topCategory.percentage.toFixed(1)}% de tus gastos recientes.`
        });
    }
    
    // Insight 4: Recomendación de ahorro
    const avgIncome = last6Months.reduce((sum, month) => sum + getMonthlyTotal(month, 'ingreso'), 0) / 6;
    const avgExpense = last6Months.reduce((sum, month) => sum + getMonthlyTotal(month, 'gasto'), 0) / 6;
    const currentSavingsRate = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0;
    
    if (currentSavingsRate < 20) {
        insights.push({
            icon: 'fas fa-piggy-bank',
            color: 'primary',
            title: 'Oportunidad de Ahorro',
            description: `Intenta ahorrar al menos el 20% de tus ingresos. Actualmente ahorras ${currentSavingsRate.toFixed(1)}%.`
        });
    }
    
    // Renderizar insights
    renderInsights(insights);
}

// Calcular tendencia
function calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
}

// Obtener categoría de gasto principal
function getTopExpenseCategory() {
    const last3Months = new Date();
    last3Months.setMonth(last3Months.getMonth() - 3);
    
    const recentExpenses = allMovements.filter(mov => 
        mov.tipo === 'gasto' && new Date(mov.fecha) >= last3Months
    );
    
    const categoryTotals = {};
    let totalExpenses = 0;
    
    recentExpenses.forEach(mov => {
        const amount = parseFloat(mov.monto || 0);
        categoryTotals[mov.categoria] = (categoryTotals[mov.categoria] || 0) + amount;
        totalExpenses += amount;
    });
    
    const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && totalExpenses > 0) {
        return {
            categoria: topCategory[0],
            total: topCategory[1],
            percentage: (topCategory[1] / totalExpenses) * 100
        };
    }
    
    return null;
}

// Renderizar insights
function renderInsights(insights) {
    const container = document.getElementById('insights');
    
    if (insights.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-lightbulb fa-2x text-muted mb-3"></i>
                <p class="text-muted">No hay insights disponibles con los datos actuales.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    insights.forEach(insight => {
        container.innerHTML += `
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-start p-3 bg-light rounded">
                    <div class="me-3">
                        <i class="${insight.icon} fa-2x text-${insight.color}"></i>
                    </div>
                    <div>
                        <h6 class="mb-1 text-${insight.color}">${insight.title}</h6>
                        <p class="mb-0 text-muted small">${insight.description}</p>
                    </div>
                </div>
            </div>
        `;
    });
}

// === FUNCIONES DE UTILIDAD ===

// Obtener últimos 6 meses
function getLast6Months() {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(date);
    }
    
    return months;
}

// Obtener total mensual por tipo
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

// Destruir todas las gráficas
function destroyAllCharts() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};
}

// Exportar gráficas
function exportChart() {
    try {
        // Crear un canvas temporal para combinar todas las gráficas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Configurar canvas
        canvas.width = 1200;
        canvas.height = 800;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Agregar título
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FideFinance - Análisis Financiero', canvas.width / 2, 40);
        
        // Descargar imagen
        const link = document.createElement('a');
        link.download = `fidefinance-graficas-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        alert('✅ Gráficas exportadas exitosamente');
        
    } catch (error) {
        console.error('Error exportando gráficas:', error);
        alert('❌ Error al exportar las gráficas');
    }
}

// Generar datos de ejemplo
function generateSampleData() {
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
    const chartsContent = document.getElementById('chartsContent');
    
    if (loadingIndicator && chartsContent) {
        if (show) {
            loadingIndicator.style.display = 'block';
            chartsContent.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
            chartsContent.style.display = 'block';
        }
    }
}

// Mostrar error
function showError(message) {
    const chartsContent = document.getElementById('chartsContent');
    if (chartsContent) {
        chartsContent.innerHTML = `
            <div class="alert alert-danger">
                <h5>❌ Error</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-sync me-1"></i>Reintentar
                </button>
            </div>
        `;
        chartsContent.style.display = 'block';
    }
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
}

// Hacer funciones globales
window.updateCharts = updateCharts;
window.updateMainChart = updateMainChart;
window.changeChartView = changeChartView;
window.exportChart = exportChart;
window.cerrarSesion = cerrarSesion;