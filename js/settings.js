let currentUser = null;
let userCategories = [];

// Inicializar configuración
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    if (!api.isAuthenticated()) {
        alert('Debes iniciar sesión para acceder');
        window.location.href = 'user_logIn.html';
        return;
    }

    await loadSettings();
});

// Cargar configuración
async function loadSettings() {
    try {
        showLoading(true);
        
        // Obtener usuario actual
        currentUser = api.getCurrentUser();
        
        // Cargar categorías
        await loadCategories();
        
        // Actualizar UI
        updateUserInfo();
        updateCategories();
        
        // Configurar formularios
        setupForms();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error cargando configuración:', error);
        showError('Error al cargar la configuración');
    }
}

// Cargar categorías 
async function loadCategories() {
    try {
        console.log('Cargando categorías desde el servidor...');
        
        const response = await api.getCategories();
        
        if (response.success && response.data) {
            userCategories = response.data.all || [];
            console.log('Categorías cargadas exitosamente:', userCategories.length);
            console.log('Categorías:', userCategories);
        } else {
            throw new Error('Respuesta inválida del servidor');
        }
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
        
        // Mostrar categorías por defecto solo si hay error
        userCategories = [
            { id: null, nombre: 'Alimentación', tipo: 'gasto', icon: 'fas fa-utensils', color: '#dc3545' },
            { id: null, nombre: 'Transporte', tipo: 'gasto', icon: 'fas fa-car', color: '#dc3545' },
            { id: null, nombre: 'Entretenimiento', tipo: 'gasto', icon: 'fas fa-gamepad', color: '#dc3545' },
            { id: null, nombre: 'Salario', tipo: 'ingreso', icon: 'fas fa-money-bill-wave', color: '#198754' },
            { id: null, nombre: 'Freelance', tipo: 'ingreso', icon: 'fas fa-laptop', color: '#198754' },
            { id: null, nombre: 'Otros ingresos', tipo: 'ingreso', icon: 'fas fa-plus-circle', color: '#198754' }
        ];
        
        console.warn('⚠️ Usando categorías por defecto debido a error');
    }
}

