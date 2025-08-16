document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está logueado
    checkIfLoggedIn();
    
    // Configurar el formulario de registro
    setupRegisterForm();
    
    // Configurar validaciones en tiempo real
    setupRealTimeValidation();
    
    // Configurar toggle de contraseñas
    setupPasswordToggles();
});

function checkIfLoggedIn() {
    if (api.isAuthenticated()) {
        api.showMessage('Ya tienes una sesión activa', 'info', 2000);
        setTimeout(() => {
            window.location.href = 'userProfile_main.html';
        }, 1000);
    }
}

function setupRegisterForm() {
    const registerForm = document.getElementById('registroForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        await handleRegister();
    });
}

async function handleRegister() {
    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;
    const submitBtn = document.querySelector('button[type="submit"]');

    // Validaciones del lado cliente
    if (!validateForm(nombre, apellidos, email, password, confirm)) {
        return;
    }

    try {
        // Deshabilitar botón durante el proceso
        setButtonLoading(submitBtn, true);

        // Preparar datos para el backend
        const userData = {
            nombre: nombre,
            apellidos: apellidos,
            email: email,
            password: password
        };

        // Intentar registrar con la API
        const result = await api.register(userData);
        
        if (result.success) {
            // Registro exitoso
            clearForm();
            
            // Mostrar mensaje de éxito y redireccionar
            api.showMessage('¡Registro exitoso! Ahora puedes iniciar sesión', 'success', 3000);
            
            setTimeout(() => {
                window.location.href = 'user_logIn.html';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        // El error ya se muestra en api.register()
        
    } finally {
        // Rehabilitar botón
        setButtonLoading(submitBtn, false);
    }
}

function validateForm(nombre, apellidos, email, password, confirm) {
    // Validar campos vacíos
    if (!nombre || !apellidos || !email || !password || !confirm) {
        api.showMessage('Por favor completa todos los campos', 'error');
        return false;
    }

    // Validar longitud de nombre y apellidos
    if (nombre.length < 2 || apellidos.length < 2) {
        api.showMessage('Nombre y apellidos deben tener al menos 2 caracteres', 'error');
        return false;
    }

    // Validar email
    if (!api.isValidEmail(email)) {
        api.showMessage('Por favor ingresa un email válido', 'error');
        return false;
    }

    // Validar contraseña
    if (password.length < 6) {
        api.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }

    // Validar confirmación de contraseña
    if (password !== confirm) {
        api.showMessage('Las contraseñas no coinciden', 'error');
        return false;
    }

    // Validar fortaleza de contraseña
    if (!isStrongPassword(password)) {
        api.showMessage('La contraseña debe tener al menos una letra y un número', 'warning');
        // No retornar false aquí, solo advertencia
    }

    return true;
}

function isStrongPassword(password) {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
}

function setupRealTimeValidation() {
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const confirmField = document.getElementById('confirm');

    // Validación de email
    if (emailField) {
        emailField.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !api.isValidEmail(email)) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Email inválido');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });

        emailField.addEventListener('input', function() {
            if (this.classList.contains('is-invalid') && api.isValidEmail(this.value.trim())) {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });
    }

    // Validación de contraseña
    if (passwordField) {
        passwordField.addEventListener('input', function() {
            const password = this.value;
            const confirmPassword = confirmField ? confirmField.value : '';

            // Validar longitud
            if (password.length > 0 && password.length < 6) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Mínimo 6 caracteres');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }

            // Validar confirmación si ya tiene contenido
            if (confirmPassword && password !== confirmPassword) {
                confirmField.classList.add('is-invalid');
                showFieldError(confirmField, 'Las contraseñas no coinciden');
            } else if (confirmPassword) {
                confirmField.classList.remove('is-invalid');
                hideFieldError(confirmField);
            }
        });
    }

    // Validación de confirmación de contraseña
    if (confirmField && passwordField) {
        confirmField.addEventListener('input', function() {
            const password = passwordField.value;
            const confirm = this.value;

            if (confirm.length > 0) {
                if (password === confirm) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                    hideFieldError(this);
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                    showFieldError(this, 'Las contraseñas no coinciden');
                }
            } else {
                this.classList.remove('is-valid', 'is-invalid');
                hideFieldError(this);
            }
        });
    }
}

function setupPasswordToggles() {
    setupPasswordToggle('password', 'toggle-password');
    setupPasswordToggle('confirm', 'toggle-confirm');
}

function setupPasswordToggle(fieldId, toggleId) {
    const passwordField = document.getElementById(fieldId);
    const toggleBtn = document.getElementById(toggleId);
    
    if (!passwordField || !toggleBtn) return;

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

function showFieldError(field, message) {
    hideFieldError(field); // Limpiar error anterior
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    errorDiv.setAttribute('data-field-error', field.id);
    
    field.parentNode.appendChild(errorDiv);
}

function hideFieldError(field) {
    const existingError = field.parentNode.querySelector(`[data-field-error="${field.id}"]`);
    if (existingError) {
        existingError.remove();
    }
}

function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Registrando...';
    } else {
        button.disabled = false;
        button.innerHTML = 'Registrar';
    }
}

function clearForm() {
    const form = document.getElementById('registroForm');
    if (form) {
        form.reset();
        // Limpiar clases de validación
        form.querySelectorAll('.is-valid, .is-invalid').forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
        });
        // Limpiar mensajes de error
        form.querySelectorAll('[data-field-error]').forEach(error => {
            error.remove();
        });
    }
}
