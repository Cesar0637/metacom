function getMesas(){
	 $.ajax({
        data:  '',
        // hacemos referencia al archivo contacto.php
        url:   '/admin_mesas',
        type:  'post',
        success: function(response) {
           var listMesas = response;
           var trs = "";
           for (var i in listMesas){
        	   trs += mesaDinamico(listMesas[i]);
           }
           $('#tableMesas .tbody').append(trs);
       },
       error: function(error){
    	   console.log(error);
    	   alert('¡Oops! surgio un error: ' + error);
       }
   });
}


function mesaDinamico(data){
	var total = 0;
	total += data.feudalismo + data.capitalismo + data.neoliberalismo;
	var tr = '<tr>' +
				'<td>'+data.noMesa+'</td>'+
				'<td>'+data.feudalismo+'</td>'+
				'<td>'+data.capitalismo+'</td>'+
				'<td>'+data.neoliberalismo+'</td>'+
				'<td>'+total+'</td>'+
			 '</tr>';
    return tr;
}