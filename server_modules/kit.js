const fs = require("fs");
const path = require("path");
const requestIp = require("request-ip")
const rateLimit = require('express-rate-limit');

const config = require("../config.json");

const { superlog } = require("./superlog");
const Logger = new superlog();

function setRoomCookie(res, cookieInfos) {

    for (const key in cookieInfos) {

        const cookieData = cookieInfos[key];

        res.cookie(key, cookieData.value, cookieData.config);

    };

};

function getDefaultPath() {

    return path.join(__dirname, '../', config.fronted_path);

};

async function accessWebFile(...paths) {

    try {
        
        return fs.readFileSync(path.join(getDefaultPath(), ...paths)).toString();

    } catch (e) {

        throw new Error(e);

    };

};

function log(content) {

    Logger.log(content);

};

function saveLog() {

    Logger.saveLog();

};

function getIp(req) {

    return requestIp.getClientIp(req);

};

function detectBot(ua) {

    return (new RegExp(config['ua_db_bot'].join("|"),"i")).test(ua);

};

exports.setRoomCookie = setRoomCookie;
exports.getDefaultPath = getDefaultPath;
exports.accessWebFile = accessWebFile;
exports.log = log;
exports.saveLog = saveLog;
exports.getIp = getIp;
exports.detectBot = detectBot;

exports.antiDDos = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 50,
	delayMs: 100,
	handler(req, res, next, option) {
		res.status(option.statusCode).json({
            status: -998,
			result: 'Too many requests, please try again later.'
		});
	}
});