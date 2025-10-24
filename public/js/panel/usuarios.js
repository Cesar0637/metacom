function getUsuarios(){
	 $.ajax({
        data:  '',
        // hacemos referencia al archivo contacto.php
        url:   '/usuarios',
        type:  'post',
        success: function(response) {
           var listUsuarios = response;
           var trs = "";
           for (var i in listUsuarios){
        	   trs += usuarioDinamico(listUsuarios[i]);
           }
           $('#tableUsuarios .tbody').append(trs);
       },
       error: function(error){
    	   alert('¡Oops! surgio un error: ' + error);
       }
   });
}


function usuarioDinamico(data){
	var fi = "No hay fecha";
	if (data.fecha_ingreso){
		fi = data.fecha_ingreso.toString().substring(0, 10);
	}
	var tr = '<tr>' +
				'<td class="nombre">'+data.nick+'</td>'+
				'<td class="edad">'+data.edad+'</td>'+
				'<td class="genero">'+data.genero+'</td>'+
				'<td class="puntos">'+data.puntos+'</td>'+
				'<td class="fecha">'+fi+'</td>'+
			 '</tr>';
    return tr;
}

//Actualizacion de los puntos configurados en la bd
$( "#formUpdatePuntos" ).submit(function( event ) {
	//Se bloquea el boton
	var btnUpdatePuntos = $('#btnUpdatePuntos');
	btnUpdatePuntos.attr('disabled','disabled');
	
	//Se valida el input de puntos
	var puntos = $('#txtPuntos').val();
	var exprNumber = /^([0-9])*$/;
	//Si el valor de puntos no es vacio
	//y si es un numero
	if(puntos != "" && exprNumber.test(puntos)){
		$.ajax({
	        data:  {txtPuntos: puntos},
	        // hacemos referencia al archivo contacto.php
	        url:   '/updatePoints',
	        type:  'post',
	        success: function(response) {
	        	$('#txtPuntos').val('');
	        	if(!response.desc){
	        		$.growl.notice({ title: 'Exito', message: 'Los puntos se actualizaron correctamente' });
	        		btnUpdatePuntos.removeAttr('disabled');
	        	}else{
	        		$.growl.error({ title: '¡Oops!', message: 'Surgio un problema, intentalo más tarde' });	        		
	        	}
	       },
	       error: function(error){
	    	   for (var i in error.responseJSON.desc){
	    		   $.growl.error({ title: '¡Opops!', message: error.responseJSON.desc[i].msg});
	    	   }
	    	   btnUpdatePuntos.removeAttr('disabled');
	       }
	   });		
	}
	else{
		btnUpdatePuntos.removeAttr('disabled');
		$.growl.error({ title: '¡Opops!', message: 'El campo puntos es requerido y debe ser numérico'});
	}
  event.preventDefault();
});
