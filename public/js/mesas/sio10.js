/*m-10*/
function initCustom(){
	//Se establece la conexion
	socket = io.connect();
	socket.emit('connect10');
}
/*m-10*/

function listen(){
	/*m-10*/
	socket.on('selectFicha', procesaSelectFicha);
	socket.on('updateListFichas', procesaUpdateListFichas);
	socket.on('closeModalFicha', procesaCloseModalFicha);
	/*m-10*/
	
	socket.on('redirect', procesaRedirect);
	socket.on('updateJugador', procesaUpdateJugador);
	socket.on('updateListJugadores', procesaUpdateListJugadores);
	socket.on('cargaConfiguracion', procesandoCargaConfiguracion);
	socket.on('notificacion', procesaNotificacion);
	socket.on('run-time', procesaRunTime);
	socket.on('timer-decrement', procesaTimerDecrement);
	socket.on('verificaJugadorExpulsar', procesaVerificaJugadorExpulsar);
	socket.on('ganadorDefault', procesaGanadorDefault);
	socket.on('mostrarGanadorDefault', procesaMostrarGanadorDefault);
	socket.on('timer-decrement-reset', procesaTimerDecrementReset);
	socket.on('updateCapturaTurnos', procesaUpdateCapturaTurnos);
	socket.on('updateNoCapturas', procesaUpdateNoCapturas);
	socket.on('updateFichasUsers', procesaUpdateFichasUsers);
	socket.on('closeModalReset', procesaCloseModalReset);
	socket.on('pasarTurno', procesaCambiarTurno); // se pinta el movimiento correspondiente
	socket.on('pintaFicha', pintarFicha);
	socket.on('capturaFichas', pintaTablero);
	socket.on('updatePuntosMesa', procesaUpdateMesa);
	socket.on('ganador', procesaGanador);
	socket.on('bloqueaIniciarJuego', bloqueaBoton);
	socket.on('newMessage', procesaNewMessage);
	socket.on('redirectTime', procesaRedirectTime);
	socket.on('checkUpdateJugadorSess', procesaCheckUpdateJugadorSess);
}


/*Mesa 10*/
function procesaCloseModalFicha(){
	closeModal('#modalSelectFichas');
}

//funcion que muestra un dialog con las opciones para elegir una ficha con respecto a la mesa
function procesaSelectFicha(data){
	openModal('#modalSelectFichas');
	$('#contenedor-fichas').html(listGroupFichas(data));
}


function procesaUpdateListFichas(data){
	$('#contenedor-fichas').html(listGroupFichas(data));
}

function listGroupFichas(list){
	var ul = '<div class="col-md-12" style="overflow-y: auto; max-height: 250px;">';
	for(var i in list){
		console.log(i);
		ul += '<div class="col-md-3 col-xs-6 text-center">'
				+'<a id="f-'+i+'" class="clearfix" onclick="defineFicha(\'#f-'+i+'\', '+i+');">'
					+'<img src="'+list[i]._ficha+'" alt="'+list[i]._nombre+'" />'
					+'<p class="text-info">'+list[i]._nombre+'</p>'
				+'</a>'
			  +'</div>';	
	}
	ul+='</div>'
	return ul;
}

function defineFicha(link, data){
	setTimeout(function(){
		socket.emit('definePatrocinador', data, function(resultado){
			//Si el resutado es negativo quiere decir que no se asigno la ficha al usuario
			if(!resultado){
				//por lo tanto se cierra el modal
				closeModal('#modalSelectFichas');
			}
		});
	},400);
}
/*Mesa 10*/

function procesaCheckUpdateJugadorSess(data){
	if(data._nick == jugador._nick){
		socket.emit('updateSessJugador', data);
		procesaUpdateJugador(data);
	}
}


function procesaRedirectTime(data){
	if(jugador._nick == data[0]){
		setTimeout(function (){
			procesaRedirect(data[1]);
		}, 5000);
	}
}

function procesaNewMessage(data){
	//Sobre el div que contiene los mensajes se van agregando el nombre del usuario y el mensaje
	e_chat.append(itemNewMessage(data));
	//Se agrega una animacion para no tener que hacer scroll sobre el chat
	e_content_chat.animate({scrollTop: e_chat.height()}, 800);
}

function procesaGanador(data){
	mesa = data.mesa;
	if(jugador._nick == data.jugador._nick){
		jugador = data.jugador;
	}
	verificarGanador(data);
}

function procesaUpdateMesa(data){
	mesa._puntosAcumulados = data;
	e_total_puntos.html(mesa._puntosAcumulados);
}

