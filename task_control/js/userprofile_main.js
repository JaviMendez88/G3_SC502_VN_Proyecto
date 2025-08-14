// Variables globales
let currentUser = null;
let userMovements = [];
let userCategories = [];

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
  // Verificar si está autenticado
  if (!api.isAuthenticated()) {
    window.location.href = 'user_logIn.html';
    return;
  }

  // Mostrar loading
  showLoading(true);

  try {
    // Cargar datos del usuario
    await loadUserData();
    
    // Mostrar nombre del usuario en el header
    updateUserHeader();

    // Mostrar página de bienvenida por defecto
    mostrarInicio(document.getElementById("contenidoPerfil"));
    
  } catch (error) {
    console.error('Error inicial:', error);
    api.showMessage('Error al cargar los datos iniciales: ' + error.message, 'error');
  } finally {
    // Ocultar loading
    showLoading(false);
  }
});

// Mostrar/ocultar loading
function showLoading(show) {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? 'block' : 'none';
  }
}

// Cargar datos del usuario desde el backend
async function loadUserData() {
  try {
    // Obtener usuario actual
    currentUser = api.getCurrentUser();
    
    // Si no hay usuario en localStorage, intentar obtenerlo del backend
    if (!currentUser) {
      const userResponse = await api.makeRequest('/user');
      currentUser = userResponse.user;
      localStorage.setItem('fidefinance_user', JSON.stringify(currentUser));
    }
    
    // Cargar movimientos del usuario
    const movementsResponse = await api.getMovements(100, 0);
    userMovements = movementsResponse.data || [];
    
    // Cargar categorías
    const categoriesResponse = await api.getCategories();
    userCategories = categoriesResponse.data.all || [];
    
    console.log('Datos cargados:', { currentUser, userMovements, userCategories });
    
  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
    throw error;
  }
}

// Actualizar header con nombre del usuario
function updateUserHeader() {
  const userNameElement = document.getElementById('userName');
  const userEmailElement = document.getElementById('userEmail');
  
  if (currentUser) {
    if (userNameElement) {
      userNameElement.innerHTML = `${currentUser.nombre} ${currentUser.apellidos}`;
    }
    if (userEmailElement) {
      userEmailElement.textContent = currentUser.email;
    }
  } else {
    if (userNameElement) {
      userNameElement.innerHTML = '<span class="text-warning">Error al cargar usuario</span>';
    }
    if (userEmailElement) {
      userEmailElement.innerHTML = '<span class="text-warning">No disponible</span>';
    }
  }
}

