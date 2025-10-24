
var models = require('../models/ConfigModel');

module.exports = {
    configuracion: {

        // --- CORREGIDO CON ASYNC/AWAIT ---
        findConfig: async function () {
            try {
                const result = await models.Config.find({}).exec();

                return {
                    err: false,
                    result
                };
            } catch (err) {
                return {
                    err: true,
                    result: 'Error al obtener configuración desc: ' + err
                };
            }
        },


        // --- CORREGIDO CON ASYNC/AWAIT ---
        findCreditos: async function () {
            try {
                const result = await models.Config.find({}).select('creditos').exec();
                return {
                    err: false,
                    result
                };
            } catch (err) {
                logger.error(nameModuleLogger + 'Error en findCreditos: ' + err);
                return {
                    err: true,
                    result: 'Error al obtener créditos de configuración: ' + err
                };
            }
        },

        // --- CORREGIDO CON ASYNC/AWAIT ---
        findNoMesas: async function () {
            try {
                const result = await models.Config.find({}).select('noMesas').exec();

                // Si quieres solo un número en lugar de un array de documentos:
                const noMesas = result.length > 0 ? result[0].noMesas : 10; // valor por defecto

                return { err: false, result: noMesas };

            } catch (err) {
                return { err: true, result: 'Error al obtener número de mesas: ' + err };
            }
        },


        findNoCasillasWin: async function () {
            try {
                const result = await models.Config.find({}).select('noCasillas win').exec();
                return {
                    err: false,
                    result: result
                };
            } catch (err) {
                return {
                    err: true,
                    result: 'Error al obtener casillas de tablero y win de configuración: ' + err
                };
            }
        }
        ,

        // --- CORREGIDO CON ASYNC/AWAIT ---
        // .update está obsoleto, se usa .updateOne o .updateMany
        updateConfigPuntosUsuarios: async function (puntos, callback) {
            var query = { type: 'default' };
            var fieldUpdate = { creditos: puntos };
            var data = {};

            try {
                const result = await models.Config.updateOne(query, fieldUpdate).exec();
                data.err = false;
                data.desc = result; // En Mongoose moderno, 'result' contiene info sobre la operación
                callback(data);
            } catch (err) {
                data.err = true;
                data.desc = 'Error al actualizar los creditos de los usuarios desc: ' + err;
                callback(data);
            }
        }
    } //fin configuracion
};