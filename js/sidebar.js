document.addEventListener('DOMContentLoaded', function() {
    setActiveNavigation();
});

function setActiveNavigation() {
    // Obtener el nombre del archivo actual
    const currentPage = window.location.pathname.split('/').pop();
    
    // Mapeo de páginas a elementos del sidebar
    const pageMapping = {
        'userProfile_dashboard.html': 'nav-dashboard',
        'userProfile_settings.html': 'nav-settings', 
        'userProfile_reports.html': 'nav-reports',
        'userProfile_charts.html': 'nav-charts',
        'userProfile_statistics.html': 'nav-statistics'
    };
    
    // Remover clases activas de todos los enlaces
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active', 'bg-warning', 'text-dark');
        link.classList.add('text-white');
    });
    
    // Agregar clase activa al enlace correspondiente
    const currentNavId = pageMapping[currentPage];
    if (currentNavId) {
        const activeLink = document.getElementById(currentNavId);
        if (activeLink) {
            activeLink.classList.add('active', 'bg-warning', 'text-dark');
            activeLink.classList.remove('text-white');
        }
    }
    
    console.log('Página actual:', currentPage);
    console.log('Navegación activa establecida para:', currentNavId);
}

// Función para manejar clicks en navegación
function handleNavClick(event) {
    // Remover active de todos
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active', 'bg-warning', 'text-dark');
        link.classList.add('text-white');
    });
    
    // Agregar active al clickeado
    const clickedLink = event.target.closest('.nav-link');
    if (clickedLink) {
        clickedLink.classList.add('active', 'bg-warning', 'text-dark');
        clickedLink.classList.remove('text-white');
    }
}