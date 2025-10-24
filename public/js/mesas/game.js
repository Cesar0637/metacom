function showNotificationStartGame(data){
	$('#start-game-notificacion #descripcion').html(data);
	$('#start-game-notificacion').addClass('show animated bounceIn');
	setTimeout(function(){
		$('#start-game-notificacion').removeClass('bounceOutLeft');
		$('#start-game-notificacion').addClass('bounceOut');
		setTimeout(function(){
			$('#start-game-notificacion').removeClass('show animated bounceOut');
		},600);
	}, 3000);
}

function salir(){
	socket.disconnect();
	procesaRedirect('/lobby');
}

// funcion que configura los datos del juego
function settingGame() {
   var data = {
       'epoca' : $("#epoca-juego").val(),
       'tiempoTirada' :  $("#tiempo-tirada").val(),
       'nick' : jugador._nick,
       'mesa' : mesa._noMesa
   };
   socket.emit('reiniciarJuego', data);
}
		
//procesa redireccionamientos
function procesaRedirect(page){
	window.location.replace(page);
}

//evento para iniciar el juego
e_btn_iniciar_juego.click(function() {
    socket.emit('iniciarJuego', mesa._noMesa);
});

//Desabilita o habilita el boton para iniciar el juego
function defineStatusJuego(startGame, turnoEnMesa){
	if (startGame) {
		e_btn_iniciar_juego.attr('disabled','disabled');
		$(e_jugadores.selector + " .estado[data-jugador="+turnoEnMesa+"]").addClass('turno');
	}else{
		e_btn_iniciar_juego.removeAttr('disabled');
	}
}

function crearCasillas(noCasillas){
    var width = 0;
	//Se obtiene el ancho del tablero si este es mayor a 300px
    if(e_content_tablero.width() > 330){
    	//Elimna el scroll
        e_tablero.removeClass('tablero-responsive');
        e_tablero.addClass('tablero');
        width = e_tablero.width() / 16;
    }else{
    	//Como la pantalla es muy pequeña se activa el scroll sobre la tabla
        e_tablero.removeClass('tablero');
        e_tablero.addClass('tablero-responsive');
        width = 20;
    }
    var tbody = "";
    for(var i = 0; i < noCasillas; i++){
        var trs = '<div class="fila">';
        for(var j = 0; j < noCasillas; j++){
            trs += 
                '<div id="'+i+'-'+j+'" class="columna casilla" onclick="clicCasilla(this);" style="width: '+width+'px; height: '+width+'px;">'
                +'</div>';
        }
        trs += '</div>';
        tbody += trs;
    }
    e_tablero.html(tbody);
}

//cambia el tamaño del tablero de manera dinamica
function resizeCasillas(){
    if (!e_tablero.is(':empty')){
        var width = 0;
       //Se obtiene el ancho del tablero si este es mayor a 300px
        if(e_content_tablero.width() > 330){
        	//Elimna el scroll
            e_tablero.removeClass('tablero-responsive');
            e_tablero.addClass('tablero');
            width = e_tablero.width() / 16;
        }else{
        	//Como la pantalla es muy pequeña se activa el scroll sobre la tabla
            e_tablero.removeClass('tablero');
            e_tablero.addClass('tablero-responsive');
            width = 20;
        }
        $(e_tablero.selector + ' div.columna').css('width', width);
        $(e_tablero.selector + ' div.columna').css('height', width);
    }  
}


//funcion que actualiza las listas de de jugadores y observadores
function actualizarUsuarios(listaJugadores) {
	var htmlJugadores = '<ul class="list-group">';
	var htmlObservadores = '<ul class="list-group">';
	
	for(var i = 0; i < listaJugadores.length; i++) {
		// se verifica que el jugador esta activo en la partida
		if(listaJugadores[i]._activo) {
			var stringLi = stringListJugadores().replace('{data}', i);
			stringLi = stringLi.replace('{ficha}', listaJugadores[i]._patrocinador.ficha);
			stringLi = stringLi.replace('{nombreFicha}', listaJugadores[i]._patrocinador.nombre);
			stringLi = stringLi.replace('{nick}', listaJugadores[i]._nick);
			htmlJugadores += stringLi;
		} else { // si no esta activo se muestra en la lista de observadores
			htmlObservadores += stringListObservadores().replace('{nick}',  listaJugadores[i]._nick);
		}
	}
	htmlJugadores += '</ul>';
    htmlObservadores += '</ul>';
	// se agregan los datos a cada una de la lista jugadores u observadores
	e_jugadores.html(htmlJugadores);
	e_observadores.html(htmlObservadores);
}

function stringListJugadores(){
	var listUser = '<li class="estado list-group-item" data-jugador="{data}" style="padding:10px;">'+
						'<img src = "{ficha}" alt="{nombreFicha}" class="listFicha"/>'+
						'<p>{nick}</p>'+
					'</li>';
	return listUser;
}

function stringListObservadores(){
	var listObservador = '<li class="list-group-item" style="border: none;">{nick}</li>';
	return listObservador;
}
		
// function pinta la el historico del juego
function pintarHistorico(tablero, turnoEnMesa) {
	pintaTablero(tablero);
	$(e_jugadores.selector +' .estado[data-jugador="' + turnoEnMesa + '"]').addClass('turno');
}

