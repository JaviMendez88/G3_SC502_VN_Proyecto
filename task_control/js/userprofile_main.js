function mostrarSeccion(seccion) {
  const contenido = document.getElementById("contenidoPerfil");

  switch(seccion) {
    case 'perfil':
      contenido.innerHTML = `
        <h4>Perfil de Usuario</h4>
        <form>
          <div class="mb-3">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-control" placeholder="Juan Pérez" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Correo Electrónico</label>
            <input type="email" class="form-control" placeholder="usuario@email.com" required>
          </div>
          <div class="mb-3">
            <label class="form-label">País</label>
            <input type="text" class="form-control" placeholder="Costa Rica">
          </div>
          <div class="mb-3">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-control" placeholder="60606060">
          </div>
          <div class="mb-3">
            <label class="form-label">Cambiar Contraseña</label>
            <input type="password" class="form-control" placeholder="Nueva contraseña">
          </div>
          <div class="mb-3">
            <label class="form-label">Confirmar nueva Contraseña</label>
            <input type="password" class="form-control" placeholder="Confirmar nueva contraseña">
          </div>
          <button type="submit" class="btn custom-btn">Guardar Cambios</button>
        </form>
      `;
      break;

    case 'registros':
      contenido.innerHTML = `
        <h4 class="mb-4">Registros Financieros</h4>
        <button class="btn custom-btn mb-4" data-bs-toggle="modal" data-bs-target="#modalRegistro">Registrar Ingreso/ Gasto</button>
        <div class="table-responsive">
          <table class="table table-striped" id="tablaRegistros">
            <thead class="table-dark">
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Subtipo</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="modal fade" id="modalRegistro" tabindex="-1" aria-labelledby="modalRegistroLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <form id="formRegistro">
                <div class="modal-header bg-success text-white">
                  <h5 class="modal-title" id="modalRegistroLabel">Nuevo Registro</h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <input type="date" id="fechaReg" class="form-control mb-2" required>
                  <select id="tipoReg" class="form-select mb-2" required>
                    <option value="">Tipo</option>
                    <option value="Ingreso">Ingreso</option>
                    <option value="Gasto">Gasto</option>
                  </select>
                  <input type="text" id="subtipoReg" class="form-control mb-2" placeholder="Subtipo" required>
                  <input type="text" id="catReg" class="form-control mb-2" placeholder="Categoría" required>
                  <input type="number" id="montoReg" class="form-control mb-2" placeholder="₡9,999.00" required>
                  <textarea id="descReg" class="form-control" placeholder="Descripción (opcional)"></textarea>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                  <button class="btn btn-success" type="submit">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        const form = document.getElementById('formRegistro');
        const tabla = document.querySelector('#tablaRegistros tbody');
        const registros = JSON.parse(localStorage.getItem('registros')) || [];

        function MostrarTabla() {
          tabla.innerHTML = '';
          registros.forEach(reg => {
            tabla.innerHTML += `
              <tr>
                <td>${reg.fecha}</td>
                <td>${reg.tipo}</td>
                <td>${reg.subtipo}</td>
                <td>${reg.categoria}</td>
                <td>₡ ${parseFloat(reg.monto).toLocaleString('es-CR')}</td>
                <td>${reg.descripcion || '-'}</td>
              </tr>`;
          });
        }

        MostrarTabla();

        form.addEventListener('submit', function(e) {
          e.preventDefault();

          const nuevo = {
            fecha: document.getElementById('fechaReg').value,
            tipo: document.getElementById('tipoReg').value,
            subtipo: document.getElementById('subtipoReg').value,
            categoria: document.getElementById('catReg').value,
            monto: document.getElementById('montoReg').value,
            descripcion: document.getElementById('descReg').value
          };

          registros.push(nuevo);
          localStorage.setItem('registros', JSON.stringify(registros));
          MostrarTabla();
          form.reset();
          bootstrap.Modal.getInstance(document.getElementById('modalRegistro')).hide();
        });
      }, 0);
      break;

  /*Inicio de Ejemplo de Tabla en Proyecciones*/

case 'plan':
  contenido.innerHTML = `
    <h4>Plan Financiero</h4>
    <p>Proyección de ingresos, gastos, capacidad de ahorro y deuda.</p>

    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card text-bg-success">
          <div class="card-body">
            <h5 class="card-title">Total Ingresos</h5>
            <p class="card-text">₡ 1,250,000.00</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-bg-danger">
          <div class="card-body">
            <h5 class="card-title">Total Gastos</h5>
            <p class="card-text">₡ 890,000.00</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-bg-primary">
          <div class="card-body">
            <h5 class="card-title">Capacidad de Ahorro</h5>
            <p class="card-text">₡ 360,000.00</p>
          </div>
        </div>
      </div>
    </div>

    <h5 class="mt-4">Resumen de Movimientos</h5>
    <div class="table-responsive">
      <table class="table table-striped" id="tablaMov">
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
          <tr>
            <td>2025-06-01</td>
            <td>Ingreso</td>
            <td>Salario</td>
            <td>₡ 1,000,000.00</td>
            <td>Pago mensual</td>
          </tr>
          <tr>
            <td>2025-06-05</td>
            <td>Ingreso</td>
            <td>Freelance</td>
            <td>₡ 250,000.00</td>
            <td>Proyecto web</td>
          </tr>
          <tr>
            <td>2025-06-10</td>
            <td>Gasto</td>
            <td>Alquiler</td>
            <td>₡ 400,000.00</td>
            <td>Renta mensual</td>
          </tr>
          <tr>
            <td>2025-06-12</td>
            <td>Gasto</td>
            <td>Comida</td>
            <td>₡ 150,000.00</td>
            <td>Supermercado</td>
          </tr>
          <tr>
            <td>2025-06-18</td>
            <td>Gasto</td>
            <td>Transporte</td>
            <td>₡ 50,000.00</td>
            <td>Gasolina</td>
          </tr>
          <tr>
            <td>2025-06-25</td>
            <td>Gasto</td>
            <td>Servicios</td>
            <td>₡ 90,000.00</td>
            <td>Electricidad, agua</td>
          </tr>
          <tr>
            <td>2025-06-28</td>
            <td>Gasto</td>
            <td>Ocio</td>
            <td>₡ 200,000.00</td>
            <td>Cine, restaurantes</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  break;

  /*Fin de Ejemplo de Tabla en Proyecciones*/

    case 'dashboard':
      contenido.innerHTML = `
        <h4>Dashboard Financiero</h4>
        <p>Visualización gráfica de tus finanzas personales</p>
      `;
      break;

    case 'recomendaciones':
      contenido.innerHTML = `
        <h4>Recomendaciones de FideFinance</h4>
        <p>Tips y sugerencias para mejorar tus finanzas.</p>
      `;
      break;
  }
}
