//loggers
var nameModuleLogger = "Routes > panel.js : ";
var logger = require('winston');

var express = require('express');
var multer = require('multer');
var router = express.Router();
var cloudinary = require('cloudinary');
var patrocinadorController = require('../controllers/Patrocinador');
var usuarioController = require('../controllers/Usuario');
var mesasController = require('../controllers/Mesa');
var config = require('../config/config');
var Patrocinador = require('../class/patrocinador');

//Modulo para la validacion
var validator = require('validator');

cloudinary.config({
    cloud_name: 'tr-network',
    api_key: '636895678532356',
    api_secret: 'nPLGAY2_3pvVVq5P6Oc1XEg2H8c'
});

router.use('/admin', function(req, res, next) {
    //inicializacion de la variable de session
    //Si el usario ya esta en session este se redirecciona a su panel
    if (!req.session.admin) {
        res.redirect('/login');
    } else {
        next();
    }
});

router.get('/admin/panel', function(req, res) {
    res.render('admin/panel', { view: 'partials/marcas', user: req.session.admin, errors: null });
});

router.get('/admin/usuarios', function(req, res) {
    res.render('admin/panel', { view: 'partials/usuarios', user: req.session.admin, errors: null });
});

router.get('/admin/mesas', function(req, res) {
    mesasController.mesa.calculaPromedioUsuariosPorMesa(function(data) {
        //Variable que contendra el promedio de usuarios por mesa
        var promedio = null;
        if (data.err) {
            logger.error(nameModuleLogger + 'get: /admin/mesas Err: ' + data.desc);
        } else {
            promedio = data.desc[0].promedio;
        }

        res.render('admin/panel', { view: 'partials/mesas', user: req.session.admin, errors: null, promedio: promedio });
    });
});

router.post('/patrocinadores', function(req, res) {
    patrocinadorController.patrocinadores.findAll(function(data) {
        if (data.err) {
            logger.error(nameModuleLogger + 'post: patrocinadores Err: ' + data.desc);
            res.status(500).json({ error: '¡Oops! ' + data.desc });
        } else {
            res.status(200).json(data.desc);
        }
    });
});

router.post('/usuarios', function(req, res) {
    usuarioController.usuario.findAll(function(data) {
        if (data.err) {
            logger.error(nameModuleLogger + 'post: usuarios Err: ' + data.desc);
            res.status(500).json({ error: '¡Oops! ' + data.desc });
        } else {
            res.status(200).json(data.desc);
        }
    });
});

router.post('/admin_mesas', function(req, res) {
    mesasController.mesa.findAll(function(data) {
        if (data.err) {
            logger.error(nameModuleLogger + 'post: admin_mesas Err: ' + data.desc);
            res.status(500).json({ error: '¡Oops! ' + data.desc });
        } else {
            res.status(200).json(data.desc);
        }
    });
});

// --- LÍNEA CORREGIDA ---
// La sintaxis antigua 'multer({})' se reemplaza con 'multer().any()' para que funcione con la versión actualizada.
router.use('/addMarca', multer().any(), function(req, res, next) {
    //inicializacion de la variable de session
    var session = req.session;
    //Si el usario no esta en session se redirecciona a login
    if (!session.admin) {
        res.redirect('/login');
    } else {
        //Valid inputs post
        req.assert('nombre_marca', '* El nombre de marca es requerido').notEmpty();
        req.assert('nombre_marca', '* Caracteres maximos permitidos 30').len(0, 30);
        req.assert('descripcion', '* La descripción es requerida').notEmpty();
        req.assert('descripcion', '* Ingrese al menos 100 caracteres').len(0, 100);
        req.assert('datosContacto', '* Los datos de contacto son requeridos').notEmpty();
        req.assert('datosContacto', '* Ingrese al menos 100 caracteres').len(0, 100);
        req.assert('numero_visualizacion', '* Ingrese el número de visualizaciones').notEmpty();
        req.assert('numero_visualizacion', '* El número de visualizaciones debe ser un dato numérico').isInt();
        var errors = req.validationErrors();
        if (errors) {
            res.render('admin/panel', { view: 'partials/marcas', user: session.admin, errors: errors });
        } else {
            //Como no hubo errores se reinicializa el arreglo
            errors = new Array();
            //Se verifica si el patrocinador ya esta registrado
            patrocinadorController.patrocinadores.find(req.body.nombre_marca, function(data) {
                if (data.err) {
                    logger.error(nameModuleLogger + 'use: addMarca Err: ' + data.desc);
                    errors.push({ msg: '* ¡Oops!, ha surgido un problema : ' + data.desc });
                    res.render('admin/panel', { view: 'partials/marcas', user: session.admin, errors: errors });
                } else {
                    //Si la marca no se ha registrado
                    if (data.desc == "") {
                        //Se continua con el analisis de la imagen
                        //Si no hubo errores en los input se analizan las imagenes
                        var fileKeys = Object.keys(req.files);
                        fileKeys.forEach(function(key) {
                            var img = req.files[key];
                            //Se valida el tamaño para el logo
                            if (img.size > 1048576) {
                                errors.push({ msg: '* El peso del logo, excede el tamaño permitido' });
                            }
                            //Se analiza la extension y tipo
                            if (!img.mimetype.match('(image/png)|(image/jpeg)')) {
                                errors.push({ msg: '* El tipo de imagen no esta permitido' });
                            }
                        });
                        //Si no hay errores se pasa a la siguiente operacion
                        if (errors.length == 0) {
                            next();
                        } else {
                            //Renderizando vista con errores
                            res.render('admin/panel', { view: 'partials/marcas', user: session.admin, errors: errors });
                        }
                    } else {
                        //Renderizando vista con errores
                        errors.push({ msg: '* El patrocinador a registrar ya existe.' });
                        res.render('admin/panel', { view: 'partials/marcas', user: session.admin, errors: errors });
                    }
                }
            }); //fin find
        } //fin else
    } //fin else
});

