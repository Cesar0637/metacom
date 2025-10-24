function getPatrocinadores(){
	 $.ajax({
        data:  '',
        // hacemos referencia al archivo
        url:   '/patrocinadores',
        type:  'post',
        success: function(response) {
        	$('#listaPatrocinadores').html('');
           var listPatrocinadores = response;
           var lis = "";
           for (var i in listPatrocinadores){
        	   lis += pantrocinadorDinamico(listPatrocinadores[i]);
           }
           $('#listaPatrocinadores').html(lis);
       },
       error: function(error){
    	   alert('¡Oops! surgio un error: ' + error);
       }
   });
}
		
		
function pantrocinadorDinamico(data){
	var li = '<li class="list-group-item">'
				+'<div class="row">'
              		+'<div class="col-xs-2 col-md-2 text-center">'
                        + '<img src="'+data.ficha+'" class="img-responsive img-thumbnail" alt=""/>'
                        + '<div class="action text-center">'
                            +'<button id="'+data._id+'" type="button" class="btn btn-danger btn-xs" title="Delete" onclick="deletePatrocinador(\''+data._id+'\');">'
                                +'<span class="glyphicon glyphicon-trash"></span> Eliminar'
                            +'</button>'
                        +'</div>'
                    +'</div>'
                    + '<div class="col-xs-10 col-md-10">'
                    	+ '<div class="col-xs-6 col-md-6">'
                            +'<div>'
                                +'<a href="#">'+data.nombre+'</a>'
                                +'<div class="mic-info">'
                                	+'<span>Descripción</span>'
                                    +'<p>'+data.descripcion+'</p>'
                               + '</div>'
                            +'</div>'
                            +'<div class="comment-text">'
                            	+'<span>Datos de contacto</span>'
                                +'<p>'+data.datosContacto+'</p>'
                            +'</div>'
                       + '</div>'
                       + '<div class="col-xs-6 col-md-6">'
	                       +'<div>'
	                           +'<div class="mic-info text-center">'
	                           		+'<p>Vistas Iniciales: '+ data.visualizacionInicial + '</p>'
	                           		+'<p>Vistas Restantes: ' + data.visualizacionActual + '</p>'
	                           		+'<p>Juegos visualizados: ' + (data.visualizacionInicial - data.visualizacionActual) + '</p>'
	                          + '</div>'
	                       +'</div>'
	                  + '</div>'
                   	+'</div>'
               	+'</div>'
         + '</li>'
    return li;
}
		
function deletePatrocinador(id){
	$.ajax({
        data:  {id: id},
        // hacemos referencia al archivo contacto.php
        url:   '/deleteMarca',
        type:  'post',
        success: function(response) {
        	if(response != null){
        		//Se actualiza la lista de patrocinadores
        		getPatrocinadores();
        		//Se le muestra una notificacion al usuario sobre la eliminacion
        		$.growl.notice({ title: 'Exito', message: 'El patrocinador ha sido eliminado exitosamente.' });
        	}else{
        		$.growl.warning({ title: '¡Oops!', message: 'El patrocinador ha eliminar no existe' });
        	}
       },
       error: function(error){
    	   $.growl.error({ title: '¡Opops!', message: error.responseJSON.desc });
       }
   });
}