// statistics.js - Análisis estadístico avanzado
let currentUser = null;
let allMovements = [];
let filteredMovements = [];
let categories = [];

// Inicializar estadísticas
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    if (!api.isAuthenticated()) {
        alert('❌ Debes iniciar sesión para acceder');
        window.location.href = 'user_logIn.html';
        return;
    }

    await loadStatistics();
});

// Cargar datos y calcular estadísticas
async function loadStatistics() {
    try {
        showLoading(true);
        
        // Obtener usuario actual
        currentUser = api.getCurrentUser();
        
        // Cargar movimientos y categorías
        await Promise.all([
            loadMovements(),
            loadCategories()
        ]);
        
        // Configurar filtros
        populateFilters();
        
        // Calcular estadísticas iniciales
        calculateStatistics();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        showError('Error al cargar las estadísticas');
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

// Cargar categorías
async function loadCategories() {
    try {
        const response = await api.getCategories();
        categories = response.data?.all || [];
    } catch (error) {
        console.error('Error cargando categorías:', error);
        categories = [
            { nombre: 'Alimentación', tipo: 'gasto' },
            { nombre: 'Transporte', tipo: 'gasto' },
            { nombre: 'Salario', tipo: 'ingreso' }
        ];
    }
}

// Llenar filtros
function populateFilters() {
    const categoryFilter = document.getElementById('statsCategory');
    
    // Limpiar opciones existentes
    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    
    // Agregar categorías únicas
    const uniqueCategories = [...new Set(categories.map(cat => cat.nombre))];
    uniqueCategories.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categoryFilter.appendChild(option);
    });
}

// Calcular todas las estadísticas
function calculateStatistics() {
    try {
        // Obtener filtros
        const period = document.getElementById('statsPeriod').value;
        const category = document.getElementById('statsCategory').value;
        const type = document.getElementById('statsType').value;
        
        // Filtrar movimientos
        filteredMovements = filterMovements(period, category, type);
        
        // Actualizar contador de datos
        document.getElementById('totalDataPoints').textContent = `${filteredMovements.length} movimientos`;
        
        if (filteredMovements.length === 0) {
            showNoDataMessage();
            return;
        }
        
        // Calcular estadísticas principales
        calculateMainStatistics();
        
        // Calcular distribución
        calculateDistribution();
        
        // Análisis por categorías
        calculateCategoryAnalysis();
        
        // Análisis temporal
        calculateTemporalAnalysis();
        
        // Proyecciones
        calculateProjections();
        
    } catch (error) {
        console.error('Error calculando estadísticas:', error);
        alert('❌ Error al calcular estadísticas');
    }
}

// Filtrar movimientos según criterios
function filterMovements(period, category, type) {
    let filtered = [...allMovements];
    
    // Filtro por periodo
    if (period !== 'all') {
        const months = parseInt(period);
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);
        
        filtered = filtered.filter(mov => new Date(mov.fecha) >= cutoffDate);
    }
    
    // Filtro por categoría
    if (category) {
        filtered = filtered.filter(mov => mov.categoria === category);
    }
    
    // Filtro por tipo
    if (type) {
        filtered = filtered.filter(mov => mov.tipo === type);
    }
    
    return filtered;
}