// Función principal para mostrar secciones
function mostrarSeccion(seccion) {
  const contenido = document.getElementById("contenidoPerfil");

  // Mostrar loading mientras cambia de sección
  contenido.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando ${seccion}...</p>
    </div>
  `;

  // Pequeño delay para mejor UX
  setTimeout(() => {
    switch(seccion) {
      case 'perfil':
        mostrarPerfil(contenido);
        break;
      case 'registros':
        mostrarRegistros(contenido);
        break;
      case 'plan':
        mostrarPlan(contenido);
        break;
      case 'dashboard':
        mostrarDashboard(contenido);
        break;
      case 'recomendaciones':
        mostrarRecomendaciones(contenido);
        break;
      case 'inicio':
      default:
        mostrarInicio(contenido);
        break;
    }
  }, 300);
}

// Mostrar página de inicio
function mostrarInicio(contenido) {
  updateBreadcrumb('Inicio');
  
  // Calcular estadísticas rápidas
  const totalMovimientos = userMovements?.length || 0;
  const totalIngresos = userMovements?.filter(m => m.tipo === 'ingreso').length || 0;
  const totalGastos = userMovements?.filter(m => m.tipo === 'gasto').length || 0;
  const ultimoMovimiento = userMovements?.length > 0 ? 
    new Date(userMovements[0].fecha).toLocaleDateString('es-CR') : 'Ninguno';

  contenido.innerHTML = `
    <div class="text-center py-5">
      <i class="fas fa-chart-pie text-primary mb-3" style="font-size: 4rem;"></i>
      <h4 class="text-primary">¡Bienvenido a FideFinance, ${currentUser?.nombre || 'Usuario'}!</h4>
      <p class="text-muted mb-4">Gestiona tus finanzas de manera inteligente y eficaz.</p>
      
      <!-- Estadísticas rápidas -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card border-info">
            <div class="card-body text-center">
              <i class="fas fa-list text-info mb-2" style="font-size: 2rem;"></i>
              <h5 class="text-info">${totalMovimientos}</h5>
              <small class="text-muted">Total Movimientos</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-success">
            <div class="card-body text-center">
              <i class="fas fa-arrow-up text-success mb-2" style="font-size: 2rem;"></i>
              <h5 class="text-success">${totalIngresos}</h5>
              <small class="text-muted">Ingresos Registrados</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-danger">
            <div class="card-body text-center">
              <i class="fas fa-arrow-down text-danger mb-2" style="font-size: 2rem;"></i>
              <h5 class="text-danger">${totalGastos}</h5>
              <small class="text-muted">Gastos Registrados</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-warning">
            <div class="card-body text-center">
              <i class="fas fa-calendar text-warning mb-2" style="font-size: 2rem;"></i>
              <h6 class="text-warning">${ultimoMovimiento}</h6>
              <small class="text-muted">Último Movimiento</small>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Accesos rápidos -->
      <div class="row mt-4">
        <div class="col-md-3">
          <div class="card h-100 border-primary">
            <div class="card-body text-center">
              <i class="fas fa-user text-primary mb-2" style="font-size: 2rem;"></i>
              <h6>Perfil</h6>
              <p class="small text-muted">Gestiona tu información personal</p>
              <button class="btn btn-outline-primary btn-sm" onclick="mostrarSeccion('perfil')">
                Ver Perfil
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card h-100 border-success">
            <div class="card-body text-center">
              <i class="fas fa-list-alt text-success mb-2" style="font-size: 2rem;"></i>
              <h6>Registros</h6>
              <p class="small text-muted">Administra tus ingresos y gastos</p>
              <button class="btn btn-outline-success btn-sm" onclick="mostrarSeccion('registros')">
                Ver Registros
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card h-100 border-info">
            <div class="card-body text-center">
              <i class="fas fa-chart-line text-info mb-2" style="font-size: 2rem;"></i>
              <h6>Plan Financiero</h6>
              <p class="small text-muted">Revisa tu situación financiera</p>
              <button class="btn btn-outline-info btn-sm" onclick="mostrarSeccion('plan')">
                Ver Plan
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card h-100 border-warning">
            <div class="card-body text-center">
              <i class="fas fa-lightbulb text-warning mb-2" style="font-size: 2rem;"></i>
              <h6>Recomendaciones</h6>
              <p class="small text-muted">Consejos para mejorar</p>
              <button class="btn btn-outline-warning btn-sm" onclick="mostrarSeccion('recomendaciones')">
                Ver Tips
              </button>
            </div>
          </div>
        </div>
      </div>
      
      ${totalMovimientos === 0 ? `
        <div class="mt-4">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>¡Comenzemos!</strong> Aún no tienes movimientos registrados. 
            <a href="#" onclick="mostrarSeccion('registros')" class="alert-link">Registra tu primer ingreso o gasto</a> 
            para comenzar a gestionar tus finanzas.
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Mostrar perfil del usuario
function mostrarPerfil(contenido) {
  if (!currentUser) {
    contenido.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Error: No se pudieron cargar los datos del usuario.
      </div>
    `;
    return;
  }

  contenido.innerHTML = `
    <h4>Perfil de Usuario</h4>
    <div class="row">
      <div class="col-md-8">
        <form id="profileForm">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Nombre *</label>
                <input type="text" id="nombre" class="form-control" value="${currentUser.nombre || ''}" required>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Apellidos *</label>
                <input type="text" id="apellidos" class="form-control" value="${currentUser.apellidos || ''}" required>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Correo Electrónico</label>
            <input type="email" class="form-control" value="${currentUser.email || ''}" readonly style="background-color: #f8f9fa;">
            <small class="text-muted">El correo no se puede cambiar</small>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">País</label>
                <select id="pais" class="form-select">
                  <option value="Costa Rica" selected>Costa Rica</option>
                  <option value="Guatemala">Guatemala</option>
                  <option value="Honduras">Honduras</option>
                  <option value="El Salvador">El Salvador</option>
                  <option value="Nicaragua">Nicaragua</option>
                  <option value="Panamá">Panamá</option>
                  <option value="México">México</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Teléfono</label>
                <input type="tel" id="telefono" class="form-control" placeholder="8888-8888" pattern="[0-9]{4}-?[0-9]{4}">
                <small class="text-muted">Formato: 8888-8888</small>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Miembro desde</label>
            <input type="text" class="form-control" value="${currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('es-CR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'No disponible'}" readonly style="background-color: #f8f9fa;">
          </div>
          
          <hr class="my-4">
          
          <h5 class="mb-3">
            <i class="fas fa-lock me-2"></i>Cambiar Contraseña
          </h5>
          <div class="alert alert-warning">
            <i class="fas fa-info-circle me-2"></i>
            <small>Funcionalidad en desarrollo. Próximamente podrás cambiar tu contraseña.</small>
          </div>
          
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save me-2"></i>Guardar Cambios
            </button>
            <button type="button" class="btn btn-outline-secondary" onclick="mostrarSeccion('inicio')">
              <i class="fas fa-times me-2"></i>Cancelar
            </button>
          </div>
        </form>
      </div>
      
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="fas fa-info-circle me-2"></i>Información de la Cuenta
            </h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <strong>Usuario ID:</strong><br>
              <span class="text-muted">#${currentUser.id || 'N/A'}</span>
            </div>
            <div class="mb-3">
              <strong>Nombre Completo:</strong><br>
              <span class="text-muted">${currentUser.nombre || ''} ${currentUser.apellidos || ''}</span>
            </div>
            <div class="mb-3">
              <strong>Email:</strong><br>
              <span class="text-muted">${currentUser.email || 'N/A'}</span>
            </div>
            <div class="mb-3">
              <strong>Estado:</strong><br>
              <span class="badge bg-success">Activo</span>
            </div>
            <div class="mb-0">
              <strong>Última actualización:</strong><br>
              <span class="text-muted">${new Date().toLocaleDateString('es-CR')}</span>
            </div>
          </div>
        </div>
        
        <div class="card mt-3">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="fas fa-chart-bar me-2"></i>Estadísticas Rápidas
            </h6>
          </div>
          <div class="card-body">
            <div class="mb-2">
              <strong>Total de Movimientos:</strong><br>
              <span class="text-primary">${userMovements?.length || 0}</span>
            </div>
            <div class="mb-2">
              <strong>Ingresos Registrados:</strong><br>
              <span class="text-success">${userMovements?.filter(m => m.tipo === 'ingreso').length || 0}</span>
            </div>
            <div class="mb-0">
              <strong>Gastos Registrados:</strong><br>
              <span class="text-danger">${userMovements?.filter(m => m.tipo === 'gasto').length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  updateBreadcrumb('Perfil de Usuario');

  setTimeout(() => {
    document.getElementById('profileForm').addEventListener('submit', actualizarPerfil);
    cargarDatosAdicionales();
  }, 0);
}

// Cargar datos adicionales del usuario
function cargarDatosAdicionales() {
  try {
    const savedData = localStorage.getItem('fidefinance_user_extra');
    if (savedData) {
      const extraData = JSON.parse(savedData);
      
      if (extraData.pais) {
        const paisSelect = document.getElementById('pais');
        if (paisSelect) paisSelect.value = extraData.pais;
      }
      
      if (extraData.telefono) {
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) telefonoInput.value = extraData.telefono;
      }
    }
  } catch (error) {
    console.log('No se pudieron cargar datos adicionales:', error);
  }
}

// Función para actualizar breadcrumb
function updateBreadcrumb(sectionName) {
  const breadcrumbNav = document.getElementById('breadcrumbNav');
  const currentSection = document.getElementById('currentSection');
  
  if (breadcrumbNav && currentSection) {
    breadcrumbNav.style.display = 'block';
    currentSection.textContent = sectionName;
  }
}

// Actualizar perfil del usuario
async function actualizarPerfil(e) {
  e.preventDefault();
  
  try {
    const userData = {
      nombre: document.getElementById('nombre').value.trim(),
      apellidos: document.getElementById('apellidos').value.trim()
    };

    // Validaciones básicas
    if (!userData.nombre || !userData.apellidos) {
      api.showMessage('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    // Actualizar en el backend (cuando esté implementado)
    // await api.updateUser(userData);
    
    // Por ahora, actualizar localmente
    currentUser.nombre = userData.nombre;
    currentUser.apellidos = userData.apellidos;
    localStorage.setItem('fidefinance_user', JSON.stringify(currentUser));
    
    // Guardar datos adicionales
    const extraData = {
      pais: document.getElementById('pais').value,
      telefono: document.getElementById('telefono').value
    };
    localStorage.setItem('fidefinance_user_extra', JSON.stringify(extraData));
    
    // Actualizar header
    updateUserHeader();
    
    api.showMessage('Perfil actualizado exitosamente', 'success');
    
  } catch (error) {
    api.showMessage('Error al actualizar perfil: ' + error.message, 'error');
  }
}

// Función para cerrar sesión (disponible globalmente)
function cerrarSesion() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    api.logout();
  }
}

// Mostrar registros financieros
function mostrarRegistros(contenido) {
  contenido.innerHTML = `
    <h4 class="mb-4">Registros Financieros</h4>
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card text-bg-success">
          <div class="card-body">
            <h6 class="card-title">💰 Total Ingresos</h6>
            <h5 id="totalIngresos">₡ 0</h5>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-bg-danger">
          <div class="card-body">
            <h6 class="card-title">💸 Total Gastos</h6>
            <h5 id="totalGastos">₡ 0</h5>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-bg-primary">
          <div class="card-body">
            <h6 class="card-title">📊 Balance</h6>
            <h5 id="balance">₡ 0</h5>
          </div>
        </div>
      </div>
    </div>
    
    <button class="btn btn-success mb-4" data-bs-toggle="modal" data-bs-target="#modalRegistro">
      <i class="fas fa-plus me-2"></i>Registrar Ingreso/Gasto
    </button>
    
    <div class="table-responsive">
      <table class="table table-striped" id="tablaRegistros">
        <thead class="table-dark">
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Monto</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    
    <!-- Modal para nuevo registro -->
    <div class="modal fade" id="modalRegistro" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="formRegistro">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title">
                <i class="fas fa-plus me-2"></i>Nuevo Registro
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Fecha *</label>
                <input type="date" id="fechaReg" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Tipo *</label>
                <select id="tipoReg" class="form-select" required>
                  <option value="">Seleccionar tipo</option>
                  <option value="ingreso">💰 Ingreso</option>
                  <option value="gasto">💸 Gasto</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Categoría *</label>
                <select id="catReg" class="form-select" required>
                  <option value="">Seleccionar categoría</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Monto (₡) *</label>
                <input type="number" id="montoReg" class="form-control" step="0.01" min="0.01" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea id="descReg" class="form-control" rows="3" placeholder="Descripción opcional"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-success">
                <i class="fas fa-save me-2"></i>Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  updateBreadcrumb('Registros Financieros');

  setTimeout(() => {
    setupRegistrosEvents();
    mostrarTablaMovimientos();
    calcularResumenFinanciero();
  }, 0);
}

