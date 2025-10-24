

//funcion que obtiene todos los patrociandores
function getPatrocinadores(){
	 $.ajax({
        data:  '',
        url:   '/patrocinadores',
        type:  'post',
        success: function(response) {
           var slider = $('#slider-patrocinadores ul.slides');
           slider.html('');
           var listPatrocinadores = response;
           var lis = "";
           for (var i in listPatrocinadores){
        	   lis += pantrocinadorDinamico(listPatrocinadores[i]);
           }
           slider.html(lis);
       },
       error: function(error){
    	   alert('¡Oops! surgio un error: ' + error);
       }
   });
}
//crea los patrociandores dinamicamente
function pantrocinadorDinamico(data){
	var li = stringLi().replace('{pathImg}', data.ficha);
	return li;
}

function stringLi(){
	var li = "<li><img src='{pathImg}' class='img-rounded'></li>";
	return li;
}

//funcion init
function init(){
	//Se cargan las funciones que van a gestinar las funciones provenientes del servidor
	//Se le solicita al server la lista de usuarios conectados
	socket.emit('getNoUsuariosConectadosLobby');
	//El server envia una respuesta con el no de usuarios conectados en el lobby
	socket.on('sendNoUsuariosConectadosLobby', procesaNoUsuariosConectados);
	
	//El server envia los usuarios de cada mesa
	socket.on('sendUsersMesas', procesaUsersMesas);
	//procesar redireccionamiento
	socket.on('redirectToMesa', procesaRedirect);
	//procesar redireccionamiento
	socket.on('redirectToIndex', procesaRedirect);
	//block button
	socket.on('buttonBlock', procesaBlockButton);
	//desblock button
	socket.on('buttonDesBlock', procesaDesBlockButton);
	//notificaciones
	socket.on('notificacion', procesaNotificacion);
// 			defineColor();
	//nuevo mensaje de chat
	socket.on('newMessage', procesaNewMessage);
}

//muestra los mensajes en el chat
function procesaNewMessage(data){	
	//Sobre el div que contiene los mensajes se van agregando el nombre del usuario y el mensaje
	e_chat.append(itemNewMessage(data));
	//Se agrega una animacion para no tener que hacer scroll sobre el chat
	e_content_chat.animate({scrollTop: e_chat.height()}, 800);

	//Se muestra una notificacion al recibir un mensaje de chat	
	var dataNotification =  {
		title : data[0] + ' dice : ',
		msg : data[1]
	};
	procesaNotificacion(dataNotification);
}

function itemNewMessage(data){
	if($(e_chat.selector + ' li').length == 0){
		e_chat.html('');	
	}
		
	var li = strinLiChat();
	li = li.replace('{nick}', data[0]);
	li = li.replace('{msg}', data[1]);
	return li;
}

function strinLiChat(){
	var li = '<li class="left clearfix">' +				
				'<div class="chat-body clearfix">'+
			    	'<div class="header">'+
			        	'<strong class="primary-font">{nick} dice: </strong>'+ 
		        	'</div>'+
			    	'<p>{msg}</p>'+
			    '</div>'+
			'</li>';
	return li;
}


//funcion que procesa los usuarios de cada mesa
function procesaUsersMesas(data) {
	console.log(JSON.stringify(data));
	var count = 0;
	var inner = ".inner.back";
	//Se itera sobre el json de mesas con su key y value
	jQuery.each(data, function(mesa, valor) {
		count ++;
		var title = $(inner + ' #title-'+mesa);
		var text = "";
		//Si el valor de la mesa es diferente de null entonces quiere decir
		//que ya se ha creado
		if(valor != null){
			//Se define el titulo de la mesa
			text = mesa + ' <br/> Época: ' + valor._epoca;
			//Como esta creada se limpia el form
			$(inner + ' #contentData-'+mesa).html('');
			//se obtiene la lista de jugadores
			var array = new Array();
			array = valor._listaJugadores;
			//Se itera sobre la lista de jugadores y se pintan en html
			//Se pinta la lista de usuarios conectados y la epoca de esa mesa
			var listaUsuarios = '<ul>';
				for(var x = 0; x < array.length; x++){
					//Si el jugador se encuentra activo en la mesa (jugando partida) lo pinta
					if(array[x]._activo){
						listaUsuarios += '<li>';
							listaUsuarios += array[x]._nick + ' | ' + array[x]._creditos; 
						listaUsuarios += '</li>';	
					}
				}
			listaUsuarios += '</ul>';
			var button =  '<button type="button" id="btn-join-'+mesa+'" class="btn btn-default" onclick="joinMesa(\''+mesa+'\');">'
						 	+'<span class="glyphicon glyphicon-hand-up"></span>'
						 +'</button>';
						 
			listaUsuarios+=button;
			$(inner + ' #contentData-'+mesa).append(listaUsuarios);
		} else {
			//Se define el titulo de la mesa
			text = mesa + ' | Vacía';
			var html = stringFormMesa(count);
			$(inner + ' #contentData-mesa-' + count).html(html);
		}
		title.html(text.toUpperCase());
	});
}

function stringFormMesa(count){
	var form = 
	'<form id="form-mesa-'+count+'">'+
	'<div class="form-group">'+
	'<label for="tiempoTirada">Tiempo</label>'+
	'<select id="tiempoTirada" class="form-control" required="required">';
	for(var t = 5; t <= 20; t+=5) {
		form += '<option value="' + t + '">' + t + ' Seg.</option>';
	}
	form += 
	'</select>'+
	'</div>'+
	'<div class="form-group">'+
    '<label for="epoca">Época</label>'+
    '<select id="epoca" class="form-control" required="required">'+
    '<option value="Feudalismo">Feudalismo</option>'+
    '<option value="Capitalismo">Capitalismo</option>'+
    '<option value="Neoliberalismo">Neoliberalismo</option>'+
    '</select>'+
    '</div>'+
    '<button type="button" id="btn-mesa-'+count+'" class="btn btn-default" onclick="selectMesa('+count+');">'+
    '<span class="glyphicon glyphicon-hand-up"></span>'+
    '</button>'+
    '</form>';
	return form;
}

