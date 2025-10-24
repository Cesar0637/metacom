//loggers 
var nameModuleLogger = "Util > util.js : "
var logger = require('winston');

var Patrocinador = require("../class/patrocinador"); // instancia de la clase patrocinador
var usuarioController = require('../controllers/Usuario');
var mesaController = require('../controllers/Mesa');

module.exports = {
	//Function que obtiene el numero de elemntos de una coleccion
	getSizeCollection: function (collection) {
		var count = 0;
		for (var i in collection) {
			if (collection.hasOwnProperty(i)) {
				count++;
			}
		}
		return count;
	},

	//funcion que verifica si un jugador ya esta dentro de una mesa
	checkPlayersMesa: function (listaJugadores, nick) {
		//Se verifica si la mesa esta creada
		if (listaJugadores != null && listaJugadores != undefined) {
			//Se itera sobre la lista de usuarios para verificar si
			//El usuario que desea unirse ya existe
			for (var i = 0; i < listaJugadores.length; i++) {
				if (listaJugadores[i]._nick == nick) {
					return true;
				}
			}
		}
		//en caso de que no exista es un false
		return false;
	},

	//funcion que crea el tablero
	crearTablero: function (tablero, noCasillas) {
		tablero = new Array(noCasillas); // se crea un arreglo
		// se crea una matriz de n x n
		for (var x = 0; x < noCasillas; x++) {
			tablero[x] = new Array(noCasillas);
		}

		return tablero;
	},


	//funcion que inicializa los valores de las mesas
	inicializarTablero: function (tablero) {
		// se establece un valor por default a la matriz
		for (var x = 0; x < tablero.length; x++) {
			for (var y = 0; y < tablero.length; y++) {
				tablero[x][y] = '';
			}
		}
		return tablero;
	},

	//funcion que genera un numero aleatorio entre varios rangos
	numeroAleatorio: function (numeroMaximo) {
		return Math.floor(Math.random() * (numeroMaximo - 0 + 0)) + 0;
	},

	//Metodo que asigna una ficha al jugador de la mesa
	asignarFicha: function (jugador, listaJugadores, listaPatrocinadores, noJugadoresActivos) {
		for (var i = 0; i < listaPatrocinadores.length; i++) {
			//Se obtiene el patrocinador en la posicion 0
			var patrocinador = listaPatrocinadores[i];
			//Se establece en false la bandera
			var ban = false;
			//Se busca el patrocinador entre los jugadores activos
			for (var j = 0; j < listaJugadores.length; j++) {

				/*
				if(listaJugadores[j]._patrocinador == null){
					logger.info(nameModuleLogger + ' asignarFicha : anteriormente se generaba expecion datos: ' + listaJugadores[j]._nick + ' su patrocinador es null');
					console.log('Jugador en el que se causo null : ' + listaJugadores[j]._nick);
					console.log('Jugadores Activos : ' + noJugadoresActivos);
					console.log('Lista de jugadores en la mesa');
					console.log(listaJugadores);
				}*/

				//Si el patrocinador ya existe entonces se quiebra el ciclo
				if (listaJugadores[j]._patrocinador != null && listaJugadores[j]._patrocinador.id == patrocinador._id) {
					//Como el patrocinador existio la bandera se convierte a true
					ban = true;
					//Se termina el ciclo
					break;
				}
			}

			//Si el patrocinador no hasido asignado este se asigna
			if (!ban) {
				//Se itera sobre la lista de jugadores
				for (var k in listaJugadores) {
					//Se busca el usuario que acaba de entrar
					if (listaJugadores[k]._nick == jugador._nick) {
						//Se activa el usuario
						jugador._activo = true;
						//Se le asigna su patrocinador al jugador
						jugador._patrocinador = { id: patrocinador._id, nombre: patrocinador._nombre, ficha: patrocinador._ficha };
						//Se actualiza el jugador en la mesa
						listaJugadores[k]._activo = jugador._activo;
						listaJugadores[k]._patrocinador = jugador._patrocinador;
						break;
					}
				}
				break;
			}
		}
		return [jugador, listaJugadores];
	},


	//funcion que pasa el turno al jugador
	pasarTurno: function (expulsado, item, mesa) {
		//Si hubo un jugador expulsado y el turno actual es mayor o igual al tamanio de los jugadores activos este regresa al inicio
		//O si no hubo jugador expulsado y el item es igual a el numero de jugadores activos - 1 este se regresa a 0
		if ((expulsado && item >= mesa._noJugadoresActivos) || (!expulsado && item == (mesa._noJugadoresActivos - 1))) {
			mesa._turnoEnMesa = 0;
		} else {
			//Si no hubo algun expulsado
			if (!expulsado) {
				mesa._turnoEnMesa += 1;
			}
		}

		/*if(mesa._listaJugadores[mesa._turnoEnMesa] == undefined){
			logger.error('******************** Error *********************');
			logger.error(nameModuleLogger + 'Metodo pasarTurno');
			logger.error('Turno en mesa nuevo: ' + mesa._turnoEnMesa);
			logger.error('Jugadores activos: ' + mesa._noJugadoresActivos);
			logger.error('Expulsado: ' + expulsado);
			logger.error('Item: ' + item);
			logger.error(mesa._listaJugadores);
			logger.error('---------------------------------------------------------------------');
			logger.error('*************** Fin Error ******************');
		}*/

		if (typeof (mesa._listaJugadores[mesa._turnoEnMesa]) == 'undefined') {
			logger.error('******************** Error *********************');
			logger.error(nameModuleLogger + 'Metodo pasarTurno');
			logger.error('Turno en mesa nuevo: ' + mesa._turnoEnMesa);
			logger.error('Jugadores activos: ' + mesa._noJugadoresActivos);
			logger.error('Expulsado: ' + expulsado);
			logger.error('Item: ' + item);
			logger.error(mesa._listaJugadores);
			logger.error('---------------------------------------------------------------------');
			logger.error('*************** Fin Error ******************');
		}


		mesa._ficha = mesa._listaJugadores[mesa._turnoEnMesa]._patrocinador.nombre;
		return mesa;
	},

	//funcion que verifica el ganador 
	verificarGanador: function (mesa, data) {
		// json que obtienen los datos
		var result = { 'existe': false, 'noElementos': data.noElementos, 'ganador': false };
		// se verifica que es igual la ficha en el tablero correspondiente a la coordenada
		if (mesa._tablero[data.x][data.y] == data.ficha) {
			// se incrementa el valor
			result.noElementos += 1;
			result.existe = true;
			// se verifica que el no de coincidencias consecutivas sea igual al numero establecido por default para ganar
			if (result.noElementos == mesa._win) {
				result.ganador = true;
			}
		}
		return result;
	},



	//funcion que analiza si hay ganador
	ganador: function (mesa, fichaActual) {
		mesa._noJugadas += 1;
		var estadoJuego = '';
		if (mesa._noJugadas == (mesa._noCasillas * mesa._noCasillas)) {
			estadoJuego = 'empate';
		} else {
			// se recorre la matriz en x
			for (x = 0; x < mesa._noCasillas; x++) {
				// se declaran las variables para incrementar el no de coincidencias consecutivas
				var fila = 0, columna = 0;
				// se recorre la matriz en y
				for (y = 0; y < mesa._noCasillas; y++) {
					// --------------------------------------- SEARCH IN ROW ---------------------------------------
					// se declara un json con los valores especificos
					var data = {
						'x': x, //coordenada en x para buscar en fila
						'y': y, // coordenada en y para buscar en fila
						'ficha': fichaActual, // ficha que ha agregado
						'noElementos': fila // el no de coincidencias consecuticas en fila
					};
					// se obtiene un arreglo con los resultados obtenidos por fila
					var result = this.verificarGanador(mesa, data);
					// si coincide la ficha dentro del tablero
					if (result.existe) {
						// fila toma el valor que proviene del json
						fila = result.noElementos;
						// se verifica si existe ganador para romper el ciclo
						if (result.ganador) {
							estadoJuego = 'ganador';
							break;
						}
					} else fila = 0; // en caso de que no coincide la ficha dentro del tablero se restablece el valor

					// --------------------------------------- SEARCH IN COLUM ---------------------------------------
					data.x = y; // coordenada en x para buscar en columna (el valor de x toma como valor de y)
					data.y = x; // coordenada en y para buscar en columna (el valor de y toma como valor de x)
					data.noElementos = columna; // el no de coincidencias consecuticas en columna
					// se obtienen los resultados
					result = this.verificarGanador(mesa, data);
					// si coincide la ficha dentro del tablero
					if (result.existe) {
						// columna toma el valor que proviene del json
						columna = result.noElementos;
						// se verifica si existe ganador para romper el ciclo
						if (result.ganador) {
							estadoJuego = 'ganador';
							break;
						}
					} else columna = 0; // en caso de que no coincide la ficha dentro del tablero se restablece el valor

					// SE REALIZA UNA BUSQUEDA EN DIAGONAL IZQ Y DIAGONAL DER
					if (mesa._tablero[x][y] == fichaActual && x < (mesa._noCasillas - mesa._win + 1)) {
						// se declaran las variables para incrementar el no de coincidencias consecutivas
						var dDerecha = 0; dIzquierda = 0;
						// Se recorre en forma diagonal
						for (var z = 0; z < mesa._win; z++) {
							// --------------------------------------- SEARCH IN DIAGONAL IZQUIERDA ---------------------------------------
							data.x = x + z; // coordenada en x para buscar en diagonal izq
							data.y = y + z; // coordenada en y para buscar en diagonal izq
							data.noElementos = dIzquierda; // el no de coincidencias consecuticas en diagonal izq
							// se obtienen los resultados
							result = this.verificarGanador(mesa, data);
							// si coincide la ficha dentro del tablero
							if (result.existe) {
								// diagonal izq toma el valor que proviene del json
								dIzquierda = result.noElementos;
								// se verifica si existe ganador para romper el ciclo
								if (result.ganador) {
									estadoJuego = 'ganador';
									break;
								}
							} else dIzquierda = 0; // en caso de que no coincide la ficha dentro del tablero se restablece el valor

							// --------------------------------------- SEARCH IN DIAGONAL DERECHA ---------------------------------------
							data.x = x + z; // coordenada en x para buscar en diagonal der
							data.y = y - z; // coordenada en y para buscar en diagonal der
							data.noElementos = dDerecha; // el no de coincidencias consecuticas en diagonal der
							// se obtienen los resultados
							result = this.verificarGanador(mesa, data);
							// si coincide la ficha dentro del tablero
							if (result.existe) {
								// diagonal der toma el valor que proviene del json
								dDerecha = result.noElementos;
								// se verifica si existe ganador para romper el ciclo
								if (result.ganador) {
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
	},

	/*Funciones sobre captura de fichas*/

	//Funcion que veridica si se captura o no la ficha
	getFichasCapturaCapitalismo: function (array) {
		//Se analiza si se capturan fichas
		if ((array[0].ficha != undefined && array[3].ficha != undefined) && (array[0].ficha != '' && array[3].ficha != '') && (array[0].ficha == array[3].ficha)) {
			if ((array[1].ficha != undefined && array[2].ficha != undefined) && (array[1].ficha != '' && array[2].ficha != '') && (array[1].ficha == array[2].ficha) && (array[1].ficha != array[0].ficha)) {
				console.log('Se capturan las fichas: ' + array[1].ficha + ' ya que estan entre: ' + array[0].ficha);
				return {
					'captura': true,
					'fichas_eliminar': {
						'f1_x': array[1].i,
						'f1_y': array[1].j,
						'f2_x': array[2].i,
						'f2_y': array[2].j
					},
					'ficha': array[1].ficha
				};
			}
		}
		return { 'captura': false };
	},

	//Funcion que veridica si se captura o no la ficha en neoliberalismo
	getFichasCapturaNeoliberalismo: function (array) {
		//Se analiza si se capturan fichas
		if ((array[0].ficha != undefined && array[3].ficha != undefined) && (array[0].ficha != '' && array[3].ficha != '') && (array[0].ficha == array[3].ficha)) {
			if ((array[1].ficha != undefined && array[2].ficha != undefined) && (array[1].ficha != '' && array[2].ficha != '') && (array[1].ficha != array[0].ficha) && (array[2].ficha != array[0].ficha)) {
				console.log('Se capturan las fichas: ' + array[1].ficha + ' ya que estan entre: ' + array[0].ficha);
				return {
					'captura': true,
					'fichas_eliminar': {
						'f1_x': array[1].i,
						'f1_y': array[1].j,
						'f2_x': array[2].i,
						'f2_y': array[2].j
					},
					'ficha': array[1].ficha
				};
			}
		}
		return { 'captura': false };
	},



	//funcion que analiza si existe una captura
	analizaCapturaEpoca: function (tablero, x, y, ficha, epoca) {
		//Inicializacion de variables
		var array = new Array(4);
		var arrayStoreFichasCapturadas = new Array();
		var noCapturasJugador = 0;
		var i = parseInt(x), j = parseInt(y);

		//Se verifica si la posicion del tablero es igual a la ficha actual y que aparte sea la posicion del ultimo tiro
		if (tablero[i][j] == ficha) {
			//Se calcula la diferencia para saber si se tienen almenos 4 espacios para analizar calculando los espacios disponibles en X y Y
			var dif_x_positiva = 14 - j;
			var dif_x_negativa = (14 - dif_x_positiva) + 1;
			var dif_y_positiva = 14 - i;
			var dif_y_negativa = (14 - dif_y_positiva) + 1;
			//Se analizan si los espacios disponibles en x positivos son por lo menos 4
			if (dif_x_positiva >= 4) {
				//Se itera en los 4 espacios disponibles
				for (var a = 0; a < 4; a++) {
					array[a] = {
						'i': i,
						'j': (j + a),
						'ficha': tablero[i][(j + a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if (epoca == 'Capitalismo') {
					result = this.getFichasCapturaCapitalismo(array);
				} else if (epoca == 'Neoliberalismo') {
					result = this.getFichasCapturaNeoliberalismo(array);
				}
				if (result.captura) {
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
			//Se analizan si los espacios disponibles en x negativos si son por lo menos 4
			if (dif_x_negativa >= 4) {
				//Se itera en los 4 espacios disponibles negativos
				for (var a = 0; a < 4; a++) {
					array[a] = {
						'i': i,
						'j': (j - a),
						'ficha': tablero[i][(j - a)]
					};
				}
				//Se verifica si se capturo
				var result = null;
				//Se verifica si se capturo
				if (epoca == 'Capitalismo') {
					result = this.getFichasCapturaCapitalismo(array);
				} else if (epoca == 'Neoliberalismo') {
					result = this.getFichasCapturaNeoliberalismo(array);
				}
				if (result.captura) {
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}

			//Se analizan si los espacios disponibles en y positivos son por lo menos 4
			if (dif_y_positiva >= 4) {
				//Se itera en los 4 espacios disponibles
				for (var a = 0; a < 4; a++) {
					array[a] = {
						'i': (i + a),
						'j': j,
						'ficha': tablero[(i + a)][j]
					};
				}
				//Se verifica si se capturo
				var result = null;
				//Se verifica si se capturo
				if (epoca == 'Capitalismo') {
					result = this.getFichasCapturaCapitalismo(array);
				} else if (epoca == 'Neoliberalismo') {
					result = this.getFichasCapturaNeoliberalismo(array);
				}
				if (result.captura) {
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}

			//Si en las y negativas tiene almenos 4 espacios analiza esos 4 espacios
			if (dif_y_negativa >= 4) {
				//Se itera en los 4 espacios disponibles negativos en y
				for (var a = 0; a < 4; a++) {
					array[a] = {
						'i': (i - a),
						'j': j,
						'ficha': tablero[(i - a)][j]
					};
				}
				//Se verifica si se capturo
				var result = null;
				//Se verifica si se capturo
				if (epoca == 'Capitalismo') {
					result = this.getFichasCapturaCapitalismo(array);
				} else if (epoca == 'Neoliberalismo') {
					result = this.getFichasCapturaNeoliberalismo(array);
				}
				if (result.captura) {
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}


			//Se analiza la diagonal primaria de izq a der (postivo y negativo) = \
			if (dif_x_positiva >= 4 && dif_y_positiva >= 4) {
				for (var a = 0; a < 4; a++) {
					array[a] = {
						'i': (i + a),
						'j': (j + a),
						'ficha': tablero[(i + a)][(j + a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if (epoca == 'Capitalismo') {
					result = this.getFichasCapturaCapitalismo(array);
				} else if (epoca == 'Neoliberalismo') {
					result = this.getFichasCapturaNeoliberalismo(array);
				}
				if (result.captura) {
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}
			if (dif_x_negativa >= 4 && dif_y_negativa >= 4) {
				for (var a = 0; a < 4; a++) {
					array[a] = {
						'i': (i - a),
						'j': (j - a),
						'ficha': tablero[(i - a)][(j - a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if (epoca == 'Capitalismo') {
					result = this.getFichasCapturaCapitalismo(array);
				} else if (epoca == 'Neoliberalismo') {
					result = this.getFichasCapturaNeoliberalismo(array);
				}
				if (result.captura) {
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}

			//Se analiza la diagonal secundaria de der a izq (postivo y negativo) = /
			if (dif_x_positiva >= 4 && dif_y_negativa >= 4) {
				for (var a = 0; a < 4; a++) {
					array[a] = {
						'i': (i - a),
						'j': (j + a),
						'ficha': tablero[(i - a)][(j + a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if (epoca == 'Capitalismo') {
					result = this.getFichasCapturaCapitalismo(array);
				} else if (epoca == 'Neoliberalismo') {
					result = this.getFichasCapturaNeoliberalismo(array);
				}
				if (result.captura) {
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}

			if (dif_x_negativa >= 4 && dif_y_positiva >= 4) {
				for (var a = 0; a < 4; a++) {
					array[a] = {
						'i': (i + a),
						'j': (j - a),
						'ficha': tablero[(i + a)][(j - a)]
					};
				}
				var result = null;
				//Se verifica si se capturo
				if (epoca == 'Capitalismo') {
					result = this.getFichasCapturaCapitalismo(array);
				} else if (epoca == 'Neoliberalismo') {
					result = this.getFichasCapturaNeoliberalismo(array);
				}
				if (result.captura) {
					noCapturasJugador++;
					arrayStoreFichasCapturadas.push(result);
				}
			}

		}//fin verificacion ficha
		return [noCapturasJugador, arrayStoreFichasCapturadas];
	},//fin metodo
	/*Fin funcions sobre captuda de fichas*/

	//Metodo que reinicializa los valores de un jugador para salir de la mesa y ser actualizados en la session
	resetSessionJugador: function (jugador) {
		jugador._activo = false;
		jugador._room = null;
		jugador._patrocinador = null;
		jugador._noTurnosPerdidos = 0;
		jugador._noCapturas = 0;
		return jugador;
	},

	//Metodo que actualiza los valores de la session
	actualizaSessionUsuario: async function (session, jugador) {
		try {
			session.jugador = jugador;
			await session.save(); // save devuelve promesa en Mongoose 7+
			return { err: false };
		} catch (err) {
			return { err: true, desc: 'Error al actualizar sesión: ' + err };
		}
	},
	// funcion que obtiene los patrocinadores
	obtenerPatrocinadores: function (listPatrocinadoresDefault, listPatrocinadoresPago) {
    // Número de patrocinadores de pago actuales
    var numeroPatrocinadoresPago = this.getSizeCollection(listPatrocinadoresPago);

    // Si hay menos de 6 patrocinadores de pago, se agregan fichas de relleno
    if (numeroPatrocinadoresPago < 6) {
        var noFichasRelleno = Math.min(6 - numeroPatrocinadoresPago, this.getSizeCollection(listPatrocinadoresDefault));
        var arrayNumerosAleatorios = [];

        while (arrayNumerosAleatorios.length < noFichasRelleno) {
            var na = this.numeroAleatorio(this.getSizeCollection(listPatrocinadoresDefault));
            if (!arrayNumerosAleatorios.includes(na)) {
                arrayNumerosAleatorios.push(na);
                listPatrocinadoresPago.push(listPatrocinadoresDefault[na]);
            }
        }
    }

    return this.parseJsonToArray(listPatrocinadoresPago);
},



	//funcion que convierte el json de patrocinadores en array
	parseJsonToArray: function (jsonPatrocinadores) {
		var array = new Array();
		for (var p in jsonPatrocinadores) {
			var patrocinio = new Patrocinador(); // se crea un objeto de la clase patrocinador
			patrocinio.setId(jsonPatrocinadores[p]._id)
			patrocinio.setNombre(jsonPatrocinadores[p].nombre); // se pasa el valor del nombre
			patrocinio.setFicha(jsonPatrocinadores[p].ficha); // se pasa el valor de la ficha
			patrocinio.setIsDefault(jsonPatrocinadores[p].isDefault);
			array.push(patrocinio); // se agrega el objeto a un array
		}

		return array;
	},

	//Funcion que agrega y elimina usuarios de la mesa de acuerdo a los espacios disponibles o jugadores activos
	addRemovePlayers: function (sala, mesa) {
		//			console.log('---------------Ganador -----------------------');
		//			console.log('Jugadores activos: ' + mesa._noJugadoresActivos);
		//			console.log('Jugadores totales: ' + mesa._listaJugadores.length);
		//Se analiza el numero de observadores a entrar a la nueva partida
		var numeroObservadores = mesa._listaJugadores.length - mesa._noJugadoresActivos;
		//			console.log('Jugadores observadores: ' + numeroObservadores);
		//Si no hay lugar disponible en la mesa y tengo almenos un 1 observador se expulsa a un jugador activo
		if (mesa._noJugadoresActivos == 6 && numeroObservadores > 0) {
			var count = 0;
			for (var i = (mesa._noJugadoresActivos - 1); i >= 1; i--) {
				//Si el numero de elementos eliminados es igual al numero de observadores
				if (count != numeroObservadores) {
					//Se emite a el jugador expulsado un redireccionamiento
					//console.log('********Jugador a expulsar ********', mesa._listaJugadores[i]._nick);
					sala.to(mesa._noMesa).emit('redirectTime', [mesa._listaJugadores[i]._nick, '/lobby']);
					//Se elimina de la lista de jugadores activos de la mesa
					mesa._listaJugadores.splice(i, 1);
					mesa._noJugadoresActivos -= 1;
					//Contador que incrementa cada vez que se elimina un jugador
					count++;
				}
			}
		}

		//Como hubo ganador se reordenan los jugadores activos y los observadores
		if (mesa._noJugadoresActivos < 6 && mesa._noJugadoresActivos < mesa._listaJugadores.length) {
			//Se verifica si hay observadores
			var item = mesa._noJugadoresActivos;
			do {
				if (mesa._listaJugadores.length > mesa._noJugadoresActivos) {
					var result = this.asignarFicha(mesa._listaJugadores[item], mesa._listaJugadores, mesa._listaPatrocinadores, mesa._noJugadoresActivos);
					sala.to(mesa._noMesa).emit('checkUpdateJugadorSess', result[0]);
					mesa._listaJugadores[item] = result[0];
					mesa._noJugadoresActivos++;
				}
				item++;
			} while (mesa._noJugadoresActivos < 6 && mesa._noJugadoresActivos < mesa._listaJugadores.length);
		}
		return mesa;
	},

	//Funcion que invoca a un controlador y actualiza los puntos del usuario en la bd
	updatePuntosUsuario: function (jugador) {
		usuarioController.usuario.actualizaPuntosUsuarioNew(jugador._nick, jugador._creditos, function (data) {
			if (data.err) logger.error(nameModuleLogger + 'Metodo updatePuntosUsuario  Err: ' + data.desc);
		});
	},

	registerUpdateMesa: function (mesa) {
		//Se crea o actualiza la mesa en la bd
		mesaController.mesa.find(mesa._noMesa, function (data) {
			if (!data.err) {
				//Si no hubo error al consultar
				if (data.desc.length <= 0) {
					//Se registra la nueva mesa en la bd
					mesaController.mesa.add(mesa, function (data) {
						if (data.err) logger.error(nameModuleLogger + 'Metodo registerUpdateMesa  Err: ' + data.desc);
					});
				} else {
					mesaController.mesa.update(mesa, function (data) {
						if (data.err) logger.error(nameModuleLogger + 'Metodo registerUpdateMesa  Err: ' + data.desc);
					});
				}
			} else {
				logger.error(nameModuleLogger + 'Metodo registerUpdateMesa  Err: ' + data.desc);
			}
		});
	},

	increment: function (socket) {
		if (socket.request.session.jugador) {
			socket.request.session.jugador._creditos += 10;
			socket.request.session.save();
			this.updatePuntosUsuario(socket.request.session.jugador);
			socket.emit('notificacion', { 'title': socket.request.session.jugador._nick, 'msg': 'Ahora cuentas con 10pts más', 'tipo': 'notice' });
		} else {
			socket.emit('redirectToIndex', '/');
		}
	}

}