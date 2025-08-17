// dashboard.js - MEJORADO CON FUNCIONES COMPLETAS
let dashboardData = null;
let currentUser = null;
let monthlyChart = null;
let categoriesChart = null;

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    if (!api.isAuthenticated()) {
        alert('Debes iniciar sesión para acceder');
        window.location.href = 'user_logIn.html';
        return;
    }

    // Configurar modal
    preloadCategoriesOnModalOpen();
    
    // Cargar dashboard
    await loadDashboard();
});

// Cargar todos los datos del dashboard
async function loadDashboard() {
    try {
        showLoading(true);
        
        // Obtener usuario actual
        currentUser = api.getCurrentUser();
        
        // Cargar datos del dashboard
        const response = await api.getDashboard();
        dashboardData = response.data;
        
        // Actualizar UI
        updateUserHeader();
        updateQuickStats();
        updateCurrentMonthSummary();
        updateRecentMovements();
        updateTopCategories();
        
        // Crear gráficos si hay datos
        if (dashboardData.monthly_stats && dashboardData.monthly_stats.length > 0) {
            createMonthlyChart();
        }
        
        if (dashboardData.categories_stats && dashboardData.categories_stats.length > 0) {
            createCategoriesChart();
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showError('Error al cargar el dashboard: ' + error.message);
        showLoading(false);
    }
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

// Crear gráfico mensual
function createMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx || !dashboardData.monthly_stats) return;
    
    const monthlyStats = dashboardData.monthly_stats;
    
    // Preparar datos
    const labels = monthlyStats.map(m => m.mes_nombre || `Mes ${m.mes}`);
    const ingresos = monthlyStats.map(m => m.ingresos || 0);
    const gastos = monthlyStats.map(m => m.gastos || 0);
    const balance = monthlyStats.map(m => (m.ingresos || 0) - (m.gastos || 0));
    
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
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#198754',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                },
                {
                    label: 'Gastos',
                    data: gastos,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#dc3545',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                },
                {
                    label: 'Balance',
                    data: balance,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#ffc107',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ffc107',
                    borderWidth: 1,
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
                        padding: 20
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Meses',
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Crear gráfico de categorías
function createCategoriesChart() {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx || !dashboardData.categories_stats) return;
    
    // Filtrar solo gastos para el gráfico
    const gastos = dashboardData.categories_stats.filter(cat => cat.tipo === 'gasto');
    
    if (gastos.length === 0) {
        ctx.parentElement.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-chart-pie fa-3x mb-3 d-block"></i>
                <p>No hay datos de gastos por categoría</p>
                <button class="btn btn-sm btn-success" data-bs-toggle="modal" data-bs-target="#modalNuevoMovimiento">
                    <i class="fas fa-plus me-1"></i>Agregar gasto
                </button>
            </div>
        `;
        return;
    }
    
    // Preparar datos
    const labels = gastos.map(cat => cat.categoria);
    const data = gastos.map(cat => cat.total);
    const colors = [
        '#ffc107', '#dc3545', '#198754', '#0d6efd',
        '#6f42c1', '#fd7e14', '#20c997', '#e83e8c',
        '#6c757d', '#17a2b8'
    ];
    
    // Destruir gráfico anterior si existe
    if (categoriesChart) {
        categoriesChart.destroy();
    }
    
    // Crear nuevo gráfico
    categoriesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 3,
                borderColor: '#fff',
                hoverBorderWidth: 4
            }]
        },
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
                            return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
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
    return api.formatCurrency(amount);
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

// === FUNCIONES GLOBALES ===

// Actualizar dashboard
async function refreshDashboard() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...';
        
        await loadDashboard();
        
        api.showMessage('Dashboard actualizado exitosamente', 'success');
        
    } catch (error) {
        api.showMessage('Error al actualizar dashboard', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Exportar datos
function exportData() {
    try {
        if (!dashboardData || !dashboardData.recent_movements) {
            alert('⚠️ No hay datos para exportar');
            return;
        }
        
        // Crear CSV con los movimientos
        let csv = 'Fecha,Tipo,Categoría,Monto,Descripción\n';
        
        dashboardData.recent_movements.forEach(mov => {
            const fecha = formatDate(mov.fecha);
            const descripcion = (mov.descripcion || '').replace(/,/g, ';'); // Reemplazar comas
            csv += `${fecha},${mov.tipo},${mov.categoria},${mov.monto},"${descripcion}"\n`;
        });
        
        // Descargar archivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `fidefinance-movimientos-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        api.showMessage('Datos exportados exitosamente', 'success');
        
    } catch (error) {
        console.error('Error exportando datos:', error);
        api.showMessage('Error al exportar datos', 'error');
    }
}

// === GESTIÓN DE CATEGORÍAS EN DASHBOARD ===

let dashboardCategories = []; // Cache de categorías

// Cargar categorías cuando se selecciona el tipo
async function loadCategoriesForType() {
    const tipoSelect = document.getElementById('tipoMovimiento');
    const categoriaSelect = document.getElementById('categoriaMovimiento');
    const loadingIndicator = document.getElementById('categoriesLoadingIndicator');
    
    const selectedType = tipoSelect.value;
    
    if (!selectedType) {
        // Si no hay tipo seleccionado, deshabilitar categorías
        categoriaSelect.disabled = true;
        categoriaSelect.innerHTML = '<option value="">Selecciona un tipo primero</option>';
        return;
    }
    
    try {
        // Mostrar indicador de carga
        loadingIndicator.style.display = 'block';
        categoriaSelect.disabled = true;
        categoriaSelect.innerHTML = '<option value="">Cargando categorías...</option>';
        
        console.log('🔄 Cargando categorías para tipo:', selectedType);
        
        // Si no tenemos categorías en cache, cargarlas
        if (dashboardCategories.length === 0) {
            const response = await api.getCategories();
            if (response.success && response.data) {
                dashboardCategories = response.data.all || [];
                console.log('✅ Categorías cargadas en cache:', dashboardCategories.length);
            } else {
                throw new Error('Error al cargar categorías');
            }
        }
        
        // Filtrar categorías por tipo
        const filteredCategories = dashboardCategories.filter(cat => cat.tipo === selectedType);
        console.log(`📋 Categorías de ${selectedType}:`, filteredCategories.length);
        
        // Poblar el select
        populateCategoriesSelect(categoriaSelect, filteredCategories, selectedType);
        
        // Habilitar select
        categoriaSelect.disabled = false;
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
        
        // Mostrar categorías por defecto en caso de error
        const defaultCategories = getDefaultCategories(selectedType);
        populateCategoriesSelect(categoriaSelect, defaultCategories, selectedType);
        categoriaSelect.disabled = false;
        
        // Mostrar mensaje de error sutil
        showCategoriesError();
        
    } finally {
        // Ocultar indicador de carga
        loadingIndicator.style.display = 'none';
    }
}

// Poblar el select con las categorías
function populateCategoriesSelect(selectElement, categories, type) {
    // Limpiar opciones existentes
    selectElement.innerHTML = '';
    
    // Agregar opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Seleccionar categoría de ${type}`;
    selectElement.appendChild(defaultOption);
    
    // Agregar categorías
    if (categories.length === 0) {
        const noCategories = document.createElement('option');
        noCategories.value = '';
        noCategories.textContent = `No hay categorías de ${type}`;
        noCategories.disabled = true;
        selectElement.appendChild(noCategories);
        return;
    }
    
    // Ordenar categorías alfabéticamente
    const sortedCategories = categories.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.nombre;
        
        // Crear texto con icono si existe
        let iconText = '';
        if (category.icon) {
            if (category.icon.startsWith('fas ') || category.icon.startsWith('far ') || category.icon.startsWith('fab ')) {
                // Para iconos Font Awesome, solo usar el nombre
                iconText = '';
            } else {
                // Para emojis, agregarlos
                iconText = `${category.icon} `;
            }
        }
        
        option.textContent = `${iconText}${category.nombre}`;
        selectElement.appendChild(option);
    });
    
    console.log(`✅ ${categories.length} categorías agregadas al select`);
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
        
        // Restaurar texto original después de 5 segundos
        setTimeout(() => {
            formText.innerHTML = '<i class="fas fa-info-circle me-1"></i>Las categorías se cargan según el tipo seleccionado';
        }, 5000);
    }
}

