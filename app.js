/**
 * Module dependencies
 */
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const pmx = require('pmx').init();
const favicon = require('serve-favicon');
const morgan = require('morgan');
const winston = require('winston');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const errorHandler = require('errorhandler');
const nocache = require('nocache');

// Configuración Winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, '/logs/app.log') })
    ]
});

// Importar rutas
const routesIndex = require('./routes/index');
const routesLobby = require('./routes/lobby');
const routesMesa = require('./routes/mesas');
const routesReglas = require('./routes/reglas');
const routesLogin = require('./routes/login');
const routesPanel = require('./routes/panel');
const routesSalir = require('./routes/salir');

const patrocinadorController = require('./controllers/Patrocinador');
const sioIndex = require('./routes/sio/index');

const app = express();

// --- Configuración servidor ---
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, '/public/images/favicon.ico')));

// Logger de accesos
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/logs/access.log'), { flags: 'a' });
app.use(morgan('dev', { stream: accessLogStream }));

app.use(methodOverride());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(nocache());

// --- Configuración de Sesiones ---
const sessionMiddleware = session({
    secret: 'QYxIiQd3',
    resave: false,
    saveUninitialized: true, // asegura que la cookie se envie
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/dinamita'
    }),
    cookie: { maxAge: 864000000 } // 10 días
});
app.use(sessionMiddleware);

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// --- Rutas ---
app.use(routesIndex);
app.use(routesLobby);
app.use(routesMesa);
app.use(routesReglas);
app.use(routesLogin);
app.use(routesPanel);
app.use(routesSalir);

app.use(pmx.expressErrorHandler());
if (app.get('env') === 'development') app.use(errorHandler());

// --- Servidor y Socket.IO ---
const server = http.createServer(app).listen(app.get('port'), () => {
    logger.info('Express server listening on port ' + app.get('port'));
});

const io = require('socket.io')(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Compartir sesión con Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Estado global
const usuariosConectadosLobby = {};
const statusMesas = {
    'mesa-1': false, 'mesa-2': false, 'mesa-3': false, 'mesa-4': false, 'mesa-5': false,
    'mesa-6': false, 'mesa-7': false, 'mesa-8': false, 'mesa-9': false, 'mesa-10': false
};

// --- Inicialización de la app asincrónica ---
(async () => {
    try {
        // Consultas en paralelo
        const listPatrocinadoresDefault = await patrocinadorController.patrocinadores.buscarPatrocinadoresDefault();
        const mesas = await sioIndex.obtenerListaMesas();

        // Inicializar sockets
        sioIndex.monitorIndex(io, usuariosConectadosLobby);
        require('./routes/sio/historia')(io, sessionMiddleware);
        require('./routes/sio/lobby')(io, sessionMiddleware, usuariosConectadosLobby, mesas, listPatrocinadoresDefault, statusMesas);
        require('./routes/sio/sala')(io, mesas, listPatrocinadoresDefault, statusMesas);
        require('./routes/sio/salir')(io, usuariosConectadosLobby);

        logger.info('Sockets inicializados correctamente');

    } catch (err) {
        logger.error('Error inicializando la app:', err);
    }
})();
