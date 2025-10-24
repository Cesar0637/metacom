const express = require('express');
const validator = require('validator');
const Usuario = require('../../class/usuario');
const usuarioController = require('../../controllers/Usuario');
const config = require('../../config/config');
const util = require('../../util/util');
const logger = require('winston');
const nameModuleLogger = "Routes > sio > historia.js : ";

module.exports = function (io, sessionMiddleware) {
    const historiaNamespace = io.of('/historia');

    historiaNamespace.use(function (socket, next) {
        sessionMiddleware(socket.request, socket.request.res || {}, next);
    });

    historiaNamespace.on('connection', function (socket) {
        socket.on('registraNuevoUsuario', async function (jugadorInput, callback) {
            try {
                const session = socket.request.session;

                // Validaciones de sesión
                if (!session || !session.jugador) {
                    return callback({ err: true, desc: "Error de sesión. Recarga la página." });
                }

                const { jugador } = session;
                const nick = jugador._nick || jugador.nick;

                // Si ya tiene edad, redirigir al lobby
                if (jugador.edad || jugador._edad) {
                    socket.emit('redirect', '/lobby');
                    return;
                }

                if (!nick) {
                    socket.emit('redirect', '/');
                    return;
                }

                // Validación de datos
                if (!validator.isInt(jugadorInput.edad, { min: 5, max: 100 }) ||
                    !['Masculino', 'Femenino'].includes(jugadorInput.genero)) {
                    socket.emit('notificacion', {
                        title: '¡Oops! Verifique sus datos',
                        msg: 'Edad o género inválido',
                        tipo: 'danger'
                    });
                    return;
                }

                // Crear usuario
                const usuario = new Usuario();
                usuario.setNick(nick);
                usuario.setEdad(jugadorInput.edad);
                usuario.setGenero(validator.escape(jugadorInput.genero));
                // Obtener créditos
                const creditosResp = await config.obtenerCreditos();
                if (creditosResp.err || !Array.isArray(creditosResp.result) || creditosResp.result.length === 0) {
                    throw new Error('Error al obtener créditos: ' + JSON.stringify(creditosResp));
                }
                const creditos = creditosResp.result[0].creditos;
                usuario.setCreditos(creditos);

                // Buscar usuario en BD
                const userFindResult = await usuarioController.usuario.findNew(nick);


                if (userFindResult.err) {
                    throw new Error('Error al buscar usuario');
                }

                const usuarios = userFindResult.desc.length;
                if (usuarios > 0) {
                    const updateResult = await usuarioController.usuario.updateNew(usuario);
                    if (updateResult.err) {
                        throw new Error(updateResult.desc);
                    }
                } else {
                    const addResult = await usuarioController.usuario.addNew(usuario);
                    if (addResult.err) {
                        throw new Error(addResult.desc);
                    }
                }



                // Actualizar sesión
                util.actualizaSessionUsuario(session, usuario);

                const result = await util.actualizaSessionUsuario(session, usuario);
                if (result.err) {
                    throw new Error(result.desc);
                }

                console.log("Sesión actualizada correctamente: " + JSON.stringify(session));


            
                callback({ err: false, page: '/lobby' });

            } catch (error) {
                console.log("❌ Error en registro:", error.message);
                callback({ err: true, desc: error.message });
            }
        });

        socket.on('disconnect', function () {
            console.log("🔌 Cliente desconectado de /historia - ID:", socket.id);
        });
    });

    return historiaNamespace;
};