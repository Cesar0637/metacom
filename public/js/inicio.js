// Este bloque se ejecuta SÓLO cuando toda la página HTML está completamente cargada.
$(document).ready(function () {
    console.log("Página lista. 'inicio.js' iniciado.");

    // --- Asegura conexión con socket.io ---
    const socket = io(); // ✅ conexión al namespace raíz

    // Prepara la página para escuchar las respuestas del servidor.
    init(socket);

    // Asigna la lógica directamente al CLIC del botón.
    $('#submit').on('click', function (e) {
        e.preventDefault(); // Evita recarga
        console.log("Clic en 'INGRESA' detectado.");

        const submitButton = $(this);
        submitButton.prop('disabled', true);

        const jugador = {
            nick: $('#nick').val().trim(),
        };

        if (jugador.nick && jugador.nick.length > 0) {
            console.log("Nick válido ('" + jugador.nick + "'). Enviando al servidor...");
            socket.emit('addGamer', jugador);
        } else {
            console.error("Error: El campo de nick está vacío.");
            submitButton.prop('disabled', false);
            procesaNotificacion({
                title: '¡Oops!',
                msg: 'Ingrese un nombre válido',
                tipo: 'danger',
            });
        }
    });

    // Inicializa listeners
    function init(socket) {
        socket.on('connect', () => console.log("✅ Socket conectado:", socket.id));

        socket.on('nickOcupado', procesarNickOcupado);
        socket.on('redirect', procesaRedirect);
        socket.on('notificacion', procesaNotificacion);
    }

    function procesarNickOcupado() {
        console.log("Respuesta del servidor: 'nickOcupado'.");
        $('#submit').prop('disabled', false);
        procesaNotificacion({
            title: '¡Oops!',
            msg: 'El nombre que deseas utilizar ya está en uso.',
            tipo: 'danger',
        });
    }

    function procesaRedirect(page) {
        console.log("¡ORDEN RECIBIDA! Redirigiendo a: " + page);
        window.location.href = page;
    }

    function procesaNotificacion(data) {
        if (data.tipo === 'info') {
            $.growl.notice({ title: data.title, message: data.msg });
        } else if (data.tipo === 'danger') {
            $.growl.error({ title: data.title, message: data.msg });
        } else {
            $.growl.warning({ title: data.title, message: data.msg });
        }
    }
});
