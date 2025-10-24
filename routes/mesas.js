var express = require('express');
var router = express.Router();

router.get('/mesas', function(req, res) {
    const session = req.session;
    if (!session.jugador) return res.redirect('/');
    res.redirect('/lobby');
});

router.get('/mesas/:no_mesa', function(req, res) {
    const session = req.session;
    if (!session.jugador) return res.redirect('/');

    const no_mesa = req.params.no_mesa;
    const esMesaValida = /^mesa-([1-9]|10)$/.test(no_mesa);

    if (esMesaValida) {
        // Renderiza la vista correspondiente dentro de views/mesas/
        res.render(`mesas/${no_mesa}`, { jugador: session.jugador });
    } else {
        res.redirect('/lobby');
    }
});

module.exports = router;
