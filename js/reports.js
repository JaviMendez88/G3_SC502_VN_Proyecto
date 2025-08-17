let currentUser = null;
let allMovements = [];
let filteredMovements = [];
let categories = [];

// Inicializar reportes
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    if (!api.isAuthenticated()) {
        alert('Debes iniciar sesión para acceder');
        window.location.href = 'user_logIn.html';
        return;
    }

    await loadReports();
});

// Cargar datos para reportes
async function loadReports() {
    try {
        showLoading(true);
        
        // Obtener usuario actual
        currentUser = api.getCurrentUser();
        
        // Cargar movimientos y categorías
        await Promise.all([
            loadMovements(),
            loadCategories()
        ]);
        
        // Configurar fechas por defecto (este mes)
        setDefaultDates();
        
        // Llenar filtros
        populateFilters();
        
        // Generar reporte inicial
        generateReport();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error cargando reportes:', error);
        showError('Error al cargar los reportes');
    }
}

// Cargar movimientos
async function loadMovements() {
    try {
        const response = await api.getMovements(1000); // Cargar muchos movimientos
        allMovements = response.movements || [];
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        // Datos de ejemplo si falla
        allMovements = generateSampleMovements();
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

// Configurar fechas por defecto
function setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('startDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

// Llenar filtros
function populateFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    
    // Limpiar opciones existentes (excepto "Todas")
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

// Generar reporte
function generateReport() {
    try {
        // Obtener filtros
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        // Filtrar movimientos
        filteredMovements = filterMovements(startDate, endDate, categoryFilter);
        
        // Actualizar resumen
        updateReportSummary();
        
        // Actualizar tabla según el tipo de reporte
        updateReportTable(reportType);
        
        // Actualizar estadísticas laterales
        updateSideStats();
        
        // Actualizar título del periodo
        updatePeriodTitle(startDate, endDate);
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        alert('Error al generar el reporte');
    }
}

// Filtrar movimientos
function filterMovements(startDate, endDate, category) {
    return allMovements.filter(mov => {
        // Filtro por fecha
        const movDate = new Date(mov.fecha);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (movDate < start || movDate > end) {
            return false;
        }
        
        // Filtro por categoría
        if (category && mov.categoria !== category) {
            return false;
        }
        
        return true;
    });
}

// Actualizar resumen del reporte
function updateReportSummary() {
    const ingresos = filteredMovements
        .filter(mov => mov.tipo === 'ingreso')
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
    
    const gastos = filteredMovements
        .filter(mov => mov.tipo === 'gasto')
        .reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
    
    const balance = ingresos - gastos;
    const totalMovimientos = filteredMovements.length;
    
    document.getElementById('reportIngresos').textContent = api.formatCurrency(ingresos);
    document.getElementById('reportGastos').textContent = api.formatCurrency(gastos);
    document.getElementById('reportBalance').textContent = api.formatCurrency(balance);
    document.getElementById('reportMovimientos').textContent = totalMovimientos;
    
    // Cambiar color del balance
    const balanceElement = document.getElementById('reportBalance');
    balanceElement.className = balance >= 0 ? 'text-success mb-1' : 'text-danger mb-1';
}

// Actualizar tabla del reporte
function updateReportTable(reportType) {
    const tableBody = document.getElementById('reportTableBody');
    const resultCount = document.getElementById('resultCount');
    const reportTitle = document.getElementById('reportTitle');
    
    // Actualizar título según tipo
    const titles = {
        'monthly': 'Movimientos del Mes',
        'category': 'Movimientos por Categoría',
        'comparison': 'Comparativo de Periodos',
        'custom': 'Reporte Personalizado'
    };
    reportTitle.textContent = titles[reportType] || 'Detalle de Movimientos';
    
    // Limpiar tabla
    tableBody.innerHTML = '';
    
    if (filteredMovements.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-inbox fa-2x mb-2 d-block text-muted"></i>
                    <p class="text-muted mb-0">No se encontraron movimientos para este periodo</p>
                </td>
            </tr>
        `;
        resultCount.textContent = '0 resultados';
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    const sortedMovements = [...filteredMovements].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Mostrar movimientos
    sortedMovements.forEach(mov => {
        const fecha = formatDate(mov.fecha);
        const tipoClass = mov.tipo === 'ingreso' ? 'text-success' : 'text-danger';
        const tipoIcon = mov.tipo === 'ingreso' ? '💰' : '💸';
        
        tableBody.innerHTML += `
            <tr>
                <td>${fecha}</td>
                <td class="${tipoClass}">
                    ${tipoIcon} ${capitalizeFirst(mov.tipo)}
                </td>
                <td><span class="badge bg-secondary">${mov.categoria}</span></td>
                <td class="${tipoClass} fw-bold">${api.formatCurrency(mov.monto)}</td>
                <td class="text-truncate" style="max-width: 200px;" title="${mov.descripcion || 'Sin descripción'}">
                    ${mov.descripcion || '-'}
                </td>
            </tr>
        `;
    });
    
    resultCount.textContent = `${filteredMovements.length} resultado${filteredMovements.length !== 1 ? 's' : ''}`;
}

// Actualizar estadísticas laterales
function updateSideStats() {
    // Top categorías
    updateTopCategories();
    
    // Estadísticas rápidas
    updateQuickStats();
}

// Actualizar top categorías
function updateTopCategories() {
    const container = document.getElementById('topCategoriesReport');
    
    // Agrupar por categoría
    const categoryStats = {};
    filteredMovements.forEach(mov => {
        if (!categoryStats[mov.categoria]) {
            categoryStats[mov.categoria] = { total: 0, count: 0, tipo: mov.tipo };
        }
        categoryStats[mov.categoria].total += parseFloat(mov.monto || 0);
        categoryStats[mov.categoria].count++;
    });
    
    // Convertir a array y ordenar
    const sortedCategories = Object.entries(categoryStats)
        .map(([categoria, stats]) => ({ categoria, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    
    if (sortedCategories.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-chart-pie fa-2x mb-2 d-block text-muted"></i>
                <small class="text-muted">No hay datos para mostrar</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    sortedCategories.forEach((cat, index) => {
        const percentage = sortedCategories[0].total > 0 ? 
            Math.round((cat.total / sortedCategories[0].total) * 100) : 0;
        
        const colorClass = cat.tipo === 'ingreso' ? 'bg-success' : 'bg-danger';
        
        container.innerHTML += `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <small class="fw-bold text-dark">${cat.categoria}</small>
                    <small class="text-muted">${cat.count} mov.</small>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                    <small class="text-muted">${api.formatCurrency(cat.total)}</small>
                    <small class="text-muted">${percentage}%</small>
                </div>
            </div>
        `;
    });
}

// Actualizar estadísticas rápidas
function updateQuickStats() {
    const gastos = filteredMovements.filter(mov => mov.tipo === 'gasto');
    const ingresos = filteredMovements.filter(mov => mov.tipo === 'ingreso');
    
    // Promedio diario de gastos
    const totalGastos = gastos.reduce((sum, mov) => sum + parseFloat(mov.monto || 0), 0);
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
    const avgDaily = totalGastos / days;
    
    // Gasto más alto
    const maxExpense = gastos.length > 0 ? Math.max(...gastos.map(mov => parseFloat(mov.monto || 0))) : 0;
    
    // Ingreso más alto
    const maxIncome = ingresos.length > 0 ? Math.max(...ingresos.map(mov => parseFloat(mov.monto || 0))) : 0;
    
    // Días activos
    const uniqueDays = [...new Set(filteredMovements.map(mov => mov.fecha.split('T')[0]))].length;
    
    document.getElementById('avgDaily').textContent = api.formatCurrency(avgDaily);
    document.getElementById('maxExpense').textContent = api.formatCurrency(maxExpense);
    document.getElementById('maxIncome').textContent = api.formatCurrency(maxIncome);
    document.getElementById('activeDays').textContent = uniqueDays;
}

// Actualizar título del periodo
function updatePeriodTitle(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
    
    document.getElementById('currentPeriod').textContent = `${startStr} - ${endStr}`;
}

// === FUNCIONES DE FILTROS RÁPIDOS ===

// Configurar filtro rápido
function setQuickFilter(period) {
    const today = new Date();
    let startDate, endDate;
    
    switch (period) {
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay()); // Domingo de esta semana
            endDate = today;
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = today;
            break;
        default:
            return;
    }
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    generateReport();
}

// === EXPORTAR REPORTE ===

// Exportar reporte
function exportReport() {
    try {
        if (filteredMovements.length === 0) {
            alert('⚠️ No hay datos para exportar');
            return;
        }
        
        // Crear CSV
        let csv = 'Fecha,Tipo,Categoría,Monto,Descripción\n';
        
        filteredMovements.forEach(mov => {
            const fecha = formatDate(mov.fecha);
            const descripcion = (mov.descripcion || '').replace(/,/g, ';');
            csv += `${fecha},${mov.tipo},${mov.categoria},${mov.monto},"${descripcion}"\n`;
        });
        
        // Descargar archivo
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const filename = `reporte-${startDate}-${endDate}.csv`;
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Reporte exportado exitosamente');
        
    } catch (error) {
        console.error('Error exportando reporte:', error);
        alert('Error al exportar el reporte');
    }
}

// === FUNCIONES DE UTILIDAD ===

// Generar datos de ejemplo si no hay conexión
function generateSampleMovements() {
    const categories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Salario', 'Freelance'];
    const movements = [];
    
    for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Últimos 3 meses
        
        const isIncome = Math.random() > 0.7; // 30% ingresos, 70% gastos
        const tipo = isIncome ? 'ingreso' : 'gasto';
        const categoria = categories[Math.floor(Math.random() * categories.length)];
        const monto = isIncome ? 
            Math.floor(Math.random() * 500000) + 100000 : // Ingresos: 100k-600k
            Math.floor(Math.random() * 50000) + 5000;     // Gastos: 5k-55k
        
        movements.push({
            id: i + 1,
            fecha: date.toISOString().split('T')[0],
            tipo: tipo,
            categoria: categoria,
            monto: monto,
            descripcion: `${tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} de ${categoria}`
        });
    }
    
    return movements;
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

// Mostrar/ocultar loading
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const reportsContent = document.getElementById('reportsContent');
    
    if (loadingIndicator && reportsContent) {
        if (show) {
            loadingIndicator.style.display = 'block';
            reportsContent.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
            reportsContent.style.display = 'block';
        }
    }
}

// Mostrar error
function showError(message) {
    const reportsContent = document.getElementById('reportsContent');
    if (reportsContent) {
        reportsContent.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-sync me-1"></i>Reintentar
                </button>
            </div>
        `;
        reportsContent.style.display = 'block';
    }
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
}

// Hacer funciones globales
window.generateReport = generateReport;
window.setQuickFilter = setQuickFilter;
window.exportReport = exportReport;
window.cerrarSesion = cerrarSesion;