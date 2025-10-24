//Definir que se necesita express 
var express = require('express');
//Definir que se utilizara Router para controlar las rutas sobre las peticiones entrantes
var router = express.Router();

//definicion de rutas
router.get('/reglas', function(req, res){
	res.render('reglas');
});


//Se exporta el modulo
module.exports = router;