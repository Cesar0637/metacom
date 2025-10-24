//loggers 
var nameModuleLogger = "Routes > salir.js : "
var logger = require('winston');

//Definir que se necesita express
var express = require('express');
var mail = require('../controllers/Email');
var patrocinadorController = require('../controllers/Patrocinador');
var util = require('../util/util');

//Definir que se utilizara Router para controlar las rutas sobre las peticiones entrantes
var router = express.Router();

//Se definen variables
var jugador = null;


router.use('/salir', function(req, res, next){
	//inicializacion de la variable de session
	if(req.session.jugador){
		next();
	}else{
		res.redirect('/');		
	}
});

router.get('/salir', function(req, res){
	//si la session existe esta se destruye
	res.render('salir', {jugador: req.session.jugador});
});

router.use("/send", function(req, res, next){
	//inicializacion de la variable de session
	if(!req.session.jugador){
		res.status(500).json({desc : [{msg : 'No es posible realizar esta acción, su sesión ha finalizado por favor inicie nuevamente', redirect : true, page : '/'}]});
	}else{
		next();
	}
});

router.post("/send", function(req, res){
	//Valid inputs post
	req.assert('email', '* Ingrese un email valido').isEmail();
	var errors = req.validationErrors();
	if(errors){
		res.status(500).json({desc : errors});
	}else{
		//Se envia el email y se redireccina al index
		var mailOptions = {
		    from: 'METACON | JUEGOS DINAMITA  <contacto@metacon.net>', // sender address
		    sender : '<no-reply@metacon.net>',
		    to: req.body.email, // list of receivers
		    subject: 'Resultados Preliminares METACON', // Subject line
		    html: mail.mailer.templateMail({nick : req.session.jugador._nick, puntos : req.session.jugador._creditos})
		};

		//Se envia el email de resultados al amdinistrador
		var mailOptionsAdmin = {
			from: 'METACON | JUEGOS DINAMITA  <contacto@metacon.net>', // sender address
		    sender : '<no-reply@metacon.net>',
		    to: 'contacto@metacon.net, contacto@dinamita.cc', // list of receivers
		    subject: 'Notificacion sobre solictud de Resultados Preliminares METACON', // Subject line
		    html: mail.mailer.templateResultadosAdmin({nick : req.session.jugador._nick, puntos : req.session.jugador._creditos})
		};

		mail.mailer.transporter().sendMail(mailOptionsAdmin, function (err, result){
			if(err){
				logger.error(nameModuleLogger + 'post: send admin  Err:' + err);				
		    }else{
		    	console.log('Envio de correo hacia admin exitosamente');
		    }
		});

		//send mail al usuario
		mail.mailer.transporter().sendMail(mailOptions, function(err, result){
			if(err){
				logger.error(nameModuleLogger + 'post: send  Err:' + err);
				res.status(500).json({desc : err});
		    }else{
		    	res.status(200).json({response : 'Su solictud ha sido enviada exitosamente'});
		    }
		});
	}
});

router.use('/view_patrocinador', function(req, res, next){
	if(req.session.jugador){
		next();
	}else{
		res.status(200).json({denegado :  true});
	}
});

router.post('/view_patrocinador', function(req, res){
	req.session.jugador._creditos+=10;
	util.updatePuntosUsuario(req.session.jugador);
	patrocinadorController.patrocinadores.findOnePatrocinadorAleatorio(function(data) {
		if(data.err)logger.error(nameModuleLogger + 'post: view_patrocinador  Err:' + data.desc);
		
		res.status(200).json({patrocinador :  data});			
	});
});

//Se exporta el modulo
module.exports = router;