// Calcular estadísticas principales
function calculateMainStatistics() {
    const amounts = filteredMovements.map(mov => parseFloat(mov.monto || 0));
    
    if (amounts.length === 0) return;
    
    // Estadísticas básicas
    const mean = calculateMean(amounts);
    const median = calculateMedian(amounts);
    const stdDev = calculateStandardDeviation(amounts, mean);
    const variationCoeff = mean > 0 ? (stdDev / mean) * 100 : 0;
    
    // Actualizar UI
    updateElement('avgMonthly', api.formatCurrency(mean));
    updateElement('median', api.formatCurrency(median));
    updateElement('standardDeviation', api.formatCurrency(stdDev));
    updateElement('variationCoeff', `${variationCoeff.toFixed(1)}%`);
    
    // Métricas detalladas
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const range = max - min;
    const q1 = calculatePercentile(amounts, 25);
    const q3 = calculatePercentile(amounts, 75);
    const iqr = q3 - q1;
    const skewness = calculateSkewness(amounts, mean, stdDev);
    const kurtosis = calculateKurtosis(amounts, mean, stdDev);
    
    updateElement('minValue', api.formatCurrency(min));
    updateElement('maxValue', api.formatCurrency(max));
    updateElement('range', api.formatCurrency(range));
    updateElement('q1', api.formatCurrency(q1));
    updateElement('q3', api.formatCurrency(q3));
    updateElement('iqr', api.formatCurrency(iqr));
    updateElement('skewness', skewness.toFixed(2));
    updateElement('kurtosis', kurtosis.toFixed(2));
}

