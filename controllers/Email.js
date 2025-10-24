//http://www.nodemailer.com/
//https://github.com/andris9/nodemailer-smtp-transport
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
module.exports = {
	mailer : {	
			//trasnporter
			transporter : function(){ 
				var smtp = 
					nodemailer.createTransport(smtpTransport({
					  service: "Zoho",
					  debug: true,
					  auth: {
					    user: "contacto@metacon.net",
					    pass: "QYxIiQd3"
					  }
					}));
				return smtp;
			},//fin function transporter
			
			
			//funcion que retorna el diseño de email a enviar
			templateMail : function(options){
				var template = 
					'<html>' +
						'<head>' +
						    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'+
						    '<meta property="og:title" content="[METACON] Juegos"> ' +
						    '<title>[METACON] Juegos</title>' +
						'</head>' +
						'<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="-webkit-text-size-adjust: none;margin: 0;padding: 0;background-color: #FAFAFA;width: 100%;">' +
						'<center>'+
			        		'<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="backgroundTable" style="margin: 0;padding: 0;background-color: #FAFAFA;height: 100%;width: 100%;">' +
			            		'<tbody><tr>' +
			                		'<td align="center" valign="top" style="border-collapse: collapse;">' +
			                        '<table border="0" cellpadding="10" cellspacing="0" width="600" style="background-color: #FAFAFA;">' +
			                            '<tbody><tr>' +
			                                '<td valign="top" style="border-collapse: collapse;">' +
			                                    '<table border="0" cellpadding="10" cellspacing="0" width="100%">' +
			                                    	'<tbody><tr>' +
			                                        	'<td valign="top" style="border-collapse: collapse;">' +
			                                            	'<div style="color: rgb(80, 80, 80); font-family: Arial; font-size: 10px; line-height: 100%; text-align: left;">' +
			                                        			'<span><span><a href="http://metacon.net/">METACON | JUEGOS DINAMITA</a></span></span></div>' +
			                                            '</td>' +
			                                        '</tr>' +
			                                    '</tbody></table>' +
			                                '</td>' +
			                            '</tr>' +
			                        '</tbody></table>' +
			                        
			                    	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateContainer" style="border: 1px solid #DDDDDD;background-color: #FFFFFF;">'+
			                        	'<tbody><tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateHeader" style="background-color: #FFFFFF;border-bottom: 0;">' +
			                                        '<tbody>'+
			                                        	'<tr>'+
				                                            '<td class="headerContent" style="border-collapse: collapse; color: rgb(32, 32, 32); font-family: Arial; font-size: 34px; font-weight: bold; line-height: 100%; padding: 0px; text-align: center; vertical-align: middle;" pardot-region="header_image" pardot-data="">'+	
				                                            	'<img alt="Dinamita" src="http://res.cloudinary.com/trndesarrollo/image/upload/c_scale,w_100/v1430859867/mskw07ujbxrl3qoxck0h.png" title="h3ikzwburlrxfyqtpmlz.png" style="float: left;">' +
				                                            	'<h1 style="  float: left;font-size: 35px;margin: 32px;color: #2A68BB;">METACON</h1>' +
				                                            '</td>'+
			                                        	'</tr>'+
			                                        	'<tr>' +
			                                        		'<td>' +
			                                        			'<table border="0" cellpadding="0" cellspacing="0" width="100%" class="ecxmcnDividerBlock" style="border-collapse:collapse;">' +
																    '<tbody class="ecxmcnDividerBlockOuter">' +
																        '<tr>' +
																            '<td class="ecxmcnDividerBlockInner" style="padding:18px;">' +
																                '<table class="ecxmcnDividerContent" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top-width:1px;border-top-style:solid;border-top-color:#999999;border-collapse:collapse;">' +
																                    '<tbody><tr><td><span></span></td></tr>' +
																                '</tbody></table>' +
																            '</td>' +
																        '</tr>' +
																    '</tbody>' +
																'</table>' +
			                                        		'</td>' +
			                                        	'</tr>' +
			                                    	'</tbody>' +
			                                	'</table>' +
			                                '</td>'+
			                            '</tr>'+
			                        	'<tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateBody">'+
			                                    	'<tbody><tr>'+
			                                            '<td valign="top" class="bodyContent" style="border-collapse: collapse;background-color: #FFFFFF;">'+
			                                                '<table border="0" cellpadding="20" cellspacing="0" width="100%">'+
			                                                    '<tbody><tr>'+
			                                                        '<td valign="top" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="std_content00" style="color: rgb(80, 80, 80); font-family: Arial; font-size: 14px; line-height: 150%; text-align: left;">'+
																			'<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;">'+
																				'Hola, '+options.nick+' <br>'+
																				'Tu solicitud se llevo acabo exitosamente, a continuación te presentamos los resultados preliminares:' +
																			'</p><br>'+
																			'<ul style="margin-top:0pt;margin-bottom:0pt;">'+
																				'<li dir="ltr" style="list-style-type: disc; font-size: 15px; color: rgb(0, 0, 0); background-color: transparent; vertical-align: baseline;">'+
																					'<p dir="ltr" style="line-height:1.15;margin-top:0pt;margin-bottom:0pt;">'+
																						'Total de Puntos: ' + options.puntos +
																					'</p>'+
																				'</li>'+
																			'</ul>&nbsp;' +
																			'<p dir="ltr" style="line-height:1.15;margin-top:0pt;margin-bottom:0pt;">'+
																				'Gracias por participar en Juegos Dinamita.'+
																			'</p></div></td></tr></tbody></table>'+
			                                            '</td>'+
			                                        '</tr></tbody></table>'+
			                                '</td>'+
			                            '</tr>'+
			                        	'<tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="10" cellspacing="0" width="600" id="templateFooter" style="background-color: #FFFFFF;border-top: 0;">'+
			                                    	'<tbody><tr>'+
			                                        	'<td valign="top" class="footerContent" style="border-collapse: collapse;">'+
			                                                '<table border="0" cellpadding="10" cellspacing="0" width="100%">'+
			                                                    '<tbody><tr>'+
			                                                        '<td colspan="2" valign="middle" id="social" style="border-collapse: collapse;background-color: #FAFAFA;border: 0;">'+
			                                                            '<div pardot-region="std_social" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: center;">'+
			                                                            	'<a href="http://metacon.net/">metacon.net</a> <br/>'+
			                                                            	'<img src="http://res.cloudinary.com/trndesarrollo/image/upload/v1433344453/qr_img_vefevh.png" alt="QR METACON">'+
			                                                            '</div>'+
			                                                            '<em>Recuerda imprimir desde las opciones de configuración de tu cliente de correo.</em><br>'+
			                                                        '</td>'+
			                                                    '</tr>'+
			                                                    '<tr>'+
			                                                        '<td valign="top" width="350" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="std_footer" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: left;">'+
																			'<em>Todos los derechos reservados a DINAMITA.</em><br>'+
			                                                            '</div>'+
			                                                        '</td>'+
			                                                        '<td valign="top" width="190" id="monkeyRewards" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="monkeyrewards" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: left;">'+
			                                                            '</div>'+
			                                                        '</td>'+
			                                                    '</tr>'+
			                                                    '<tr>'+
			                                                        '<td colspan="2" valign="middle" id="utility" style="border-collapse: collapse;background-color: #FFFFFF;border: 0;"></td>'+
			                                                    '</tr></tbody></table>'+
			                                            '</td>'+
			                                        '</tr></tbody></table>'+
			                                '</td>'+
			                            '</tr></tbody></table>'+
			                        '<br></td></tr>'+
			            '</tbody></table>'+
			        '</center>'+
			    '</body>'+
			'</html>';
				
			return template;
			},
		
			//funcion que retorna el diseño de email a enviar
			templateMailContacto : function(options){
				
				var recibeInformacionPatrociandor = "";
				if(options.recibirInfoPatrocinador){
					recibeInformacionPatrociandor = "DESEO RECIBIR INFORMACIÓN SOBRE CÓMO SER UN PATROCINADOR DEL DESARROLLO COGNITIVO NACIONAL.";
				}
				
				var template = 
					'<html>' +
						'<head>' +
						    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'+
						    '<meta property="og:title" content="[METACON] Juegos"> ' +
						    '<title>[METACON] Juegos</title>' +
						'</head>' +
						'<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="-webkit-text-size-adjust: none;margin: 0;padding: 0;background-color: #FAFAFA;width: 100%;">' +
						'<center>'+
			        		'<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="backgroundTable" style="margin: 0;padding: 0;background-color: #FAFAFA;height: 100%;width: 100%;">' +
			            		'<tbody><tr>' +
			                		'<td align="center" valign="top" style="border-collapse: collapse;">' +
			                        '<table border="0" cellpadding="10" cellspacing="0" width="600" style="background-color: #FAFAFA;">' +
			                            '<tbody><tr>' +
			                                '<td valign="top" style="border-collapse: collapse;">' +
			                                    '<table border="0" cellpadding="10" cellspacing="0" width="100%">' +
			                                    	'<tbody><tr>' +
			                                        	'<td valign="top" style="border-collapse: collapse;">' +
			                                            	'<div style="color: rgb(80, 80, 80); font-family: Arial; font-size: 10px; line-height: 100%; text-align: left;">' +
			                                            	'<span><span><a href="http://metacon.net/">METACON | JUEGOS DINAMITA</a></span></span></div>' +
			                                            '</td>' +
			                                        '</tr>' +
			                                    '</tbody></table>' +
			                                '</td>' +
			                            '</tr>' +
			                        '</tbody></table>' +
			                        
			                    	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateContainer" style="border: 1px solid #DDDDDD;background-color: #FFFFFF;">'+
			                        	'<tbody><tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateHeader" style="background-color: #FFFFFF;border-bottom: 0;">' +
			                                        '<tbody>'+
			                                        	'<tr>'+
				                                            '<td class="headerContent" style="border-collapse: collapse; color: rgb(32, 32, 32); font-family: Arial; font-size: 34px; font-weight: bold; line-height: 100%; padding: 0px; text-align: center; vertical-align: middle;" pardot-region="header_image" pardot-data="">'+	
				                                            	'<img alt="Dinamita" src="http://res.cloudinary.com/trndesarrollo/image/upload/c_scale,w_100/v1430859867/mskw07ujbxrl3qoxck0h.png" title="h3ikzwburlrxfyqtpmlz.png" style="float: left;">' +
				                                            	'<h1 style="  float: left;font-size: 35px;margin: 32px;color: #2A68BB;">METACON</h1>' +
				                                            '</td>'+
			                                        	'</tr>'+
			                                        	'<tr>' +
			                                        		'<td>' +
			                                        			'<table border="0" cellpadding="0" cellspacing="0" width="100%" class="ecxmcnDividerBlock" style="border-collapse:collapse;">' +
																    '<tbody class="ecxmcnDividerBlockOuter">' +
																        '<tr>' +
																            '<td class="ecxmcnDividerBlockInner" style="padding:18px;">' +
																                '<table class="ecxmcnDividerContent" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top-width:1px;border-top-style:solid;border-top-color:#999999;border-collapse:collapse;">' +
																                    '<tbody><tr><td><span></span></td></tr>' +
																                '</tbody></table>' +
																            '</td>' +
																        '</tr>' +
																    '</tbody>' +
																'</table>' +
			                                        		'</td>' +
			                                        	'</tr>' +
			                                    	'</tbody>' +
			                                	'</table>' +
			                                '</td>'+
			                            '</tr>'+
			                        	'<tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateBody">'+
			                                    	'<tbody><tr>'+
			                                            '<td valign="top" class="bodyContent" style="border-collapse: collapse;background-color: #FFFFFF;">'+
			                                                '<table border="0" cellpadding="20" cellspacing="0" width="100%">'+
			                                                    '<tbody><tr>'+
			                                                        '<td valign="top" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="std_content00" style="color: rgb(80, 80, 80); font-family: Arial; font-size: 14px; line-height: 150%; text-align: left;">'+
																			'<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;">'+
																				'Hola, buenas noticias has recibido una nueva notificación <br>'+
																				'A continuación te presentamos la información del mensaje:' +
																			'</p><br>'+
																			'<ul style="margin-top:0pt;margin-bottom:0pt;">'+
																				'<li dir="ltr" style="list-style-type: disc; font-size: 15px; color: rgb(0, 0, 0); background-color: transparent; vertical-align: baseline;">'+
																					'<p dir="ltr" style="line-height:1.15;margin-top:0pt;margin-bottom:0pt;">'+
																						'E-mail: ' + options.mail +
																					'</p>'+
																				'</li>'+
																				'<li dir="ltr" style="list-style-type: disc; font-size: 15px; color: rgb(0, 0, 0); background-color: transparent; vertical-align: baseline;">'+
																					'<p dir="ltr" style="line-height:1.15;margin-top:0pt;margin-bottom:0pt;">'+
																						'Mensaje: <br/>' + options.msg +
																					'</p>'+
																				'</li>'+
																			'</ul>&nbsp;' +
																			'<p dir="ltr" style="line-height:1.15;margin-top:0pt;margin-bottom:0pt;">'+
																				recibeInformacionPatrociandor +
																			'</p>'+
																			'</div></td></tr></tbody></table>'+
			                                            '</td>'+
			                                        '</tr></tbody></table>'+
			                                '</td>'+
			                            '</tr>'+
			                        	'<tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="10" cellspacing="0" width="600" id="templateFooter" style="background-color: #FFFFFF;border-top: 0;">'+
			                                    	'<tbody><tr>'+
			                                        	'<td valign="top" class="footerContent" style="border-collapse: collapse;">'+
			                                                '<table border="0" cellpadding="10" cellspacing="0" width="100%">'+
			                                                    '<tbody><tr>'+
			                                                        '<td colspan="2" valign="middle" id="social" style="border-collapse: collapse;background-color: #FAFAFA;border: 0;">'+
			                                                            '<div pardot-region="std_social" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: center;">'+
			                                                            	'<a href="http://metacon.net/">metacon.net</a> <br/>'+
			                                                            	'<img src="http://res.cloudinary.com/trndesarrollo/image/upload/v1433344453/qr_img_vefevh.png" alt="QR METACON">'+
			                                                            '</div>'+
			                                                        '</td>'+
			                                                    '</tr>'+
			                                                    '<tr>'+
			                                                        '<td valign="top" width="350" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="std_footer" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: left;">'+
			                                                            	'<em>Todos los derechos reservados a DINAMITA.</em><br>'+
			                                                            '</div>'+
			                                                        '</td>'+
			                                                        '<td valign="top" width="190" id="monkeyRewards" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="monkeyrewards" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: left;">'+
			                                                            '</div>'+
			                                                        '</td>'+
			                                                    '</tr>'+
			                                                    '<tr>'+
			                                                        '<td colspan="2" valign="middle" id="utility" style="border-collapse: collapse;background-color: #FFFFFF;border: 0;"></td>'+
			                                                    '</tr></tbody></table>'+
			                                            '</td>'+
			                                        '</tr></tbody></table>'+
			                                '</td>'+
			                            '</tr></tbody></table>'+
			                        '<br></td></tr>'+
			            '</tbody></table>'+
			        '</center>'+
			    '</body>'+
			'</html>';
			return template;
		  	},

		  	//funcion que retorna el diseño de email a enviar
			templateResultadosAdmin : function(options){
				var template = 
					'<html>' +
						'<head>' +
						    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'+
						    '<meta property="og:title" content="[METACON] Juegos"> ' +
						    '<title>[METACON] Juegos</title>' +
						'</head>' +
						'<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="-webkit-text-size-adjust: none;margin: 0;padding: 0;background-color: #FAFAFA;width: 100%;">' +
						'<center>'+
			        		'<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="backgroundTable" style="margin: 0;padding: 0;background-color: #FAFAFA;height: 100%;width: 100%;">' +
			            		'<tbody><tr>' +
			                		'<td align="center" valign="top" style="border-collapse: collapse;">' +
			                        '<table border="0" cellpadding="10" cellspacing="0" width="600" style="background-color: #FAFAFA;">' +
			                            '<tbody><tr>' +
			                                '<td valign="top" style="border-collapse: collapse;">' +
			                                    '<table border="0" cellpadding="10" cellspacing="0" width="100%">' +
			                                    	'<tbody><tr>' +
			                                        	'<td valign="top" style="border-collapse: collapse;">' +
			                                            	'<div style="color: rgb(80, 80, 80); font-family: Arial; font-size: 10px; line-height: 100%; text-align: left;">' +
			                                        			'<span><span><a href="http://metacon.net/">METACON | JUEGOS DINAMITA</a></span></span></div>' +
			                                            '</td>' +
			                                        '</tr>' +
			                                    '</tbody></table>' +
			                                '</td>' +
			                            '</tr>' +
			                        '</tbody></table>' +
			                        
			                    	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateContainer" style="border: 1px solid #DDDDDD;background-color: #FFFFFF;">'+
			                        	'<tbody><tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateHeader" style="background-color: #FFFFFF;border-bottom: 0;">' +
			                                        '<tbody>'+
			                                        	'<tr>'+
				                                            '<td class="headerContent" style="border-collapse: collapse; color: rgb(32, 32, 32); font-family: Arial; font-size: 34px; font-weight: bold; line-height: 100%; padding: 0px; text-align: center; vertical-align: middle;" pardot-region="header_image" pardot-data="">'+	
				                                            	'<img alt="Dinamita" src="http://res.cloudinary.com/trndesarrollo/image/upload/c_scale,w_100/v1430859867/mskw07ujbxrl3qoxck0h.png" title="h3ikzwburlrxfyqtpmlz.png" style="float: left;">' +
				                                            	'<h1 style="  float: left;font-size: 35px;margin: 32px;color: #2A68BB;">METACON</h1>' +
				                                            '</td>'+
			                                        	'</tr>'+
			                                        	'<tr>' +
			                                        		'<td>' +
			                                        			'<table border="0" cellpadding="0" cellspacing="0" width="100%" class="ecxmcnDividerBlock" style="border-collapse:collapse;">' +
																    '<tbody class="ecxmcnDividerBlockOuter">' +
																        '<tr>' +
																            '<td class="ecxmcnDividerBlockInner" style="padding:18px;">' +
																                '<table class="ecxmcnDividerContent" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top-width:1px;border-top-style:solid;border-top-color:#999999;border-collapse:collapse;">' +
																                    '<tbody><tr><td><span></span></td></tr>' +
																                '</tbody></table>' +
																            '</td>' +
																        '</tr>' +
																    '</tbody>' +
																'</table>' +
			                                        		'</td>' +
			                                        	'</tr>' +
			                                    	'</tbody>' +
			                                	'</table>' +
			                                '</td>'+
			                            '</tr>'+
			                        	'<tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateBody">'+
			                                    	'<tbody><tr>'+
			                                            '<td valign="top" class="bodyContent" style="border-collapse: collapse;background-color: #FFFFFF;">'+
			                                                '<table border="0" cellpadding="20" cellspacing="0" width="100%">'+
			                                                    '<tbody><tr>'+
			                                                        '<td valign="top" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="std_content00" style="color: rgb(80, 80, 80); font-family: Arial; font-size: 14px; line-height: 150%; text-align: left;">'+
																			'<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;">'+
																				'Hola, Administrador <br>'+
																				'El jugador '+ options.nick +' ha recibido los siguientes resultados preliminares:' +
																			'</p><br>'+
																			'<ul style="margin-top:0pt;margin-bottom:0pt;">'+
																				'<li dir="ltr" style="list-style-type: disc; font-size: 15px; color: rgb(0, 0, 0); background-color: transparent; vertical-align: baseline;">'+
																					'<p dir="ltr" style="line-height:1.15;margin-top:0pt;margin-bottom:0pt;">'+
																						'Total de Puntos: ' + options.puntos +
																					'</p>'+
																				'</li>'+
																			'</ul>&nbsp;' +
			                                            '</td>'+
			                                        '</tr></tbody></table>'+
			                                '</td>'+
			                            '</tr>'+
			                        	'<tr>'+
			                            	'<td align="center" valign="top" style="border-collapse: collapse;">'+
			                                	'<table border="0" cellpadding="10" cellspacing="0" width="600" id="templateFooter" style="background-color: #FFFFFF;border-top: 0;">'+
			                                    	'<tbody><tr>'+
			                                        	'<td valign="top" class="footerContent" style="border-collapse: collapse;">'+
			                                                '<table border="0" cellpadding="10" cellspacing="0" width="100%">'+
			                                                    '<tbody><tr>'+
			                                                        '<td colspan="2" valign="middle" id="social" style="border-collapse: collapse;background-color: #FAFAFA;border: 0;">'+
			                                                            '<div pardot-region="std_social" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: center;">'+
			                                                            	'<a href="http://metacon.net/">metacon.net</a> <br/>'+
			                                                            	'<img src="http://res.cloudinary.com/trndesarrollo/image/upload/v1433344453/qr_img_vefevh.png" alt="QR METACON">'+
			                                                            '</div>'+
			                                                            '<em>Recuerda imprimir desde las opciones de configuración de tu cliente de correo.</em><br>'+
			                                                        '</td>'+
			                                                    '</tr>'+
			                                                    '<tr>'+
			                                                        '<td valign="top" width="350" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="std_footer" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: left;">'+
																			'<em>Todos los derechos reservados a DINAMITA.</em><br>'+
			                                                            '</div>'+
			                                                        '</td>'+
			                                                        '<td valign="top" width="190" id="monkeyRewards" style="border-collapse: collapse;">'+
			                                                            '<div pardot-region="monkeyrewards" style="color: #707070;font-family: Arial;font-size: 12px;line-height: 125%;text-align: left;">'+
			                                                            '</div>'+
			                                                        '</td>'+
			                                                    '</tr>'+
			                                                    '<tr>'+
			                                                        '<td colspan="2" valign="middle" id="utility" style="border-collapse: collapse;background-color: #FFFFFF;border: 0;"></td>'+
			                                                    '</tr></tbody></table>'+
			                                            '</td>'+
			                                        '</tr></tbody></table>'+
			                                '</td>'+
			                            '</tr></tbody></table>'+
			                        '<br></td></tr>'+
			            '</tbody></table>'+
			        '</center>'+
			    '</body>'+
			'</html>';
				
			return template;
			},
			
			
	}//fin mailer
};