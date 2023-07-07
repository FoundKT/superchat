const express = require('express');
const router = express.Router();

const config = require("../config.json");
const { antiDDos } = require("../server_modules/kit");

router.get('/frontendpath', antiDDos, async function (req, res) {

    res.json({ status: 0, result: config['fronted_path'] });

});

router.get('/socketaddress', antiDDos, async function (req, res) {

    res.json({ status: 0, result: { host: config['socket_host'], port: config['socket_port'] } });

});

router.get('/packetalgorithm', antiDDos, async function (req, res) {

    res.json({ status: 0, result: { algorithm: config['defualt_algorithm'] } });

});

router.get('/errordb', antiDDos, async function (req, res) {

    res.json({ status: 0, result: { maintext: config['errorDB']['maintext'], errortext: config['errorDB'][req.query.code] } });

});

module.exports = router;