var mongoose = require('mongoose');
var logger = require('winston');
var nameModuleLogger = "dbConfConcect : ";

const dbUri = process.env.BD_DINAMITA || 'mongodb://localhost:27017/dinamita';

// --- CONEXIÓN MODERNA CON ASYNC/AWAIT ---
const connectDB = async () => {
    try {
        // 'await' pausa la ejecución hasta que la conexión se complete
        await mongoose.connect(dbUri);
        // El resto de los eventos se configuran después de la conexión inicial.
    } catch (err) {
        // Si la conexión inicial falla, se captura el error aquí
        logger.error(nameModuleLogger + 'Error de conexión inicial a MongoDB: ' + err);
        // Termina el proceso si no se puede conectar a la base de datos
        process.exit(1);
    }
};

// --- CONFIGURACIÓN DE EVENTOS DE CONEXIÓN ---
// Se ejecutan después de que el intento de conexión inicial (connectDB) se completa.

// Cuando la conexión es exitosa
mongoose.connection.on('connected', () => {
    logger.info(nameModuleLogger + 'Mongoose default connection open to ' + dbUri);
});

// Si la conexión arroja un error después de haberse establecido
mongoose.connection.on('error', (err) => {
    logger.error(nameModuleLogger + 'Mongoose default connection error: ' + err);
});

// Cuando la conexión se desconecta
mongoose.connection.on('disconnected', () => {
    logger.error(nameModuleLogger + 'Mongoose default connection disconnected');
});

// --- MANEJO DEL CIERRE DE LA APLICACIÓN ---
// Si el proceso de Node.js termina, se cierra la conexión de Mongoose
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        logger.error(nameModuleLogger + 'Mongoose default connection disconnected through app termination');
        process.exit(0);
    } catch (err) {
        logger.error('Error al cerrar la conexión de Mongoose:', err);
        process.exit(1);
    }
});

// --- INICIAR LA CONEXIÓN Y EXPORTAR ---

// Llamamos a la función para establecer la conexión
connectDB();

// Exportamos la instancia de mongoose para que otros archivos puedan usarla
module.exports.mongoose = mongoose;