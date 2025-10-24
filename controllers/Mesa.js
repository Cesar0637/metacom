const models = require('../models/MesaModel');

module.exports = {
  mesa: {
    add: async function(mesa) {
      try {
        let feudalismo = 0, capitalismo = 0, neoliberalismo = 0;

        if (mesa._epoca === 'Feudalismo') feudalismo++;
        else if (mesa._epoca === 'Capitalismo') capitalismo++;
        else neoliberalismo++;

        const numeroMesa = parseInt(mesa._noMesa.substring(5));

        const newMesa = new models.Mesa({
          numero: numeroMesa,
          noMesa: mesa._noMesa,
          feudalismo,
          capitalismo,
          neoliberalismo,
          no_usuarios: mesa._noJugadoresActivos
        });

        await newMesa.save();

        return { err: false };
      } catch (err) {
        return { err: true, desc: `Error al crear la mesa en mongodb: ${mesa._noMesa} desc: ${err}` };
      }
    },

    find: async function(noMesa) {
      try {
        const result = await models.Mesa.find({ noMesa });
        return { err: false, desc: result };
      } catch (err) {
        return { err: true, desc: `Error al consultar sobre mesas desc: ${err}` };
      }
    },

    findAll: async function() {
      try {
        const result = await models.Mesa.find({}).sort({ numero: 1 }).exec();
        return { err: false, desc: result };
      } catch (err) {
        return { err: true, desc: `Error al consultar sobre todas las mesas desc: ${err}` };
      }
    },

    update: async function(mesa) {
      try {
        const query = { noMesa: mesa._noMesa };
        let fieldUpdate = {};

        if (mesa._epoca === 'Feudalismo') fieldUpdate = { $inc: { feudalismo: 1, no_usuarios: mesa._noJugadoresActivos } };
        else if (mesa._epoca === 'Capitalismo') fieldUpdate = { $inc: { capitalismo: 1, no_usuarios: mesa._noJugadoresActivos } };
        else fieldUpdate = { $inc: { neoliberalismo: 1, no_usuarios: mesa._noJugadoresActivos } };

        const result = await models.Mesa.updateOne(query, fieldUpdate);
        return { err: false, desc: result };
      } catch (err) {
        return { err: true, desc: `Error al actualizar sobre mesas desc: ${err}` };
      }
    },

    calculaPromedioUsuariosPorMesa: async function() {
      try {
        const results = await models.Mesa.aggregate([
          { $group: { _id: '1', promedio: { $avg: '$no_usuarios' } } }
        ]);
        return { err: false, desc: results };
      } catch (err) {
        return { err: true, desc: `Error al promediar usuarios por mesa desc: ${err}` };
      }
    }
  }
};
