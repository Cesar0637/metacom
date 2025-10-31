//loggers 
var nameModuleLogger = "Routes > sio > sala.js : "
var logger = require('winston');

var util = require("../../util/util");
var patrocinadorController = require("../../controllers/Patrocinador"); // instancia de la clase patrocinador
var Patrocinador = require("../../class/patrocinador"); // instancia de la clase patrocinador

//Modulo para la validacion
var validator = require('validator');

//Variable que tomara el objeto el mesa
var mesa = null;

//json que contiene los intervalos para las 10 mesas simbolizando el contador en el juego
var intervalos = {
	'mesa-1' : null,
	'mesa-2' : null, 
	'mesa-3' : null, 
	'mesa-4' : null,
	'mesa-5' : null,
	'mesa-6' : null,
	'mesa-7' : null,
	'mesa-8' : null,
	'mesa-9' : null,
	'mesa-10' : null,
};

//Lista que contendra los patrocinadores auxiliares para la mesa 10
var listaAuxiliarPatrocinadores = new Array();

//funcion que inicializa el cronometro
function cronometro(sala, mesa, nick) {
	//Se inicializa el tiempo de tirada en la partida
	var tiempoInicial =  mesa._tiempoTirada;
	//Se iguala la variable intervalo con respecto a la mesa
	intervalos[mesa._noMesa] = setInterval(function() {
		//Si el tiempo aun es mayor a 0 se envia el decremento a la vista
		if(tiempoInicial >= 0){
			var data = [tiempoInicial, nick];
			sala.to(mesa._noMesa).emit('timer-decrement', data);
			tiempoInicial--;
		}
		//En caso de que se pierda el turno
		else{
			//Como el usuario no tiro se deteniene el intervalo
			clearInterval(intervalos[mesa._noMesa]);
			//Variable que define si un usuario se expulso
			var expulsado = false;
			//Se verifica el numero de tiros perdidos del usuario
			for(var i = 0; i < mesa._noJugadoresActivos; i++) {
				//Se obtiene el jugador que perdio el tiro
				if(nick == mesa._listaJugadores[i]._nick) {
					//Se incrementa el numero de tiros perdidos
					mesa._listaJugadores[i]._noTurnosPerdidos += 1;
					//Se analiza el numero de turnos perdidos consecutivos
					if(mesa._listaJugadores[i]._noTurnosPerdidos >= 3) {
						expulsado = true;
						//Se emite redireccionamiento al usuario expulsado
						var auxNick = mesa._listaJugadores[i]._nick;
						//Se elimina el jugador de la lista de jugadores
						mesa._listaJugadores.splice(i,1);
						mesa._noJugadoresActivos -=1;
						sala.to(mesa._noMesa).emit('verificaJugadorExpulsar', auxNick);
						//Se actualiza la lista de jugadores activos en la vista
						sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
						//Si el juego esta iniciado y en la lista de jugadores activos solo queda uno entonces se establece un ganador por default
						if(mesa._startGame && ( mesa._noJugadoresActivos == 1)){
							//Se termina el juego 
							mesa._startGame = false;
							mesa._bloqueoPorReinicio = true;
							sala.to(mesa._noMesa).emit('ganadorDefault', {'ganador' : 'win', 'mesa' : mesa});
							return;
						}
					}
					
					//Si no hay turnos perdidos se pasa el turno
					// se actualizan los valores de la mesa
					mesa = util.pasarTurno(expulsado, i, mesa);
					
					var turnoAnterior = i;
					if(mesa._turnoEnMesa != 0){
						turnoAnterior = mesa._turnoEnMesa - 1;
					} 
					sala.to(mesa._noMesa).emit('pasarTurno', {'turnoAnterior' : turnoAnterior, 'turnoSiguiente' : mesa._turnoEnMesa});
					// Se inicia el cronometrometro para el turno siguiente
					cronometro(sala, mesa, mesa._listaJugadores[mesa._turnoEnMesa]._nick);
					break;
				}
			}//fin for
		}
	}, 1000);
}


//funcion de cronometro reinicio cuando el ganador no configura el juego
function cronometroReinicioJuego(io, sala, mesa, mesas, nick, listPatrocinadoresDefault){
	var tiempoInicial = 15;
	intervalos[mesa._noMesa] = setInterval(function() {
		if(tiempoInicial >= 0){
			sala.to(mesa._noMesa).emit('timer-decrement-reset', [tiempoInicial, nick]);
			tiempoInicial--;
		}else{
			clearInterval(intervalos[mesa._noMesa]);
			//En caso de que el usuario que gano no reinicie el juego en 15 segundos 
			//la mesa toma la misma configuracion de la partida anterior
			if(!mesa._startGame){
				//Se reinicializan los valores
				mesa._puntosAcumulados = 0;
				mesa._tablero = util.inicializarTablero(mesa._tablero);
				mesa._turnoEnMesa = 0;
				mesa._bloqueoPorReinicio = false;
				
				//Se emite un evento para reiniciar las capturas de todos los jugadores en session
				//Se reinician los turnos perdidos de todos los jugadores al reiniciar el juego
				sala.to(mesa._noMesa).emit('updateCapturaTurnos');
				
				//Si la mesa tiene algun jugador activo
				/*if(mesa._noJugadoresActivos > 0){
					mesa._ficha = mesa._listaJugadores[0]._patrocinador.nombre;
				}*/
				
				//Se obtienen nuevos patrocinadores de pago
				patrocinadorController.patrocinadores.getPatrocinadoresPago(function(r) {
					if(!r.err){
						mesa._listaPatrocinadores = util.obtenerPatrocinadores(listPatrocinadoresDefault, r.desc);
						//mesa._ficha = mesa._listaPatrocinadores[0]._nombre;
						
						//Se analiza si es la mesa 10
						if(mesa._noMesa == 'mesa-10'){
							//Se pasan todos los jugadores como observadores
							var auxJugadoresActivos = mesa._noJugadoresActivos;
							for(var i = 0; i < mesa._noJugadoresActivos; i++){
								delete mesa._listaJugadores[i]._patrocinadores;
								mesa._listaJugadores[i]._activo = false;
								auxJugadoresActivos--;
							}
							mesa._noJugadoresActivos = auxJugadoresActivos;
							listaAuxiliarPatrocinadores = mesa._listaPatrocinadores;
							sala.to(mesa._noMesa).emit('selectFicha', listaAuxiliarPatrocinadores);
						}
						else{
							//Se actualizan las fichas del usuario en su session
							sala.to(mesa._noMesa).emit('updateFichasUsers', mesa._noMesa);	
						}
						
						//Se actualiza el valor de las mesas (json) con el nuevo objeto
						mesas[mesa._noMesa] = mesa;
						//Se reinicia el juego y se emiten a todos los clientes las nuevas configuraciones
						sala.to(mesa._noMesa).emit('closeModalReset');
						sala.to(mesa._noMesa).emit('cargaConfiguracion', mesa);
						io.of('/lobby').emit('sendUsersMesas', mesas);
					}else{
						logger.error(nameModuleLogger + 'Metodo cronometroReinicioJuego Err: ' + r.desc);
					}
				});
			}
		}
	}, 1000);
}

