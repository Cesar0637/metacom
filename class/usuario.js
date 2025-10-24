var method = Usuario.prototype;

//constructor
function Usuario(nick, edad, genero, creditos, room) {
    this._nick = nick;
    this._edad = edad;
    this._genero = genero;
    this._creditos = creditos;
    this._room = room;
    this._patrocinador = null;
    this._activo = false;
    this._noTurnosPerdidos = 0;
    this._noCapturas = 0;
}

//setters
method.setNick = function(nick) {
    this._nick = nick;
};
method.setEdad = function(edad) {
    this._edad = edad;
};
method.setGenero = function(genero) {
    this._genero = genero;
};
method.setCreditos = function(creditos) {
    this._creditos = creditos;
};
method.setRoom = function(room) {
    this._room = room;
};
method.setPatrocinador = function(patrocinador) {
    this._patrocinador = patrocinador;
};
method.setActivo = function(activo) {
    this._activo = activo;
};
method.setNoTurnosPerdidos = function(noTurnosPerdidos) {
    this._noTurnosPerdidos = noTurnosPerdidos;
};
method.setNoCapturas = function(noCapturas) {
    this._noCapturas = noCapturas;
};
//getters
method.getNick = function() {
    return this._nick;
};
method.getEdad = function() {
    return this._edad;
};
method.getGenero = function() {
    return this._genero;
};
method.getCreditos = function() {
    return this._creditos;
};
method.getRoom = function() {
    return this._room;
};
method.getPatrocinador = function() {
    return this._patrocinador;
};
method.getActivo = function() {
    return this._activo;
};
method.getNoTurnosPerdidos = function() {
    return this._noTurnosPerdidos;
};
method.getNoCapturas = function() {
    return this._noCapturas;
};
module.exports = Usuario;