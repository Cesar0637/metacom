//loggers 
var nameModuleLogger = "Routes > sio > lobby.js : "
var logger = require('winston');

//Modulo para la validacion
var validator = require('validator');

var async = require('async');
var config = require("../../config/config");
var util = require("../../util/util");
//Instancia de el clase mesa
var Mesa = require("../../class/mesa");
var patrocinadorController = require("../../controllers/Patrocinador"); // instancia de la clase patrocinador


module.exports = function (io, sessionMiddleware, usuariosConectadosLobby, mesas, listPatrocinadoresDefault, statusMesas) {
	const lobbyNameSpace = io.of('/lobby');
	lobbyNameSpace.use(function (socket, next) {
		sessionMiddleware(socket.request, socket.request.res || {}, next);
	})
	lobbyNameSpace.on('connection', function (socket) {

		socket.on('getNoUsuariosConectadosLobby', function () {
			logger.info(nameModuleLogger + "Evento 'getNoUsuariosConectadosLobby' recibido. wwwwwwwwwwwwwwwwwwwwwwwww");
			//Se obtiene la session del request
			var session = socket.request.session;
			//Solo se verifica si existe la session del jugador
			if (session.jugador) {

				if (!usuariosConectadosLobby[session.jugador._nick]) {
					// Se agrega el usuario al array de usuarios conectados
					usuariosConectadosLobby[session.jugador._nick] = session.jugador;
				}
			}
			//Envia el numero de usuarios conectados a todas las sockets
			lobbyNameSpace.emit('sendNoUsuariosConectadosLobby', util.getSizeCollection(usuariosConectadosLobby));
			logger.info("LA mesaaaaaaaaaaaaaaaaa" + JSON.stringify(mesas));
			lobbyNameSpace.emit('sendUsersMesas', mesas);
		});

		
		socket.on('selectedMesa', async function (data) {
			logger.info(nameModuleLogger + "Evento 'selectedMesa' recibido con mesa: " + data[0]);

			const session = socket.request.session;

			if (!session.jugador._room || session.jugador._room === data[0]) {
				if (session.jugador && session.jugador._creditos !== 0) {
					session.jugador._room = data[0];
					await session.save();
					socket.request.session = session;

					let mesa = null;

					if (!statusMesas[data[0]]) {
						statusMesas[data[0]] = true;

						if (mesas[data[0]] == null) {
							try {
								// Obtener configuración de casillas y win
								const configCasillasWin = await config.obtenerNoCasillasAndWin();
								if (configCasillasWin.err) throw new Error(configCasillasWin.result);

								// Crear la mesa
								mesa = new Mesa(
									data[0],
									data[1],
									data[2],
									session.jugador,
									configCasillasWin.result[0].noCasillas,
									configCasillasWin.result[0].win,
									false,
									0
								);

								// Obtener patrocinadores de pago
								const patrocinadoresPago = await patrocinadorController.patrocinadores.getPatrocinadoresPago();
								console.log("mesas select mesa "+JSON.stringify(patrocinadoresPago));
								if (patrocinadoresPago.err) throw new Error(patrocinadoresPago.desc);

								mesa._listaPatrocinadores = util.obtenerPatrocinadores(listPatrocinadoresDefault, patrocinadoresPago.desc);
								mesas[data[0]] = mesa;

							} catch (err) {
								logger.error(nameModuleLogger + ' socket: selectedMesa Err: ' + err);
								socket.emit('notificacion', { title: 'Error', msg: err.message || err, tipo: 'danger' });
								return;
							}
						}
					}

					// Espera activa para que los patrocinadores se carguen
					console.log("iqwd100");
					let tolerancia = 0;
					const interval = setInterval(() => {
						if (tolerancia >= 10) {
							console.log("i100");
							clearInterval(interval);
							session.jugador._room = null;
							session.save();
							socket.request.session = session;
							socket.emit('notificacion', { title: 'Error de conexión', msg: 'Se perdio la conexión al unirse a la mesa.', tipo: 'error' });
							return;
						}
						
						if (mesas[data[0]]?._listaPatrocinadores?.length) {
							console.log("i100w2");
							clearInterval(interval);
							if (!util.checkPlayersMesa(mesas[data[0]]._listaJugadores, session.jugador._nick)) {
								socket.join(session.jugador._room);
								mesas[data[0]]._listaJugadores.push(session.jugador);
							}
							socket.emit('redirectToMesa', '/mesas/' + data[0]);
						}

						tolerancia++;
					}, 1000);

				} else {
					socket.emit('notificacion', { title: '¡Oops!, créditos insuficientes', msg: 'No cuentas con los créditos suficientes para participar en la mesa.', tipo: 'danger' });
					socket.emit('buttonDesBlock', data[0]);
				}
			} else {
				socket.emit('notificacion', { title: '¡Oops!, te encuentras activo en la ' + session.jugador._room, msg: 'Solo puedes jugar en una mesa.', tipo: '' });
				socket.emit('buttonDesBlock', data[0]);
			}

		});


		//Recibe una seleccion de un usuario a una mesa ya creada
		socket.on('joinMesa', function (data) {
			logger.info(nameModuleLogger + "Evento 'joinMesa' recibido con mesa: " + data);
			//Se inicializa la variable con la session del socket request
			var session = socket.request.session;
			if (session.jugador._room == undefined || session.jugador._room == null || session.jugador._room == data) {
				//Antes de realizar la creacion de la mesa se verifica si el usuario tiene puntos
				if (session.jugador && session.jugador._creditos != 0) {
					//Se invoca a la funcion que indica si el usuario ya existe en la mesa
					if (!util.checkPlayersMesa(mesas[data]._listaJugadores, session.jugador._nick)) {
						//Como el usuario no esta en la mesa
						//Se actualiza la room en su session del usuario estableciendo la mesa
						session.jugador._room = data;
						session.save();
						socket.request.session = session;
						//Se agrega el usuario a la lista de usuarios de la mesa
						mesas[data]._listaJugadores.push(session.jugador);
						//Se agrega la socket del jugador a la mesa
						socket.join(session.jugador._room);
					}
					//Se emite una redireccion al cliente
					socket.emit('redirectToMesa', '/mesas/' + data);
				}//fin if
				else {
					//Como el usuario no tiene creditos suficientes no puede acceder a la mesa
					socket.emit('notificacion',
						{
							'title': '¡Oops!, créditos insuficientes',
							'msg': 'No cuentas con los créditos suficientes para participar en la mesa.',
							'tipo': 'danger'
						});
					socket.emit('buttonDesBlock', 'join-' + data);
				}
			} else {
				//Como el usuario se encuentra en una mesa no puede acceder o crear una mesa
				socket.emit('notificacion',
					{
						'title': '¡Oops!, te encuentras activo en la ' + session.jugador._room,
						'msg': 'Lo sentimos pero solo puedes jugar en una mesa.',
						'tipo': ''
					});
				socket.emit('buttonDesBlock', 'join-' + data);
			}
		});

		//Se emite el bloqueo del boton a todos los presentes en el lobby
		socket.on('blockButton', function (mesa) {
			lobbyNameSpace.emit('buttonBlock', mesa);
		});

		//Evento que actualiza los puntos del usuario en la session del request
		socket.on('increment', function () {
			util.increment(socket);
		});

		/*CHAT*/
		socket.on('sendMessage', function (data) {
			logger.info(nameModuleLogger + "Evento 'sendMessage' recibido con nick: " + data.nick + " y mensaje: " + data.msg);
			if (data.nick && data.msg) {
				if (!validator.isLength(data.msg, 1, 100)) {
					socket.emit('notificacion', { 'title': '¡Oops!, verifica tu mensaje', 'msg': 'Tu mensaje de contener de 1 a 100 caracteres', 'tipo': 'danger' });
				} else {
					lobbyNameSpace.emit('newMessage', [validator.escape(data.nick), validator.escape(data.msg)]);
				}
			} else {
				socket.emit('notificacion', { 'title': '¡Oops!, verifica tu mensaje', 'msg': 'Nick o mensaje invalido', 'tipo': 'danger' });
			}
		});
		/*FIN CHAT*/

	});
}