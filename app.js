/**
 * app.js — versión completa, estable y con sesión compartida
 * entre Express y Socket.IO (para que /salir reconozca la sesión del jugador)
 */

// ==============================
// Dependencias principales
// ==============================
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var session = require('express-session');
const MongoStore = require('connect-mongo');
var pmx = require('pmx').init();
var favicon = require('serve-favicon');
var morgan_logger = require('morgan');
var logger = require('winston');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var async = require('async');
var nocache = require('nocache');
var dbConf = require('./dbConfConect.js');

// ==============================
// Configuración de Winston
// ==============================
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

// ==============================
// Importación de rutas
// ==============================
var routesIndex = require('./routes/index');
var routesLobby = require('./routes/lobby');
var routesMesa = require('./routes/mesas');
var routesReglas = require('./routes/reglas');
var routesLogin = require('./routes/login');
var routesPanel = require('./routes/panel');
var routesSalir = require('./routes/salir');
var patrocinadorController = require('./controllers/Patrocinador');

// ==============================
// Configuración de Express
// ==============================
var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// --- Favicon y logs de acceso ---
app.use(favicon(path.join(__dirname, '/public/images/favicon.ico')));
var accessLogStream = fs.createWriteStream(path.join(__dirname, '/logs/access.log'), { flags: 'a' });
app.use(morgan_logger('dev', { stream: accessLogStream }));

// --- Middlewares base ---
app.use(methodOverride());
app.use(cookieParser());  // ✅ CRÍTICO: Debe ir ANTES de session
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==============================
// Configuración de Sesiones
// ==============================
const sessionMiddleware = session({
    secret: 'QYxIiQd3',
    resave: false,
    saveUninitialized: true,   // <-- Envía cookie incluso sin sesión activa
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/dinamita'
    }),
    cookie: {
        maxAge: 864000000, // 10 días
        httpOnly: true,    // ✅ AÑADIDO para seguridad
        secure: false      // ✅ AÑADIDO (true en producción con HTTPS)
    }
});
app.use(sessionMiddleware);

// --- Archivos estáticos y no cache ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());

// ==============================
// Rutas HTTP
// ==============================
app.use(routesIndex);
app.use(routesLobby);
app.use(routesMesa);
app.use(routesReglas);
app.use(routesLogin);
app.use(routesPanel);
app.use(routesSalir);

// ==============================
// Manejo de errores
// ==============================
app.use(pmx.expressErrorHandler());
if ('development' === app.get('env')) {
    app.use(errorHandler());
}

// ==============================
// Servidor HTTP + Socket.IO
// ==============================
var server = http.createServer(app).listen(app.get('port'), function () {
    logger.info('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- Compartir sesión con Socket.IO (FIX MEJORADO) ---
io.engine.use(sessionMiddleware);  // ✅ AÑADIDO: Comparte sesión a nivel engine

io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// ==============================
// Variables globales de juego
// ==============================
var usuariosConectadosLobby = {};
var statusMesas = {
    'mesa-1': false, 'mesa-2': false, 'mesa-3': false, 'mesa-4': false, 'mesa-5': false,
    'mesa-6': false, 'mesa-7': false, 'mesa-8': false, 'mesa-9': false, 'mesa-10': false
};

// ==============================
// Inicialización de módulos Socket.IO
// ==============================
var sioIndex = require('./routes/sio/index');
sioIndex.monitorIndex(io, usuariosConectadosLobby);

(async () => {
    try {
        // Consultas iniciales
        const [listPatrocinadoresDefault, mesas] = await Promise.all([
            patrocinadorController.patrocinadores.buscarPatrocinadoresDefault(),
            sioIndex.obtenerListaMesas()
        ]);

        // Namespaces principales
        require('./routes/sio/historia')(io, sessionMiddleware);
        require('./routes/sio/lobby')(io, sessionMiddleware, usuariosConectadosLobby, mesas, listPatrocinadoresDefault, statusMesas);
        require('./routes/sio/sala')(io, mesas, listPatrocinadoresDefault, statusMesas);
        require('./routes/sio/salir')(io, usuariosConectadosLobby);

        logger.info("Socket.IO namespaces cargados correctamente ✅");

    } catch (err) {
        logger.error("Error inicializando sockets: " + err);
    }
})();