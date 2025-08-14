document.getElementById('registroForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const apellidos = document.getElementById('apellidos').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    // Validaciones existentes
    if (password !== confirm) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    // Preparar datos para el backend
    const userData = {
        nombre: nombre,
        apellidos: apellidos,
        email: email,
        password: password
    };

    try {
        // Deshabilitar botón de envío
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registrando...';
        }

        // Intentar registrar en el backend
        await api.register(userData);
        
        // Si llegamos aquí, el registro fue exitoso
        alert('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
        
        // También guardar en localStorage como backup (opcional)
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const usuarioExistente = usuarios.find(usuario => usuario.email === email);
        if (!usuarioExistente) {
            usuarios.push({ nombre, apellidos, email, password });
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
        }
        
        // Redireccionar al login
        window.location.href = 'user_logIn.html';
        
    } catch (error) {
        console.error('Error en registro:', error);
        
        // Si hay error en el backend, usar método local como fallback
        alert('Error en el servidor. Intentando registro local...');
        
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const usuarioExistente = usuarios.find(usuario => usuario.email === email);
        
        if (usuarioExistente) {
            alert('Este correo ya está registrado.');
            return;
        }

        usuarios.push({ nombre, apellidos, email, password });
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        alert('Usuario registrado exitosamente (modo local). Ahora puedes iniciar sesión.');
        window.location.href = 'user_logIn.html';
        
    } finally {
        // Rehabilitar botón
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
        }
    }
});

// Función para validar campos en tiempo real (opcional)
function setupRealTimeValidation() {
    const confirmPasswordField = document.getElementById('confirm');
    const passwordField = document.getElementById('password');
    
    if (confirmPasswordField && passwordField) {
        confirmPasswordField.addEventListener('input', function() {
            const password = passwordField.value;
            const confirm = confirmPasswordField.value;
            
            if (confirm.length > 0) {
                if (password === confirm) {
                    confirmPasswordField.style.borderColor = '#28a745';
                } else {
                    confirmPasswordField.style.borderColor = '#dc3545';
                }
            } else {
                confirmPasswordField.style.borderColor = '';
            }
        });
    }
}

// Ejecutar validación cuando se carga la página
document.addEventListener('DOMContentLoaded', setupRealTimeValidation);