function procesaCambiarTurno(data){
	// se pinta el turno
	$(e_jugadores.selector + ' .estado[data-jugador="' + data.turnoAnterior + '"]').removeClass('turno');
    $(e_jugadores.selector + ' .estado[data-jugador="' + data.turnoSiguiente + '"]').addClass('turno');
}

function procesaCloseModalReset(data){
	closeModal('#ganador');
	e_modal_ajustar_juego.html('');
}

function procesaUpdateJugador(data){
	jugador = data;
	e_nombreJugador.html(jugador._nick); // se obtiene el nick del usuario en pantalla
	e_puntosUsuario.html(jugador._creditos); // se obtienen los creditos del usuario
}

function procesaUpdateFichasUsers(data){
	socket.emit('updateFichaUser', data);
}

function procesaUpdateNoCapturas(data) {
	   jugador._noCapturas = data;
	   $(e_total_capturas.selector + ' span').html(jugador._noCapturas);
}

function procesaUpdateCapturaTurnos(){
	socket.emit('upCaptureTurnoSess');
}

function procesaTimerDecrementReset(data){
   if(data[1] == jugador._nick){
	   e_timer_reset_game.text(data[0] + 's');   
   }
}

function procesaMostrarGanadorDefault(data){
	if(jugador._nick == data.jugador._nick){
		jugador = data.jugador;	
	}
	mesa = data.mesa;
	verificarGanador(data);
}

function procesaGanadorDefault(data){
	mesa = data.mesa;
	if(jugador._nick == mesa._listaJugadores[0]._nick){
		socket.emit('winDefaultGame', data);
	}
}

function procesaVerificaJugadorExpulsar(nick){
	if(jugador._nick == nick){
		socket.emit('expulsaJugador');
		jugador = null;
	}
}

function procesaTimerDecrement(data){
	e_cronometro.html(data[0]);
	if(data[1] == jugador._nick){
		//pinta en rojo el cronometro del jugador en turno
		e_cronometro.css('background-color' , '#F9E83A');
	}else{
		e_cronometro.css('background-color' , '#FCF8ED');
	}
}

//Execute cronometer
function procesaRunTime(data){
	mesa = data;
	//Si el usuario que esta en la vista es el mismo que al que le toca su turno se inicia el cronometro
	if(jugador._nick == mesa._listaJugadores[mesa._turnoEnMesa]._nick){
		//Si es el mismo se ejecuta el cronometro
		var datos = [mesa._noMesa, jugador._nick];
		socket.emit('execute-timer', datos);
	}
	defineStatusJuego(mesa._startGame, mesa._turnoEnMesa);
}

//Show growls notifications
function procesaNotificacion(data) {
	if(data.tipo == 'info'){
		$.growl.notice({ title: data.title, message: data.msg });	
	}else if(data.tipo == 'danger'){
		$.growl.error({ title: data.title, message: data.msg });	
	}else{
		$.growl.warning({ title: data.title, message: data.msg });	
	}
}

//Show data user in view 
function procesaUpdateJugador(data){
	jugador = data;
	e_nombreJugador.html(jugador._nick); // show nick user
	e_puntosUsuario.html(jugador._creditos); // show points user
}

function procesaUpdateListJugadores(data){
	if(mesa != null){
		mesa._listaJugadores = data;
	}
	actualizarUsuarios(data);
}

//load all config of game
function procesandoCargaConfiguracion(data){
	mesa = data;
	var imgEpoca = "<img src='../img/mesas/"+ mesa._epoca+".png' alt='"+mesa._epoca+"' class='img-responsive center-element'>";
	e_epoca.html(imgEpoca); // se agrega al html la epoca del juego
	e_cronometro.html(mesa._tiempoTirada); //se establece el tiempo de tirada
	e_total_puntos.html(mesa._puntosAcumulados); // Se pintan los puntos acumulados de la mesa
	crearCasillas(mesa._noCasillas); // agrega al html el tablero
	
	actualizarUsuarios(mesa._listaJugadores); // actualiza la lista de usuarios
	
	//Si el tablero es diferente de null se pinta el historico para el usuario
	if(mesa._tablero != null) {
		pintarHistorico(mesa._tablero, mesa._turnoEnMesa); // se pinta el historico
	}
	bloqueaBoton(mesa._noJugadoresActivos, mesa._startGame, mesa._bloqueoPorReinicio);
	// se verifica el tipo de epoca
	if(mesa._epoca != 'Feudalismo') {
		e_total_capturas.removeClass('hidden');
		e_total_capturas.addClass('show');
		$(e_total_capturas.selector + ' span').html(jugador._noCapturas);
	} else {
		e_total_capturas.removeClass('show');
		e_total_capturas.addClass('hidden');
	}
}