// Actualizar información del usuario
function updateUserInfo() {
    if (!currentUser) return;
    
    // Header
    const headerUserName = document.getElementById('headerUserName');
    if (headerUserName) {
        headerUserName.textContent = `${currentUser.nombre} ${currentUser.apellidos}`;
    }
    
    // Actualizar avatar
    const avatar = document.querySelector('img[alt="Avatar"]');
    if (avatar) {
        const fullName = `${currentUser.nombre} ${currentUser.apellidos}`;
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffc107&color=000&size=80`;
    }
    
    // Formulario de perfil
    document.getElementById('profileNombre').value = currentUser.nombre || '';
    document.getElementById('profileApellidos').value = currentUser.apellidos || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileTelefono').value = currentUser.telefono || '';
}

// Actualizar categorías 
function updateCategories() {
    console.log('=== updateCategories iniciado ===');
    console.log('userCategories disponibles:', userCategories.length);
    
    const incomeContainer = document.getElementById('incomeCategories');
    const expenseContainer = document.getElementById('expenseCategories');
    
    if (!incomeContainer || !expenseContainer) {
        console.error('No se encontraron los contenedores de categorías');
        return;
    }
    
    console.log('Contenedores encontrados');
    
    // Limpiar contenedores
    incomeContainer.innerHTML = '';
    expenseContainer.innerHTML = '';
    
    // Separar por tipo
    const incomeCategories = userCategories.filter(cat => cat.tipo === 'ingreso');
    const expenseCategories = userCategories.filter(cat => cat.tipo === 'gasto');
    
    console.log('Ingresos:', incomeCategories.length);
    console.log('Gastos:', expenseCategories.length);
    
    // Renderizar ingresos
    if (incomeCategories.length === 0) {
        incomeContainer.innerHTML = '<p class="text-muted text-center">No hay categorías de ingresos</p>';
    } else {
        let incomeHTML = '';
        incomeCategories.forEach(category => {
            incomeHTML += createCategoryItem(category);
        });
        incomeContainer.innerHTML = incomeHTML;
        console.log('Ingresos renderizados:', incomeHTML.length, 'caracteres');
    }
    
    // Renderizar gastos
    if (expenseCategories.length === 0) {
        expenseContainer.innerHTML = '<p class="text-muted text-center">No hay categorías de gastos</p>';
    } else {
        let expenseHTML = '';
        expenseCategories.forEach(category => {
            expenseHTML += createCategoryItem(category);
        });
        expenseContainer.innerHTML = expenseHTML;
        console.log('Gastos renderizados:', expenseHTML.length, 'caracteres');
    }
    
    console.log('updateCategories completado');
}

// Crear elemento de categoría MEJORADA
function createCategoryItem(category) {
    let iconHtml = '';
    
    // Verificar si es un icono de Font Awesome o emoji
    if (category.icon) {
        if (category.icon.startsWith('fas ') || category.icon.startsWith('far ') || category.icon.startsWith('fab ')) {
            // Es un icono de Font Awesome
            const colorClass = category.tipo === 'ingreso' ? 'text-success' : 'text-danger';
            iconHtml = `<i class="${category.icon} me-2 ${colorClass}" style="font-size: 1.2rem; width: 20px;"></i>`;
        } else {
            // Es un emoji o texto
            iconHtml = `<span class="me-2" style="font-size: 1.2rem; width: 20px; display: inline-block; text-align: center;">${category.icon}</span>`;
        }
    } else {
        // Icono por defecto
        const defaultIcon = category.tipo === 'ingreso' ? '💰' : '💸';
        iconHtml = `<span class="me-2" style="font-size: 1.2rem; width: 20px; display: inline-block; text-align: center;">${defaultIcon}</span>`;
    }
    
    const borderColor = category.tipo === 'ingreso' ? 'border-success' : 'border-danger';
    
    return `
        <div class="d-flex justify-content-between align-items-center p-3 mb-2 border ${borderColor} rounded bg-white shadow-sm">
            <div class="d-flex align-items-center">
                ${iconHtml}
                <span class="fw-medium">${category.nombre}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${category.nombre}')" title="Eliminar categoría">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

// === SELECTOR DE ICONOS ===

// Iconos disponibles organizados por tipo
const availableIcons = {
    gasto: {
        'Alimentación y Bebidas': [
            { icon: 'fas fa-utensils', name: 'Restaurante' },
            { icon: 'fas fa-hamburger', name: 'Comida rápida' },
            { icon: 'fas fa-pizza-slice', name: 'Pizza' },
            { icon: 'fas fa-coffee', name: 'Café' },
            { icon: 'fas fa-wine-glass', name: 'Bebidas' },
            { icon: 'fas fa-apple-alt', name: 'Comida saludable' }
        ],
        'Transporte': [
            { icon: 'fas fa-car', name: 'Auto' },
            { icon: 'fas fa-bus', name: 'Transporte público' },
            { icon: 'fas fa-subway', name: 'Metro' },
            { icon: 'fas fa-taxi', name: 'Taxi' },
            { icon: 'fas fa-motorcycle', name: 'Moto' },
            { icon: 'fas fa-gas-pump', name: 'Combustible' }
        ],
        'Hogar y Servicios': [
            { icon: 'fas fa-home', name: 'Vivienda' },
            { icon: 'fas fa-bolt', name: 'Electricidad' },
            { icon: 'fas fa-tint', name: 'Agua' },
            { icon: 'fas fa-wifi', name: 'Internet' },
            { icon: 'fas fa-phone', name: 'Teléfono' },
            { icon: 'fas fa-tv', name: 'Cable/Streaming' }
        ],
        'Compras y Ropa': [
            { icon: 'fas fa-shopping-cart', name: 'Compras' },
            { icon: 'fas fa-tshirt', name: 'Ropa' },
            { icon: 'fas fa-shoe-prints', name: 'Zapatos' },
            { icon: 'fas fa-shopping-bag', name: 'Shopping' },
            { icon: 'fas fa-gift', name: 'Regalos' },
            { icon: 'fas fa-gem', name: 'Lujo' }
        ],
        'Salud y Bienestar': [
            { icon: 'fas fa-heartbeat', name: 'Salud' },
            { icon: 'fas fa-pills', name: 'Medicamentos' },
            { icon: 'fas fa-dumbbell', name: 'Gimnasio' },
            { icon: 'fas fa-spa', name: 'Spa/Belleza' },
            { icon: 'fas fa-user-md', name: 'Médico' },
            { icon: 'fas fa-tooth', name: 'Dentista' }
        ],
        'Entretenimiento': [
            { icon: 'fas fa-gamepad', name: 'Videojuegos' },
            { icon: 'fas fa-film', name: 'Cine' },
            { icon: 'fas fa-music', name: 'Música' },
            { icon: 'fas fa-book', name: 'Libros' },
            { icon: 'fas fa-camera', name: 'Fotografía' },
            { icon: 'fas fa-plane', name: 'Viajes' }
        ],
        'Educación y Trabajo': [
            { icon: 'fas fa-graduation-cap', name: 'Educación' },
            { icon: 'fas fa-laptop', name: 'Tecnología' },
            { icon: 'fas fa-pencil-alt', name: 'Material escolar' },
            { icon: 'fas fa-briefcase', name: 'Trabajo' },
            { icon: 'fas fa-tools', name: 'Herramientas' },
            { icon: 'fas fa-clipboard', name: 'Oficina' }
        ]
    },
    ingreso: {
        'Trabajo y Profesión': [
            { icon: 'fas fa-money-bill-wave', name: 'Salario' },
            { icon: 'fas fa-laptop', name: 'Freelance' },
            { icon: 'fas fa-briefcase', name: 'Consultoría' },
            { icon: 'fas fa-handshake', name: 'Comisiones' },
            { icon: 'fas fa-award', name: 'Bonos' },
            { icon: 'fas fa-clock', name: 'Horas extra' }
        ],
        'Inversiones y Finanzas': [
            { icon: 'fas fa-chart-line', name: 'Inversiones' },
            { icon: 'fas fa-university', name: 'Banco' },
            { icon: 'fas fa-percentage', name: 'Intereses' },
            { icon: 'fas fa-coins', name: 'Dividendos' },
            { icon: 'fas fa-piggy-bank', name: 'Ahorros' },
            { icon: 'fas fa-credit-card', name: 'Cashback' }
        ],
        'Ventas y Negocios': [
            { icon: 'fas fa-tag', name: 'Ventas' },
            { icon: 'fas fa-store', name: 'Negocio' },
            { icon: 'fas fa-cash-register', name: 'Punto de venta' },
            { icon: 'fas fa-shipping-fast', name: 'E-commerce' },
            { icon: 'fas fa-users', name: 'Servicios' },
            { icon: 'fas fa-truck', name: 'Delivery' }
        ],
        'Otros Ingresos': [
            { icon: 'fas fa-gift', name: 'Regalos/Dinero' },
            { icon: 'fas fa-home', name: 'Alquiler' },
            { icon: 'fas fa-undo', name: 'Reembolsos' },
            { icon: 'fas fa-trophy', name: 'Premios' },
            { icon: 'fas fa-plus-circle', name: 'Otros' },
            { icon: 'fas fa-star', name: 'Ingresos extra' }
        ]
    }
};

// Mostrar/ocultar selector de iconos
function showIconSelector() {
    const categoryType = document.getElementById('categoryType').value;
    const iconSelector = document.getElementById('iconSelectorContainer');
    const iconInput = document.getElementById('categoryIcon');
    const iconPreview = document.getElementById('selectedIconPreview');
    
    if (!categoryType) {
        iconSelector.style.display = 'none';
        iconInput.placeholder = 'Selecciona un tipo primero';
        iconInput.value = '';
        iconPreview.innerHTML = '❓';
        return;
    }
    
    // Mostrar selector y generar iconos
    iconSelector.style.display = 'block';
    iconInput.placeholder = 'Selecciona un icono de abajo';
    generateIconGrid(categoryType);
}

// Generar grid de iconos
function generateIconGrid(type) {
    const iconGrid = document.getElementById('iconGrid');
    const icons = availableIcons[type];
    
    if (!icons) {
        iconGrid.innerHTML = '<p class="text-muted">No hay iconos disponibles</p>';
        return;
    }
    
    let gridHTML = '';
    
    // Iterar por categorías
    Object.keys(icons).forEach(categoryName => {
        gridHTML += `
            <div class="col-12 mb-3">
                <h6 class="text-muted mb-2">
                    <i class="fas fa-folder me-1"></i>${categoryName}
                </h6>
                <div class="row g-2">
        `;
        
        // Iterar por iconos en la categoría
        icons[categoryName].forEach(iconItem => {
            const colorClass = type === 'ingreso' ? 'btn-outline-success' : 'btn-outline-danger';
            gridHTML += `
                <div class="col-4 col-sm-3 col-md-2">
                    <button type="button" class="btn ${colorClass} w-100 icon-selector-btn" 
                            onclick="selectIcon('${iconItem.icon}', '${iconItem.name}')"
                            data-icon="${iconItem.icon}" 
                            title="${iconItem.name}">
                        <i class="${iconItem.icon}" style="font-size: 1.2rem;"></i>
                        <small class="d-block mt-1" style="font-size: 0.7rem;">${iconItem.name}</small>
                    </button>
                </div>
            `;
        });
        
        gridHTML += `
                </div>
            </div>
        `;
    });
    
    iconGrid.innerHTML = gridHTML;
}

// Seleccionar un icono
function selectIcon(iconClass, iconName) {
    const iconInput = document.getElementById('categoryIcon');
    const iconPreview = document.getElementById('selectedIconPreview');
    
    // Actualizar input y preview
    iconInput.value = iconClass;
    iconPreview.innerHTML = `<i class="${iconClass}"></i>`;
    
    // Remover selección anterior
    document.querySelectorAll('.icon-selector-btn').forEach(btn => {
        btn.classList.remove('btn-success', 'btn-danger');
        const type = document.getElementById('categoryType').value;
        const colorClass = type === 'ingreso' ? 'btn-outline-success' : 'btn-outline-danger';
        btn.className = `btn ${colorClass} w-100 icon-selector-btn`;
    });
    
    // Marcar como seleccionado
    const selectedBtn = document.querySelector(`[data-icon="${iconClass}"]`);
    if (selectedBtn) {
        const type = document.getElementById('categoryType').value;
        const solidColorClass = type === 'ingreso' ? 'btn-success' : 'btn-danger';
        selectedBtn.classList.remove('btn-outline-success', 'btn-outline-danger');
        selectedBtn.classList.add(solidColorClass);
    }
    
    console.log(`Icono seleccionado: ${iconClass} (${iconName})`);
}

// Limpiar selector cuando se abre el modal
function addNewCategory() {
    // Limpiar formulario
    document.getElementById('categoryForm').reset();
    
    // Limpiar selector de iconos
    document.getElementById('iconSelectorContainer').style.display = 'none';
    document.getElementById('selectedIconPreview').innerHTML = '❓';
    document.getElementById('categoryIcon').value = '';
    document.getElementById('categoryIcon').placeholder = 'Selecciona un tipo primero';
    
    // Cambiar título a "Nueva"
    document.querySelector('#modalNuevaCategoria .modal-title').innerHTML = 
        '<i class="fas fa-plus me-2"></i>Nueva Categoría';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaCategoria'));
    modal.show();
}

// Hacer funciones globales
window.showIconSelector = showIconSelector;
window.selectIcon = selectIcon;

// Configurar formularios
function setupForms() {
    // Formulario de perfil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Formulario de contraseña
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
}

// Actualizar perfil
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const formData = {
        nombre: document.getElementById('profileNombre').value.trim(),
        apellidos: document.getElementById('profileApellidos').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        telefono: document.getElementById('profileTelefono').value.trim()
    };
    
    // Validaciones
    if (!formData.nombre || !formData.apellidos || !formData.email) {
        alert('Por favor completa los campos obligatorios');
        return;
    }
    
    if (!api.isValidEmail(formData.email)) {
        alert('Por favor ingresa un email válido');
        return;
    }
    
    try {
        // Simular actualización
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Actualizar usuario local
        Object.assign(currentUser, formData);
        localStorage.setItem('fidefinance_user', JSON.stringify(currentUser));
        
        // Actualizar UI
        updateUserInfo();
        
        alert('Perfil actualizado exitosamente');
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        alert('Error al actualizar perfil');
    }
}

// Cambiar contraseña
async function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    if (newPassword.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    try {
        // Simular cambio de contraseña
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Limpiar formulario
        document.getElementById('passwordForm').reset();
        
        alert('Contraseña cambiada exitosamente');
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        alert('Error al cambiar contraseña');
    }
}

// === FUNCIONES DE CATEGORÍAS ===

// Agregar nueva categoría
function addNewCategory() {
    // Limpiar formulario
    document.getElementById('categoryForm').reset();
    
    // Cambiar título a "Nueva"
    document.querySelector('#modalNuevaCategoria .modal-title').innerHTML = 
        '<i class="fas fa-plus me-2"></i>Nueva Categoría';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaCategoria'));
    modal.show();
}

// Guardar categoría
async function saveCategory() {
    const nombre = document.getElementById('categoryName').value.trim();
    const tipo = document.getElementById('categoryType').value;
    const icono = document.getElementById('categoryIcon').value.trim();
    
    // Validaciones mejoradas
    if (!nombre || !tipo) {
        alert('Por favor completa los campos obligatorios (Nombre y Tipo)');
        return;
    }
    
    if (!icono) {
        alert('Por favor selecciona un icono');
        return;
    }
    
    // Verificar si ya existe
    if (userCategories.some(cat => cat.nombre.toLowerCase() === nombre.toLowerCase())) {
        alert('Ya existe una categoría con ese nombre');
        return;
    }
    
    try {
        // Mostrar loading en el botón
        const saveButton = document.querySelector('#modalNuevaCategoria .btn-success');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';
        saveButton.disabled = true;
        
        const newCategory = {
            nombre: nombre,
            tipo: tipo,
            icon: icono, // Ahora viene del selector
            color: tipo === 'ingreso' ? '#198754' : '#dc3545'
        };
        
        console.log('💾 Guardando categoría:', newCategory);
        
        // Enviar al backend
        const response = await api.makeRequest('/categories.php', 'POST', newCategory);
        
        if (response.success) {
            console.log('Categoría guardada con ID:', response.category_id);
            
            // Recargar desde la BD
            await loadCategories();
            updateCategories();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaCategoria'));
            modal.hide();
            
            alert('Categoría creada exitosamente');
            
        } else {
            throw new Error(response.error || 'Error al crear categoría');
        }
        
    } catch (error) {
        console.error('Error creando categoría:', error);
        alert('Error al crear categoría: ' + error.message);
    } finally {
        // Restaurar botón
        const saveButton = document.querySelector('#modalNuevaCategoria .btn-success');
        if (saveButton) {
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        }
    }
}

// Eliminar categoría
async function deleteCategory(categoryName) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${categoryName}"?`)) {
        return;
    }
    
    try {
        const category = userCategories.find(cat => cat.nombre === categoryName);
        if (!category) {
            alert('Categoría no encontrada');
            return;
        }
        const response = await api.makeRequest(`/categories.php`, 'DELETE', {
            nombre: categoryName
        });
        
        if (response.success) {
            console.log('Categoría eliminada:', categoryName);
            
            // 🔥 FIX: RECARGAR desde la BD
            await loadCategories();
            updateCategories();
            
            alert('Categoría eliminada exitosamente');
        } else {
            throw new Error(response.error || 'Error al eliminar categoría');
        }
        
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        alert('Error al eliminar categoría: ' + error.message);
    }
}

// === FUNCIONES DE UTILIDAD ===

// Mostrar/ocultar loading
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const settingsContent = document.getElementById('settingsContent');
    
    if (loadingIndicator && settingsContent) {
        if (show) {
            loadingIndicator.style.display = 'block';
            settingsContent.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
            settingsContent.style.display = 'block';
        }
    }
}

// Mostrar error
function showError(message) {
    const settingsContent = document.getElementById('settingsContent');
    if (settingsContent) {
        settingsContent.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-sync me-1"></i>Reintentar
                </button>
            </div>
        `;
        settingsContent.style.display = 'block';
    }
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
}

// Hacer funciones globales
window.addNewCategory = addNewCategory;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;
window.cerrarSesion = cerrarSesion;

// === FUNCIONES DE DEBUG (PARA TESTING) ===
window.testUpdateCategories = function() {
    console.log('=== TEST MANUAL updateCategories ===');
    console.log('userCategories:', userCategories.length);
    updateCategories();
};

window.testCreateCategoryItem = function() {
    if (userCategories.length > 0) {
        const testCat = userCategories[0];
        console.log('Test category:', testCat);
        console.log('HTML generado:', createCategoryItem(testCat));
    } else {
        console.log('No hay categorías para probar');
    }
};