module.exports =  function (io, mesas, listPatrocinadoresDefault, statusMesas) {
	
	//Evento conexion
	var sala = io.sockets.on('connection', function (socket) {
		
		/*mesa 10 */
		socket.on('connect10', function(){
			//Se obtiene el numero de mesa al que se estan conectando
			mesa = mesas['mesa-10'];
			//Se inicializa la session con el request
			var session = socket.request.session;
			//Se verifica si existe la session del jugador
			if(session.jugador){
				//Se verifica si la mesa contiene alguna configuracion
				if(mesa != null){
					//Si el jugador que ha ingresado a la vista tiene una room asignada se queda en la vista 
					if(session.jugador._room != undefined && session.jugador._room != null && session.jugador._room == mesa._noMesa){
						//Se analiza si el tablero en la vista ya ha sido creado
						if(mesa._tablero == null) {
							//Se crea el tablero de juego
							mesa._tablero = util.crearTablero(mesa._tablero, mesa._noCasillas);
							//Se inicializan los valores del tablero
							mesa._tablero = util.inicializarTablero(mesa._tablero);
						}
						
						//Se analiza si el juego no ha iniciado para asignar el jugador a la mesa y si no hay un bloqueo por reinicio
						if(!mesa._startGame && !mesa._bloqueoPorReinicio){
							//Se verifica que el numero de jugadores sea <= 6 y que el jugador que se conecta este como inactivo
							if(mesa._listaJugadores.length <= 6 && !session.jugador._activo){
								//Se analiza si existen jugadores activos sobre la mesa
								if(mesa._noJugadoresActivos == 0){
									//Si no hay jugadores activos el jugador que se conecta es el primero
									//Y se obtiene la lista de patrocinadores en una lista auxiliar para que
									//posteriormente los jugadores puedan seleccionar las fichas
									listaAuxiliarPatrocinadores = mesa._listaPatrocinadores;
								}
								//Se emite un evento para que el jugador seleccione la ficha de su interes
								socket.emit('selectFicha', listaAuxiliarPatrocinadores);
							}
						}
						
						//Se crea la socket id con la room del jugador
						socket.roomID = session.jugador._room;
						//Se une la socket del jugador a la mesa especificada
						socket.join(session.jugador._room);
						
						//Se emite de actualizacion sobre el jugador
						socket.emit('updateJugador', session.jugador);
						//Se emite a la sala en especifico la carga de su configuracion
						sala.to(mesa._noMesa).emit('cargaConfiguracion', mesa);
						//Se emite en un globito que un nuevo jugador se ha ingresado a la mesa
						sala.to(mesa._noMesa).emit('notificacion', { 'title' : session.jugador._nick , 'msg' : 'Se ha unido a la mesa', 'tipo' : 'notice'});
						
						//Se envian los usuarios activos al lobby
						mesas[mesa._noMesa] = mesa;
						io.of('/lobby').emit('sendUsersMesas', mesas);
					}else{
						//Si el jugador no tiene la room asignada se redirecciona al lobby
						socket.emit('redirect', '/lobby');
					}
				}else{
					//Como la mesa es null se redirecciona al lobby
					socket.emit('redirect', '/lobby');
				}
			}
			//Si el jugador no esta en session se redirecciona al index
			else{
				socket.emit('redirect', '/');
			}
		});


		socket.on('definePatrocinador', function(data, callback){
			//Se inicializa la variable con la session del socket request
			var session = socket.request.session;
			mesa = mesas['mesa-10'];
			//si el juego no ha iniciado y el no de jugadores activos es minimo o igual a 6 y el jugador que se conecto esta como inactivo
			if(!mesa._startGame && mesa._noJugadoresActivos < 6) {
				//Se busca el usuario en session en la coleccion de lista de jugadores
				for(var i in mesa._listaJugadores){
					if(mesa._listaJugadores[i]._nick == session.jugador._nick){
						session.jugador._activo = mesa._listaJugadores[i]._activo;
						session.save();
						socket.request.session = session;
						break;
					}
				}
				
				//Si el jugador esta como inactivo
				if(session.jugador._activo == false){
					//Variable que indicara si la ficha ya ha sido asignada anteriormente
					var asignada = false;

					//Se analiza si la ficha seleccionada no ha sido asignada o eliminada del array
					if(listaAuxiliarPatrocinadores[data] != undefined){
						//Como la ficha no ha sido eliminada se analiza si ya ha sido asignada
						var idFichaSeleccionada = listaAuxiliarPatrocinadores[data]._id;
						//Se itera sobre los jugadores buscando que la ficha ya haya sido asignada a uno
						for(var i = 0; i < mesa._listaJugadores.length; i++){
							//Si el patrocinador ya ha sido asignado antes y el jugador que clickeo es diferente del q se le asigno
							if(mesa._listaJugadores[i]._patrocinador != null 
									&& mesa._listaJugadores[i]._patrocinador.id == idFichaSeleccionada 
									&& mesa._listaJugadores[i]._nick != session.jugador._nick){
								asignada = true;
								//Se emite que la ficha ya ha sido asignada
								socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'Te ganaron la ficha, selecciona otra por favor', 'tipo' : 'warning'});
								break;
							}
						}
					}else{
						logger.info('Mesa 10 la ficha: ' +  data  +' fue seleccionada 2 o más veces');
						console.info('Data: ' + data);						
						console.info('Jugador: ' + session.jugador._nick);
						console.log('Patrocinadores auxiliares');
						console.log(listaAuxiliarPatrocinadores);
						logger.info('Fin Mesa 10');

						//si la ficha seleccionada arroja un udefined quiere decir que ha sido eliminada del array por que 
						//ya ha sido asignada
						//Se emite que la ficha ya ha sido asignada
						socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'Te ganaron la ficha, selecciona otra por favor', 'tipo' : 'warning'});
						//Se coloca en true la bandera para indicar que la ficha ha sido eliminada del array y ya fue asignada
						asignada = true;
					}
					
					
					if(!asignada){
						//Se le asigna la ficha al jugador en la session y en la lista de jugadores
						session.jugador._activo = true;
						session.jugador._patrocinador = {
									id: listaAuxiliarPatrocinadores[data]._id, 
									nombre : listaAuxiliarPatrocinadores[data]._nombre, 
									ficha: listaAuxiliarPatrocinadores[data]._ficha,
									isDefault : listaAuxiliarPatrocinadores[data]._isDefault
								};
						session.save();
						socket.request.session = session;
						
						//Se actualiza el jugador en el array de jugadores de la mesa
						for(var i in mesa._listaJugadores) {
							if(mesa._listaJugadores[i]._nick == session.jugador._nick){
								// Se actualizan los valores del jugador en la mesa
								mesa._listaJugadores[i] = session.jugador;
								//Se incrementa el numero de jugadores activos
								mesa._noJugadoresActivos++;
								
								//Se define la ficha inicial que tira en la mesa
								if(mesa._listaJugadores[0]._patrocinador  == null && i != 0){
									var auxJugador = mesa._listaJugadores[0];
									mesa._listaJugadores[0] = mesa._listaJugadores[i];
									mesa._listaJugadores[i] = auxJugador;
								}
								
								//mesa._ficha = mesa._listaJugadores[0]._patrocinador.nombre;
								
								//Se elimina la ficha seleccionada por el jugador de la lista auxiliar
								listaAuxiliarPatrocinadores.splice(data, 1);
								//Se emite de actualizacion sobre el jugador
								socket.emit('updateJugador', session.jugador);
								
								//Se actualizan las fichas en las vistas de los demas jugadores
								sala.to(mesa._noMesa).emit('updateListFichas', listaAuxiliarPatrocinadores);
								
								//Se actualiza la lista de jugadores activos en la vista
								sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
								
								//Se verifica si el numero de jugadores activos es mayor a 1 para habilitar el boton de iniciar juego
								if(mesa._noJugadoresActivos > 1){
									//Se emite el desbloqueo del boton de iniciar juego
									sala.to(mesa._noMesa).emit('bloqueaIniciarJuego', mesa._noJugadoresActivos, mesa._startGame, mesa._bloqueoPorReinicio);
								}
								//Se envian los usuarios activos al lobby
								mesas[mesa._noMesa] = mesa;
								io.of('/lobby').emit('sendUsersMesas', mesas);
								break;
							}
						}
					}
					//Se envia si fue asignada o no la ficha
					callback(asignada);
				}//fin if
				else{
					//En caso de que se encuentre al jugador como activo 
					socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'Te encuentras activo sobre la mesa', 'tipo' : 'warning'});
					socket.emit('closeModalFicha')
				}
			}else if(mesa._startGame && mesa._listaJugadores.length <= 6){
				//En caso de que el juego ya hay iniciado y los jugadores sean menores a 6 y el jugador este como inactivo
				//se le notifica que el juego ha empezado sin el
				socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'Empezaron la partida sin ti, espera a la siguiente ronda', 'tipo' : 'warning'});
				socket.emit('closeModalFicha')
			}
		});
		
		/*fin mesa 10*/
		
		socket.on('conectado', function(noMesa){
			//Se obtiene el numero de mesa al que se estan conectando
			//mesa = mesas[noMesa];
			//Se inicializa la session con el request
			var session = socket.request.session;
			//Se verifica si existe la session del jugador
			if(session.jugador){
				//Se verifica si la mesa contiene alguna configuracion
				if(mesas[noMesa] != null){

					//console.log('-------La mesa esta configurada  para : ' + session.jugador._nick + ' ---------');

					//Si el jugador que ha ingresado a la vista tiene una room asignada se queda en la vista 
					//siempore y cuando su room sea la misma que el numero de mesa
					if(session.jugador._room != undefined && session.jugador._room != null && session.jugador._room == mesas[noMesa]._noMesa){
						
						//Se analiza si el tablero en la vista ya ha sido creado
						if(mesas[noMesa]._tablero == null) {
							//Se crea el tablero de juego
							mesas[noMesa]._tablero = util.crearTablero(mesas[noMesa]._tablero, mesas[noMesa]._noCasillas);
							//Se inicializan los valores del tablero
							mesas[noMesa]._tablero = util.inicializarTablero(mesas[noMesa]._tablero);
						}
						
						//Se analiza si el juego no ha iniciado para asignar el jugador a la mesa
						if(!mesas[noMesa]._startGame){
							//console.log('-------El juego no ha iniciado para : ' + session.jugador._nick + ' ---------');
							//console.log('-------Antes de if No. Jugadores de la mesa: '+mesas[noMesa]._listaJugadores.length+' No.Activos : '+mesas[noMesa]._noJugadoresActivos+' El jugador: '+session.jugador._nick +' esta como : ' + session.jugador._activo +'---------');

							//Se verifica que el numero de jugadores sea <= 6 y que el jugador que se conecta este como inactivo
							//if(mesas[noMesa]._listaJugadores.length <= 6 && !session.jugador._activo){
							if(mesas[noMesa]._noJugadoresActivos < 6 && !session.jugador._activo){
								//console.log('--------- El jugador: ' + session.jugador._nick + ' entro al if noJugadoresActivos: ' + mesas[noMesa]._noJugadoresActivos);

								//Se invoca a la funcion que le asigna una ficha aleatoria al jugador de la session y al de la mesa
								var result = util.asignarFicha(session.jugador, mesas[noMesa]._listaJugadores, mesas[noMesa]._listaPatrocinadores, mesas[noMesa]._noJugadoresActivos);
								// se obtiene los nuevos valores para la sesion
								session.jugador = result[0];
								session.save();
								socket.request.session = session;
								//Se actualizan los valores del jugador en la mesa
								mesas[noMesa]._listaJugadores = result[1];
								//Se incrementa el numero de jugadores que estaran activos sobre la mesa
								mesas[noMesa]._noJugadoresActivos++;
								//console.log('-------Se asigno la ficha: '+session.jugador._patrocinador.nombre+' a: ' + session.jugador._nick + ' Jugadores Activos: ' + mesas[noMesa]._noJugadoresActivos +' ---------');
							}
						}
						
						//Se crea la socket id con la room del jugador
						socket.roomID = session.jugador._room;
						//Se une la socket del jugador a la mesa especificada
						socket.join(session.jugador._room);
						//Se emite de actualizacion sobre el jugador
						socket.emit('updateJugador', session.jugador);
						//Se emite a la sala en especifico la carga de su configuracion
						sala.to(mesas[noMesa]._noMesa).emit('cargaConfiguracion', mesas[noMesa]);
						//Se emite en un globito que un nuevo jugador se ha ingresado a la mesa
						sala.to(mesas[noMesa]._noMesa).emit('notificacion', { 'title' : session.jugador._nick , 'msg' : 'Se ha unido a la mesa', 'tipo' : 'notice'});
						
						//Se envian los usuarios activos al lobby
						//mesas[mesas[noMesa]_noMesa] = mesa;
						/*if(!mesas[noMesa]._startGame && mesas[noMesa]._listaJugadores.length <= 6 && !session.jugador._activo){
							console.log('-------Despues de Save ficha : '+session.jugador._patrocinador.nombre+' a: ' + session.jugador._nick + ' Jugadores Activos: ' + mesas[noMesa]._noJugadoresActivos +' ---------');
						}else{
							console.log('Jugador : '+session.jugador._nick +' encontro Jugadores Activos: ' + mesas[noMesa]._noJugadoresActivos);
						}*/

						io.of('/lobby').emit('sendUsersMesas', mesas);

					}else{
						//Si el jugador no tiene la room asignada se redirecciona al lobby
						socket.emit('redirect', '/lobby');
					}
				}else{
					//Como la mesa es null se redirecciona al lobby
					socket.emit('redirect', '/lobby');
				}
			}
			//Si el jugador no esta en session se redirecciona al index
			else{
				socket.emit('redirect', '/');
			}
		});//fin evento connect-to
		
		
		socket.on('iniciarJuego', function(data) {
			//Se obtiene el objeto mesa de acuerdo a la mesa que se ha conectado el cliente
			mesa = mesas[data];
			//Se inicializa la variable con la session del socket request
			var session = socket.request.session;
			//Se verifica que el usuario que presiono el boton este en session
			if(session.jugador){
				//Si el usuario esta en session se analiza si esta activo sobre la mesa
				if(!session.jugador._activo){
					//En caso de que no este activo se le notifica un mensaje
					socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'No tienes permitido realizar esta acción', 'tipo' : 'warning'});
				}else{
					//Si el usuario esta activo se validan cuestiones de la mesa
					//Si el juego no ha iniciado, Si hay mas de un jugador en la mesa, y que no exista un bloqueo por reinicio
					if(!mesa._startGame && mesa._noJugadoresActivos >= 2 && !mesa._bloqueoPorReinicio){
						/*Mesa 10
						 * Se analiza si la mesa es la 10
						 * */
						if(mesa._noMesa == "mesa-10"){
							//Se verifica si el numero de jugadores activos es menor a 6 
							//y que el total de jugadores sea mayor a los activos
							if(mesa._noJugadoresActivos < 6 && mesa._listaJugadores.length > mesa._noJugadoresActivos){
								//Si se cumple el if quiere decir que hay jugadores como observadores que no han seleccionado su ficha
								//por lo tanto se les debe asignar una ficha por default
								sala.to(mesa._noMesa).emit('closeModalFicha');//Se cierra el modal para seleccionar ficha
								//Se itera sobre la lista de jugadores en la mesa
								for(var item in mesa._listaJugadores){
									//Se verifica si los jugadores activos son menos de 6
									if(mesa._noJugadoresActivos < 6){
										//Se analiza si el jugador esta como inactivo
										if(!mesa._listaJugadores[item]._activo){
											//Se cambia a activo
											mesa._listaJugadores[item]._activo = true;
											//Se le asigna un patrocinador por default de la lista aux
											mesa._listaJugadores[item]._patrocinador = 
													{
														id: listaAuxiliarPatrocinadores[0]._id, 
														nombre : listaAuxiliarPatrocinadores[0]._nombre, 
														ficha: listaAuxiliarPatrocinadores[0]._ficha,
														isDefault : listaAuxiliarPatrocinadores[0]._isDefault
													};
											//Una vez asignado el patrocinador se elimna de la lista aux
											listaAuxiliarPatrocinadores.splice(0, 1);
											//Se incrementa el numero de jugadores activos sobre la mesa
											mesa._noJugadoresActivos++;
											sala.to(mesa._noMesa).emit('checkUpdateJugadorSess', mesa._listaJugadores[item]);
										}//end if										
									}//end if
									else{
										//En caso de q esten 6 jugadores activos se quiebra el for
										break;
									}
								}//end for
								
								//Una vez lista la mesa con sus jugadores activos se actualiza la vista de los jugadores
								//Se actualiza la lista de jugadores activos en la vista
								sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
							}
						}
						/*end mesa 10*/
						
						mesa._ficha = mesa._listaJugadores[0]._patrocinador.nombre;//Se establece la ficha para el tiro incial
						mesa._startGame = true;
						mesas[data] = mesa;
						sala.to(mesa._noMesa).emit('run-time', mesa);
						sala.to(mesa._noMesa).emit('notificacionStartGame', 'Atento inicia el juego con la Epoca: ' + mesa._epoca);
						//Se registran o actualizan las epocas de la mesa en la bd
						util.registerUpdateMesa(mesa);
						//Se actualizan las vistas de los patrocinadores en la bd de acuerdo al numero de jugadores activos
						for(var i=0; i < mesa._noJugadoresActivos; i++){
							patrocinadorController.patrocinadores.decrementaVistasPatrocinador(mesa._listaJugadores[i]._patrocinador);
						}
					}
					else{
						if(!mesa._startGame && mesa._bloqueoPorReinicio){
							socket.emit('notificacion', { 'title' : 'Espere por favor' , 'msg' : 'El juego aun no ha sido reiniciado', 'tipo' : 'warning'});
						}else if(!mesa._startGame && !mesa._bloqueoPorReinicio && mesa._noJugadoresActivos <= 1){
							socket.emit('notificacion', {'title' : '¡Oops!' , 'msg' : 'Esperando más jugadores', 'tipo' : 'warning'});
						}else if(mesa._startGame){
							socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'El juego ya ha iniciado', 'tipo' : 'danger'});
						}
					}
				}
			}else{
				//Si no esta en session se redirecciona al lobby
				socket.emit('redirect', '/');
			}
		});//fin evento iniciar juego
		
		//El servidor recibe el evento de correr el tiempo
		socket.on('execute-timer', function(data){
			mesa = mesas[data[0]];
			//Se ejecuta la funcion para el cronometrometro
			/* param sala
			 * param objeto mesa
			 * data nick del jugador
			 * */
			cronometro(sala, mesa, data[1]);
		});//fin evento execute-timer
		
		
		socket.on('expulsaJugador', function(){
			//Se inicializa la variable con la session del socket request
			var session = socket.request.session;
			//Se invoca a la funcion que reinicia los valores de la session del jugador
			session.jugador = util.resetSessionJugador(session.jugador);
			//Como se realizaron cambios en el objeto de la session es necesario guardarlos
			session.save();
			socket.request.session = session;
			//console.log('Session de usuario ' + session.jugador._nick + ' reseteada: ', session.jugador);			
			socket.emit('redirect', '/lobby');			
		});//fin evento expulsa jugador
		
		socket.on('winDefaultGame', function(data) {
			//Se inicializa la variable con la session del socket request
			mesa = data.mesa;
			session = socket.request.session;
			session.jugador._creditos += mesa._puntosAcumulados;
			session.save();
			socket.request.session = session;
			
			//Se actualizan los puntos del usuario en la bd
			util.updatePuntosUsuario(session.jugador);
			//Se agrega la propiedad jugador al json con los valores de la session
			data.jugador = session.jugador;
			//Se actualizan los puntos del jugador en la mesa
			for(var i = 0; i < mesa._listaJugadores.length; i++) {
				if(mesa._listaJugadores[i]._nick == session.jugador._nick) {
					mesa._listaJugadores[i]._creditos =  session.jugador._creditos;
					break;
				}
			}
			
			//Funcion que re asigna los espacios de los jugadores activos y observadores dependiendo de el numero de espacios disponibles o jugadores activos sobre la mesa
			mesa = util.addRemovePlayers(sala, mesa);
			sala.to(mesa._noMesa).emit('mostrarGanadorDefault', data);
			//Se actualizan los datos de los jugadores en la mesa
			mesas[mesa._noMesa] = mesa;
			//Se actualiza la lista de jugadores activos en la vista
			sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
			io.of('/lobby').emit('sendUsersMesas', mesas);
			cronometroReinicioJuego(io, sala, mesa, mesas, session.jugador._nick, listPatrocinadoresDefault);
		});//fin de evento winDefaultGame
		
		//Actualiza las capturas del jugador en session
		socket.on('upCaptureTurnoSess', function(){
			//Se inicializa la variable session y se obtiene el request
			var session = socket.request.session;
			
			//console.log('Actualizando capturas y turnos perdidos --> antes');
			//console.log(session.jugador);
			
			//Si existe la session y el jugador esta activo sus capturas se reinician
			if(session.jugador && (session.jugador._activo ||  session.jugador._noTurnosPerdidos > 0 || session.jugador._noCapturas > 0 )){
				session.jugador._noCapturas = 0;
				session.jugador._noTurnosPerdidos = 0;
				session.save();
				socket.request.session = session;
				socket.emit('updateNoCapturas', session.jugador._noCapturas);
			}
			
			//console.log('Despues de actualizar turno y capturas');
			//console.log(session.jugador);
		});//fin evento upCaptureSess
		
		
		socket.on('updateFichaUser', function(data){
			// Se inicializa la variable session y se obtiene el request
			var session = socket.request.session;
			if(session.jugador._activo){
				mesa = mesas[data];
				for(var i = 0; i < mesa._noJugadoresActivos; i++){
					if(mesa._listaJugadores[i]._nick == session.jugador._nick){
						var patrocinador = mesa._listaPatrocinadores[i];
						session.jugador._patrocinador = {id: patrocinador._id, nombre : patrocinador._nombre, ficha: patrocinador._ficha};
						session.save();
						socket.request.session = session;
						
						mesa._listaJugadores[i]._patrocinador = session.jugador._patrocinador;
						//Se emite de actualizacion sobre el jugador
						socket.emit('updateJugador', session.jugador);
						//Se actualiza la lista de jugadores activos en la vista
						sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
						//Se guardan los valores en la coleccionde mesas
						mesas[data] = mesa;
						break;
					}
				}
			}
		});//fin updateFichaUser
		
		
		// Evento cuando se ha realizado un movimiento
		socket.on('process_move', function(data) {
			mesa = mesas[data[0]];
			//Coordenada en el tablero
			var idCasillaSeleccionada = data[1];
			// se verifica que el juego ha iniciado
			if(mesa != null && mesa._startGame) {
				//Se inicializa la variable con la session del socket request
				var session = socket.request.session;
				if(session.jugador._patrocinador != null) {
					//Se verfica el turno del usuario es su ficha coincide con la mesa y si este esta activo  
					if(mesa._ficha == session.jugador._patrocinador.nombre && session.jugador._activo) {
						//Si es el usuario correcto se verifica si tiene creditos
						if(session.jugador._creditos != 0) {
							//Se recuperan las coordenas seleccionadas con respecto al tablero 
							var coordenas = idCasillaSeleccionada.split('-');
							var x = coordenas[0]; // se obtiene la coordena en x
							var y = coordenas[1]; // se obtiene la coordena en y
							
							//Se verifica que la posicion seleccionada este vacia y no contenga ficha alguna
							if(mesa._tablero[x][y] == '') {
								
								//Una vez valido el usuario y su turno se detiene su intervalo o cronometrometro
								clearInterval(intervalos[mesa._noMesa]);
								
								// Se agrega la ficha del jugador al tablero en las coordenas seleccionadas
								mesa._tablero[x][y] = session.jugador._patrocinador.ficha;
								//Se definen las coordenas y el id de la casillas seleccionada para pintarla en los clientes
								sala.to(mesa._noMesa).emit('pintaFicha', mesa._tablero[x][y], idCasillaSeleccionada);
								
								//Se incrementan los puntos sobre la mesa
								mesa._puntosAcumulados+=1;
								
								//Se decrementan los puntos del jugador en la session
								session.jugador._creditos-=1;
								//Se resetea el numero de turno perdidos
								session.jugador._noTurnosPerdidos = 0;
								session.save();
								socket.request.session = session;
								
								//Se actualizan los puntos del jugador en la bd
								util.updatePuntosUsuario(session.jugador);
								
								//Se verifica si el jugador ha ganado
								var isGanador = util.ganador(mesa, mesa._tablero[x][y]);
								var isGanadorPorCapturas = false;
								
								//Se analiza la epoca de la mesa si es diferente de la epoca feudal
								if(mesa._epoca != 'Feudalismo') {
									
									//Se obtienen los resultados del analisis de una posible captura
									var resultTipoCaptura = util.analizaCapturaEpoca(mesa._tablero, x, y, session.jugador._patrocinador.ficha, mesa._epoca);
									//Se actualizan las capturas del jugador
									session.jugador._noCapturas += resultTipoCaptura[0];
									session.save();
									socket.request.session = session;
									
									//Se verifica que si el jugador ha capturado mas o = a 5 veces se define ganador
									if(session.jugador._noCapturas >= 5) {
										// se define que ha ganado por la opcion de captura
										isGanadorPorCapturas = true;
									} 
									
									//Si existe alguna captura se actualiza el tablero con respecto con respecto a las posiciones obtenidas
									//Y se actualiza la vista del tablero en el cliente
									if(resultTipoCaptura[0] > 0) {
										for(var r = 0; r < resultTipoCaptura[1].length; r++) {
											var x = resultTipoCaptura[1][r].fichas_eliminar.f1_x;
											var y = resultTipoCaptura[1][r].fichas_eliminar.f1_y;
											mesa._tablero[x][y] = '';
											
											x = resultTipoCaptura[1][r].fichas_eliminar.f2_x;
											y = resultTipoCaptura[1][r].fichas_eliminar.f2_y;
											mesa._tablero[x][y] = '';
											
											//Se actualizan los puntos del usuario que capturo
											session.jugador._creditos += 2;
											session.save();
											socket.request.session = session;
											
											//Se actualizan los puntos del usuario en la bd
											util.updatePuntosUsuario(session.jugador);
											//Como el jugador capturo fichas se restan los puntos sobre la mesa
											mesa._puntosAcumulados -=2;
											socket.emit('updateNoCapturas', session.jugador._noCapturas);
										}
										//Se emite el nuevo tablero con las capturas al cliente
										sala.to(mesa._noMesa).emit('capturaFichas', mesa._tablero);
									}//fin if
								}//fin if
								
								//Se verifica si el jugador ha ganado ya sea en linea o por capturas
								if(isGanador == 'ganador' || isGanadorPorCapturas){
									session.jugador._creditos += mesa._puntosAcumulados;
									session.jugador._noCapturas = 0;
									session.save();
									socket.request.session = session;
									
									//Se actualizan los puntos del usuario en la bd
									util.updatePuntosUsuario(session.jugador);
									mesa._startGame = false;
								}
								
								//Se actualiza el jugador en la lista de jugadores de la mesa con sus nuevos valores
								var ultimoJugadorTiro = 0;
								for(var i = 0; i < mesa._noJugadoresActivos; i++){
									if(mesa._listaJugadores[i]._nick == session.jugador._nick){
										mesa._listaJugadores[i] = session.jugador;
										ultimoJugadorTiro = i;
										break;
									}
								}
								
								//Se actualizan los datos de la mesa en la coleccion
								mesas[mesa._noMesa] = mesa;
								socket.emit('updateJugador', session.jugador);
								sala.to(mesa._noMesa).emit('updatePuntosMesa', mesa._puntosAcumulados);
								//Se envian los usuarios activos al lobby
								io.of('/lobby').emit('sendUsersMesas', mesas);
								
								//Se evalua si el juego ya termino
								if(!mesa._startGame) {
									//Se analiza si la mesa tiene mas de dos jugadores activos
									if(mesa._noJugadoresActivos >= 2){
										for(var j = 0; j < mesa._noJugadoresActivos; j++){
											//Se busca el jugador que gano
											if(mesa._listaJugadores[j]._nick == session.jugador._nick){
												//Si el jugador que gano tiene un posicion diferente a la inicial este se intercambia
												if(j != 0){
													//Se obtiene el jugador que se encuentra en la posicion inicial
													var auxJugador = mesa._listaJugadores[0];
													//Se actualiza el jugador que gano en la posicion inicial
													mesa._listaJugadores[0] = mesa._listaJugadores[j];
													//Se actualiza el jugador que perdio en la posicion en la que se encontraba el jugador ganador
													mesa._listaJugadores[j] = auxJugador;
													//Se actualiza la lista de jugadores en la coleccion de mesas 
													mesas[mesa._noMesa]._listaJugadores = mesa._listaJugadores;
													//Se envian los intercambios al lobby
													io.of('/lobby').emit('sendUsersMesas', mesas);
													//Se actualiza la lista de jugadores activos en la vista
													sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
													break;
												}
											}
										}//fin for
									}
									mesa._bloqueoPorReinicio = true;
									
									//Funcion que re asigna los espacios de los jugadores activos y observadores dependiendo de el numero de espacios disponibles o jugadores activos sobre la mesa
									mesa = util.addRemovePlayers(sala, mesa);
									var data = {'ganador' : 'win', 'mesa' : mesa, 'jugador' : session.jugador};
									sala.to(mesa._noMesa).emit('ganador', data);
									mesas[mesa._noMesa] = mesa;
									//Se envian los intercambios al lobby
									io.of('/lobby').emit('sendUsersMesas', mesas);
									//Se actualiza la lista de jugadores activos en la vista
									sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
									cronometroReinicioJuego(io, sala, mesa, mesas, session.jugador._nick, listPatrocinadoresDefault);
									return;
								}
								
								//En caso de que no haya ganador se pasa el turno y se inicia el nuevo cronometrometro para el nuevo turno
								mesa = util.pasarTurno(false, ultimoJugadorTiro, mesa);
								//Se actualizan los datos de la mesa en la coleccion
								mesas[mesa._noMesa] = mesa;
								
								if(mesa._turnoEnMesa != 0) {
									ultimoJugadorTiro = mesa._turnoEnMesa - 1;
								} 
								
								
								//Se emite el turno siguiente y se inicia el cronometrometro
								sala.to(mesa._noMesa).emit('pasarTurno', {'turnoAnterior' : ultimoJugadorTiro, 'turnoSiguiente' : mesa._turnoEnMesa});
								cronometro(sala, mesa, mesa._listaJugadores[mesa._turnoEnMesa]._nick);
								
							} else {
								//En caso de que la casilla ya contenga una ficha
								socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'Tiro no valido', 'tipo' : 'danger'});
							}
						}else{
							socket.emit('notificacion', {'title' : '¡Oops! lo sentimos', 'msg' : 'No tienes creditos disponibles', 'tipo' : 'warning'});
						}
					}//fin evaluacion turno del jugador
					else{
						socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'Por favor espera tu turno', 'tipo' : 'danger'});
					}
				} else {
					socket.emit('notificacion', {'title' : '¡Oops! lo sentimos', 'msg' : 'El juego no ha terminado', 'tipo' : 'info'});
				}
			}//fin if evaluacion de juego iniciado
			else{
				socket.emit('notificacion', {'title' : '¡Oops!, espere por favor', 'msg' : 'El juego no ha iniciado', 'tipo' : 'danger'});
			}
		});//fin evento process_move
		
		
	// Petición para reiniciar el juego
