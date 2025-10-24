//Funcion proveniente del form que solicita el nick del usuario
console.log("Intentando conectar a:", window.location.host + '/historia');

var socket = io('/historia', {
    withCredentials: true
});

socket.on('connect', function() {
    console.log("✅ CONECTADO - Socket ID:", socket.id);
    console.log("Namespace:", socket.nsp);
});

socket.on('connect_error', function(error) {
    console.log("❌ ERROR de conexión:", error);
});

socket.on('disconnect', function(reason) {
    console.log("🔌 DESCONECTADO - Razón:", reason);
});


$('#form-historia').on('submit', function(e){
	e.preventDefault();
	
	if($("#terminos").is(':checked')){

		//Se valida si ingreso un genero
		if($('input[name=option]:checked').val()){
			//variable para validar que el nombre del usuario
			//  no este ocupado
			var newAtributsJugador = {
				edad : $('#edad').val(),
				genero : $('input[name=option]:checked').val()
			};	
			//Se valida la edad del usuario
			var e = parseInt(newAtributsJugador.edad);
			if(isNaN(e)){
				$.growl.error({ title: 'Ups, edad no valida', message: 'Ingrese un valor numérico' });
			}else{
				if(e >= 5 && e <= 100){
					console.log(newAtributsJugador)
					socket.emit('registraNuevoUsuario', newAtributsJugador, function(data){
						if(!data.err){
							procesaRedirect(data.page);
						}else{
							$.growl.error({ title: '¡Oops!', message: data.desc});
						}
					});
					
				}else{
					$.growl.error({ title: 'Ups, edad no valida', message: 'Debes tener al menos 5 años y máximo 100 años' });
				}
			}		
		}else{
			$.growl.error({ title: 'Campo obligatorio', message: 'No ha seleccionado su sexo' });
		}
	}
	else{
		$.growl.error({ title: 'Campo obligatorio', message: 'Debe aceptar la "Pólitica de Datos y Comportamiento"' });
	}
});


//funcion que procesa un redireccionamiento proveniente del server
function procesaRedirect(page){
	window.location.replace(page);
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