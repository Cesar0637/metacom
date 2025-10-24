// routes/inicio.js
const express = require('express');
const router = express.Router();

// Ruta principal
router.get('/', (req, res) => {
    console.log("Ruta actual:", req.path);
    console.log(">>> Entró a ruta '/' en router inicio.js <<<");

    const session = req.session || {};
  

    const jugador = session.jugador || {};
    const nick = jugador._nick || jugador.nick;
    const edad = jugador._edad || jugador.edad;

    if (edad) {
        console.log("Jugador tiene edad → redirigiendo a /lobby");
        return res.redirect('/lobby');
    } else if (nick) {
        console.log("Jugador tiene nick → redirigiendo a /historia");
        return res.redirect('/historia');
    } else {
        console.log("Sin sesión → renderizando vista 'inicio'");
        return res.render('inicio');
    }
});

// Ruta /historia
router.get('/historia', (req, res) => {
    console.log(">>> Entró a ruta '/historia' en router inicio.js <<<");

    const session = req.session || {};


    const jugador = session.jugador || {};
    const nick = jugador._nick || jugador.nick;
    const edad = jugador._edad || jugador.edad;
   
    if (edad) {
        console.log("Jugador con edad → redirigiendo a /lobby");
        return res.redirect('/lobby');
    } else if (nick) {
        console.log("Jugador con nick → renderizando 'historia'");
        return res.render('historia', { jugador }); 
    } else {
        console.log("Sin sesión → redirigiendo a /");
        return res.redirect('/');
    }
});

module.exports = router;