router.post('/addMarca', function(req, res) {
    var urlImage = null;
    cloudinary.uploader.upload(req.files.ficha.path, function(result) {
        urlImage = result.url;
    });

    setInterval(function() {
        if (urlImage != null) {
            clearInterval(this);
            //Se crea un objeto patrocinador
            var patrocinador = new Patrocinador();
            //Se le setean los valores  obtenidos del request
            patrocinador.setNombre(validator.escape(req.body.nombre_marca));
            patrocinador.setDescripcion(validator.escape(req.body.descripcion));
            patrocinador.setDatosContacto(validator.escape(req.body.datosContacto));
            patrocinador.setVisualizacionInicial(validator.escape(req.body.numero_visualizacion));
            patrocinador.setVisualizacionActual(validator.escape(req.body.numero_visualizacion));
            patrocinador.setFicha(urlImage);
            //Se crea un objeto patrocinador
            patrocinadorController.patrocinadores.add(patrocinador, function(data) {
                //posteriormente se le notifica al cliente que la marca se ha subido correctamente
                if (data.err) {
                    logger.error(nameModuleLogger + 'post: addMarca Err: ' + data.desc);
                    res.render('notificacion', {
                        titleMsg: '¡Oops!, tenemos un problema',
                        contentMsg: 'El patrocinador : ' + patrocinador.getNombre() + 'no se agrego correctamente.',
                        causa: 'Causa: ' + data.desc,
                        sf: false,
                        returnPage: 'admin/panel'
                    }); //fin render
                } else {
                    res.render('notificacion', {
                        titleMsg: 'Exito',
                        contentMsg: 'El patrocinador : ' + patrocinador.getNombre() + ' se agrego correctamente.',
                        causa: '',
                        sf: true,
                        returnPage: 'admin/panel'
                    }); //fin render
                } //fin else
            });
        }
    }, 500);
});

router.use('/deleteMarca', function(req, res, next) {
    if (req.body.id && req.body.id != null && req.body.id != '') {
        next();
    } else {
        res.status(500).json({ desc: 'Surgio un problema, verifique que los datos sean correctos' });
    }
});

router.post('/deleteMarca', function(req, res) {
    patrocinadorController.patrocinadores.deleteById(req.body.id, function(data) {
        if (data.err) {
            logger.error(nameModuleLogger + 'post: deleteMarca Err: ' + data.desc);
            res.render('notificacion', {
                titleMsg: '¡Oops!, tenemos un problema',
                contentMsg: 'El patrocinador : ' + id + ' no se pudo eliminar',
                causa: 'Causa: ' + data.desc,
                sf: false,
                returnPage: 'admin/panel'
            }); //fin render
        } else {
            //Se trata toda la url de la imagen
            var idImg = data.desc.ficha.split('/');
            //Se obtiene solo el id de la imagen sin la extension
            var imgId = idImg[idImg.length - 1].split('.');

            //Se invoca a la funcion que eliminara la imagen
            cloudinary.api.delete_resources([imgId[0]], function(result) {
                console.log(result);
            });
            res.status(200).json(data.desc);
        }
    });
});

//Se actualiza el valor de los puntos para un usuario
router.use('/updatePoints', function(req, res, next) {
    //inicializacion de la variable de session
    var session = req.session;
    //Si el usario no esta en session se redirecciona al login
    if (!session.admin) {
        res.redirect('/login');
    } else {
        //Valid inputs post
        req.assert('txtPuntos', '* Ingrese el numero de puntos').notEmpty();
        req.assert('txtPuntos', '* El numero de puntos debe ser un dato numérico').isInt();
        //Si recuperan los errores
        var errors = req.validationErrors();
        //Si existieron errores de validacion
        if (errors) {
            res.status(500).json({ desc: errors });
        } else {
            //Si no hay errores de validacion se pasa al siguiente metodo
            next();
        } //fin else
    } //fin else
});

router.post('/updatePoints', function(req, res) {
    //Se recuperan los creditos del request
    var creditos = req.body.txtPuntos;
    //Una vez validado el campo se actualizan los puntos de los jugadores en la bd
    config.actualizarPuntosUsuarios(creditos, function(data) {
        if (data.err) {
            logger.error(nameModuleLogger + 'post: updatePoints Err: ' + data.desc);
            res.status(200).json({ desc: true });
        } else {
            res.status(200).json({ desc: false });
        }
    });
});

//Route para que el usuario salga del panel
router.get('/logout', function(req, res) {
    if (!req.session.jugador) {
        req.session.destroy(function(err) {
            // cannot access session here
            if (err) logger.error(nameModuleLogger + 'get: logout  Err:' + err);

            //Se redirecciona al login
            res.redirect('/login');
        });
    } else {
        delete req.session.admin;
        res.redirect('/login');
    }
});

//Se exporta el modulo
module.exports = router;