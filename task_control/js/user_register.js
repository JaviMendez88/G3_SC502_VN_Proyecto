document.getElementById('registroForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const apellidos = document.getElementById('apellidos').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    if (password !== confirm) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    const usuarioExistente = usuarios.find(usuario => usuario.email === email);
    if (usuarioExistente) {
        alert('Este correo ya está registrado.');
        return;
    }

    usuarios.push({ nombre, apellidos, email, password });
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    alert('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
    window.location.href = 'user_logIn.html';
});