// Limpiar formulario de movimiento
function limpiarFormularioMovimiento() {
    document.getElementById('formNuevoMovimiento').reset();
    
    // Restablecer estado de categorías
    const categoriaSelect = document.getElementById('categoriaMovimiento');
    categoriaSelect.disabled = true;
    categoriaSelect.innerHTML = '<option value="">Selecciona un tipo primero</option>';
    
    // Ocultar indicador de carga
    document.getElementById('categoriesLoadingIndicator').style.display = 'none';
    
    // Establecer fecha actual por defecto
    const fechaInput = document.getElementById('fechaMovimiento');
    const today = new Date().toISOString().split('T')[0];
    fechaInput.value = today;
    
    console.log('🧹 Formulario de movimiento limpiado');
}

// Pre-cargar categorías cuando se abre el modal
function preloadCategoriesOnModalOpen() {
    // Listener para cuando se abre el modal
    const modal = document.getElementById('modalNuevoMovimiento');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            console.log('📂 Modal de nuevo movimiento abierto');
            limpiarFormularioMovimiento();
            
            // Pre-cargar categorías en background si no están en cache
            if (dashboardCategories.length === 0) {
                console.log('🔄 Pre-cargando categorías en background...');
                api.getCategories().then(response => {
                    if (response.success && response.data) {
                        dashboardCategories = response.data.all || [];
                        console.log('✅ Categorías pre-cargadas:', dashboardCategories.length);
                    }
                }).catch(error => {
                    console.warn('⚠️ Error pre-cargando categorías:', error);
                });
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    preloadCategoriesOnModalOpen();
});

