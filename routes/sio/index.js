//loggers
var nameModuleLogger = "Routes > sio > index.js : ";
var logger = require('winston');

// Módulo para validación
var validator = require('validator');

// Dependencias
var Usuario = require("../../class/usuario");
var config = require("../../config/config");

module.exports = {
    // Función que monitorea los eventos realizados desde el /
    monitorIndex: function (io, usuariosConectadosLobby) {
        io.of('/').on('connection', function (socket) {

            logger.info(nameModuleLogger + "Nuevo cliente conectado.");

            // === Evento addGamer ===
            socket.on('addGamer', function (data) {
                console.log("------------------------------------");
                logger.info(nameModuleLogger + "Evento 'addGamer' recibido con nick: " + data.nick);
                logger.info(nameModuleLogger + "Usuarios conectados AHORA: " + JSON.stringify(Object.keys(usuariosConectadosLobby)));

                // Validar longitud
                if (!validator.isLength(data.nick || '', { min: 1, max: 25 })) {
                    socket.emit('notificacion', {
                        title: '¡Oops!, verifique su nick',
                        msg: 'El nick debe contener de 1 a 25 caracteres',
                        tipo: 'danger'
                    });
                    return;
                }

                data.nick = validator.escape(data.nick);

                // Si el nick ya existe
                if (usuariosConectadosLobby[data.nick]) {
                    logger.warn(nameModuleLogger + "VEREDICTO: El nick '" + data.nick + "' YA EXISTE. Enviando 'nickOcupado'.");
                    socket.emit('nickOcupado');
                    return;
                }

                // Nick libre → Crear jugador
                const jugador = new Usuario();
                jugador.setNick(data.nick);
                socket.jugador = jugador;
                usuariosConectadosLobby[data.nick] = jugador;

                // Guardar sesión
                const sess = socket.request.session;
                if (sess) {
                    sess.jugador = jugador;
                    sess.save((err) => {
                        if (err) {
                            logger.error(nameModuleLogger + "Error al guardar sesión: " + err.message);
                        } else {
                            logger.info(nameModuleLogger + "Sesión guardada correctamente para '" + data.nick + "'.");
                        }
                        socket.emit('redirect', '/historia');
                    });
                } else {
                    logger.warn(nameModuleLogger + "No existe sesión en el socket, redirigiendo igual.");
                    socket.emit('redirect', '/historia');
                }
            });

            // === Evento disconnect ===




        });
    },

    // Función que retorna la lista llenada en el módulo config
    obtenerListaMesas: async function () {
        try {
            const data = await config.obtenerMesas(); // suponiendo que devuelve una promesa
            
            if (data.err) {
                throw new Error(data.desc);
            }
            
            
            return data;
        } catch (err) {
            throw new Error('Error al obtener lista de mesas: ' + err);
        }
    },

};
