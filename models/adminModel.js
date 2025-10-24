var mongoose = require('mongoose');
var AdminSchema = new mongoose.Schema({
    usuario : String,
    password : String
});
//nombre del modelo
//el esquema definido
//el nombre de la coleccion a la que se hara referencia
var admin =  mongoose.model('admin', AdminSchema, 'admin');

module.exports = {admin : admin}; 