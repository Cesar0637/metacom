function chekValidateFile(element, max_size){
	var ban = false;
	//Se remueve la notificacion de erro dentro del elemento especificado
	var p = $(element).next();
	p.next().remove();
	  //is empty
	  if($(element).val() != ''){
	      //GET THE FILE AND SUBMIT IT TO THE SERVER WITH AJAX CALL 
	      //Se verifica el tamaño del input
	      var file = $(element)[0].files[0];
	      //Se verficia el tamanio en bytes max 1Mb
	      if(file.size > max_size){
	          $(element).next().after( "<span class='text-danger' id='error_file'>¡Opps! El archivo execede el peso permitido.</span>" );                                        
	          $(element).val('');
	          ban = false;
	      }        
	      //Se verifica el el tipo de archivo
	      else if (!file.type.match('.(png)|(jpg)|(jpeg)')) {
	          $(element).next().after( "<span class='text-danger' id='error_file'>¡Opps! Solo se adminte imagenes (PNG, JPEG).</span>");                                        
	          $(element).val('');
	          ban = false;
	      }        
	      else{
	          ban = true;
	      }   
	  }else{
	      ban = false;
	  }    
	  return ban;
}