// Configurar eventos de la sección registros
function setupRegistrosEvents() {
  // Fecha por defecto
  const fechaInput = document.getElementById('fechaReg');
  if (fechaInput) {
    fechaInput.value = new Date().toISOString().split('T')[0];
  }
  
  // Evento cambio de tipo para filtrar categorías
  const tipoSelect = document.getElementById('tipoReg');
  if (tipoSelect) {
    tipoSelect.addEventListener('change', function() {
      actualizarCategorias(this.value);
    });
  }
  
  // Evento envío del formulario
  const form = document.getElementById('formRegistro');
  if (form) {
    form.addEventListener('submit', guardarMovimiento);
  }
}

// Actualizar categorías según el tipo seleccionado
function actualizarCategorias(tipo) {
  const categoriaSelect = document.getElementById('catReg');
  if (!categoriaSelect) return;
  
  categoriaSelect.innerHTML = '<option value="">Seleccionar categoría</option>';
  
  if (tipo && userCategories) {
    const categoriasFiltradas = userCategories.filter(cat => cat.tipo === tipo);
    categoriasFiltradas.forEach(categoria => {
      categoriaSelect.innerHTML += `<option value="${categoria.nombre}">${categoria.icon || ''} ${categoria.nombre}</option>`;
    });
  }
}

