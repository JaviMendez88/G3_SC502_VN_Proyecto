document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está logueado
    if (api.isAuthenticated()) {
        alert('Ya tienes una sesión activa');
        window.location.href = 'userProfile_dashboard.html';
        return;
    }

    // Configurar el formulario
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    // Rellenar fecha actual en cualquier campo de fecha
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
});

async function handleLogin(event) {
    event.preventDefault();

    // Obtener datos del formulario
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validaciones básicas
    if (!email || !password) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (!api.isValidEmail(email)) {
        alert(' Por favor ingresa un email válido');
        return;
    }

    // Deshabilitar botón
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';
    }

    try {
        // Enviar credenciales al backend
        const credentials = { email, password };
        const result = await api.login(credentials);

        if (result.success) {
            // Limpiar formulario
            document.getElementById('loginForm').reset();
            
            // Redireccionar al dashboard
            setTimeout(() => {
                window.location.href = 'userProfile_dashboard.html';
            }, 1000);
        }

    } catch (error) {
        console.error('Error en login:', error);
        
    } finally {
        // Rehabilitar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Ingresar';
        }
    }
}

// Función demo para llenar campos (OPCIONAL)
function fillDemoCredentials() {
    document.getElementById('email').value = 'demo@fidefinance.com';
    document.getElementById('password').value = 'demo123';
    alert('Datos demo cargados. Presiona "Ingresar" para probar');
}