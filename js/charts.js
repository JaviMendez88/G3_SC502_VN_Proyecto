let currentUser = null;
let allMovements = [];
let charts = {}; // Almacenar instancias de gráficas
let currentView = 'weekly';
let currentPeriod = 6; // Período actual en meses

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

// : Cambiar período (MEJORADA)
function changePeriod() {
    const periodSelector = document.getElementById('chartPeriod');
    if (periodSelector) {
        const newPeriod = parseInt(periodSelector.value);
        console.log('=== CAMBIANDO PERÍODO ===');
        console.log('Período anterior:', currentPeriod);
        console.log('Período nuevo:', newPeriod);
        
        currentPeriod = newPeriod;
        
        // Ajustar vista si es necesario
        if (currentView === 'daily' && currentPeriod > 3) {
            console.log('⚠️ Cambiando a vista semanal para período largo');
            currentView = 'weekly';
            
            // Actualizar botón activo
            document.querySelectorAll('.btn-group .btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.toLowerCase().includes('semanal')) {
                    btn.classList.add('active');
                }
            });
        }
        
        updateCharts();
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

// FUNCIÓN CORREGIDA: Obtener meses según período actual
function getMonthsForPeriod() {
    const months = [];
    const currentDate = new Date();
    
    // Usar el período actual (currentPeriod) en lugar de hardcodear 6
    for (let i = currentPeriod - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(date);
    }
    
    console.log(`Generando ${currentPeriod} meses:`, months.map(m => m.toLocaleDateString()));
    return months;
}

// Preparar datos para gráfica principal (CORREGIDA CON VISTAS)
function prepareMainChartData() {
    console.log('Preparando datos con vista:', currentView);
    
    // Determinar qué función usar según la vista actual
    switch (currentView) {
        case 'daily':
            return prepareDailyChartData();
        case 'weekly':
            return prepareWeeklyChartData();
        case 'monthly':
        default:
            return prepareMonthlyChartData();
    }
}

//  Datos mensuales (lógica original)
function prepareMonthlyChartData() {
    const months = getMonthsForPeriod();
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

//  Datos semanales
function prepareWeeklyChartData() {
    const weeks = getWeeksForPeriod();
    const dataView = document.getElementById('dataView').value;
    const datasets = [];
    
    if (dataView === 'both' || dataView === 'income') {
        const incomeData = weeks.map(week => getWeeklyTotal(week, 'ingreso'));
        datasets.push({
            label: 'Ingresos',
            data: incomeData,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.1)',
            borderWidth: 2,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.3,
            pointBackgroundColor: '#198754',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3
        });
    }
    
    if (dataView === 'both' || dataView === 'expense') {
        const expenseData = weeks.map(week => getWeeklyTotal(week, 'gasto'));
        datasets.push({
            label: 'Gastos',
            data: expenseData,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            borderWidth: 2,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.3,
            pointBackgroundColor: '#dc3545',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3
        });
    }
    
    if (dataView === 'balance') {
        const balanceData = weeks.map(week => {
            const income = getWeeklyTotal(week, 'ingreso');
            const expense = getWeeklyTotal(week, 'gasto');
            return income - expense;
        });
        datasets.push({
            label: 'Balance',
            data: balanceData,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderWidth: 2,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.3,
            pointBackgroundColor: '#ffc107',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3
        });
    }
    
    return {
        labels: weeks.map(week => `Sem ${week.week}`),
        datasets: datasets
    };
}

//  Datos diarios (últimos 30 días para no saturar)
function prepareDailyChartData() {
    const days = getDaysForPeriod();
    const dataView = document.getElementById('dataView').value;
    const datasets = [];
    
    if (dataView === 'both' || dataView === 'income') {
        const incomeData = days.map(day => getDailyTotal(day, 'ingreso'));
        datasets.push({
            label: 'Ingresos',
            data: incomeData,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.1)',
            borderWidth: 1,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.2,
            pointBackgroundColor: '#198754',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 2
        });
    }
    
    if (dataView === 'both' || dataView === 'expense') {
        const expenseData = days.map(day => getDailyTotal(day, 'gasto'));
        datasets.push({
            label: 'Gastos',
            data: expenseData,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            borderWidth: 1,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.2,
            pointBackgroundColor: '#dc3545',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 2
        });
    }
    
    if (dataView === 'balance') {
        const balanceData = days.map(day => {
            const income = getDailyTotal(day, 'ingreso');
            const expense = getDailyTotal(day, 'gasto');
            return income - expense;
        });
        datasets.push({
            label: 'Balance',
            data: balanceData,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderWidth: 1,
            fill: document.getElementById('chartType').value === 'area',
            tension: 0.2,
            pointBackgroundColor: '#ffc107',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 2
        });
    }
    
    return {
        labels: days.map(day => day.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })),
        datasets: datasets
    };
}

