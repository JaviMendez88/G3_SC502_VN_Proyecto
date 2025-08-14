document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validación básica
    if (!email || !password) {
        alert('Por favor completa todos los campos.');
        return;
    }

    try {
        // Deshabilitar botón de envío
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Iniciando sesión...';
        }

        // Intentar login con el backend
        const credentials = { email, password };
        const result = await api.login(credentials);
        
        // Si llegamos aquí, el login fue exitoso
        alert('Inicio de sesión exitoso.');
        window.location.href = 'userProfile_main.html';
        
    } catch (error) {
        console.error('Error en login backend:', error);
        
        // Fallback: verificar usuario administrador hardcodeado
        if (email === 'usuario@email.com' && password === 'admin') {
            sessionStorage.setItem('usuarioActivo', email);
            alert('Inicio de sesión exitoso (admin).');
            window.location.href = 'userProfile_main.html';
            return;
        }
        
        // Fallback: verificar en localStorage
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const usuarioEncontrado = usuarios.find(usuario => 
            usuario.email === email && usuario.password === password
        );
        
        if (usuarioEncontrado) {
            sessionStorage.setItem('usuarioActivo', email);
            // Simular datos de usuario para compatibilidad
            localStorage.setItem('fidefinance_user', JSON.stringify({
                email: usuarioEncontrado.email,
                nombre: usuarioEncontrado.nombre,
                apellidos: usuarioEncontrado.apellidos
            }));
            alert('Inicio de sesión exitoso (local).');
            window.location.href = 'userProfile_main.html';
        } else {
            alert('Correo o contraseña incorrectos.');
        }
        
    } finally {
        // Rehabilitar botón
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar Sesión';
        }
    }
});

// Función para mostrar/ocultar contraseña (opcional)
function setupPasswordToggle() {
    const passwordField = document.getElementById('password');
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-outline-secondary';
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.right = '10px';
    toggleBtn.style.top = '50%';
    toggleBtn.style.transform = 'translateY(-50%)';
    toggleBtn.style.border = 'none';
    toggleBtn.style.background = 'none';
    
    if (passwordField) {
        // Hacer el contenedor del password relativo
        passwordField.style.paddingRight = '40px';
        passwordField.parentElement.style.position = 'relative';
        passwordField.parentElement.appendChild(toggleBtn);
        
        toggleBtn.addEventListener('click', function() {
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordField.type = 'password';
                toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }
}

// Verificar si ya está logueado
function checkIfLoggedIn() {
    if (api.isAuthenticated() || sessionStorage.getItem('usuarioActivo')) {
        // Ya está logueado, redireccionar
        window.location.href = 'userProfile_main.html';
    }
}

// Ejecutar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    checkIfLoggedIn();
    // setupPasswordToggle(); // Descomenta si quieres el toggle de contraseña
});