//loggers 
var nameModuleLogger = "Routes > login.js : "
var logger = require('winston');

var express = require('express');
var router = express.Router();

//conexion con mongodb
var adminModel = require('../models/adminModel').admin;

router.use('/login', function(req, res, next){
	//Si el usario ya esta en session este se redirecciona a su panel
	if(req.session.admin){
		res.redirect('/admin/panel');
	}else{
		next();
	}
});

router.get('/login', function(req, res){
	res.render('login', {msg : ''});
});

router.post('/login', function(req, res){
	//Se obtienen los valores del request
	var usuario = req.body.txtUsuario;
	var pass = req.body.txtPassword;
	//Se busca el usuario y pass en la bd
	adminModel.find({usuario : usuario, password : pass}, function (err, result) {
		if(!err){
			//Si se obtuvo algun resultado entonces el usuario es valido
			if(result.length != 0){
				req.session.admin = usuario;
				res.redirect('/admin/panel');		
			}else{
				res.render('login', {msg : 'Usuario y/o contraseña incorrectos'});
			}
		}else{
			logger.error(nameModuleLogger + 'post: login  Err:' + err);
		}
	});
});

//Se exporta el modulo
module.exports = router;