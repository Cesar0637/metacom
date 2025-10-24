var nameModuleLogger = "config > config : "

var configController = require("../controllers/Configuracion"); // instancia de la clase patrocinador

module.exports = {
	findAllConfiguracion: async function () {
		try {
			const data = await configController.configuracion.findConfig();


			if (data.err) {


				// Configuración por defecto
				return [{
					creditos: 200,
					noMesas: 10,
					noCasillas: 14,
					win: 5
				}];
			}


			return data.result;

		} catch (err) {
	
			console.log('Se establecen valores en código duro (error en ejecución)');

			// Configuración por defecto en caso de error inesperado
			return [{
				creditos: 200,
				noMesas: 10,
				noCasillas: 14,
				win: 5
			}];
		}
	},


	//Metodo que retorna una estructura json para las mesas de juego
	obtenerMesas: async function () {
		try {
			// Esperamos la configuración
			const data = await this.findAllConfiguracion();

			if (data.err) {
				const msg = "Surgió error al generar colección de mesas: " + data.err;

				throw new Error(msg);
			}

			// Generamos el objeto de mesas dinámicamente
			const mesas = {};
			for (let i = 0; i < data[0].noMesas; i++) {
				mesas[`mesa-${i + 1}`] = null;
			}

			return mesas;

		} catch (err) {

			throw new Error('Error al obtener mesas: ' + err);
		}
	},

	obtenerCreditos: async function () {
		try {
			const data = await configController.configuracion.findCreditos();
			if (data.err) {
	
				return { err: true, result: data.result }; // <-- no throw, devuelve objeto consistente
			}
			return { err: false, result: data.result }; // <-- mantiene forma {err, result}
		} catch (err) {
			
			return { err: true, result: String(err) };
		}
	},
	obtenerNoMesas: async function () {
		try {
			const data = await configController.configuracion.findNoMesas();

			if (data.err) {

				return { err: false, result: 10 };
			}

			return data;

		} catch (err) {
			
			return { err: false, result: 10 };
		}
	},


	obtenerNoCasillasAndWin: async function () {
		try {
			const data = await configController.configuracion.findNoCasillasWin();
			if (data.err) {
				
			}
			return data;
		} catch (err) {
			
			return { err: true, result: err };
		}
	},


	//Actualiza los puntos configurados para las mesas
	actualizarPuntosUsuarios: function (puntos, callback) {
		configController.configuracion.updateConfigPuntosUsuarios(puntos, function (data) {
			if (data.err) console.log(nameModuleLogger + 'Metodo: actualizarPuntosUsuarios Err: ' + data.result);

			callback(data);
		});
	}
}