// Calcular distribución de datos
function calculateDistribution() {
    const amounts = filteredMovements.map(mov => parseFloat(mov.monto || 0));
    
    if (amounts.length === 0) {
        document.getElementById('distributionTable').innerHTML = '<tr><td colspan="4" class="text-center">No hay datos</td></tr>';
        return;
    }
    
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const numBins = Math.min(10, Math.ceil(Math.sqrt(amounts.length)));
    const binSize = (max - min) / numBins || 1;
    
    const bins = [];
    for (let i = 0; i < numBins; i++) {
        const start = min + (i * binSize);
        const end = start + binSize;
        const count = amounts.filter(amount => 
            amount >= start && (i === numBins - 1 ? amount <= end : amount < end)
        ).length;
        
        bins.push({
            range: `${api.formatCurrency(start)} - ${api.formatCurrency(end)}`,
            count: count,
            percentage: (count / amounts.length) * 100
        });
    }
    
    // Calcular porcentajes acumulados
    let accumulated = 0;
    bins.forEach(bin => {
        accumulated += bin.percentage;
        bin.accumulated = accumulated;
    });
    
    // Renderizar tabla
    const tableBody = document.getElementById('distributionTable');
    tableBody.innerHTML = '';
    
    bins.forEach(bin => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bin.range}</td>
            <td>${bin.count}</td>
            <td>${bin.percentage.toFixed(1)}%</td>
            <td>${bin.accumulated.toFixed(1)}%</td>
        `;
        tableBody.appendChild(row);
    });
}

// Análisis por categorías
function calculateCategoryAnalysis() {
    const categoryStats = {};
    const totalAmount = filteredMovements.reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
    
    filteredMovements.forEach(mov => {
        const cat = mov.categoria;
        const amount = parseFloat(mov.monto || 0);
        
        if (!categoryStats[cat]) {
            categoryStats[cat] = {
                count: 0,
                total: 0,
                amounts: []
            };
        }
        
        categoryStats[cat].count++;
        categoryStats[cat].total += amount;
        categoryStats[cat].amounts.push(amount);
    });
    
    // Calcular métricas por categoría
    Object.keys(categoryStats).forEach(cat => {
        const stats = categoryStats[cat];
        stats.average = stats.total / stats.count;
        stats.percentage = totalAmount > 0 ? (stats.total / totalAmount) * 100 : 0;
        stats.frequency = (stats.count / filteredMovements.length) * 100;
    });
    
    // Ordenar por total descendente
    const sortedCategories = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b.total - a.total);
    
    // Renderizar tabla
    const tableBody = document.getElementById('categoryStatsTable');
    tableBody.innerHTML = '';
    
    if (sortedCategories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay datos</td></tr>';
        return;
    }
    
    sortedCategories.forEach(([categoria, stats]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="fw-bold">${categoria}</span></td>
            <td>${stats.count}</td>
            <td class="fw-bold">${api.formatCurrency(stats.total)}</td>
            <td>${api.formatCurrency(stats.average)}</td>
            <td>${stats.percentage.toFixed(1)}%</td>
            <td>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-primary" style="width: ${stats.frequency}%"></div>
                </div>
                <small class="text-muted">${stats.frequency.toFixed(1)}%</small>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Análisis temporal
function calculateTemporalAnalysis() {
    // Análisis por día de la semana
    const weekdayStats = {};
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Inicializar días
    dayNames.forEach((day, index) => {
        weekdayStats[index] = {
            name: day,
            count: 0,
            total: 0
        };
    });
    
    // Análisis por mes del año
    const monthlyStats = {};
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Inicializar meses
    monthNames.forEach((month, index) => {
        monthlyStats[index] = {
            name: month,
            count: 0,
            total: 0
        };
    });
    
    // Procesar movimientos
    filteredMovements.forEach(mov => {
        const date = new Date(mov.fecha);
        const weekday = date.getDay();
        const month = date.getMonth();
        const amount = parseFloat(mov.monto || 0);
        
        // Estadísticas por día de semana
        weekdayStats[weekday].count++;
        weekdayStats[weekday].total += amount;
        
        // Estadísticas por mes
        monthlyStats[month].count++;
        monthlyStats[month].total += amount;
    });
    
    // Renderizar análisis de días de semana
    const weekdayContainer = document.getElementById('weekdayStats');
    weekdayContainer.innerHTML = '';
    
    const maxWeekdayCount = Math.max(...Object.values(weekdayStats).map(stat => stat.count));
    
    Object.values(weekdayStats).forEach(stat => {
        const percentage = maxWeekdayCount > 0 ? (stat.count / maxWeekdayCount) * 100 : 0;
        const avg = stat.count > 0 ? stat.total / stat.count : 0;
        
        const statDiv = document.createElement('div');
        statDiv.className = 'mb-3';
        statDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold">${stat.name}</span>
                <span class="text-muted">${stat.count} mov.</span>
            </div>
            <div class="progress mb-1" style="height: 8px;">
                <div class="progress-bar bg-primary" style="width: ${percentage}%"></div>
            </div>
            <div class="d-flex justify-content-between">
                <small class="text-muted">Total: ${api.formatCurrency(stat.total)}</small>
                <small class="text-muted">Prom: ${api.formatCurrency(avg)}</small>
            </div>
        `;
        weekdayContainer.appendChild(statDiv);
    });
    
    // Renderizar análisis mensual
    const monthlyContainer = document.getElementById('monthlyStats');
    monthlyContainer.innerHTML = '';
    
    const maxMonthlyCount = Math.max(...Object.values(monthlyStats).map(stat => stat.count));
    
    Object.values(monthlyStats).forEach(stat => {
        const percentage = maxMonthlyCount > 0 ? (stat.count / maxMonthlyCount) * 100 : 0;
        
        const statDiv = document.createElement('div');
        statDiv.className = 'mb-2';
        statDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold">${stat.name}</span>
                <span class="text-muted">${stat.count}</span>
            </div>
            <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-success" style="width: ${percentage}%"></div>
            </div>
        `;
        monthlyContainer.appendChild(statDiv);
    });
}

// Calcular proyecciones
function calculateProjections() {
    if (filteredMovements.length < 3) {
        // Datos insuficientes
        updateElement('nextMonthPrediction', 'N/A');
        updateElement('trend', '❓');
        updateElement('seasonality', 'N/A');
        updateElement('volatility', 'N/A');
        return;
    }
    
    // Agrupar por mes para análisis de tendencia
    const monthlyData = {};
    filteredMovements.forEach(mov => {
        const date = new Date(mov.fecha);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += parseFloat(mov.monto || 0);
    });
    
    const monthlyAmounts = Object.values(monthlyData);
    
    // Predicción simple (promedio de últimos 3 meses)
    const recent3Months = monthlyAmounts.slice(-3);
    const prediction = recent3Months.reduce((sum, val) => sum + val, 0) / recent3Months.length;
    updateElement('nextMonthPrediction', api.formatCurrency(prediction));
    
    // Análisis de tendencia
    const trend = calculateTrendDirection(monthlyAmounts);
    let trendIcon = '➡️';
    if (trend > 0.05) trendIcon = '📈';
    else if (trend < -0.05) trendIcon = '📉';
    updateElement('trend', trendIcon);
    
    // Estacionalidad (variación entre meses)
    const seasonalVariation = calculateVariationCoefficient(monthlyAmounts);
    let seasonalityText = 'Normal';
    if (seasonalVariation > 50) seasonalityText = 'Alta';
    else if (seasonalVariation < 15) seasonalityText = 'Baja';
    updateElement('seasonality', seasonalityText);
    
    // Volatilidad
    let volatilityText = 'Baja';
    if (seasonalVariation > 40) volatilityText = 'Alta';
    else if (seasonalVariation > 20) volatilityText = 'Media';
    updateElement('volatility', volatilityText);
}

// === FUNCIONES MATEMÁTICAS ===

// Calcular media
function calculateMean(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// Calcular mediana
function calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
}

// Calcular desviación estándar
function calculateStandardDeviation(values, mean) {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

// Calcular percentil
function calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
        return sorted[index];
    } else {
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
    }
}

// Calcular asimetría (skewness)
function calculateSkewness(values, mean, stdDev) {
    if (values.length < 3 || stdDev === 0) return 0;
    
    const n = values.length;
    const sum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
}

// Calcular curtosis
function calculateKurtosis(values, mean, stdDev) {
    if (values.length < 4 || stdDev === 0) return 0;
    
    const n = values.length;
    const sum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}

// Calcular dirección de tendencia
function calculateTrendDirection(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const avgY = sumY / n;
    
    return avgY > 0 ? slope / avgY : 0; // Normalizar por el valor promedio
}

// Calcular coeficiente de variación
function calculateVariationCoefficient(values) {
    const mean = calculateMean(values);
    const stdDev = calculateStandardDeviation(values, mean);
    return mean > 0 ? (stdDev / mean) * 100 : 0;
}

// === EXPORTAR ESTADÍSTICAS ===

function exportStatistics() {
    try {
        if (filteredMovements.length === 0) {
            alert('⚠️ No hay datos para exportar');
            return;
        }
        
        // Recopilar todas las estadísticas
        const amounts = filteredMovements.map(mov => parseFloat(mov.monto || 0));
        const mean = calculateMean(amounts);
        const median = calculateMedian(amounts);
        const stdDev = calculateStandardDeviation(amounts, mean);
        
        // Crear contenido del reporte
        let report = 'REPORTE DE ESTADÍSTICAS FINANCIERAS\n';
        report += '======================================\n\n';
        report += `Periodo analizado: ${document.getElementById('statsPeriod').selectedOptions[0].text}\n`;
        report += `Total de movimientos: ${filteredMovements.length}\n\n`;
        
        report += 'ESTADÍSTICAS PRINCIPALES:\n';
        report += `--------------------------\n`;
        report += `Promedio: ${api.formatCurrency(mean)}\n`;
        report += `Mediana: ${api.formatCurrency(median)}\n`;
        report += `Desviación Estándar: ${api.formatCurrency(stdDev)}\n`;
        report += `Mínimo: ${api.formatCurrency(Math.min(...amounts))}\n`;
        report += `Máximo: ${api.formatCurrency(Math.max(...amounts))}\n\n`;
        
        // Análisis por categorías
        const categoryStats = {};
        filteredMovements.forEach(mov => {
            const cat = mov.categoria;
            const amount = parseFloat(mov.monto || 0);
            
            if (!categoryStats[cat]) {
                categoryStats[cat] = { count: 0, total: 0 };
            }
            categoryStats[cat].count++;
            categoryStats[cat].total += amount;
        });
        
        report += 'ANÁLISIS POR CATEGORÍAS:\n';
        report += '-------------------------\n';
        Object.entries(categoryStats)
            .sort(([,a], [,b]) => b.total - a.total)
            .forEach(([categoria, stats]) => {
                report += `${categoria}: ${stats.count} mov., ${api.formatCurrency(stats.total)}\n`;
            });
        
        report += `\nReporte generado: ${new Date().toLocaleString('es-CR')}\n`;
        report += 'FideFinance - Gestión Financiera Simple';
        
        // Descargar archivo
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `estadisticas-${new Date().toISOString().split('T')[0]}.txt`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Estadísticas exportadas exitosamente');
        
    } catch (error) {
        console.error('Error exportando estadísticas:', error);
        alert('❌ Error al exportar estadísticas');
    }
}

// === FUNCIONES DE UTILIDAD ===

// Actualizar elemento del DOM
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Mostrar mensaje cuando no hay datos
function showNoDataMessage() {
    const tableIds = ['distributionTable', 'categoryStatsTable'];
    
    tableIds.forEach(tableId => {
        const table = document.getElementById(tableId);
        if (table) {
            table.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No hay datos suficientes para el análisis</td></tr>';
        }
    });
    
    const containerIds = ['weekdayStats', 'monthlyStats'];
    
    containerIds.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                    <p>No hay datos suficientes</p>
                </div>
            `;
        }
    });
    
    // Limpiar métricas
    const metrics = [
        'avgMonthly', 'median', 'standardDeviation', 'variationCoeff',
        'minValue', 'maxValue', 'range', 'q1', 'q3', 'iqr', 'skewness', 'kurtosis'
    ];
    
    metrics.forEach(metricId => {
        const element = document.getElementById(metricId);
        if (element) {
            const isPercentage = metricId.includes('Coeff');
            const isDecimal = metricId.includes('ness') || metricId.includes('osis');
            element.textContent = isPercentage ? '0%' : isDecimal ? '0.00' : '₡0';
        }
    });
}