// Hacer funciones globales
window.loadCategoriesForType = loadCategoriesForType;
window.limpiarFormularioMovimiento = limpiarFormularioMovimiento;

// === GUARDAR MOVIMIENTO ACTUALIZADO ===

async function guardarMovimiento() {
    try {
        // Obtener datos del formulario
        const fecha = document.getElementById('fechaMovimiento').value;
        const tipo = document.getElementById('tipoMovimiento').value;
        const categoria = document.getElementById('categoriaMovimiento').value;
        const monto = document.getElementById('montoMovimiento').value;
        const descripcion = document.getElementById('descripcionMovimiento').value.trim();
        
        // Validaciones mejoradas
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
        
        // Validar que la fecha no sea futura (opcional)
        const fechaSeleccionada = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999); // Hasta el final del día
        
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
        
        // Preparar datos para enviar
        const movementData = {
            fecha: fecha,
            tipo: tipo,
            categoria: categoria,
            monto: parseFloat(monto),
            descripcion: descripcion || null
        };
        
        console.log('💾 Guardando movimiento:', movementData);
        
        // Enviar al backend
        const response = await api.createMovement(movementData);
        
        if (response.success) {
            console.log('✅ Movimiento guardado con ID:', response.movement_id);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoMovimiento'));
            modal.hide();
            
            // Limpiar formulario
            limpiarFormularioMovimiento();
            
            // Actualizar dashboard (recargar datos)
            await refreshDashboardData();
            
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

// Refrescar datos del dashboard después de guardar
async function refreshDashboardData() {
    try {
        console.log('🔄 Actualizando datos del dashboard...');
        
        // Si tienes una función loadDashboard, llamarla
        if (typeof loadDashboard === 'function') {
            await loadDashboard();
        }
        
        // O si tienes funciones específicas, llamarlas
        if (typeof loadRecentMovements === 'function') {
            await loadRecentMovements();
        }
        
        if (typeof updateStatsCards === 'function') {
            await updateStatsCards();
        }
        
        console.log('✅ Dashboard actualizado');
        
    } catch (error) {
        console.warn('⚠️ Error actualizando dashboard:', error);
    }
}

// Mostrar mensaje de éxito
function showSuccessMessage(message) {
    // Crear toast de éxito (si tienes Bootstrap toast)
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
        
        // Agregar toast al DOM y mostrarlo
        const toastContainer = document.querySelector('.toast-container') || document.body;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = toastHtml;
        const toastElement = tempDiv.firstElementChild;
        toastContainer.appendChild(toastElement);
        
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Remover del DOM después de que se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    } else {
        // Fallback con alert
        alert('✅ ' + message);
    }
}

// Función auxiliar para actualizar solo el botón
function refreshDashboard() {
    refreshDashboardData().then(() => {
        showSuccessMessage('Dashboard actualizado');
    }).catch(error => {
        alert('Error al actualizar dashboard');
        console.error(error);
    });
}

// Hacer funciones globales
window.guardarMovimiento = guardarMovimiento;
window.refreshDashboard = refreshDashboard;

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
}

// Hacer funciones disponibles globalmente
window.refreshDashboard = refreshDashboard;
window.exportData = exportData;
window.cerrarSesion = cerrarSesion;
window.guardarMovimiento = guardarMovimiento;