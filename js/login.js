// js/login.js
document.addEventListener('DOMContentLoaded', () => {
  //Usuarios  de prueba 
  const usuariosPredefinidos = [
    { email: 'wmiranda00058@ufide.ac.cr', password: '1234' },
    { email: 'usuario1@ufide.ac.cr',      password: '1234' },
    { email: 'usuario2@ufide.ac.cr',      password: '1234' },
    { email: 'usuario3@ufide.ac.cr',      password: '1234' }
  ];

  // Usuarios que se hayan registrado
  const usuariosRegistrados = JSON.parse(localStorage.getItem('usuarios')) || [];


  const usuarios = [...usuariosPredefinidos, ...usuariosRegistrados];

  //Lógica de inicio de sesión 
  const form      = document.getElementById('loginForm');
  const emailIn   = document.getElementById('email');
  const passIn    = document.getElementById('password');
  const errorDiv  = document.getElementById('error');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = emailIn.value.trim();
    const pass  = passIn.value.trim();

    const valido = usuarios.find(u => u.email === email && u.password === pass);

    if (valido) {
      sessionStorage.setItem('usuarioActivo', email); // recuerda al usuario
      window.location.href = 'dashboard.html';        // pasa al panel
    } else {
      errorDiv.classList.remove('d-none');            // muestra error
    }
  });
});
