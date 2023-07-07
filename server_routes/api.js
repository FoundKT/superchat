const express = require('express');
const router = express.Router();

const { ChatForServer } = require("../server_modules/chat");
const chat = new ChatForServer();
const { getIp, log, antiDDos, setRoomCookie } = require("../server_modules/kit");

const db = {
    rooms: {}
};

router.post('/accessroom/createroom', antiDDos, async function (req, res) {

    const base = req.body;

    const info = {
        ip: getIp(req),
        host: req.headers.host,
        roomname: base.roomname
    };

    const roominfo = chat.createRoom(info);

    log(`{p}Create room requested!\n{c}roomname : ${info.roomname}\n{c}roomcode : ${roominfo.roomcode}\n{c}sessionkey : ${roominfo.sessionkey}`);

    setRoomCookie(res, {
        'last_session_key': {
            value: roominfo.sessionkey,
            config: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        },
        'last_room_code': {
            value: roominfo.roomcode,
            config: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        },
        'last_room_name': {
            value: info.roomname,
            config: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        },
        'user_host': {
            value: true,
            config: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        }
    });

    res.json({ status: 0, result: { roomcode: roominfo.roomcode } });

    db.rooms[roominfo.roomcode] = {
        session_key: roominfo.sessionkey,
        room_name: info.roomname
    };

});

router.post('/accessroom/enterroom', antiDDos, async function (req, res) {

    const base = req.body;

    const info = {
        ip: getIp(req),
        host: req.headers.host,
        roomcode: base.roomcode
    };

    const roominfo = db.rooms[info.roomcode];

    if (!roominfo) {

        return res.json({ status: -300, result: { reason: 'Room doesn\'t exists!' } });

    };

    log(`{p}Enter room requested!\n{c}roomcode : ${info.roomcode}`);

    setRoomCookie(res, {
        'last_session_key': {
            value: roominfo.session_key,
            config: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        },
        'last_room_code': {
            value: info.roomcode,
            config: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        },
        'last_room_name': {
            value: roominfo.room_name,
            config: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        },
        'user_host': {
            value: false,
            config: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        }
    });

    res.json({ status: 0, result: { entered: 'true' } });

});

module.exports = router;