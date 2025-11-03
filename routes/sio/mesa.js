var util = require("../../util/util"); 
var patrocinadorController = require("../../controllers/Patrocinador"); // instancia de la clase patrocinador
//Variable que tomara el objeto el mesa
var mesa = null, tamanioListaJugadores = 0;

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
var listaAuxiliarPatrocinadores = new Array();

function cronometroReinicioJuego(io, sala, mesa, mesas, nick, listPatrocinadoresDefault){
    console.log("🎯 [CRONÓMETRO] INICIADO para mesa:", mesa._noMesa);
    
    var tiempoInicial = 30;
    intervalos[mesa._noMesa] = setInterval(async function() {
        console.log("⏰ [CRONÓMETRO] Tiempo restante:", tiempoInicial, "segundos");
        
        if(tiempoInicial >= 0){
            sala.to(mesa._noMesa).emit('timer-decrement-reset', [tiempoInicial, nick]);
            tiempoInicial--;
        }else{
            console.log("🚨 [CRONÓMETRO] TIEMPO AGOTADO - Iniciando reinicio...");
            clearInterval(intervalos[mesa._noMesa]);
            
            console.log("🔍 [CRONÓMETRO] mesa._startGame =", mesa._startGame);
            
            if(!mesa._startGame){
                console.log("✅ [CRONÓMETRO] Condición cumplida - Reiniciando juego...");
                
                //Se reinicializan los valores
                mesa._puntosAcumulados = 0;
                mesa._tablero = util.inicializarTablero(mesa._tablero);
                mesa._turnoEnMesa = 0;
                mesa._bloqueoPorReinicio = false;
                
                console.log("📤 [CRONÓMETRO] Emitiendo updateCapturaTurnos...");
                sala.to(mesa._noMesa).emit('updateCapturaTurnos');
                
                if(mesa._noJugadoresActivos > 0){
                    mesa._ficha = mesa._listaJugadores[0]._patrocinador.nombre;
                }
                
                // SOLUCIÓN TEMPORAL - SALTAR PATROCINADORES DE PAGO
                console.log("🔧 [CRONÓMETRO] Usando patrocinadores por defecto");
                usarPatrocinadoresDefault();
                
                function usarPatrocinadoresDefault() {
                    console.log("🔄 [CRONÓMETRO] Ejecutando usarPatrocinadoresDefault()");
                    
                    mesa._listaPatrocinadores = listPatrocinadoresDefault;
                    mesa._ficha = mesa._listaPatrocinadores[0]._nombre;
                    mesas[mesa._noMesa] = mesa;
                    
                    console.log("📤 [CRONÓMETRO] Emitiendo updateFichasUsers...");
                    sala.to(mesa._noMesa).emit('updateFichasUsers', mesa._noMesa);
                    
                    console.log("📤 [CRONÓMETRO] Emitiendo closeModalReset...");
                    sala.to(mesa._noMesa).emit('closeModalReset');
                    
                    console.log("📤 [CRONÓMETRO] Emitiendo cargaConfiguracion...");
                    sala.to(mesa._noMesa).emit('cargaConfiguracion', mesa);
                    
                    console.log("📤 [CRONÓMETRO] Emitiendo sendUsersMesas...");
                    io.of('/lobby').emit('sendUsersMesas', mesas);
                    
                    console.log("🎉 [CRONÓMETRO] REINICIO COMPLETADO EXITOSAMENTE");
                }
            } else {
                console.log("❌ [CRONÓMETRO] NO se reinicia porque mesa._startGame = true");
            }
        }
    }, 1000);
}
// funcion que inicializa el cronometro
function cronometro(sala, mesa, nick) {
	
	var tiempoInicial =  mesa._tiempoTirada;
	
	intervalos[mesa._noMesa] = setInterval(function() {
		
		if(tiempoInicial >= 0){
			var data = [tiempoInicial, nick];
			sala.to(mesa._noMesa).emit('timer-decrement', data);
			tiempoInicial--;
		}else{
			
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
					mesa = pasarTurno(expulsado, i, mesa);
					
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
	
// funcion que pasa el turno al jugador
function pasarTurno(expulsado, item, mesa) {
	//Si hubo un jugador expulsado y el turno actual es mayor o igual al tamanio de los jugadores activos este regresa al inicio
	//O si no hubo jugador expulsado y el item es igual a el numero de jugadores activos - 1 este se regresa a 0
	if((expulsado && item >= mesa._noJugadoresActivos) || (!expulsado && item == (mesa._noJugadoresActivos -1))) {
		mesa._turnoEnMesa = 0;
	} else {
		//Si no hubo algun expulsado
		if(!expulsado) {
			mesa._turnoEnMesa += 1;
		} 
	}
	if(mesa._listaJugadores[mesa._turnoEnMesa] == undefined){
		console.log('*************** Se detecto patrocinador undefined ******************');
		console.log(mesa._listaJugadores);
		console.log('---------------------------------------------------------------------');
		console.log('Turno en mesa nuevo: ' + mesa._turnoEnMesa);
		console.log('Jugadores activos: ' + mesa._noJugadoresActivos);
		console.log('Expulsado: ' + expulsado);
		console.log('Item: ' + item);
		console.log('*************** ******************');
	}
	mesa._ficha = mesa._listaJugadores[mesa._turnoEnMesa]._patrocinador.nombre;
	return mesa;
}

// funcion que analiza si hay ganador
var ganador = function (mesa, fichaActual) {
	
	mesa._noJugadas += 1;
	
	var estadoJuego = '';
	
	if(mesa._noJugadas == (mesa._noCasillas * mesa._noCasillas)) {
		estadoJuego = 'empate';
	} else {
		// se recorre la matriz en x
		for ( x  = 0 ; x < mesa._noCasillas; x++ ) {
			// se declaran las variables para incrementar el no de coincidencias consecutivas
			var fila = 0, columna = 0;
			// se recorre la matriz en y
			for ( y  = 0 ; y < mesa._noCasillas ; y++ ) {
				// --------------------------------------- SEARCH IN ROW ---------------------------------------
				
				// se declara un json con los valores especificos
				var data = {
					'x' : x, //coordenada en x para buscar en fila
					'y' : y, // coordenada en y para buscar en fila
					'ficha' : fichaActual, // ficha que ha agregado
					'noElementos' : fila // el no de coincidencias consecuticas en fila
				};
				
				// se obtiene un arreglo con los resultados obtenidos por fila
				var result = verificarGanador(mesa, data);
				
				// si coincide la ficha dentro del tablero
				if(result.existe) {
					
					// fila toma el valor que proviene del json
					fila = result.noElementos;
					
					// se verifica si existe ganador para romper el ciclo
					if(result.ganador) {
						estadoJuego = 'ganador';
						break;
					}
					
				} else fila = 0; // en caso de que no coincide la ficha dentro del tablero se restablece el valor
				
				// --------------------------------------- SEARCH IN COLUM ---------------------------------------
				data.x = y; // coordenada en x para buscar en columna (el valor de x toma como valor de y)
				data.y = x; // coordenada en y para buscar en columna (el valor de y toma como valor de x)
				data.noElementos = columna; // el no de coincidencias consecuticas en columna
				
				// se obtienen los resultados
				result = verificarGanador(mesa, data);
				
				// si coincide la ficha dentro del tablero
				if(result.existe) {
					
					// columna toma el valor que proviene del json
					columna = result.noElementos;
					
					// se verifica si existe ganador para romper el ciclo
					if(result.ganador) {
						estadoJuego = 'ganador';
						break;
					}
					
				} else columna = 0; // en caso de que no coincide la ficha dentro del tablero se restablece el valor
				
				// SE REALIZA UNA BUSQUEDA EN DIAGONAL IZQ Y DIAGONAL DER
				if(mesa._tablero[x][y] == fichaActual && x < (mesa._noCasillas - mesa._win + 1)) {
					
					// se declaran las variables para incrementar el no de coincidencias consecutivas
					var dDerecha = 0; dIzquierda = 0;				

					// Se recorre en forma diagonal
					for (var z = 0; z < mesa._win; z++) {
						
						// --------------------------------------- SEARCH IN DIAGONAL IZQUIERDA ---------------------------------------
						data.x = x + z; // coordenada en x para buscar en diagonal izq
						data.y = y + z; // coordenada en y para buscar en diagonal izq
						data.noElementos = dIzquierda; // el no de coincidencias consecuticas en diagonal izq
						
						// se obtienen los resultados
						result = verificarGanador(mesa, data);
						
						// si coincide la ficha dentro del tablero
						if(result.existe) {
							
							// diagonal izq toma el valor que proviene del json
							dIzquierda = result.noElementos;
							
							// se verifica si existe ganador para romper el ciclo
							if(result.ganador) {
								estadoJuego = 'ganador';
								break;
							}
							
						} else dIzquierda = 0; // en caso de que no coincide la ficha dentro del tablero se restablece el valor
						
						
						// --------------------------------------- SEARCH IN DIAGONAL DERECHA ---------------------------------------
						data.x = x + z; // coordenada en x para buscar en diagonal der
						data.y = y - z; // coordenada en y para buscar en diagonal der
						data.noElementos = dDerecha; // el no de coincidencias consecuticas en diagonal der
						
						// se obtienen los resultados
						result = verificarGanador(mesa, data);
						
						// si coincide la ficha dentro del tablero
						if(result.existe) {
							
							// diagonal der toma el valor que proviene del json
							dDerecha = result.noElementos;
							
							// se verifica si existe ganador para romper el ciclo
							if(result.ganador) {
								estadoJuego = 'ganador';
								break;
							}
							
						} else dDerecha = 0; // en caso de que no coincide la ficha dentro del tablero se restablece el valor
					} // fin for en z
				} // fin if
			} // fin for en y
		} // fin en for z
	} // fin funcion
	return estadoJuego;
}

//funcion que verifica el ganador 
var verificarGanador = function(mesa, data) {
	
	// json que obtienen los datos
	var result = {'existe' : false, 'noElementos' : data.noElementos, 'ganador' : false};
	
	// se verifica que es igual la ficha en el tablero correspondiente a la coordenada
	if(mesa._tablero[data.x][data.y] == data.ficha) {
		
		// se incrementa el valor
		result.noElementos += 1;
		
		result.existe = true;
		
		// se verifica que el no de coincidencias consecutivas sea igual al numero establecido por default para ganar
		if(result.noElementos == mesa._win) {
			result.ganador = true;
		}
	}
	
	return result;
}

// funcion que analiza si existe una captura
var analizaCapturaEpoca = function (tablero, x, y, ficha, epoca){
	//Inicializacion de variables
	var array = new Array(4);
	var arrayStoreFichasCapturadas = new Array ();
	var noCapturasJugador = 0;
	var i = parseInt(x), j =  parseInt(y);
		
	//Se verifica si la posicion del tablero es igual a la ficha actual y que aparte sea la posicion del ultimo tiro
	if(tablero[i][j] == ficha) {
			
			//Se calcula la diferencia para saber si se tienen almenos 4 espacios para analizar calculando los espacios disponibles en X y Y
			var dif_x_positiva = 14 - j;
			var dif_x_negativa = (14 - dif_x_positiva) + 1;
			var dif_y_positiva = 14 - i;
			var dif_y_negativa = (14 - dif_y_positiva) + 1;
			
			//Se analizan si los espacios disponibles en x positivos son por lo menos 4
			if(dif_x_positiva >= 4){
				//Se itera en los 4 espacios disponibles
				for(var a = 0; a < 4; a++){
					array[a] = {
							'i' : i,
							'j' : (j+a),
							'ficha' : tablero[i][(j+a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if(epoca == 'Capitalismo'){
					result = getFichasCapturaCapitalismo(array);
				}else if(epoca == 'Neoliberalismo'){
					result = getFichasCapturaNeoliberalismo(array);
				}
				if(result.captura){
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
					
			//Se analizan si los espacios disponibles en x negativos si son por lo menos 4
			if(dif_x_negativa >= 4){
				//Se itera en los 4 espacios disponibles negativos
				for(var a = 0; a < 4; a++){
					array[a] = {
							'i' : i,
							'j' : (j-a),
							'ficha' : tablero[i][(j-a)]
					};
				}
				//Se verifica si se capturo
				var result = null;
				//Se verifica si se capturo
				if(epoca == 'Capitalismo'){
					result = getFichasCapturaCapitalismo(array);
				}else if(epoca == 'Neoliberalismo'){
					result = getFichasCapturaNeoliberalismo(array);
				}
				if(result.captura){
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
					
			//Se analizan si los espacios disponibles en y positivos son por lo menos 4
			if(dif_y_positiva >= 4){
				//Se itera en los 4 espacios disponibles
				for(var a = 0; a < 4; a++){
					array[a] = {
							'i' : (i+a),
							'j' : j,
							'ficha' : tablero[(i+a)][j]
					};
				}
				//Se verifica si se capturo
				var result = null;
				//Se verifica si se capturo
				if(epoca == 'Capitalismo'){
					result = getFichasCapturaCapitalismo(array);
				}else if(epoca == 'Neoliberalismo'){
					result = getFichasCapturaNeoliberalismo(array);
				}
				if(result.captura){
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
				
			//Si en las y negativas tiene almenos 4 espacios analiza esos 4 espacios
			if(dif_y_negativa >= 4){
				//Se itera en los 4 espacios disponibles negativos en y
				for(var a = 0; a < 4; a++){
					array[a] = {
							'i' : (i-a),
							'j' : j,
							'ficha' : tablero[(i-a)][j]
					};
				}
				//Se verifica si se capturo
				var result = null;
				//Se verifica si se capturo
				if(epoca == 'Capitalismo'){
					result = getFichasCapturaCapitalismo(array);
				}else if(epoca == 'Neoliberalismo'){
					result = getFichasCapturaNeoliberalismo(array);
				}
				if(result.captura){
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
			
			
			//Se analiza la diagonal primaria de izq a der (postivo y negativo) = \
			if(dif_x_positiva >= 4 && dif_y_positiva >= 4){
				for(var a = 0; a < 4; a++){
					array[a] = {
							'i' : (i+a),
							'j' : (j+a),
							'ficha' : tablero[(i+a)][(j+a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if(epoca == 'Capitalismo'){
					result = getFichasCapturaCapitalismo(array);
				}else if(epoca == 'Neoliberalismo'){
					result = getFichasCapturaNeoliberalismo(array);
				}
				if(result.captura){
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
			if(dif_x_negativa >= 4 && dif_y_negativa >= 4){
				for(var a = 0; a < 4; a++){
					array[a] = {
							'i' : (i-a),
							'j' : (j-a),
							'ficha' : tablero[(i-a)][(j-a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if(epoca == 'Capitalismo'){
					result = getFichasCapturaCapitalismo(array);
				}else if(epoca == 'Neoliberalismo'){
					result = getFichasCapturaNeoliberalismo(array);
				}
				if(result.captura){
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
			
			//Se analiza la diagonal secundaria de der a izq (postivo y negativo) = /
			if(dif_x_positiva >= 4 && dif_y_negativa >= 4){
				for(var a = 0; a < 4; a++){
					array[a] = {
							'i' : (i-a),
							'j' : (j+a),
							'ficha' : tablero[(i-a)][(j+a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if(epoca == 'Capitalismo'){
					result = getFichasCapturaCapitalismo(array);
				}else if(epoca == 'Neoliberalismo'){
					result = getFichasCapturaNeoliberalismo(array);
				}
				if(result.captura){
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
			
			if(dif_x_negativa >= 4 && dif_y_positiva >= 4){
				for(var a = 0; a < 4; a++){
					array[a] = {
							'i' : (i+a),
							'j' : (j-a),
							'ficha' : tablero[(i+a)][(j-a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if(epoca == 'Capitalismo'){
					result = getFichasCapturaCapitalismo(array);
				}else if(epoca == 'Neoliberalismo'){
					result = getFichasCapturaNeoliberalismo(array);
				}
				if(result.captura){
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
			
		}//fin verificacion ficha
	
	return [noCapturasJugador, arrayStoreFichasCapturadas];
}//fin metodo

//Funcion que veridica si se captura o no la ficha
function getFichasCapturaCapitalismo(array){
	//Se analiza si se capturan fichas
	if((array[0].ficha != undefined && array[3].ficha != undefined) && (array[0].ficha != '' && array[3].ficha != '') && (array[0].ficha == array[3].ficha)){
		if((array[1].ficha != undefined && array[2].ficha != undefined) && (array[1].ficha != '' && array[2].ficha != '') && (array[1].ficha == array[2].ficha) && (array[1].ficha != array[0].ficha)){
			console.log('Se capturan las fichas: ' + array[1].ficha + ' ya que estan entre: ' + array[0].ficha);
			return {
				'captura' : true, 
				'fichas_eliminar' : {
					'f1_x' : array[1].i,
					'f1_y' : array[1].j,
					'f2_x' : array[2].i,
					'f2_y' : array[2].j
				},
				'ficha' :  array[1].ficha
			};
		}
	}
	return {'captura' : false};
}

//Funcion que veridica si se captura o no la ficha en neoliberalismo
function getFichasCapturaNeoliberalismo(array){
	//Se analiza si se capturan fichas
	if((array[0].ficha != undefined && array[3].ficha != undefined) && (array[0].ficha != '' && array[3].ficha != '') && (array[0].ficha == array[3].ficha)){
		if((array[1].ficha != undefined && array[2].ficha != undefined) && (array[1].ficha != '' && array[2].ficha != '') && (array[1].ficha != array[0].ficha) && (array[2].ficha != array[0].ficha)){
			console.log('Se capturan las fichas: ' + array[1].ficha + ' ya que estan entre: ' + array[0].ficha);
			return {
				'captura' : true, 
				'fichas_eliminar' : {
					'f1_x' : array[1].i,
					'f1_y' : array[1].j,
					'f2_x' : array[2].i,
					'f2_y' : array[2].j
				},
				'ficha' :  array[1].ficha
			};
		}
	}
	return {'captura' : false};
}

module.exports =  function (io, mesas, session, listPatrocinadoresDefault) {
	
	var sala = io.sockets.on('connection', function (socket) {
		
		//Metodos de validacion para la mesa 10
		socket.on('custom-conect', function(data){
			if(data == 'mesa-10'){
				mesa = mesas[data];
				
				if(mesa != null){
					
					//Se analiza si el tablero de la mesa ha sido creado
					if(mesa._tablero == null) {
						//Se crea el tablero de juego
						mesa._tablero = util.crearTablero(mesa._tablero, mesa._noCasillas);
						//Se inicializan los valores del tablero
						mesa._tablero = util.inicializarTablero(mesa._tablero);
					}
					
					//Se inicializa la variable con la session del socket request
					session = socket.request.session;
					//Se obtiene el tamaño de la lista de jugadores en la mesa
					tamanioListaJugadores = mesa._listaJugadores.length;
					
					//si el juego no ha iniciado y el no de jugadores es menor o igual a 6 y el jugador que se conecto esta como inactivo
					if(!mesa._startGame && tamanioListaJugadores <= 6 && session.jugador._activo == false) {
						
						if(mesa._noJugadoresActivos == 0){
							listaAuxiliarPatrocinadores = mesa._listaPatrocinadores;
						}
						
						//Se emite un evento para que el jugador seleccione la ficha de su interes
						socket.emit('selectFicha', listaAuxiliarPatrocinadores);
					}
					
					
					//Se une la socket del jugador a la mesa especificada
					socket.join(session.jugador._room);
					
					//Se actualiza el jugador en la vista
					socket.emit('updateJugador', session.jugador);
					//Se emite a la sala en especifico la carga de su condiguracion
					sala.to(mesa._noMesa).emit('cargaConfiguracion', mesa);
					//Se envian los usuarios activos al lobby
					mesas[mesa._noMesa] = mesa;
					io.of('/lobby').emit('sendUsersMesas', mesas);
				}else{
					//En caso de que la mesa no tenga nada de configuracion se redirecciona al usuario al lobby
					socket.emit('redirect', '/lobby');
				}
			}
		});
		
		socket.on('definePatrocinador', function(data){
			//Se inicializa la variable con la session del socket request
			session = socket.request.session;
			mesa = mesas['mesa-10'];
			
			//si el juego no ha iniciado y el no de jugadores es minimo o igual a 6 y el jugador que se conecto esta como inactivo
			if(!mesa._startGame && mesa._listaJugadores.length <= 6 && session.jugador._activo == false) {
				//Se le asigna la ficha al jugador en la session y en la lista de jugadores
				session.jugador._activo = true;
				session.jugador._patrocinador = {'nombre' : listaAuxiliarPatrocinadores[data]._nombre, 'ficha' : listaAuxiliarPatrocinadores[data]._ficha};
				session.save();
				
				for(var i in mesa._listaJugadores){
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
						mesa._ficha = mesa._listaJugadores[0]._patrocinador.nombre;
						
						//Se elimina la ficha seleccionada por el jugador de la lista auxiliar
						listaAuxiliarPatrocinadores.splice(data, 1);
						//Se emite de actualizacion sobre el jugador
						socket.emit('updateJugador', session.jugador);
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
		});
		
		//fin metodos de validacion para la mesa 10
		
		socket.on('conectado', function(data){
			//Se obtiene el objeto mesa de acuerdo a la mesa que se ha conectado el cliente
			mesa = mesas[data];
			
			//Se inicializa la variable con la session del socket request
			session = socket.request.session;
			
			//Si la mesa tiene configuracion se le permite el acceso al usuario
			if(mesa != null && session.jugador._room != undefined && session.jugador._room != null){
				
				//Se analiza si el tablero de la mesa ha sido creado
				if(mesa._tablero == null) {
					//Se crea el tablero de juego
					mesa._tablero = util.crearTablero(mesa._tablero, mesa._noCasillas);
					//Se inicializan los valores del tablero
					mesa._tablero = util.inicializarTablero(mesa._tablero);
				}
				
				//Se obtiene el tamaño de la lista de jugadores en la mesa
				tamanioListaJugadores = mesa._listaJugadores.length;
				
				//si el juego no ha iniciado y el no de jugadores es minimo o igual a 6 y el jugador que se conecto esta como inactivo
				if(!mesa._startGame && tamanioListaJugadores <= 6 && session.jugador._activo == false) {
					//Se invoca a la funcion que le asigna una ficha aleatoria al jugador de la session y al de la mesa
					var result = util.asignarFicha(session.jugador, mesa._listaJugadores, mesa._listaPatrocinadores, mesa._noJugadoresActivos);
					// se obtiene los nuevos valores para la sesion
					session.jugador = result[0];
					session.save();
					//Se actualizan los valores del jugador en la mesa
					mesa._listaJugadores = result[1];
					//Se incrementa el numero de jugadores que estaran activos sobre la mesa
					mesa._noJugadoresActivos++;
					// Se obtiene la ficha inicial con la que iniciara el juego
					mesa._ficha = mesa._listaJugadores[0]._patrocinador.nombre;
				}
				
				socket.roomID = session.jugador._room;
				//Se une la socket del jugador a la mesa especificada
				socket.join(session.jugador._room);
				//Se emite de actualizacion sobre el jugador
				socket.emit('updateJugador', session.jugador);
				//Se emite a la sala en especifico la carga de su condiguracion
				sala.to(data).emit('cargaConfiguracion', mesa);
				//Se envian los usuarios activos al lobby
				mesas[data] = mesa;
				io.of('/lobby').emit('sendUsersMesas', mesas);
			}else{
				//En caso de que la mesa no tenga nada de configuracion se redirecciona al usuario al lobby
				socket.emit('redirect', '/lobby');
			}
		});
		
		socket.on('iniciarJuego', function(data) {
			//Se obtiene el objeto mesa de acuerdo a la mesa que se ha conectado el cliente
			mesa = mesas[data];
			//Se inicializa la variable con la session del socket request
			session = socket.request.session;
			//Se verifica si el usuario que presiono el boton esta activo sobre la mesa
			if(!session.jugador._activo){
				socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'No tienes permitido realizar esta acción', 'tipo' : 'warning'});
			}else{
				//tambien tiene el nick del cliente que va iniciar el juego
				if(!mesa._startGame && mesa._noJugadoresActivos >= 2 && !mesa._bloqueoPorReinicio && session.jugador._activo){
					//Se valida si ya inicio el juego para que no lo vuelvan a iniciar
					mesa._startGame = true;
					mesas[data] = mesa;
					sala.to(mesa._noMesa).emit('run-time', mesa);
					
					//Se registran o actualizan las epocas de la mesa en la bd
					util.registerUpdateMesa(mesa);
					
					//Se actualizan las vistas de los patrocinadores en la bd de acuerdo al numero de jugadores activos
					for(var i=0; i < mesa._noJugadoresActivos; i++){
						patrocinadorController.patrocinadores.decrementaVistasPatrocinador(mesa._listaJugadores[i]._patrocinador);
					}
				}else{
					if(!mesa._startGame && mesa._bloqueoPorReinicio){
						socket.emit('notificacion', { 'title' : 'Espere por favor' , 'msg' : 'El juego aun no ha sido reiniciado', 'tipo' : 'warning'});
					}else if(!mesa._startGame && !mesa._bloqueoPorReinicio && mesa._noJugadoresActivos <= 1){
						socket.emit('notificacion', {'title' : '¡Oops!' , 'msg' : 'Esperando más jugadores', 'tipo' : 'warning'});
					}else if(mesa._startGame){
						socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'El juego ya ha iniciado', 'tipo' : 'danger'});
					}
				}
			}
		});
		
		
		// Evento cuando se ha realizado un movimiento
		socket.on('process_move', function(data) {
			
			mesa = mesas[data[0]];
			//Coordenada en el tablero
			var idCasillaSeleccionada = data[1];
			
			// se verifica que el juego ha iniciado
			if(mesa != null && mesa._startGame) {

				//Se inicializa la variable con la session del socket request
				session = socket.request.session;
				
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
								
								//Se actualizan los puntos del jugador en la bd
								util.updatePuntosUsuario(session.jugador);
								
								//Se verifica si el jugador ha ganado
								var isGanador = ganador(mesa, mesa._tablero[x][y]);
								var isGanadorPorCapturas = false;
								
								//Se analiza la epoca de la mesa si es diferente de la epoca feudal
								if(mesa._epoca != 'Feudalismo') {
									
									//Se obtienen los resultados del analisis de una posible captura
									var resultTipoCaptura = analizaCapturaEpoca(mesa._tablero, x, y, session.jugador._patrocinador.ficha, mesa._epoca);
									//Se actualizan las capturas del jugador
									session.jugador._noCapturas += resultTipoCaptura[0];
									session.save();
									
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
								if(mesa._startGame == false) {
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
								mesa = pasarTurno(false, ultimoJugadorTiro, mesa);
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
		});
		
		
		//El servidor recibe el evento de correr el tiempo
		socket.on('execute-timer', function(data){
			mesa = mesas[data[0]];
			//Se ejecuta la funcion para el cronometrometro
			/* param sala
			 * param objeto mesa
			 * data nick del jugador
			 * */
			cronometro(sala, mesa, data[1]);
			
		});
		
		socket.on('expulsaJugador', function(){
			//Se inicializa la variable con la session del socket request
			session = socket.request.session;
			//Se invoca a la funcion que reinicia los valores de la session del jugador
			session.jugador = util.resetSessionJugador(session.jugador);
			//Como se realizaron cambios en el objeto de la session es necesario guardarlos
			session.save();
			socket.emit('redirect', '/lobby');			
		});
		
		socket.on('winDefaultGame', function(data) {
			//Se inicializa la variable con la session del socket request
			mesa = data.mesa;
			session = socket.request.session;
			session.jugador._creditos += mesa._puntosAcumulados;
			session.save();
			//Se actualizan los puntos del usuario en la bd
			util.updatePuntosUsuario(session.jugador);
			
			data.jugador = session.jugador;
			for(var i = 0; i < mesa._listaJugadores.length; i++) {
				if(mesa._listaJugadores[i]._nick == session.jugador._nick) {
					mesa._listaJugadores[i]._creditos =  session.jugador._creditos;
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
		});
		
		// peticion para reiniciar el juego
socket.on('reiniciarJuego', async function(data) { // ← Agregar async aquí
    //Se obtiene la mesa
    mesa = mesas[data.mesa];
    
    //Si la mesa no esta iniciada se puede reiniciar
    if(!mesa._startGame){
        //Se inicializa la variable con la session del socket request
        session = socket.request.session;
        if(mesa._listaJugadores[0]._nick == session.jugador._nick){
            //Se detiene el cronometro de reinicio de partida
            clearInterval(intervalos[mesa._noMesa]);
            mesa._epoca = data.epoca;
            mesa._puntosAcumulados = 0;
            mesa._tiempoTirada = data.tiempoTirada;
            mesa._tablero = util.inicializarTablero(mesa._tablero);
            mesa._turnoEnMesa = 0;
            mesa._bloqueoPorReinicio = false;
            
            //Se emite un evento para reiniciar las capturas de todos los jugadores en session
            //Se reinician los turnos perdidos de todos los jugadores al reiniciar el juego
            sala.to(mesa._noMesa).emit('updateCapturaTurnos');
            
            // ⭐⭐ CORREGIDO - Usar async/await ⭐⭐
            try {
                console.log("🔄 [REINICIO MANUAL] Obteniendo patrocinadores...");
                const r = await patrocinadorController.patrocinadores.getPatrocinadoresPago();
                console.log("✅ [REINICIO MANUAL] Patrocinadores obtenidos:", r.desc.length);
                
                if(!r.err){
                    mesa._listaPatrocinadores = util.obtenerPatrocinadores(listPatrocinadoresDefault, r.desc);
                    mesa._ficha = mesa._listaPatrocinadores[0]._nombre;
                    //Se actualiza el valor de las mesas (json) con el nuevo objeto
                    mesas[data.mesa] = mesa;
                    //Se actualizan las fichas del usuario en su session
                    sala.to(mesa._noMesa).emit('updateFichasUsers', mesa._noMesa);
                    //Se reinicia el juego y se emiten a todos los clientes las nuevas configuraciones
                    sala.to(mesa._noMesa).emit('closeModalReset');
                    sala.to(mesa._noMesa).emit('cargaConfiguracion', mesa);
                    io.of('/lobby').emit('sendUsersMesas', mesas);
                    
                    console.log("🎉 [REINICIO MANUAL] Reinicio completado exitosamente");
                }
            } catch (error) {
                console.error("❌ [REINICIO MANUAL] Error:", error);
                socket.emit('notificacion', {'title' : 'Error', 'msg' : 'Error al reiniciar el juego', 'tipo' : 'danger'});
            }
            
        }else{
            socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'No tienes permitido realizar esta acción', 'tipo' : 'danger'});
        }
    }else{
        socket.emit('notificacion', {'title' : '¡Oops!', 'msg' : 'La mesa esta activa y no puede ser reiniciada', 'tipo' : 'warning'});
    }
});
		
		socket.on('upCaptureTurnoSess', function(){
			//Se inicializa la variable session y se obtiene el request
			session = socket.request.session;
			//Si existe la session y el jugador esta activo sus capturas se reinician
			if(session.jugador && session.jugador._activo){
				session.jugador._noCapturas = 0;
				session.jugador._noTurnosPerdidos = 0;
				session.save();
				socket.emit('updateNoCapturas', session.jugador._noCapturas);
			}
		});
		
		socket.on('updateFichaUser', function(data){
			// Se inicializa la variable session y se obtiene el request
			session = socket.request.session;
			if(session.jugador._activo){
				mesa = mesas[data];
				for(var i = 0; i < mesa._noJugadoresActivos; i++){
					if(mesa._listaJugadores[i]._nick == session.jugador._nick){
						var patrocinador = mesa._listaPatrocinadores[i];
						session.jugador._patrocinador = {id: patrocinador._id, nombre : patrocinador._nombre, ficha: patrocinador._ficha};
						session.save();
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
		});
		
		socket.on('updateSessJugador', function(data){
			// Se inicializa la variable session y se obtiene el request
			session = socket.request.session;
			//Se actualiza la session del jugador
			session.jugador = data;
			//Se guardan cambios sobre la session
			session.save();
		});
		
		
		
		/*CHAT*/
		socket.on('sendMessage', function(data){
			sala.to(data[2]).emit('newMessage', data);
		});
		/*FIN CHAT*/
		
		socket.on("disconnect", function() {
		    // Let the users know something bad happened or log the disconnect
			var roomID = socket.roomID;
			//Se inicializa la variable session y se obtiene el request
			session = socket.request.session;
			if(roomID != undefined){
				//Se obtiene la mesa de la cual se esta abandonando
				mesa = mesas[roomID];
					
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
										mesa = pasarTurno(true, turnoAnterior, mesa);
										if(mesa._turnoEnMesa != 0){
											turnoAnterior = mesa._turnoEnMesa - 1;
										} 
										//Se emite el turno siguiente a los clientes
										sala.to(mesa._noMesa).emit('pasarTurno', {'turnoAnterior' : turnoAnterior, 'turnoSiguiente' : mesa._turnoEnMesa});
										// Se inicia el cronometrometro para el turno siguiente
										cronometro(sala, mesa, mesa._listaJugadores[mesa._turnoEnMesa]._nick);
									}
								}
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
								clearInterval(intervalos[mesa._noMesa]);
								mesa = null; 
							}else{
								//Se actualiza la lista de jugadores activos en la vista
								sala.to(mesa._noMesa).emit('updateListJugadores', mesa._listaJugadores);
							}
								
							//Se resetean los valores del usuario en la session
							session.jugador = util.resetSessionJugador(session.jugador);
							session.save();
							// Se actualiza los valores de la mesa en la coleccion
							mesas[roomID] = mesa;
							//Se emiten los nuevos datos a el lobby
							io.of('/lobby').emit('sendUsersMesas', mesas); // Se envia los nuevos valores de la mesa al lobby
							socket.emit('redirect', '/lobby');
							break;
						}
					}//fin for
			}
		});
	});	
}