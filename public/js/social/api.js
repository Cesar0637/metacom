//fb sdk
window.fbAsyncInit = function() {
    FB.init({
      appId      : '1627463147468540',
      xfbml      : true,
      version    : 'v2.3'
    });
};

(function(d, s, id){
 var js, fjs = d.getElementsByTagName(s)[0];
 if (d.getElementById(id)) {return;}
 js = d.createElement(s); js.id = id;
 js.src = "//connect.facebook.net/en_ES/sdk.js";
 fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


//twitter api
window.twttr = (function (d,s,id) {
var t, js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return; js=d.createElement(s); js.id=id;
js.src="//platform.twitter.com/widgets.js"; fjs.parentNode.insertBefore(js, fjs);
return window.twttr || (t = { _e: [], ready: function(f){ t._e.push(f) } });
}(document, "script", "twitter-wjs"));


//share fb
$( "#btnFB" ).on( "click", function(){
    FB.ui(
              {
                method: 'feed',
                name : 'JUEGOS METACON',
                caption : 'METACON | JUEGOS DINAMITA',
                description : 'JUEGA METACON Y DESPIERTA',
                message : 'JUEGA METACON Y DESPIERTA',
                link: urlShare,
              },
              function(response) {
                if (response && !response.error_code) {
                    incrementPuntos('#btnFB');
                } else {
                  console.log('Error al compartir en fb: ' + response.error_code);
                }
              }
    );
});


//share twitter
function reward_user( event ) {
    if ( event ) {
        // do something
    	incrementPuntos('#btnTwitter');
    }
}

twttr.ready(function (twttr) {
    twttr.events.bind('tweet', reward_user);
});

//share google plus
$( "#btnGoogle" ).on( "click", function(){
	var url = "https://plus.google.com/share?url="+urlShare; 
	window.open(url, '','menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
	incrementPuntos('#btnGoogle');
});

function incrementPuntos(btn){
	$(btn).prop('disabled', true);
  socket.emit('increment');
}


function updateCreditos(){
	$.ajax({
        data:  '',
        // hacemos referencia al archivo contacto.php
        url:   '/ucredits',
        type:  'post',
        success: function(response) {
        	$('#creditos').html('');
        	$('#creditos').append('$'+response.response);
       	},
       	error: function(error){
       		console.log('Error: ' + error);
       	}
   });	
}