//loggers 
var nameModuleLogger = "Routes > lobby.js : "
var logger = require('winston');

var express = require('express');
var config = require("../config/config");
var mail = require('../controllers/Email');
var router = express.Router();
var https = require('https');
var PRIVATE_KEY = '6Lc34AcTAAAAAL1AjAgleADSponzQe2snozZJfeF';//recaptcha key

//Modulo para la validacion
var validator = require('validator');


//definicion de variables a utilizar
var creditos = 0;
var numeroMesas = 0;
var nick = "";

router.get('/lobby', async (req, res) => {
	try {
		const session = req.session;

		// Validaciones de sesión
		if (!session.jugador) {
			return res.redirect('/');
		}

		if (session.jugador && session.jugador._nick && !session.jugador._edad) {
			return res.redirect('/historia');
		}

		const creditos = session.jugador._creditos;
		const nick = session.jugador._nick;

		// Esperar el resultado de la función async
		const data = await config.obtenerNoMesas();

		if (data.err) {
			logger.error(nameModuleLogger + 'get: lobby  Err:' + data.err);
			return res.status(500).send('Error al obtener número de mesas');
		}

		// Si el resultado viene en data.result[0].noMesas, lo mantenemos así
		const mesas = Array.isArray(data.result) ? data.result[0].noMesas : data.result;

		res.render('lobby', {
			mesas,
			creditos,
			nick
		});
	} catch (err) {
		logger.error(nameModuleLogger + 'get: lobby Catch Err: ' + err);
		res.status(500).send('Error interno en /lobby');
	}
});



router.post('/ucredits', function(req, res){
	var session = req.session;
	//Si la session de jugador no existe
	if(!session.jugador){
		//Se renderiza el index
		res.redirect('/');
	}else if(session.jugador && session.jugador._nick && !session.jugador._edad){
		res.redirect('/historia');
	}else{
		creditos = session.jugador._creditos;
		//En caso de que exista se renderiza el lobby
		res.status(200).json({response : creditos});		
	}
});


router.use('/contactar', function(req, res, next){
	var data = {};
	verifyRecaptcha(req.body["g-recaptcha-response"], function(success) {
        if (success) {
        	//Valid inputs post
    		req.assert('txtMail', '* El email es requerido').notEmpty();
    		req.assert('txtMail', '* El email no valido').isEmail();
    		req.assert('txtMsg', '* El mensaje es requerido').notEmpty();
    		var errors = req.validationErrors();
    		//Si existieron errores de validacion
    		if(errors){
    			data.desc = "fail-v";
    			data.err = errors;
    		}else{
    			data.desc = "next";
    		}
        } else {
        	data.desc = "fail-c";
        }
        //Si no hubo errores de validacion se hace un next
        if(data.desc == "next"){
        	next();
        }else{
        	//Si ocurrio algun error se notifica
        	res.status(200).json(data);        	
        }
	});
});

router.post('/contactar', function(req, res){
	//Se envia el email y se redireccina al index
	
	var recibirInfoPatrocinador = false;
	//Si el usuario selecciono la casilla de recibir informacion sobre patrocinador
	if(req.body.info_patrocinador && req.body.info_patrocinador == "recibir_informacion"){
		recibirInfoPatrocinador = true;	
	}
	
	
	var mailOptions = {
	    from: 'METACON | CONTACTO METACON ✔ <contacto@metacon.net>', // sender address
	    sender : '<no-reply@metacon.net>',
	    to: 'contacto@metacon.net', // list of receivers
	    subject: 'NUEVO CONTACTO METACON', // Subject line
	    html: mail.mailer.templateMailContacto({mail : req.body.txtMail, msg : validator.escape(req.body.txtMsg), recibirInfoPatrocinador : recibirInfoPatrocinador})
	};
	
	//send mail
	mail.mailer.transporter().sendMail(mailOptions, function(err, result){
		if(err){
			logger.error(nameModuleLogger + 'post: contactar  Err:' + err);
			res.status(200).json({desc : 'fail-m', err: err});
	    }else{
	    	res.status(200).json({desc : 'success'});
	    }
	});
});


//Helper function to make API call to recatpcha and check response
function verifyRecaptcha(key, callback) {
	https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + PRIVATE_KEY + "&response=" + key, function(res) {
	        var data = "";
	        res.on('data', function (chunk) {
	                data += chunk.toString();
	        });
	        res.on('end', function() {
	                try {
	                        var parsedData = JSON.parse(data);
	                        callback(parsedData.success);
	                } catch (e) {
	                        callback(false);
	                }
	        });
	});
}


//Se exporta el modulo
module.exports = router;