socket.on('reiniciarJuego', function(data) {
    const mesa = mesas[data.mesa];

    // Validar que la mesa existe y no esté iniciada
    if (!mesa || mesa._startGame) {
        return socket.emit('notificacion', {
            title: '¡Oops!',
            msg: 'La mesa está activa y no puede ser reiniciada',
            tipo: 'warning'
        });
    }

    const session = socket.request.session;

    // Validar que el usuario tenga sesión
    if (!session.jugador) {
        return socket.emit('redirect', '/');
    }

    // Solo el creador de la mesa puede reiniciar
    const creador = mesa._listaJugadores[0];
    if (creador._nick !== session.jugador._nick) {
        return socket.emit('notificacion', {
            title: '¡Oops!',
            msg: 'No tienes permitido realizar esta acción',
            tipo: 'danger'
        });
    }

    // Reinicio de variables base
    clearInterval(intervalos[mesa._noMesa]);
    Object.assign(mesa, {
        _epoca: data.epoca,
        _puntosAcumulados: 0,
        _tiempoTirada: data.tiempoTirada,
        _tablero: util.inicializarTablero(mesa._tablero),
        _turnoEnMesa: 0,
        _bloqueoPorReinicio: false
    });

    // Actualiza capturas y turnos
    sala.to(mesa._noMesa).emit('updateCapturaTurnos');

    // Obtener nuevos patrocinadores
    patrocinadorController.patrocinadores.getPatrocinadoresPago(function(r) {
        if (r.err) {
            return logger.error(`${nameModuleLogger}socket:reiniciarJuego Err: ${r.desc}`);
        }

        // Fallback: si r.desc está vacío, usar patrocinadores por defecto
        mesa._listaPatrocinadores = util.obtenerPatrocinadores(
            listPatrocinadoresDefault,
            r.desc.length ? r.desc : listPatrocinadoresDefault
        );

        // Asignar ficha principal si existe
        mesa._ficha = mesa._listaPatrocinadores.length > 0 ? mesa._listaPatrocinadores[0]._nombre : null;

        // Lógica especial para mesa-10
        if (mesa._noMesa === 'mesa-10') {
            mesa._listaJugadores.forEach(j => {
                delete j._patrocinadores;
                j._activo = false;
            });
            mesa._noJugadoresActivos = 0;

            // Emitir evento para seleccionar fichas
            sala.to(mesa._noMesa).emit('selectFicha', mesa._listaPatrocinadores);
        } else {
            sala.to(mesa._noMesa).emit('updateFichasUsers', mesa._noMesa);
        }

        // Actualizar objeto mesa y emitir eventos a todos los clientes
        mesas[mesa._noMesa] = mesa;
        sala.to(mesa._noMesa).emit('closeModalReset');
        sala.to(mesa._noMesa).emit('cargaConfiguracion', mesa);
        io.of('/lobby').emit('sendUsersMesas', mesas);
    });
});
 
 
		socket.on('updateSessJugador', function(data){
			// Se inicializa la variable session y se obtiene el request
			var session = socket.request.session;
			//Se actualiza la session del jugador
			session.jugador = data;
			//Se guardan cambios sobre la session
			session.save();
			socket.request.session = session;
			
		});//fin updateSessJugador
		
		/*CHAT*/
		socket.on('sendMessage', function(data){
			if(!data[0]._patrocinador){
				data[0]._patrocinador = null;
			}
			if(!validator.isLength(data[1], 1, 100)){
				socket.emit('notificacion', {'title' : '¡Oops!, verifica tu mensaje', 'msg' : 'Tu mensaje de contener de 1 a 100 caracteres', 'tipo' : 'danger'});
			}else{
				var j = {nick : data[0]._nick, patrocinador : data[0]._patrocinador};
				sala.to(data[2]).emit('newMessage', [j, validator.escape(data[1])]);
			}
		});
		/*FIN CHAT*/
		
		
		socket.on("disconnect", function() {
		    // Let the users know something bad happened or log the disconnect
			var roomID = socket.roomID;
			//Se inicializa la variable session y se obtiene el request
			var session = socket.request.session;
			if(roomID != undefined){
				//Se obtiene la mesa de la cual se esta abandonando
				mesa = mesas[roomID];
				//Se verifica que la mesa sea diferente de null o undefined
				if(mesa != undefined || mesa != null){
					//Se itera sobre la lista de jugadores de la mesa
					for(var i in mesa._listaJugadores){
						//Se identifica el usuario de la session en la lista de jugadores
						if(mesa._listaJugadores[i]._nick == session.jugador._nick){
							var nickTurnoActual = null;
							var turnoAnterior = 0;
							//Se verifica Si el juego esta iniciado
							if(mesa._startGame){
								//Se obtiene el turno actual sobre la mesa
								nickTurnoActual = mesa._listaJugadores[mesa._turnoEnMesa]._nick;
							}
							//Se elimina el usuario de la lista de jugadores de la mesa
							mesa._listaJugadores.splice(i, 1);

							var pasarTurno = false;
							
							//Se verifica si el usuario esta activo en la mesa
							if(session.jugador._activo){
								//Si esta activo se reduce el numero de jugadores activos sobre la mesa
								mesa._noJugadoresActivos -= 1;
								
								//Se si el juego esta iniciado y si el turno actual en la mesa le pertenece al jugador que sale 
								if(nickTurnoActual == session.jugador._nick && mesa._startGame){
									//Se detiene el intervalo de tiempo
									clearInterval(intervalos[mesa._noMesa]);
									//Se calcula el turno siguiente del jugador solo en caso de que sean mas de un jugador
									if(mesa._noJugadoresActivos > 1) {
										turnoAnterior = i;
										//Se calcula el siguiente turno en mesa
										mesa = util.pasarTurno(true, turnoAnterior, mesa);
										if(mesa._turnoEnMesa != 0){
											turnoAnterior = mesa._turnoEnMesa - 1;
										} 
										//Se establece la bandera en true para pasar el turno despues de actualizar la lista de usuarios
										pasarTurno = true;
										// Se inicia el cronometrometro para el turno siguiente
										cronometro(sala, mesa, mesa._listaJugadores[mesa._turnoEnMesa]._nick);
									}
								}
								
								/*Mesa 10*/
								//Como el jugador esta activo pero el juego no ha iniciado y la mesa es 10
								if(!mesa._startGame && session.jugador._room == 'mesa-10'){
									var patrocinio = new Patrocinador(); // se crea un objeto de la clase patrocinador
									patrocinio.setId(session.jugador._patrocinador.id)
									patrocinio.setNombre(session.jugador._patrocinador.nombre); // se pasa el valor del nombre
									patrocinio.setFicha(session.jugador._patrocinador.ficha); // se pasa el valor de la ficha
									patrocinio.setIsDefault(session.jugador._patrocinador.isDefault);
									//Se actualizan las fichas auxiliares y se les envian a los usuarios
									listaAuxiliarPatrocinadores.push(patrocinio);
									//Se actualizan las fichas en las vistas de los demas jugadores
									sala.to(mesa._noMesa).emit('updateListFichas', listaAuxiliarPatrocinadores);
								}
								/*end Mesa 10*/
							}
							
							//Se evalua si despues de salir mi numero de jugadores activos es 1 y el juego esta iniciado
							if(mesa._noJugadoresActivos == 1){
								if(mesa._startGame){
									//Se detiene el intervalo de tiempo
									clearInterval(intervalos[mesa._noMesa]);
									//Se detiene el juego
									mesa._startGame = false;
									//Se define un ganador por default
									mesa._bloqueoPorReinicio = true;
									sala.to(mesa._noMesa).emit('ganadorDefault', {'ganador' : 'win', 'mesa' : mesa});							
								}else{
									//Bloquea el boton para iniciar el juego
									sala.to(mesa._noMesa).emit('bloqueaIniciarJuego', mesa._noJugadoresActivos, mesa._startGame, mesa._bloqueoPorReinicio);
								}
							}
							//Se verifica si en la mesa hay jugadores u observadores
							if(mesa._listaJugadores.length == 0){
								//Se detiene el intervalo de tiempo
								var noMesa = mesa._noMesa;
								clearInterval(intervalos[mesa._noMesa]);
								mesa = null;
								//Como la mesa es null su status se reestablece a false
								statusMesas[noMesa] = false;
							}else{
								//Se actualiza la lista de jugadores activos en la vista
								sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
								//Se verifica si la bandera de pasar turno es verdadera
								if(pasarTurno){
									//Si la evaluacion se cumple se envia el paso de turno que simboliza el cambio de color al salir un usuario de la mesa
									sala.to(mesa._noMesa).emit('pasarTurno', {'turnoAnterior' : turnoAnterior, 'turnoSiguiente' : mesa._turnoEnMesa});
								}
							}
							//Se resetean los valores del usuario en la session
							session.jugador = util.resetSessionJugador(session.jugador);
							session.save();
							socket.request.session = session;
							
							// Se actualiza los valores de la mesa en la coleccion
							mesas[roomID] = mesa;
							//Se emiten los nuevos datos a el lobby
							io.of('/lobby').emit('sendUsersMesas', mesas); // Se envia los nuevos valores de la mesa al lobby
							socket.emit('redirect', '/lobby');
							break;
						}
					}//fin for
				}//fin if
			}
		});//fin evento disconect
		
	});//fin conecction
}