document.addEventListener('DOMContentLoaded', function() {
    initializeHomePage();
    setupSmoothScrolling();
});

async function initializeHomePage() {
    try {
        // Verificar si el usuario está autenticado
        const isAuthenticated = api && api.isAuthenticated();
        
        // Cargar elementos de la página
        loadTopButtons(isAuthenticated);
        loadHeroActions(isAuthenticated);
        setupContactForm();
        
        // Cargar estadísticas si está autenticado
        if (isAuthenticated) {
            await loadStatistics();
        }
        
        // Configurar efectos visuales
        setupScrollEffects();
        
    } catch (error) {
        console.error('Error inicializando página de inicio:', error);
    }
}

function loadTopButtons(isAuthenticated) {
    const topButtons = document.getElementById('topButtons');
    if (!topButtons) return;
    
    if (isAuthenticated) {
        const currentUser = api.getCurrentUser();
        const nombreUsuario = currentUser?.nombre || 'Usuario';
        
        topButtons.innerHTML = `
            <div class="d-flex align-items-center me-3">
                <div class="user-info">
                    <i class="fas fa-user-circle text-primary me-2" style="font-size: 1.5rem;"></i>
                    <span class="text-muted">Hola, <strong>${nombreUsuario}</strong></span>
                </div>
            </div>
            <a href="userProfile_main.html" class="btn btn-primary btn-sm">
                <i class="fas fa-tachometer-alt me-1"></i>Dashboard
            </a>
            <button onclick="handleLogout()" class="btn btn-outline-danger btn-sm">
                <i class="fas fa-sign-out-alt me-1"></i>Salir
            </button>
        `;
    } else {
        topButtons.innerHTML = `
            <a href="user_logIn.html" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-sign-in-alt me-1"></i>Iniciar Sesión
            </a>
            <a href="user_register.html" class="btn btn-primary btn-sm">
                <i class="fas fa-user-plus me-1"></i>Registrarse
            </a>
            <button class="btn btn-outline-info btn-sm" data-bs-toggle="modal" data-bs-target="#modalContacto">
                <i class="fas fa-envelope me-1"></i>Contacto
            </button>
        `;
    }
}

function loadHeroActions(isAuthenticated) {
    const heroActions = document.getElementById('heroActions');
    if (!heroActions) return;
    
    if (isAuthenticated) {
        heroActions.innerHTML = `
            <div class="hero-buttons">
                <a href="userProfile_main.html" class="btn btn-primary btn-lg me-3 mb-2">
                    <i class="fas fa-tachometer-alt me-2"></i>Ir a Mi Dashboard
                </a>
                <button class="btn btn-outline-light btn-lg mb-2" data-bs-toggle="modal" data-bs-target="#modalContacto">
                    <i class="fas fa-question-circle me-2"></i>¿Necesitas Ayuda?
                </button>
            </div>
        `;
    } else {
        heroActions.innerHTML = `
            <div class="hero-buttons">
                <a href="user_register.html" class="btn btn-primary btn-lg me-3 mb-2">
                    <i class="fas fa-rocket me-2"></i>Comenzar Gratis
                </a>
                <a href="user_logIn.html" class="btn btn-outline-light btn-lg mb-2">
                    <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                </a>
            </div>
        `;
    }
}

async function loadStatistics() {
    try {
        const estadisticasSection = document.getElementById('estadisticas');
        if (!estadisticasSection) return;
        
        // Mostrar la sección de estadísticas
        estadisticasSection.style.display = 'block';
        
        // Intentar cargar estadísticas del backend
        try {
            // Cuando esté implementado el endpoint de estadísticas:
            // const stats = await api.makeRequest('/stats/general');
            
            // Por ahora usar datos simulados con animación
            animateStatistics();
            
        } catch (error) {
            console.log('Usando estadísticas por defecto:', error.message);
            animateStatistics();
        }
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

function animateStatistics() {
    // Animar contadores
    const counters = [
        { id: 'totalUsuarios', target: 150, suffix: '+' },
        { id: 'totalMovimientos', target: 5230, suffix: '+' },
        { id: 'ahorroPromedio', target: 125, prefix: '₡', suffix: 'K' }
    ];
    
    counters.forEach(counter => {
        const element = document.getElementById(counter.id);
        if (element) {
            animateCounter(element, 0, counter.target, 2000, counter.prefix, counter.suffix);
        }
    });
}

function animateCounter(element, start, end, duration, prefix = '', suffix = '') {
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Función de easing suave
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeProgress);
        
        // Formatear número con separadores de miles
        const formattedNumber = current.toLocaleString('es-CR');
        element.textContent = `${prefix}${formattedNumber}${suffix}`;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function setupContactForm() {
    const form = document.getElementById('formularioContacto');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleContactForm(this);
    });
    
    // Validación en tiempo real
    setupContactValidation();
}

