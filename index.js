const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require('cors');
const crypto = require("crypto");
const requestIp = require("request-ip");
const cookieParser = require("cookie-parser");

const { ChatForServer } = require("./server_modules/chat");
const { getDefaultPath, log, saveLog } = require("./server_modules/kit");
const config = require("./config.json");

const chat = new ChatForServer();
const app = express();
const router = express.Router();

app.set('port', config.express_port);
app.use(express.static(getDefaultPath(), {
    etag: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());
app.use(router);
app.use(cookieParser(config.master_key));

app.use('/', require('./server_routes/index'));
app.use('/room', require('./server_routes/room'));
app.use('/api', require('./server_routes/api'));
app.use('/config', require('./server_routes/config'));

app.all('*', async function (req, res) {

    try {

        const user = {
            ip: requestIp.getClientIp(req),
            host: req.headers.host,
            origin: req.originalUrl
        };
    
        log(`{p}Error detected!\n{c}ip : ${user.ip}\n{c}host : ${user.host}${user.origin}`);
    
        res.redirect('/error?code=404');

    } catch (e) {

        throw new Error(e);

    };

});

router.use(function (req, res, next) {

    try {

        const user = {
            ip: requestIp.getClientIp(req),
            host: req.headers.host,
            origin: req.originalUrl
        };
    
        log(`{p}Web access detected!\n{c}ip : ${user.ip}\n{c}host : ${user.host}${user.origin}`);

    } catch (e) {

        throw new Error(e);

    };

    try {

        if (req.headers['content-type'] === 'application/json;') {
            
            req.headers['content-type'] = 'application/json';

        };

    } catch (e) {

        throw new Error(e);

    };

    next();

});

http.createServer(app).listen(app.get('port'), async function () {

    log(`{p}Express server started!\n{c}port : ${config.express_port}`);

    chat.openSocket({
        port: config['socket_port']
    });

});

process.on('beforeExit', async () => {
    await saveLog();
});

process.on('SIGINT', async () => {
    await saveLog();
    process.exit(0);
});

process.on('uncaughtException', async (error) => {
    console.log(error);
    await saveLog();
    process.exit(1);
});