// user_register.js - SÚPER SIMPLIFICADO
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está logueado
    if (api.isAuthenticated()) {
        alert('Ya tienes una sesión activa');
        window.location.href = 'userProfile_main.html';
        return;
    }

    // Configurar el formulario
    const form = document.getElementById('registroForm');
    if (form) {
        form.addEventListener('submit', handleRegister);
    }
    
    // Configurar botones de mostrar/ocultar contraseña si existen
    setupPasswordToggle();
});

async function handleRegister(event) {
    event.preventDefault();

    // Obtener datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    // Validaciones básicas
    if (!nombre || !apellidos || !email || !password || !confirm) {
        alert(' Por favor completa todos los campos');
        return;
    }

    if (nombre.length < 2) {
        alert(' El nombre debe tener al menos 2 caracteres');
        return;
    }

    if (apellidos.length < 2) {
        alert(' Los apellidos deben tener al menos 2 caracteres');
        return;
    }

    if (!api.isValidEmail(email)) {
        alert(' Por favor ingresa un email válido');
        return;
    }

    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (password !== confirm) {
        alert('Las contraseñas no coinciden');
        return;
    }

    // Deshabilitar botón
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';
    }

    try {
        // Enviar datos al backend
        const userData = {
            nombre: nombre,
            apellidos: apellidos,
            email: email,
            password: password
        };

        const result = await api.register(userData);

        if (result.success) {
            // Limpiar formulario
            document.getElementById('registroForm').reset();
            
            // Redireccionar al login
            setTimeout(() => {
                window.location.href = 'user_logIn.html';
            }, 1000);
        }

    } catch (error) {
        console.error('Error en registro:', error);
        
    } finally {
        // Rehabilitar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar';
        }
    }
}

// Configurar botones de mostrar/ocultar contraseña
function setupPasswordToggle() {
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirm = document.getElementById('toggle-confirm');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibility('password', this);
        });
    }
    
    if (toggleConfirm) {
        toggleConfirm.addEventListener('click', function() {
            togglePasswordVisibility('confirm', this);
        });
    }
}

// Mostrar/ocultar contraseña
function togglePasswordVisibility(fieldId, button) {
    const field = document.getElementById(fieldId);
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

// Función demo para llenar datos (OPCIONAL)
function fillDemoData() {
    document.getElementById('nombre').value = 'Juan';
    document.getElementById('apellidos').value = 'Pérez González';
    document.getElementById('email').value = 'juan.perez@ejemplo.com';
    document.getElementById('password').value = 'demo123';
    document.getElementById('confirm').value = 'demo123';
    alert('Datos demo cargados. Revisa y presiona "Registrar"');
}