var mongoose = require('mongoose');
var MesaScheme = mongoose.Schema({
	numero : Number,
	noMesa : String,
	feudalismo : Number,
	capitalismo : Number,
	neoliberalismo : Number,
	no_usuarios : Number
});
var Mesa = mongoose.model('mesa', MesaScheme, 'mesa');
module.exports = {Mesa : Mesa}; 