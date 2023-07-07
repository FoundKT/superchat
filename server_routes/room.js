const express = require('express');
const router = express.Router();

const { getIp, log, accessWebFile, antiDDos } = require("../server_modules/kit");

const db = {
    rooms: {}
};

router.post('/accessroom/makeroom', antiDDos, async function (req, res) {

    const base = req.body;

    const info = {
        ip: getIp(req),
        // host: req.headers.host,
        roomcode: base.roomcode
    };

    const roominfo = db.rooms[info.roomcode];

    if (roominfo) {

        return res.json({ status: -300, result: { reason: 'Room already\'t exists!' } });

    };

    log(`{p}Create room requested!\n{c}roomcode : ${info.roomcode}`);

    db['rooms'][info.roomcode] = {
        hostIp: info.ip
    };

    res.json({ status: 0, result: { entered: 'true' } });

});

router.get('/:roomcode', async function (req, res) {

    if (!db['rooms'][req.params.roomcode]) {

        return res.redirect('/error?code=301');

    };

    res.send(await accessWebFile('html', 'room.html'));

});

module.exports = router;