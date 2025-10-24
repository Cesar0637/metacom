var mongoose = require('mongoose');
var ConfigScheme = mongoose.Schema({
	creditos : Number,
	noMesas : Number,
	noCasillas : Number,
	win : Number,
	type : String
});
var Config = mongoose.model('config',ConfigScheme, 'config');
module.exports = {Config : Config}; 