const { Logger } = require('winston');
var models = require('../models/PatrocinadorModel');
const { json } = require('body-parser');

module.exports = {
    patrocinadores: {

        // --- FUNCIÓN ADD MEJORADA ---
        add: async function (patrocinador, callback) {
            try {
                const newPatrocinador = new models.Patrocinador({
                    nombre: patrocinador._nombre,
                    descripcion: patrocinador._descripcion,
                    datosContacto: patrocinador._datosContacto,
                    visualizacionInicial: patrocinador._visualizacionInicial,
                    visualizacionActual: patrocinador._visualizacionActual,
                    ficha: patrocinador._ficha
                });

                await newPatrocinador.save();
                
                // Verificar que el callback exista antes de llamarlo
                if (callback && typeof callback === 'function') {
                    callback({ err: false });
                }
                
                return { err: false };
            } catch (err) {
                const errorMsg = 'Error al agregar un nuevo patrocinador desc: ' + err;
                console.error(errorMsg);
                
                if (callback && typeof callback === 'function') {
                    callback({ err: true, desc: errorMsg });
                }
                
                return { err: true, desc: errorMsg };
            }
        },

        // --- FUNCIÓN FIND MEJORADA ---
        find: async function (nombrePatrocinador, callback) {
            try {
                const result = await models.Patrocinador.find({ nombre: nombrePatrocinador }).exec();
                
                if (callback && typeof callback === 'function') {
                    callback({ err: false, desc: result });
                }
                
                return { err: false, desc: result };
            } catch (err) {
                const errorMsg = 'Error al consultar sobre patrocinadores desc: ' + err;
                console.error(errorMsg);
                
                if (callback && typeof callback === 'function') {
                    callback({ err: true, desc: errorMsg });
                }
                
                return { err: true, desc: errorMsg };
            }
        },

        // --- FUNCIÓN FINDALL MEJORADA ---
        findAll: async function (callback) {
            try {
                const result = await models.Patrocinador.find({}).exec();
                
                if (callback && typeof callback === 'function') {
                    callback({ err: false, desc: result });
                }
                
                return { err: false, desc: result };
            } catch (err) {
                const errorMsg = 'Error al obtener todos los patrocinadores desc: ' + err;
                console.error(errorMsg);
                
                if (callback && typeof callback === 'function') {
                    callback({ err: true, desc: errorMsg });
                }
                
                return { err: true, desc: errorMsg };
            }
        },

        // --- FUNCIÓN BUSCAR PATROCINADORES DEFAULT MEJORADA ---
        buscarPatrocinadoresDefault: async function (callback) {
            try {
                const result = await models.Patrocinador
                    .find({ isDefault: true })
                    .select('_id nombre ficha isDefault')
                    .limit(3)
                    .exec();

                if (callback && typeof callback === 'function') {
                    callback({ err: false, desc: result });
                }
                
                return result;
            } catch (err) {
                const errorMsg = 'Error al obtener patrocinadores por default: ' + err;
                console.error(errorMsg);
                
                if (callback && typeof callback === 'function') {
                    callback({ err: true, desc: errorMsg });
                }
                
                throw new Error(errorMsg);
            }
        },

        // --- FUNCIÓN GET PATROCINADORES PAGO MEJORADA ---
        getPatrocinadoresPago: async function (callback) {
            try {
                console.log("🔄 EJECUTANDO VERSIÓN ROBUSTA DE getPatrocinadoresPago 🔄");
                
                let result = await models.Patrocinador.aggregate([
                    { $match: { isDefault: false, visualizacionActual: { $gt: 0 } } },
                    { $sample: { size: 6 } }
                ]);
                
                console.log("🔍 Fase 1 - Con vistas > 0:", result.length, "resultados");
                
                if (result.length === 0) {
                    console.log("🔍 Fase 2 - Buscando cualquier patrocinador no-default...");
                    result = await models.Patrocinador.aggregate([
                        { $match: { isDefault: false } },
                        { $sample: { size: 6 } }
                    ]);
                    console.log("🔍 Fase 2 - Resultados:", result.length);
                }
                
                if (result.length === 0) {
                    console.log("🔍 Fase 3 - Usando patrocinadores por defecto...");
                    result = await models.Patrocinador.aggregate([
                        { $match: { isDefault: true } },
                        { $sample: { size: 6 } }
                    ]);
                    console.log("🔍 Fase 3 - Resultados:", result.length);
                }
                
                console.log("✅ RESULTADO FINAL - Patrocinadores encontrados:", result.length);
                
                const response = { err: false, desc: result };
                
                if (callback && typeof callback === 'function') {
                    callback(response);
                }
                
                return response;
                
            } catch (err) {
                console.error("❌ ERROR CRÍTICO:", err);
                const errorResponse = { err: true, desc: [] };
                
                if (callback && typeof callback === 'function') {
                    callback(errorResponse);
                }
                
                return errorResponse;
            }
        },

        // --- FUNCIÓN FIND ONE ALEATORIO MEJORADA ---
        findOnePatrocinadorAleatorio: async function (callback) {
            try {
                const result = await models.Patrocinador.aggregate([
                    { $sample: { size: 1 } }
                ]);
                
                const response = { 
                    err: false, 
                    desc: result.length > 0 ? result[0] : null 
                };
                
                if (callback && typeof callback === 'function') {
                    callback(response);
                }
                
                return response;
            } catch (err) {
                const errorMsg = 'Error en findOnePatrocinadorAleatorio: ' + err;
                console.error(errorMsg);
                
                const errorResponse = { err: true, desc: errorMsg };
                
                if (callback && typeof callback === 'function') {
                    callback(errorResponse);
                }
                
                return errorResponse;
            }
        },

        // --- FUNCIÓN DELETE BY ID MEJORADA ---
        deleteById: async function (id, callback) {
            try {
                const result = await models.Patrocinador.findByIdAndDelete(id).exec();
                
                const response = { err: false, desc: result };
                
                if (callback && typeof callback === 'function') {
                    callback(response);
                }
                
                return response;
            } catch (err) {
                const errorMsg = 'Error al eliminar el patrocinador: ' + id + ' desc: ' + err;
                console.error(errorMsg);
                
                const errorResponse = { err: true, desc: errorMsg };
                
                if (callback && typeof callback === 'function') {
                    callback(errorResponse);
                }
                
                return errorResponse;
            }
        },

        // --- FUNCIÓN DECREMENTA VISTAS MEJORADA ---
        decrementaVistasPatrocinador: async function (patrocinador, callback) {
            try {
                const query = { 
                    _id: patrocinador.id, 
                    visualizacionActual: { $gt: 0 }, 
                    isDefault: false 
                };
                
                const result = await models.Patrocinador.updateOne(query, { 
                    $inc: { visualizacionActual: -1 } 
                }).exec();
                
                const response = { err: false, desc: result };
                
                if (callback && typeof callback === 'function') {
                    callback(response);
                }
                
                return response;
            } catch (err) {
                const errorMsg = 'Error al actualizar las vistas de: ' + patrocinador.id + ' - ' + err;
                console.error(errorMsg);
                
                const errorResponse = { err: true, desc: errorMsg };
                
                if (callback && typeof callback === 'function') {
                    callback(errorResponse);
                }
                
                return errorResponse;
            }
        },

        // --- FUNCIÓN FIND VISUALIZACION ACTUAL MEJORADA ---
        findVisualizacionActual: async function (id, callback) {
            try {
                const result = await models.Patrocinador.findById(id).select('visualizacionActual').exec();
                
                const response = { err: false, desc: result };
                
                if (callback && typeof callback === 'function') {
                    callback(response);
                }
                
                return response;
            } catch (err) {
                const errorMsg = 'Error al consultar findVisualizacionActual desc: ' + err;
                console.error(errorMsg);
                
                const errorResponse = { err: true, desc: errorMsg };
                
                if (callback && typeof callback === 'function') {
                    callback(errorResponse);
                }
                
                return errorResponse;
            }
        }

    } // fin patrocinadores
};