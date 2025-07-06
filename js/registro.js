// js/registro.js
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('registroForm').addEventListener('submit', e => {
    e.preventDefault();

    const email = document.getElementById('nuevoEmail').value.trim();
    const pass = document.getElementById('nuevoPass').value.trim();

    if (!email || !pass) return;

    // Leer usuarios actuales
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    // Verificar si ya existe
    const yaExiste = usuarios.some(user => user.email === email);
    if (yaExiste) {
      alert("Ese correo ya está registrado.");
      return;
    }

    // Guardar nuevo usuario
    usuarios.push({ email, password: pass });
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    // Mensaje y limpieza
    document.getElementById('msg').classList.remove('d-none');
    e.target.reset();
  });
});
