document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    const usuarioValido = usuarios.find(usuario => usuario.email === email && usuario.password === password);

    if (usuarioValido) {
        sessionStorage.setItem('usuarioActivo', email);
        window.location.href = 'userProfile_main.html';
    } else {
        alert('Correo o contraseña incorrectos.');
    }
});