// function pinta la el historico del juego
function pintaTablero(tablero) {
	$(".casilla").html('');
	// se itera en fila
	for(var i = 0; i < tablero.length; i++) {
		for(var j = 0; j < tablero.length; j++) { // se itera en columna
			if(tablero[i][j] != '') {
				pintarFicha(tablero[i][j], i + '-' + j); // se pinta la ficha
			}
        }
	}
}

// funcion que pinta la ficha
function pintarFicha(src, elemento) {
	var id = '#' + elemento;
	if (!$(id).find('img').length) {
		$(id).html('<img src="' + src + '" alt="imagen" class="img-responsive" style="min-width: 18px; margin: 0px auto"/>');
	}
}

function bloqueaBoton(noJugadores, startGame, bloqueo){
	if (noJugadores >= 2 && !startGame && !bloqueo && jugador._activo) {
		// si el numero de jugadores es mayor a 2 y no se ha inidiado el juego y el cliente esta activo sobre la mesa
		//Se habilita el boton
		e_btn_iniciar_juego.removeAttr('disabled');				
	}else{
		e_btn_iniciar_juego.attr('disabled','disabled');
	}
}


function clicCasilla(id) {
	var id = $(id).attr("id");
	movimientoJugador(id);
}

function movimientoJugador(id) {
	socket.emit('process_move', [mesa._noMesa, id]);
}

//funcion que verifica ganador
function verificarGanador(data) {
	// se verifica si hay un ganador
    if (data.ganador != '') {
    	e_modal_title.html(data.jugador._nick);
    	e_modal_creditos_usuario.html(jugador._creditos);
    	e_modal_creditos_mesa.html(mesa._puntosAcumulados);
        openModal('#ganador');
        // se verifica el nick ganador para mostrar la configuracion de un nuevo juego
        if(jugador._nick == data.jugador._nick) {
        	//Se actualizan los creditos del jugador del lado del cliente
        	e_modal_creditos_usuario.html(jugador._creditos);	
        	e_modal_ajustar_juego.html(configGame());
        }
    }
}

// funcion que muestra un formulario al ganador para iniciar el juego nuevamente
function configGame() {
	html = '<label><i class="fa fa-cogs"></i> Ajustes del nuevo juego</label>';
	html += '<form id="form-ajustes" role="form">';
	html += '<div class="row">';
	html += '<div class="col-xs-offset-3 col-md-offset-3 col-sm-offset-3 col-md-6 col-sm-6 col-xs-6 text-left" style="margin-top: 20px; margin-bottom: 20px;">';
	html += '<div class="well">';
	html += '<div style="margin-bottom: 20px;">';
	html += '<span>Tiempo de tirada</span>';
	html += '<select id="tiempo-tirada" class="form-control">';
	html += '<option value="5">5 seg.</option>';
	html += '<option value="10">10 seg.</option>';
	html += '<option value="15" selected="selected">15 seg.</option>';
	html += '<option value="20">20 seg.</option>';
	html += '</select>';
	html += '</div>';
	html += '<div style="margin-bottom: 20px;">';
	html += '<span>Seleccione la epoca</span>';
	html += '<select id="epoca-juego" class="form-control">';
	html += '<option value="Feudalismo">Feudalismo</option>';
	html += '<option value="Capitalismo" selected="selected">Capitalismo</option>';
	html += '<option value="Neoliberalismo">Neoliberalismo</option>';
	html += '</select>';
	html += '</div>';
	html += '<button id="reiniciar" type="button" onclick="settingGame();" class="btn btn-primary pull-right">Reiniciar <i class="fa fa-refresh"></i></button>';
	html += '<div class="clearfix"></div>';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '</form>';
	return html;
}



//funcion que abre el modal
function openModal(modalName) {
    $(modalName).appendTo('body').modal('show');
 //modal-dialog
    $(modalName + " .modal-dialog").draggable();
}

//funcion que cierra el modal
function closeModal(modalName) {
    $(modalName).modal('hide');
}

function itemNewMessage(data){
	if($(e_chat.selector + ' li').length == 0){
		e_chat.html('');	
	}
	
	var imgUrl = '';
	if(data[0].patrocinador){
		 imgUrl = data[0].patrocinador.ficha;				
	}else{
		imgUrl = '../../images/icon-mesas/observador.png';
	}
	var li = strinLiChat().replace('{imgUrl}', imgUrl);
	li = li.replace('{nick}', data[0].nick);
	li = li.replace('{msg}', data[1]);
	return li;
}

function strinLiChat(){
	var li = '<li class="left clearfix">' +
				'<span class="chat-img pull-left">' +
			    	' <img src="{imgUrl}" alt="Ficha" style="width: 40px; height: 40px; border-radius: 50%;" />' +
				'</span>' +
				'<div class="chat-body clearfix">'+
			    	'<div class="header">'+
			        	'<strong class="primary-font">{nick} dice: </strong>'+ 
		        	'</div>'+
			    	'<p>{msg}</p>'+
			    '</div>'+
			'</li>';
	return li;
}


e_btn_send_msg.click(function(e){
	e.preventDefault();
	var msg = e_input_msg.val();
	if(msg != ''){
		socket.emit('sendMessage', [jugador, msg, mesa._noMesa]);
		e_input_msg.val('')
	}else{
		var data =  { 'title' : '¡Oops!, lo sentimos' , 'msg' : 'El campo de mensaje es requerido', 'tipo' : 'danger'};
		procesaNotificacion(data);
	}
});