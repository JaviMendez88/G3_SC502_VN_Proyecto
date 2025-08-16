document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está logueado
    checkIfLoggedIn();
    
    // Configurar el formulario de login
    setupLoginForm();
    
    // Configurar toggle de contraseña
    setupPasswordToggle();
});

function checkIfLoggedIn() {
    if (api.isAuthenticated()) {
        // Ya está logueado, redireccionar
        api.showMessage('Ya tienes una sesión activa', 'info', 2000);
        setTimeout(() => {
            window.location.href = 'userProfile_main.html';
        }, 1000);
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        await handleLogin();
    });
}

async function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const submitBtn = document.querySelector('button[type="submit"]');

    // Validación básica del lado cliente
    if (!email || !password) {
        api.showMessage('Por favor completa todos los campos', 'error');
        return;
    }

    if (!api.isValidEmail(email)) {
        api.showMessage('Por favor ingresa un email válido', 'error');
        return;
    }

    if (password.length < 6) {
        api.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    try {
        // Deshabilitar botón durante el proceso
        setButtonLoading(submitBtn, true);

        // Intentar login con la API
        const credentials = { email, password };
        const result = await api.login(credentials);
        
        if (result.success) {
            // Login exitoso
            clearForm();
            
            // Redireccionar después de un momento
            setTimeout(() => {
                window.location.href = 'userProfile_main.html';
            }, 1500);
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        // El error ya se muestra en api.login()
        
    } finally {
        // Rehabilitar botón
        setButtonLoading(submitBtn, false);
    }
}

function setupPasswordToggle() {
    const passwordField = document.getElementById('password');
    if (!passwordField) return;

    // Crear contenedor con posición relativa
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    
    // Insertar el input group
    passwordField.parentNode.insertBefore(inputGroup, passwordField);
    inputGroup.appendChild(passwordField);
    
    // Crear botón toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-outline-secondary';
    toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
    toggleBtn.title = 'Mostrar/Ocultar contraseña';
    
    // Crear span para el botón
    const inputGroupText = document.createElement('span');
    inputGroupText.className = 'input-group-text p-0';
    inputGroupText.appendChild(toggleBtn);
    inputGroup.appendChild(inputGroupText);
    
    // Funcionalidad toggle
    toggleBtn.addEventListener('click', function() {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleBtn.innerHTML = '<i class="bi bi-eye-slash"></i>';
            toggleBtn.title = 'Ocultar contraseña';
        } else {
            passwordField.type = 'password';
            toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
            toggleBtn.title = 'Mostrar contraseña';
        }
    });
}

function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Iniciando sesión...';
    } else {
        button.disabled = false;
        button.innerHTML = 'Ingresar';
    }
}

function clearForm() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.reset();
    }
}

// Manejar Enter en los campos
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.id === 'email' || activeElement.id === 'password')) {
            event.preventDefault();
            handleLogin();
        }
    }
});