// Preparar datos de categorías (CORREGIDA)
function prepareCategoryData() {
    const periodMonths = new Date();
    periodMonths.setMonth(periodMonths.getMonth() - Math.min(currentPeriod, 3)); // Máximo 3 meses para categorías
    
    const recentMovements = allMovements.filter(mov => 
        mov.tipo === 'gasto' && new Date(mov.fecha) >= periodMonths
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

// Preparar datos de balance (CORREGIDA)
function prepareBalanceData() {
    const months = getMonthsForPeriod(); // Usar 
    
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

// Preparar datos de comparación (CORREGIDA)
function prepareComparisonData() {
    const months = getMonthsForPeriod(); // Usar 
    
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

// Actualizar todas las gráficas (CORREGIDA)
function updateCharts() {
    console.log('=== ACTUALIZANDO GRÁFICAS ===');
    console.log('Período:', currentPeriod, 'meses');
    console.log('Vista actual:', currentView);
    
    createAllCharts();
    updateMetrics();
    generateInsights();
    
    // Actualizar título de la gráfica principal
    updateChartTitle();
    
    // Actualizar periodo en el header
    const periodText = {
        '3': 'Últimos 3 meses',
        '6': 'Últimos 6 meses',
        '12': 'Último año',
        '24': 'Últimos 2 años'
    };
    const periodElement = document.getElementById('analysisPeriod');
    if (periodElement) {
        periodElement.textContent = periodText[currentPeriod] || `Últimos ${currentPeriod} meses`;
    }
    
    console.log('✅ Gráficas actualizadas correctamente');
}

// Actualizar gráfica principal (CORREGIDA)
function updateMainChart() {
    if (charts.main) {
        charts.main.destroy();
    }
    createMainChart();
    
    // Actualizar título dinámicamente
    updateChartTitle();
}

// Cambiar vista de la gráfica principal (CORREGIDA)
function changeChartView(view) {
    console.log('Cambiando vista a:', view);
    currentView = view;
    
    // Actualizar botones activos
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Encontrar el botón correcto y marcarlo como activo
    const buttons = document.querySelectorAll('.btn-group .btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(view)) {
            btn.classList.add('active');
        }
    });
    
    // Actualizar título dinámicamente
    updateChartTitle();
    
    // Recrear gráfica principal con nueva vista
    updateMainChart();
}

//  Actualizar título según la vista
function updateChartTitle() {
    const dataView = document.getElementById('dataView')?.value || 'both';
    const viewNames = {
        'monthly': 'Mensual',
        'weekly': 'Semanal', 
        'daily': 'Diaria'
    };
    
    const dataNames = {
        'both': 'Ingresos y Gastos',
        'income': 'Ingresos',
        'expense': 'Gastos',
        'balance': 'Balance'
    };
    
    const title = `Tendencia ${viewNames[currentView]} de ${dataNames[dataView]}`;
    const titleElement = document.getElementById('mainChartTitle');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

// === MÉTRICAS Y CÁLCULOS ===

// Actualizar métricas clave (CORREGIDA)
function updateMetrics() {
    const months = getMonthsForPeriod(); // Usar período actual
    
    // Calcular totales del período actual
    const totalIncome = months.reduce((sum, month) => sum + getMonthlyTotal(month, 'ingreso'), 0);
    const totalExpense = months.reduce((sum, month) => sum + getMonthlyTotal(month, 'gasto'), 0);
    const balance = totalIncome - totalExpense;
    
    // Tasa de ahorro
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    const savingsElement = document.getElementById('savingsRate');
    const savingsProgress = document.getElementById('savingsProgress');
    if (savingsElement && savingsProgress) {
        savingsElement.textContent = `${Math.max(0, savingsRate).toFixed(1)}%`;
        savingsProgress.style.width = `${Math.min(100, Math.max(0, savingsRate))}%`;
    }
    
    // Crecimiento (comparar últimas vs anteriores mitades del período)
    const halfPeriod = Math.ceil(currentPeriod / 2);
    const recentMonths = months.slice(-halfPeriod);
    const previousMonths = months.slice(0, halfPeriod);
    
    const recentIncome = recentMonths.reduce((sum, month) => sum + getMonthlyTotal(month, 'ingreso'), 0);
    const previousIncome = previousMonths.reduce((sum, month) => sum + getMonthlyTotal(month, 'ingreso'), 0);
    
    const growthRate = previousIncome > 0 ? (((recentIncome - previousIncome) / previousIncome) * 100) : 0;
    const growthElement = document.getElementById('growthRate');
    const growthProgress = document.getElementById('growthProgress');
    if (growthElement && growthProgress) {
        growthElement.textContent = `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
        growthProgress.style.width = `${Math.min(100, Math.abs(growthRate))}%`;
    }
    
    // Estabilidad (consistencia de ingresos)
    const incomeVariation = calculateVariation(months.map(month => getMonthlyTotal(month, 'ingreso')));
    const stabilityRate = Math.max(0, 100 - incomeVariation);
    const stabilityElement = document.getElementById('stabilityRate');
    const stabilityProgress = document.getElementById('stabilityProgress');
    if (stabilityElement && stabilityProgress) {
        stabilityElement.textContent = `${stabilityRate.toFixed(1)}%`;
        stabilityProgress.style.width = `${stabilityRate}%`;
    }
    
    // Puntuación financiera
    const financialScore = Math.round((Math.max(0, savingsRate) + stabilityRate + Math.min(50, Math.abs(growthRate))) / 2);
    const scoreElement = document.getElementById('financialScore');
    if (scoreElement) {
        scoreElement.textContent = Math.min(100, financialScore);
    }
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

// Generar insights automáticos (CORREGIDA)
function generateInsights() {
    const insights = [];
    const months = getMonthsForPeriod(); // Usar período actual
    
    // Analizar tendencias
    const monthlyBalances = months.map(month => {
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
    if (monthlyBalances.length > 0) {
        const bestMonthIndex = monthlyBalances.indexOf(Math.max(...monthlyBalances));
        const bestMonth = months[bestMonthIndex];
        insights.push({
            icon: 'fas fa-star',
            color: 'warning',
            title: 'Mejor Mes',
            description: `${bestMonth.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })} fue tu mejor mes con ${api.formatCurrency(monthlyBalances[bestMonthIndex])} de balance.`
        });
    }
    
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
    const avgIncome = months.reduce((sum, month) => sum + getMonthlyTotal(month, 'ingreso'), 0) / months.length;
    const avgExpense = months.reduce((sum, month) => sum + getMonthlyTotal(month, 'gasto'), 0) / months.length;
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

// Obtener categoría de gasto principal (CORREGIDA)
function getTopExpenseCategory() {
    const periodMonths = new Date();
    periodMonths.setMonth(periodMonths.getMonth() - Math.min(currentPeriod, 3));
    
    const recentExpenses = allMovements.filter(mov => 
        mov.tipo === 'gasto' && new Date(mov.fecha) >= periodMonths
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
    
    if (!container) return;
    
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

// === FUNCIONES DE UTILIDAD ADICIONALES ===

//  Obtener semanas para el período
function getWeeksForPeriod() {
    const weeks = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.min(currentPeriod, 6)); // Máximo 6 meses para vista semanal
    
    // Empezar desde el lunes de la semana actual
    const currentWeekStart = new Date(endDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);
    
    let weekStart = new Date(currentWeekStart);
    let weekNumber = 1;
    
    while (weekStart >= startDate) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        weeks.unshift({
            start: new Date(weekStart),
            end: weekEnd,
            week: weekNumber
        });
        
        weekStart.setDate(weekStart.getDate() - 7);
        weekNumber++;
    }
    
    return weeks.slice(-24); // Máximo 24 semanas
}

//  Obtener días para el período
function getDaysForPeriod() {
    const days = [];
    const currentDate = new Date();
    
    // Para vista diaria, máximo 30 días para no saturar la gráfica
    const dayCount = Math.min(30, currentPeriod * 7); // 7 días por semana promedio
    
    for (let i = dayCount - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        days.push(new Date(date));
    }
    
    return days;
}

//  Obtener total semanal por tipo
function getWeeklyTotal(week, tipo) {
    return allMovements
        .filter(mov => {
            const movDate = new Date(mov.fecha);
            return mov.tipo === tipo && movDate >= week.start && movDate <= week.end;
        })
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
}

//  Obtener total diario por tipo
function getDailyTotal(day, tipo) {
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);
    
    return allMovements
        .filter(mov => {
            const movDate = new Date(mov.fecha);
            return mov.tipo === tipo && movDate >= startOfDay && movDate <= endOfDay;
        })
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
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

// Generar datos de ejemplo (MEJORADA)
function generateSampleData() {
    const movements = [];
    const categories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Salario', 'Freelance'];
    
    // Generar datos para el período actual con mejor distribución temporal
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - currentPeriod);
    
    const endDate = new Date();
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Generar 3-8 movimientos por día en promedio
    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(currentDay.getDate() + dayOffset);
        
        // Algunos días pueden no tener movimientos
        if (Math.random() > 0.3) {
            const movementsPerDay = Math.floor(Math.random() * 6) + 2; // 2-7 movimientos
            
            for (let i = 0; i < movementsPerDay; i++) {
                const isIncome = Math.random() > 0.75; // 25% probabilidad de ingreso
                const categoria = categories[Math.floor(Math.random() * categories.length)];
                
                // Montos más realistas
                let monto;
                if (isIncome) {
                    // Ingresos: 50k - 500k
                    monto = Math.floor(Math.random() * 450000) + 50000;
                } else {
                    // Gastos: 1k - 50k
                    monto = Math.floor(Math.random() * 49000) + 1000;
                }
                
                movements.push({
                    id: movements.length + 1,
                    fecha: currentDay.toISOString().split('T')[0],
                    tipo: isIncome ? 'ingreso' : 'gasto',
                    categoria: categoria,
                    monto: monto,
                    descripcion: `${isIncome ? 'Ingreso' : 'Gasto'} de ${categoria}`
                });
            }
        }
    }
    
    console.log(`Generados ${movements.length} movimientos de muestra para ${totalDays} días`);
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

// Hacer funciones globales disponibles
window.updateCharts = updateCharts;
window.updateMainChart = updateMainChart;
window.changeChartView = changeChartView;
window.changePeriod = changePeriod;
window.exportChart = exportChart;
window.cerrarSesion = cerrarSesion;