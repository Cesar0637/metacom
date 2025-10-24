/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var session = require('express-session');
const MongoStore = require('connect-mongo'); // Sintaxis moderna
var pmx = require('pmx').init();
var favicon = require('serve-favicon');
var morgan_logger = require('morgan');
var logger = require('winston');

// === CONFIGURACIÓN DE WINSTON ===
logger.configure({
    level: 'info',
    format: logger.format.combine(
        logger.format.colorize(),
        logger.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logger.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
    ),
    transports: [
        new logger.transports.Console(),
        new logger.transports.File({ filename: path.join(__dirname, '/logs/app.log') })
    ]
});
// === FIN CONFIGURACIÓN WINSTON ===

var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var async = require('async');
var nocache = require('nocache');
var dbConf = require('./dbConfConect.js');

// Importar rutas
var routesIndex = require('./routes/index');
var routesLobby = require('./routes/lobby');
var routesMesa = require('./routes/mesas');
var routesReglas = require('./routes/reglas');
var routesLogin = require('./routes/login');
var routesPanel = require('./routes/panel');
var routesSalir = require('./routes/salir');
var patrocinadorController = require('./controllers/Patrocinador');

var app = express();

// --- Configuración del servidor y Middleware ---
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, '/public/images/favicon.ico')));
var accessLogStream = fs.createWriteStream(path.join(__dirname, '/logs/access.log'), { flags: 'a' });
app.use(morgan_logger('dev', { stream: accessLogStream }));
app.use(methodOverride());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Configuración de Sesiones ---
// CAMBIO IMPORTANTE: saveUninitialized: true
// Esto hace que Express envíe la cookie de sesión al cliente en la primera respuesta HTTP.
// Alternativa: crear la sesión explícitamente en la ruta '/' (pero esto es más sencillo).
const sessionMiddleware = session({
    secret: 'QYxIiQd3',
    resave: false,
    saveUninitialized: true,   // <--- cambiado a true para asegurar que la cookie se envie al cliente
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/dinamita'
    }),
    cookie: {
        maxAge: 864000000 // 10 dias
    }
});
app.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());

// --- Definición de Rutas ---
app.use(routesIndex);
app.use(routesLobby);
app.use(routesMesa);
app.use(routesReglas);
app.use(routesLogin);
app.use(routesPanel);
app.use(routesSalir);

app.use(pmx.expressErrorHandler());
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

// --- Creación del Servidor y Socket.IO ---
var server = http.createServer(app).listen(app.get('port'), function () {
    logger.info('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Comparte la misma sesión con Socket.IO (llama al middleware de sesión para cada socket)
io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// --- Lógica de la Aplicación con Socket.IO ---
var usuariosConectadosLobby = {};
var statusMesas = {
    'mesa-1': false, 'mesa-2': false, 'mesa-3': false, 'mesa-4': false, 'mesa-5': false,
    'mesa-6': false, 'mesa-7': false, 'mesa-8': false, 'mesa-9': false, 'mesa-10': false
};

var sioIndex = require('./routes/sio/index');
sioIndex.monitorIndex(io, usuariosConectadosLobby);

// En app.js - VERIFICAR ESTA LÍNEA

(async () => {
    try {
        // Ejecutar ambas consultas en paralelo con Promise.all
        listPatrocinadoresDefault = await patrocinadorController.patrocinadores.buscarPatrocinadoresDefault();
        mesas = await sioIndex.obtenerListaMesas();
     

        require('./routes/sio/historia')(io, sessionMiddleware);
        require('./routes/sio/lobby')(io,sessionMiddleware, usuariosConectadosLobby, mesas, listPatrocinadoresDefault, statusMesas);
        require('./routes/sio/sala')(io, mesas, listPatrocinadoresDefault, statusMesas);
        require('./routes/sio/salir')(io, usuariosConectadosLobby);

    } catch (err) {
        logger.error(err);
    }
})();
