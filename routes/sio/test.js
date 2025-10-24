//loggers 
var nameModuleLogger = "Routes > sio > test.js : "
var logger = require('winston');

var arrayJugadores = new Array();
var arrayObservadores = new Array();

module.exports =  function (io) {
	
	//Evento conexion
	var test = io.sockets.on('connection', function (socket) {
				
		socket.on('test-conectado', function(user){
			console.log('Antes Longitud arrayJugadores: ' + arrayJugadores.length);
			if(arrayJugadores.length < 6){
				arrayJugadores.push(user);
			}else{
				arrayObservadores.push(user);
			}
			console.log('Despues Longitud arrayJugadores: ' + arrayJugadores.length);
		});//fin evento connect-to

		socket.on('showArrays', function(){
			console.log('Array jugadores');
			console.log(arrayJugadores);

			console.log('Array Observadores');
			console.log(arrayObservadores);
		});
		
	});//fin conecction
}