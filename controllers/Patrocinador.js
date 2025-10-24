const { Logger } = require('winston');
var models = require('../models/PatrocinadorModel');
const { json } = require('body-parser');
// Winston logger no está definido aquí, pero asumo que está disponible en otros archivos.
// Si no, necesitarías añadir: const logger = require('winston');

module.exports = {
    patrocinadores: {

        // --- CORREGIDO CON ASYNC/AWAIT ---
        add: async function (patrocinador, callback) {
            const newPatrocinador = new models.Patrocinador({
                nombre: patrocinador._nombre,
                descripcion: patrocinador._descripcion,
                datosContacto: patrocinador._datosContacto,
                visualizacionInicial: patrocinador._visualizacionInicial,
                visualizacionActual: patrocinador._visualizacionActual,
                ficha: patrocinador._ficha
            });

            try {
                await newPatrocinador.save();
                callback({ err: false });
            } catch (err) {
                callback({ err: true, desc: 'Error al agregar un nuevo patrocinador desc: ' + err });
            }
        },

        // --- CORREGIDO CON ASYNC/AWAIT ---
        find: async function (nombrePatrocinador, callback) {
            try {
                const result = await models.Patrocinador.find({ nombre: nombrePatrocinador }).exec();
                callback({ err: false, desc: result });
            } catch (err) {
                callback({ err: true, desc: 'Error al consultar sobre patrocinadores desc: ' + err });
            }
        },

        // --- CORREGIDO CON ASYNC/AWAIT ---
        findAll: async function (callback) {
            try {
                const result = await models.Patrocinador.find({}).exec();
                callback({ err: false, desc: result });
            } catch (err) {
                callback({ err: true, desc: 'Error al obtener todos los patrocinadores desc: ' + err });
            }
        },

        // --- CORREGIDO CON ASYNC/AWAIT ---
        // Esta era la función que causó el error original
        buscarPatrocinadoresDefault: async function () {
            try {
                const result = await models.Patrocinador
                    .find({ isDefault: true })       // solo los default
                    .select('_id nombre ficha isDefault')
                    .limit(3)                        // opcional: solo los primeros 3
                    .exec();

                return result; // ya no usas callback
            } catch (err) {
                throw new Error('Error al obtener patrocinadores por default: ' + err);
            }
        },


        // --- CORREGIDO CON ASYNC/AWAIT ---
        // findRandom no es una función estándar de Mongoose. La forma moderna es usar Agregación.
        getPatrocinadoresPago: async function () {
            try {
                const filter = { isDefault: false, visualizacionActual: { $gt: 0 } };
                // Usamos $sample para obtener documentos aleatorios
                const result = await models.Patrocinador.aggregate([
                    { $match: filter },
                    { $sample: { size: 6 } }
                ]);
                console.log( "Patrocinadores de pago:"   ,JSON.stringify(result));

                return { err: false, desc: result };
            } catch (err) {
                return { err: true, desc: 'Error al obtener patrocinadores de pago: ' + err };
            }
        },


        // --- CORREGIDO CON ASYNC/AWAIT ---
        findOnePatrocinadorAleatorio: async function (callback) {
            try {
                const result = await models.Patrocinador.aggregate([
                    { $sample: { size: 1 } }
                ]);
                // Aggregate devuelve un array, así que devolvemos el primer elemento
                callback({ err: false, desc: result[0] });
            } catch (err) {
                callback({ err: true, desc: 'Error en findOnePatrocinadorAleatorio: ' + err });
            }
        },

        // --- CORREGIDO CON ASYNC/AWAIT ---
        // findByIdAndRemove está obsoleto, se usa findByIdAndDelete
        deleteById: async function (id, callback) {
            try {
                const result = await models.Patrocinador.findByIdAndDelete(id).exec();
                callback({ err: false, desc: result });
            } catch (err) {
                callback({ err: true, desc: 'Error al eliminar el patrocinador: ' + id + ' desc: ' + err });
            }
        },

        // --- CORREGIDO CON ASYNC/AWAIT ---
        // .update está obsoleto, se usa .updateOne o .updateMany
        decrementaVistasPatrocinador: async function (patrocinador) {
            const query = { _id: patrocinador.id, visualizacionActual: { $gt: 0 }, isDefault: false };
            try {
                await models.Patrocinador.updateOne(query, { $inc: { visualizacionActual: -1 } }).exec();
            } catch (err) {
                console.log('Ups, surgio un error al actualizar las vistas de : ' + patrocinador.id);
                console.log(err);
            }
        },

        // --- CORREGIDO CON ASYNC/AWAIT ---
        findVisualizacionActual: async function (id, callback) {
            try {
                const result = await models.Patrocinador.findById(id).select('visualizacionActual').exec();
                callback({ err: false, desc: result });
            } catch (err) {
                callback({ err: true, desc: 'Error al consultar findVisualizacionActual desc: ' + err });
            }
        },

    } //fin patrocinadores
};