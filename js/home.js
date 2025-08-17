// home.js - SÚPER SIMPLIFICADO
document.addEventListener('DOMContentLoaded', function() {
    initializeHome();
});

function initializeHome() {
    // Verificar si está autenticado
    const isAuthenticated = api && api.isAuthenticated();
    
    // Cargar botones según el estado
    loadNavigationButtons(isAuthenticated);
    loadHeroButtons(isAuthenticated);
    
    // Configurar formulario de contacto si existe
    setupContactForm();
    
    // Configurar scroll suave
    setupSmoothScroll();
    
    // Simular estadísticas con animación simple
    animateStats();
}

// Cargar botones de navegación
function loadNavigationButtons(isAuthenticated) {
    const navActions = document.getElementById('navActions');
    if (!navActions) return;
    
    if (isAuthenticated) {
        const currentUser = api.getCurrentUser();
        const userName = currentUser?.nombre || 'Usuario';
        
        navActions.innerHTML = `
            <span class="text-light me-3">Hola, ${userName}</span>
            <a href="userProfile_dashboard.html" class="btn btn-outline-light btn-sm me-2">
                <i class="fas fa-tachometer-alt me-1"></i>Dashboard
            </a>
            <button onclick="handleLogout()" class="btn btn-danger btn-sm">
                <i class="fas fa-sign-out-alt me-1"></i>Salir
            </button>
        `;
    } else {
        navActions.innerHTML = `
            <a href="user_logIn.html" class="btn btn-outline-light btn-sm me-2">
                <i class="fas fa-sign-in-alt me-1"></i>Iniciar Sesión
            </a>
            <a href="user_register.html" class="btn btn-light btn-sm me-2">
                <i class="fas fa-user-plus me-1"></i>Registrarse
            </a>
            <button class="btn btn-outline-light btn-sm" onclick="showContactModal()">
                <i class="fas fa-envelope me-1"></i>Contacto
            </button>
        `;
    }
}

// Cargar botones del hero y CTA
function loadHeroButtons(isAuthenticated) {
    const heroButtons = document.getElementById('heroButtons');
    const ctaButtons = document.getElementById('ctaButtons');
    
    const buttonHTML = isAuthenticated ? `
        <a href="userProfile_dashboard.html" class="btn btn-primary btn-lg me-3 mb-2">
            <i class="fas fa-tachometer-alt me-2"></i>Ir a Mi Dashboard
        </a>
        <button onclick="showContactModal()" class="btn btn-outline-light btn-lg mb-2">
            <i class="fas fa-headset me-2"></i>Soporte
        </button>
    ` : `
        <a href="user_register.html" class="btn btn-primary btn-lg me-3 mb-2">
            <i class="fas fa-rocket me-2"></i>Comenzar Gratis
        </a>
        <a href="user_logIn.html" class="btn btn-outline-light btn-lg mb-2">
            <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
        </a>
    `;
    
    if (heroButtons) heroButtons.innerHTML = buttonHTML;
    if (ctaButtons) ctaButtons.innerHTML = buttonHTML;
}

// Configurar formulario de contacto
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', handleContactSubmit);
}

// Manejar envío de contacto
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName')?.value?.trim();
    const email = document.getElementById('contactEmail')?.value?.trim();
    const subject = document.getElementById('contactSubject')?.value;
    const message = document.getElementById('contactMessage')?.value?.trim();
    
    // Validaciones básicas
    if (!name || !email || !subject || !message) {
        alert(' Por favor completa todos los campos obligatorios');
        return;
    }
    
    if (!api.isValidEmail(email)) {
        alert(' Por favor ingresa un email válido');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
    }
    
    try {
        // Simular envío (aquí irían a tu backend)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        alert('✅ ¡Mensaje enviado exitosamente! Te contactaremos pronto.');
        
        // Cerrar modal y limpiar formulario
        const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
        if (modal) modal.hide();
        
        event.target.reset();
        
    } catch (error) {
        alert(' Error al enviar mensaje. Inténtalo más tarde.');
        console.error('Error:', error);
        
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Mensaje';
        }
    }
}

// Configurar scroll suave
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animar estadísticas
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.dataset.target) || 0;
        const prefix = stat.dataset.prefix || '';
        const suffix = stat.dataset.suffix || '';
        
        if (target > 0) {
            animateNumber(stat, 0, target, 2000, prefix, suffix);
        }
    });
}

// Animar número individual
function animateNumber(element, start, end, duration, prefix, suffix) {
    const increment = (end - start) / (duration / 50);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        
        element.textContent = `${prefix}${Math.floor(current).toLocaleString('es-CR')}${suffix}`;
    }, 50);
}

// Mostrar modal de contacto
function showContactModal() {
    const modal = new bootstrap.Modal(document.getElementById('contactModal'));
    modal.show();
}

// Manejar logout
function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        api.logout();
    }
}

// Hacer funciones globales
window.handleLogout = handleLogout;
window.showContactModal = showContactModal;