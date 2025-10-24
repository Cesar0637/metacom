var mongoose = require('mongoose');
var UsuarioScheme = mongoose.Schema({
	nick : {type : String, required: true },
	edad : {type : Number, required: true },
	genero : {type : String, required: true },
	puntos : {type : Number, required: true },
	fecha_ingreso : { type: Date, default: Date.now }
});
var Usuario = mongoose.model('usuario',UsuarioScheme, 'usuario');
module.exports = {Usuario : Usuario}; 