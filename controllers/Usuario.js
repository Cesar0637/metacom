const models = require('../models/UsuarioModel');

module.exports = {
    usuario: {
        // Agrega un nuevo usuario
        addNew: async function (usuario) {
            try {
                const newUsuario = new models.Usuario({
                    nick: usuario._nick,
                    edad: usuario._edad,
                    genero: usuario._genero,
                    puntos: usuario._creditos
                });

                const result = await newUsuario.save();

                return { err: false, desc: result };
            } catch (err) {
                return { err: true, desc: 'Error al agregar nuevo usuario: ' + err };
            }
        },

        // Buscar usuario por nick
        findNew: async function (nick) {
            try {
                const result = await models.Usuario.find({ nick: nick }).exec();
                return { err: false, desc: result };
            } catch (err) {
                return { err: true, desc: 'Error al consultar sobre usuario: ' + err };
            }
        },

        // Actualizar usuario completo
        updateNew: async function (usuario) {
            try {
                const query = { nick: usuario._nick };
                const updateData = {
                    edad: usuario._edad,
                    genero: usuario._genero,
                    puntos: usuario._creditos,
                    fecha_ingreso: new Date()
                };

                const result = await models.Usuario.updateOne(query, updateData).exec();
                return { err: false, desc: result };
            } catch (err) {
                return { err: true, desc: 'Error al actualizar usuario: ' + err };
            }
        },

        // Actualiza solo los puntos del usuario
        actualizaPuntosUsuarioNew: async function (nombreUsuario, puntosUsuario) {
            try {
                const query = { nick: nombreUsuario };
                const update = { puntos: puntosUsuario };

                const result = await models.Usuario.findOneAndUpdate(query, update, { new: true }).exec();
                return { err: false, desc: result };
            } catch (err) {
                return { err: true, desc: 'Error al actualizar puntos del usuario ' + nombreUsuario + ': ' + err };
            }
        },

        // Obtener todos los usuarios
        findAllNew: async function () {
            try {
                const result = await models.Usuario.find({}).sort({ fecha_ingreso: -1 }).exec();
                return { err: false, desc: result };
            } catch (err) {
                return { err: true, desc: 'Error al obtener todos los usuarios: ' + err };
            }
        }
    }
};
