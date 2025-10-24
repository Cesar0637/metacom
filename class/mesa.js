var method = Mesa.prototype;
 
//constructor
function Mesa(noMesa, epoca, tiempoTirada, jugador, noCasillas, win, starGame, noJugadas) {
    this._noMesa = noMesa;
    this._epoca = epoca;
    this._tiempoTirada = tiempoTirada;
    this._jugador = jugador;
    
    this._noCasillas = noCasillas;
    this._startGame = starGame;
    this._win = win;
    this._noJugadas = noJugadas;
    this._ficha = null;
    this._puntosAcumulados = 0;
    //Map que almacenara los usuarios activos
    //Se inicializa la lista de jugadores
    this._listaJugadores = new Array(this._jugador);
    this._listaPatrocinadores = new Array();
    this._tablero = null;
    
    this._noJugadoresActivos = 0;
    this._turnoEnMesa = 0;
    
    this._bloqueoPorReinicio = false;
}

//setters
method.setBloqueoPorReinicio = function(bloqueoPorReinicio) {
    this._bloqueoPorReinicio = bloqueoPorReinicio;
};

method.setNoMesa = function(noMesa) {
    this._noMesa = noMesa;
};

method.setEpoca = function(epoca) {
    this._epoca = epoca;
};

method.setTiempoTirada = function(tiempoTirada) {
    this._tiempoTirada = tiempoTirada;
};

method.setNoCasilla = function(noCasillas) {
	this._noCasillas = noCasillas;
}

method.setStartGame = function(startGame) {
	this._startGame = startGame;
}

method.setWin = function(win) {
	this._win = win;
}

method.setNoJugadas = function(noJugadas) {
	this._noJugadas = noJugadas;
}

method.setFicha = function(ficha) {
	this._ficha = ficha;
}
method.setPuntosAcumulados = function(puntosAcumulados) {
	this._puntosAcumulados = puntosAcumulados;
}
method.setNoJugadoresActivos = function(noJugadoresActivos) {
    this._noJugadoresActivos = noJugadoresActivos;
};
method.setTurnoEnMesa = function(turnoEnMesa) {
    this._turnoEnMesa = turnoEnMesa;
}
//funcionn que agrega nuevos jugadores a la lista
method.setAddNuevoJugador = function(jugador) {
	this._listaJugadores.push(jugador);
};

//getters
method.getNoMesa = function() {
    return this._noMesa;
};

method.getEpoca = function() {
    return this._epoca;
};

method.getTiempoTirada = function() {
    return this._tiempoTirada;
};

method.getListaJugadores = function() {
    return this._listaJugadores;
};

method.getListaPatrocinadores = function() {
	return this._listaPatrocinadores;
}

method.getNoCasilla = function() {
	return this._noCasillas;
}

method.getStartGame = function() {
	return this._startGame;
}

method.getWin = function() {
	return this._win;
}

method.getNoJugadas = function() {
	return this._noJugadas;
}

method.getFicha = function() {
	return this._ficha;
}

method.getPuntosAcumulados = function() {
	return this._puntosAcumulados;
}
method.getNoJugadoresActivos = function() {
    return this._noJugadoresActivos;
};
method.getTurnoEnMesa = function() {
    return this._turnoEnMesa;
}

method.getBloqueoPorReinicio = function() {
	return this._bloqueoPorReinicio;
}

module.exports = Mesa;