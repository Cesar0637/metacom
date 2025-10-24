var method = Patrocinador.prototype;
 
//constructor
function Patrocinador(ficha, nombre) {
	this._id = null;
	this._nombre = nombre;
	this._descripcion = null;
	this._datosContacto = null;
	this._visualizacionInicial = 0;
	this._visualizacionActual = 0;
	this._ficha = ficha;
	this._isDefault = null;
}

// set
method.setId = function(id) {
	this._id = id;
}

method.setNombre = function(nombre) {
	this._nombre = nombre;
}

method.setDescripcion = function(descripcion) {
	this._descripcion = descripcion;
}

method.setDatosContacto = function(datosContacto) {
	this._datosContacto = datosContacto;
}

method.setVisualizacionInicial = function(visualizacionInicial) {
	this._visualizacionInicial = visualizacionInicial;
}

method.setVisualizacionActual = function(visualizacionActual) {
	this._visualizacionActual = visualizacionActual;
}

method.setFicha = function(ficha) {
	this._ficha = ficha;
}

method.setIsDefault = function(isDefault) {
	this._isDefault = isDefault;
}
// get
method.getId = function() {
	return this._id;
}

method.getNombre = function() {
	return this._nombre;
}

method.getDescripcion = function() {
	return this._descripcion;
}

method.getDatosContacto = function() {
	return this._datosContacto;
}

method.getVisualizacionInicial = function() {
	return this._visualizacionInicial;
}

method.getVisualizacionActual = function() {
	return this._visualizacionActual;
}

method.getFicha = function() {
	return this._ficha;
}

method.getIsDefault = function() {
	return this._isDefault;
}
module.exports = Patrocinador;