// Generar datos de ejemplo
function generateSampleData() {
    const movements = [];
    const categories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Salario', 'Freelance'];
    
    // Generar datos para el último año
    for (let month = 0; month < 12; month++) {
        const date = new Date();
        date.setMonth(date.getMonth() - month);
        
        // Generar movimientos por mes
        for (let i = 0; i < Math.floor(Math.random() * 25) + 15; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const movDate = new Date(date.getFullYear(), date.getMonth(), day);
            
            const isIncome = Math.random() > 0.75;
            const categoria = categories[Math.floor(Math.random() * categories.length)];
            
            let monto;
            if (isIncome) {
                monto = Math.floor(Math.random() * 400000) + 100000; // 100k-500k
            } else {
                // Distribución más realista de gastos
                const rand = Math.random();
                if (rand < 0.6) monto = Math.floor(Math.random() * 20000) + 2000; // Gastos pequeños
                else if (rand < 0.9) monto = Math.floor(Math.random() * 50000) + 20000; // Gastos medianos
                else monto = Math.floor(Math.random() * 100000) + 50000; // Gastos grandes
            }
            
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
    const statisticsContent = document.getElementById('statisticsContent');
    
    if (loadingIndicator && statisticsContent) {
        if (show) {
            loadingIndicator.style.display = 'block';
            statisticsContent.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
            statisticsContent.style.display = 'block';
        }
    }
}

// Mostrar error
function showError(message) {
    const statisticsContent = document.getElementById('statisticsContent');
    if (statisticsContent) {
        statisticsContent.innerHTML = `
            <div class="alert alert-danger">
                <h5>❌ Error</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-sync me-1"></i>Reintentar
                </button>
            </div>
        `;
        statisticsContent.style.display = 'block';
    }
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
}

// Hacer funciones globales
window.calculateStatistics = calculateStatistics;
window.exportStatistics = exportStatistics;
window.cerrarSesion = cerrarSesion;