// Guardar nuevo movimiento
async function guardarMovimiento(e) {
  e.preventDefault();
  
  try {
    const movementData = {
      fecha: document.getElementById('fechaReg').value,
      tipo: document.getElementById('tipoReg').value,
      categoria: document.getElementById('catReg').value,
      monto: parseFloat(document.getElementById('montoReg').value),
      descripcion: document.getElementById('descReg').value || ''
    };

    // Validaciones
    if (!movementData.fecha || !movementData.tipo || !movementData.categoria || !movementData.monto) {
      api.showMessage('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    if (movementData.monto <= 0) {
      api.showMessage('El monto debe ser mayor a 0', 'error');
      return;
    }

    await api.createMovement(movementData);
    
    // Recargar movimientos
    await loadUserData();
    
    // Actualizar tabla y resumen
    mostrarTablaMovimientos();
    calcularResumenFinanciero();
    
    // Cerrar modal y limpiar formulario
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistro'));
    if (modal) modal.hide();
    
    document.getElementById('formRegistro').reset();
    document.getElementById('fechaReg').value = new Date().toISOString().split('T')[0];
    
    api.showMessage('Movimiento registrado exitosamente', 'success');
    
  } catch (error) {
    api.showMessage('Error al guardar movimiento: ' + error.message, 'error');
  }
}

// Mostrar tabla de movimientos
function mostrarTablaMovimientos() {
  const tbody = document.querySelector('#tablaRegistros tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!userMovements || userMovements.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
          No hay movimientos registrados<br>
          <small>¡Registra tu primer ingreso o gasto!</small>
        </td>
      </tr>
    `;
    return;
  }
  
  // Ordenar por fecha (más recientes primero)
  const movimientosOrdenados = [...userMovements].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  movimientosOrdenados.forEach(mov => {
    const fecha = new Date(mov.fecha).toLocaleDateString('es-CR');
    const monto = parseFloat(mov.monto).toLocaleString('es-CR', {
      minimumFractionDigits: 2
    });
    
    const tipoClass = mov.tipo === 'ingreso' ? 'text-success' : 'text-danger';
    const tipoIcon = mov.tipo === 'ingreso' ? '💰' : '💸';
    
    tbody.innerHTML += `
      <tr>
        <td>${fecha}</td>
        <td class="${tipoClass}">
          ${tipoIcon} ${mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
        </td>
        <td>${mov.categoria}</td>
        <td class="${tipoClass}">₡ ${monto}</td>
        <td>${mov.descripcion || '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarMovimiento(${mov.id})" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

// Calcular resumen financiero
function calcularResumenFinanciero() {
  if (!userMovements || userMovements.length === 0) {
    actualizarElementosResumen(0, 0, 0);
    return;
  }

  const totalIngresos = userMovements
    .filter(mov => mov.tipo === 'ingreso')
    .reduce((sum, mov) => sum + parseFloat(mov.monto), 0);
    
  const totalGastos = userMovements
    .filter(mov => mov.tipo === 'gasto')
    .reduce((sum, mov) => sum + parseFloat(mov.monto), 0);
    
  const balance = totalIngresos - totalGastos;
  
  actualizarElementosResumen(totalIngresos, totalGastos, balance);
}

// Actualizar elementos del resumen financiero
function actualizarElementosResumen(ingresos, gastos, balance) {
  const elementIngresos = document.getElementById('totalIngresos');
  const elementGastos = document.getElementById('totalGastos');
  const elementBalance = document.getElementById('balance');
  
  if (elementIngresos) {
    elementIngresos.textContent = `₡ ${ingresos.toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
  }
  
  if (elementGastos) {
    elementGastos.textContent = `₡ ${gastos.toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
  }
  
  if (elementBalance) {
    elementBalance.textContent = `₡ ${balance.toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
    
    // Cambiar color según el balance
    const parentCard = elementBalance.closest('.card');
    if (parentCard) {
      parentCard.className = balance >= 0 ? 'card text-bg-success' : 'card text-bg-danger';
    }
  }
}

// Eliminar movimiento
async function eliminarMovimiento(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este movimiento?')) return;
  
  try {
    await api.deleteMovement(id);
    
    // Recargar datos
    await loadUserData();
    
    // Actualizar vista
    mostrarTablaMovimientos();
    calcularResumenFinanciero();
    
    api.showMessage('Movimiento eliminado exitosamente', 'success');
    
  } catch (error) {
    api.showMessage('Error al eliminar movimiento: ' + error.message, 'error');
  }
}

// Mostrar plan financiero
function mostrarPlan(contenido) {
  contenido.innerHTML = `
    <h4>Plan Financiero</h4>
    <p>Proyección basada en tus movimientos financieros reales.</p>
    <div id="planContent">
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando datos...</p>
      </div>
    </div>
  `;
  
  updateBreadcrumb('Plan Financiero');
  
  setTimeout(async () => {
    await cargarPlanFinanciero();
  }, 100);
}

// Cargar plan financiero dinámico
async function cargarPlanFinanciero() {
  try {
    const dashboardData = await api.getDashboard();
    const balance = dashboardData.data.balance;
    const recentMovements = dashboardData.data.recent_movements;
    
    const planContent = document.getElementById('planContent');
    if (!planContent) return;

    planContent.innerHTML = `
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card text-bg-success">
            <div class="card-body">
              <h5 class="card-title">💰 Total Ingresos</h5>
              <p class="card-text fs-4">₡ ${parseFloat(balance.total_ingresos || 0).toLocaleString('es-CR', {minimumFractionDigits: 2})}</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-bg-danger">
            <div class="card-body">
              <h5 class="card-title">💸 Total Gastos</h5>
              <p class="card-text fs-4">₡ ${parseFloat(balance.total_gastos || 0).toLocaleString('es-CR', {minimumFractionDigits: 2})}</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card ${parseFloat(balance.balance_total || 0) >= 0 ? 'text-bg-success' : 'text-bg-danger'}">
            <div class="card-body">
              <h5 class="card-title">${parseFloat(balance.balance_total || 0) >= 0 ? '📈' : '📉'} Balance Actual</h5>
              <p class="card-text fs-4">₡ ${parseFloat(balance.balance_total || 0).toLocaleString('es-CR', {minimumFractionDigits: 2})}</p>
            </div>
          </div>
        </div>
      </div>

      <h5 class="mt-4">
        <i class="fas fa-history me-2"></i>Últimos Movimientos
      </h5>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead class="table-dark">
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${recentMovements && recentMovements.length > 0 ? recentMovements.map(mov => `
              <tr>
                <td>${new Date(mov.fecha).toLocaleDateString('es-CR')}</td>
                <td class="${mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}">
                  ${mov.tipo === 'ingreso' ? '💰' : '💸'} ${mov.tipo}
                </td>
                <td>${mov.categoria}</td>
                <td class="${mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}">
                  ₡ ${parseFloat(mov.monto).toLocaleString('es-CR', {minimumFractionDigits: 2})}
                </td>
                <td>${mov.descripcion || '-'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" class="text-center text-muted py-4">
                  <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                  No hay movimientos registrados
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;
    
  } catch (error) {
    const planContent = document.getElementById('planContent');
    if (planContent) {
      planContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al cargar los datos del plan financiero: ${error.message}
        </div>
      `;
    }
  }
}

// Mostrar dashboard
async function mostrarDashboard(contenido) {
  contenido.innerHTML = `
    <h4>Dashboard Financiero</h4>
    <div id="dashboardContent">
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando dashboard...</p>
      </div>
    </div>
  `;
  
  updateBreadcrumb('Dashboard Financiero');
  
  setTimeout(async () => {
    await cargarDashboard();
  }, 100);
}

// Cargar dashboard dinámico
async function cargarDashboard() {
  try {
    const dashboardData = await api.getDashboard();
    const data = dashboardData.data;
    
    const dashboardContent = document.getElementById('dashboardContent');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card border-primary">
            <div class="card-header bg-primary text-white">
              <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Resumen Financiero</h6>
            </div>
            <div class="card-body">
              <div class="row text-center">
                <div class="col-4">
                  <h5 class="text-success">₡ ${parseFloat(data.balance.total_ingresos || 0).toLocaleString('es-CR')}</h5>
                  <small class="text-muted">Ingresos</small>
                </div>
                <div class="col-4">
                  <h5 class="text-danger">₡ ${parseFloat(data.balance.total_gastos || 0).toLocaleString('es-CR')}</h5>
                  <small class="text-muted">Gastos</small>
                </div>
                <div class="col-4">
                  <h5 class="${parseFloat(data.balance.balance_total || 0) >= 0 ? 'text-success' : 'text-danger'}">
                    ₡ ${parseFloat(data.balance.balance_total || 0).toLocaleString('es-CR')}
                  </h5>
                  <small class="text-muted">Balance</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card border-info">
            <div class="card-header bg-info text-white">
              <h6 class="mb-0"><i class="fas fa-list me-2"></i>Actividad Reciente</h6>
            </div>
            <div class="card-body">
              <p><strong>Total de Movimientos:</strong> ${data.recent_movements?.length || 0}</p>
              <p><strong>Último Movimiento:</strong> ${data.recent_movements?.length > 0 ? new Date(data.recent_movements[0].fecha).toLocaleDateString('es-CR') : 'Ninguno'}</p>
              <p><strong>Categorías Activas:</strong> ${data.categories_stats?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Gastos por Categoría</h6>
            </div>
            <div class="card-body">
              ${data.categories_stats?.filter(cat => cat.tipo === 'gasto').length > 0 ? `
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Categoría</th>
                        <th>Total</th>
                        <th>Movimientos</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${data.categories_stats.filter(cat => cat.tipo === 'gasto').map(cat => `
                        <tr>
                          <td>${cat.categoria}</td>
                          <td class="text-danger">₡ ${parseFloat(cat.total).toLocaleString('es-CR')}</td>
                          <td>${cat.cantidad}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="text-center text-muted py-4">
                  <i class="fas fa-chart-pie fa-3x mb-3"></i>
                  <p>No hay datos de categorías disponibles</p>
                </div>
              `}
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="fas fa-trophy me-2"></i>Estadísticas</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Tasa de Ahorro:</strong><br>
                <span class="text-${data.balance?.savings_rate >= 20 ? 'success' : data.balance?.savings_rate >= 10 ? 'warning' : 'danger'}">
                  ${data.balance?.savings_rate || 0}%
                </span>
              </div>
              <div class="mb-3">
                <strong>Promedio Mensual:</strong><br>
                <span class="text-muted">₡ ${(parseFloat(data.balance?.total_ingresos || 0) / 12).toLocaleString('es-CR')}</span>
              </div>
              <div class="mb-0">
                <strong>Estado Financiero:</strong><br>
                <span class="badge ${parseFloat(data.balance?.balance_total || 0) >= 0 ? 'bg-success' : 'bg-danger'}">
                  ${parseFloat(data.balance?.balance_total || 0) >= 0 ? 'Saludable' : 'Requiere Atención'}
                </span>
              </div>
            </div>
          </div>
          
          <div class="card mt-3">
            <div class="card-header">
              <h6 class="mb-0"><i class="fas fa-lightbulb me-2"></i>Consejo Rápido</h6>
            </div>
            <div class="card-body">
              <p class="small mb-0">
                ${parseFloat(data.balance?.balance_total || 0) >= 0 
                  ? '¡Excelente! Mantén este balance positivo. Considera invertir tus ahorros.' 
                  : 'Tu balance es negativo. Revisa tus gastos y busca áreas donde puedas reducir costos.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    const dashboardContent = document.getElementById('dashboardContent');
    if (dashboardContent) {
      dashboardContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al cargar dashboard: ${error.message}
        </div>
      `;
    }
  }
}

// Mostrar recomendaciones
async function mostrarRecomendaciones(contenido) {
  contenido.innerHTML = `
    <h4>Recomendaciones de FideFinance</h4>
    <div id="recomendacionesContent">
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Generando recomendaciones personalizadas...</p>
      </div>
    </div>
  `;
  
  updateBreadcrumb('Recomendaciones');
  
  setTimeout(async () => {
    await cargarRecomendaciones();
  }, 100);
}

// Cargar recomendaciones dinámicas
async function cargarRecomendaciones() {
  try {
    const recommendationsData = await api.getRecommendations();
    const recommendations = recommendationsData.recommendations || [];
    
    const recomendacionesContent = document.getElementById('recomendacionesContent');
    if (!recomendacionesContent) return;

    let html = '';
    
    if (recommendations.length > 0) {
      // Agrupar recomendaciones por prioridad
      const prioridadOrder = { 'alta': 1, 'media': 2, 'baja': 3 };
      const sortedRecommendations = recommendations.sort((a, b) => 
        prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad]
      );
      
      sortedRecommendations.forEach((rec) => {
        const alertClass = {
          'alerta': 'alert-danger',
          'advertencia': 'alert-warning',
          'consejo': 'alert-info',
          'felicitacion': 'alert-success',
          'analisis': 'alert-primary',
          'meta': 'alert-secondary',
          'habito': 'alert-light',
          'patron': 'alert-dark'
        }[rec.tipo] || 'alert-info';
        
        const priorityBadge = {
          'alta': 'badge bg-danger',
          'media': 'badge bg-warning text-dark',
          'baja': 'badge bg-secondary'
        }[rec.prioridad] || 'badge bg-secondary';
        
        html += `
          <div class="alert ${alertClass} border-start border-5" style="border-left-width: 5px !important;">
            <div class="d-flex align-items-start">
              <i class="${rec.icono || 'fas fa-lightbulb'} me-3 mt-1" style="font-size: 1.5rem;"></i>
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="alert-heading mb-0">${rec.titulo}</h6>
                  <span class="${priorityBadge}">${rec.prioridad?.toUpperCase() || 'MEDIA'}</span>
                </div>
                <p class="mb-2">${rec.mensaje}</p>
                ${rec.accion ? `
                  <div class="mt-2">
                    <small class="text-muted">
                      <i class="fas fa-arrow-right me-1"></i>
                      <strong>Acción sugerida:</strong> ${rec.accion}
                    </small>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      });
    } else {
      html = `
        <div class="text-center py-5">
          <i class="fas fa-lightbulb fa-4x text-muted mb-3"></i>
          <h5 class="text-muted">No hay recomendaciones disponibles</h5>
          <p class="text-muted">Registra algunos movimientos financieros para recibir consejos personalizados.</p>
          <button class="btn btn-primary" onclick="mostrarSeccion('registros')">
            <i class="fas fa-plus me-2"></i>Registrar Movimiento
          </button>
        </div>
      `;
    }
    
    // Agregar información adicional
    html += `
      <div class="mt-4">
        <div class="card bg-light">
          <div class="card-body">
            <h6 class="card-title">
              <i class="fas fa-info-circle me-2"></i>Sobre las Recomendaciones
            </h6>
            <p class="card-text small mb-0">
              Nuestras recomendaciones se generan automáticamente basándose en tus patrones de gasto, 
              ingresos y comportamiento financiero. Se actualizan cada vez que registras nuevos movimientos.
            </p>
          </div>
        </div>
      </div>
    `;
    
    recomendacionesContent.innerHTML = html;
    
  } catch (error) {
    const recomendacionesContent = document.getElementById('recomendacionesContent');
    if (recomendacionesContent) {
      recomendacionesContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al cargar recomendaciones: ${error.message}
        </div>
      `;
    }
  }
}