function joinMesa(mesa){
	$('#btn-join-'+mesa).attr('disabled','disabled');
	//Se recibe la mesa a la que se desea unir el usuario
	
	setTimeout(function() {
		socket.emit('joinMesa', mesa);	
	}, 400);
}

function procesaRedirect(page){
	window.location.replace(page);
}

//funcion que carga la lista de usuarios conectados enviados por el server
function procesaNoUsuariosConectados(data){
	//clean list usuarios conectados
	$('#noUsuariosConectados').html('');
	$('#noUsuariosConectados').append(data);
}

function defineColor(){
	//json de class de colores
	var color = {0:'bg-lisbon', 1:'bg-paris', 2:'bg-belgrade'
				,3:'bg-moscow', 4:'bg-new-delhi', 5:'bg-tel-aviv'
				,6:'bg-cairo', 7:'bg-san-franciso', 8:'bg-tokyo'
				,9:'bg-sydney'};
	//array que contendra los numeros aleatorios sin repetirse
	var define = new Array;
	//Se itera
	var i = 0;
	while(i < 10){
		//numero aleatorio 0-10
		var aleatorio = Math.floor(Math.random() * (10-0+0)) + 0;
		var ban = false;//simboliza que el numero no se repetio
		//Se verifica si el numero generado no se repite iterando sobre los que ya se han agregado
		for(j = 0; j < define.length; j++){
			//Si el valor del arreglo en j es igual al aleatorio
			if(define[j] == aleatorio){
				ban = true; //la bandera indica que se ha repetido
				break;
			}
		}
		//Si la bandera indica que no se ha repetido
		if(ban != true){
			//Se pinta la clase sobre bg
			$('#bg-'+(i+1)).addClass(color[aleatorio]);
//				console.log('El numero aleatorio no se repitio se agrega la clase: '+ color[aleatorio] +' a bg-' + (i+1));
			//Se almacena el numero aleatorio
			define[i] = aleatorio;
			//Se incrementa i
			i++;
		}
	}
}


//funcion que le emite al server que mesa selecciono el usuario para unirse
function selectMesa(mesa){
	$('#btn-mesa-'+mesa).attr('disabled','disabled');
	//Se bloquea el boton
	setTimeout(function() {
		socket.emit('blockButton', mesa);
		var form = '#form-mesa-'+mesa;
		var noMesa  = 'mesa-'+mesa;
		var epoca = $(form+' #epoca').val();
		var tiempoTirada = $(form+' #tiempoTirada').val();
		var data = [noMesa, epoca, tiempoTirada];
		socket.emit('selectedMesa', data);
	}, 400);
}


function procesaBlockButton(data){
	$('#btn-mesa-'+data).attr('disabled','disabled');
}

function procesaDesBlockButton(data){
	$('#btn-'+data).removeAttr('disabled');
}

//Contactar al administrador
$( "#formContacto" ).submit(function( event ) {
	$('#btnContactar').attr('disabled','disabled');
	//Se validan inputs
	var mail = $('#txtMail').val();
	var msg = $('#txtMsg').val();
	if(mail != "" && mail.length != 0){
		if(msg != "" && msg.length != 0){
			$.ajax({
		        data:   $( this ).serialize(),
		        // hacemos referencia al archivo contacto.php
		        url:   '/contactar',
		        type:  'post',
		        success: function(response){
		        	if(response.desc == "fail-c"){
		        		$('#btnContactar').removeAttr('disabled');
		        		$.growl.error({ title: 'Ups, captcha no valido', message: 'Intentelo nuevamente' });
		        	}
		        	else if(response.desc == "fail-v"){
		        		$('#btnContactar').removeAttr('disabled');
		        		for(var i in response.err){
		        			$.growl.error({ title: '¡Oops!', message: response.err[i].msg });
		        		}
		        	}else if(response.desc == "fail-m"){
		        		closeModal('#modalContactar');
		        		$.growl.error({ title: '¡Oops!', message: 'Surgio un problema inesperado, intentalo más tartde' });
		        	}else{
		        		closeModal('#modalContactar');
		        		$.growl.notice({ title: '¡Exito!', message: 'Tu solicitud ha sido enviada satisfactoriamente' });
		        	}
		        	
		        	$('#txtMail').val('');
		     		$('#txtMsg').val('');
		        	grecaptcha.reset();
		       },
		       error: function(error){
		    	   console.log('Error: ' + error);
		       }
		   });		
		}else{
			$('#btnContactar').removeAttr('disabled');
			$.growl.error({ title: 'Ups, mensaje no valido', message: 'Ingrese un mensaje valido' });
		}
	}else{
		$('#btnContactar').removeAttr('disabled');
		$.growl.error({ title: 'Ups, email no valido', message: 'Ingrese un email valido' });
	}
  	event.preventDefault();
});


//Show growls notifications
function procesaNotificacion(data) {
	if($('#creditos')){
       updateCreditos();
    }

	if(data.tipo == 'info'){
		$.growl.notice({ title: data.title, message: data.msg });	
	}else if(data.tipo == 'danger'){
		$.growl.error({ title: data.title, message: data.msg });	
	}else{
		$.growl.warning({ title: data.title, message: data.msg });	
	}
}