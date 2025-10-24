//loggers 
var nameModuleLogger = "Routes > sio > salir.js : "
var logger = require('winston');

var util = require("../../util/util");

exports = module.exports = function(io, usuariosConectadosLobby) {
  var salir = io.of('/salir').on('connection', function (socket) {
		//funcion que elimina la session del usuario en el lobby
		socket.on('logout', function(){
			//Se verifica si existe session del jugador
			if(socket.request.session && socket.request.session.jugador){
				socket.leave(socket.request.session.jugador._room);
				delete usuariosConectadosLobby[socket.request.session.jugador._nick];
				//Envia el numero de usuarios conectados a todas las sockets
				io.of('/lobby').emit('sendNoUsuariosConectadosLobby', util.getSizeCollection(usuariosConectadosLobby));
//				io.of('/lobby').emit('sendUsersMesas', mesas);
				//Finalmente se elimna la session
				if(!socket.request.session.admin){
					socket.request.session.destroy(function(err) {
					    // cannot access session here
						if(err) logger.error(nameModuleLogger + 'socket: logout  Err:' + err);
						
						socket.emit('redirectToIndex', '/');
					});
				}else{
					delete socket.request.session.jugador;
					socket.request.session.save();
					socket.emit('redirectToIndex', '/');
				}
				
				
			}else{
				//Se emite una redireccion al cliente
				socket.emit('redirectToIndex', '/');
			}
		});

		//funcion que elimina la session del usuario en el lobby
		socket.on('increment', function(){
			util.increment(socket);
		});

  });
}