async function handleContactForm(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Deshabilitar botón y mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
        
        // Recopilar datos del formulario
        const formData = {
            correo: document.getElementById('correoContacto').value.trim(),
            telefono: document.getElementById('telefonoContacto').value.trim(),
            asunto: document.getElementById('asuntoContacto').value,
            mensaje: document.getElementById('mensajeContacto').value.trim()
        };
        
        // Validaciones
        if (!validateContactForm(formData)) {
            return;
        }
        
        // Simular envío (reemplazar con llamada real al backend)
        await simulateContactSubmission(formData);
        
        // Éxito
        if (api && api.showMessage) {
            api.showMessage('¡Mensaje enviado exitosamente! Te contactaremos pronto.', 'success');
        } else {
            showFallbackMessage('Mensaje enviado exitosamente. Te contactaremos pronto.', 'success');
        }
        
        // Cerrar modal y limpiar formulario
        closeContactModal();
        form.reset();
        
    } catch (error) {
        console.error('Error enviando formulario de contacto:', error);
        
        if (api && api.showMessage) {
            api.showMessage('Error al enviar mensaje: ' + error.message, 'error');
        } else {
            showFallbackMessage('Error al enviar mensaje. Inténtalo más tarde.', 'error');
        }
        
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function validateContactForm(data) {
    // Validar campos obligatorios
    if (!data.correo || !data.asunto || !data.mensaje) {
        const message = 'Por favor completa todos los campos obligatorios (correo, asunto y mensaje)';
        if (api && api.showMessage) {
            api.showMessage(message, 'error');
        } else {
            showFallbackMessage(message, 'error');
        }
        return false;
    }
    
    // Validar email
    if (!api || !api.isValidEmail(data.correo)) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.correo)) {
            const message = 'Por favor ingresa un email válido';
            if (api && api.showMessage) {
                api.showMessage(message, 'error');
            } else {
                showFallbackMessage(message, 'error');
            }
            return false;
        }
    }
    
    return true;
}

function setupContactValidation() {
    const emailField = document.getElementById('correoContacto');
    if (emailField) {
        emailField.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email) {
                const isValid = api ? api.isValidEmail(email) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                this.classList.toggle('is-invalid', !isValid);
                this.classList.toggle('is-valid', isValid);
            }
        });
    }
}

async function simulateContactSubmission(data) {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Aquí se haría la llamada real al backend:
    // return await api.makeRequest('/contact', 'POST', data);
    
    console.log('Datos de contacto enviados:', data);
}

function closeContactModal() {
    const modal = document.getElementById('modalContacto');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

function setupSmoothScrolling() {
    // Scroll suave para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                const headerOffset = 80; // Compensar por header fijo
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function setupScrollEffects() {
    // Efecto parallax sutil para el video de fondo
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.background-video');
        
        if (parallax) {
            const speed = 0.5;
            parallax.style.transform = `translateY(${scrolled * speed}px)`;
        }
    });
    
    // Animación de aparición para las tarjetas
    const observeCards = () => {
        const cards = document.querySelectorAll('.card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    };
    
    // Ejecutar cuando el DOM esté listo
    setTimeout(observeCards, 100);
}

// Función para manejar logout
function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        if (api && api.logout) {
            api.logout();
        } else {
            // Fallback si no está disponible la API
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'user_logIn.html';
        }
    }
}

// Función de fallback para mostrar mensajes
function showFallbackMessage(message, type) {
    alert(`${type.toUpperCase()}: ${message}`);
}

// Hacer handleLogout disponible globalmente
window.handleLogout = handleLogout;