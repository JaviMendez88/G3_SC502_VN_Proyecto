// js/movimientos.js
document.addEventListener('DOMContentLoaded', () => {
  const tabla  = document.querySelector('#tablaMov tbody');
  const form   = document.getElementById('formMov');
  const balanceTag = document.getElementById('balance');

  let balance = 0;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const dato = {
      fecha : document.getElementById('fecha').value,
      tipo  : document.getElementById('tipo').value,
      cat   : document.getElementById('cat').value.trim(),
      monto : parseFloat(document.getElementById('monto').value),
      desc  : document.getElementById('desc').value.trim() || '–'
    };

    balance += dato.tipo === 'Ingreso' ? dato.monto : -dato.monto;
    balanceTag.textContent = `₡ ${balance.toLocaleString('es-CR', {minimumFractionDigits:2})}`;

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${dato.fecha}</td>
      <td>${dato.tipo}</td>
      <td>${dato.cat}</td>
      <td>${dato.monto.toFixed(2)}</td>
      <td>${dato.desc}</td>`;
    tabla.appendChild(fila);

    form.reset();
    bootstrap.Modal.getInstance(document.getElementById('modalMov')).hide();
  });
});
