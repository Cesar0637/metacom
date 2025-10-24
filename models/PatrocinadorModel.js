var mongoose = require('mongoose');
//plugin para obtener resultados ordenados de manera aleatoria
//https://www.npmjs.com/package/mongoose-random
var random = require('mongoose-random');

var PatrocinadorScheme = mongoose.Schema({
	nombre : {type : String, required: true },
	descripcion : {type : String, required: true },
	datosContacto : {type : String, required: true },
	visualizacionInicial : {type : Number, required: true },
	visualizacionActual : {type : Number, required: true },
	ficha : {type : String, required: true },
	isDefault : { type : Boolean, default: false}
});
//Se asigna el plugin random a el schema de patrocinador
PatrocinadorScheme.plugin(random, { path: 'r' });
var Patrocinador = mongoose.model('patrocinador',PatrocinadorScheme, 'patrocinador');
module.exports = {Patrocinador : Patrocinador}; 