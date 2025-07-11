document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (email === 'usuario@email.com' && password === 'admin') {
        sessionStorage.setItem('usuarioActivo', email);
        window.location.href = 'userProfile_main.html';
    } else {
        alert('Correo o contraseña incorrectos.');
    }
});



