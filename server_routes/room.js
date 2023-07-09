const express = require('express');

const { getIp, log, accessWebFile, antiDDos } = require("../server_modules/kit");

class ApiRoom {

    constructor () {

        this.router = express.Router();

        this.db = {
            rooms: {},
            publicRooms: new Set()
        };

        this.addEvent(this);

    };

    addEvent(me) {

        this.router.post('/accessroom/makeroom', antiDDos, async function (req, res) {

            const base = req.body;
        
            const info = {
                ip: getIp(req),
                // host: req.headers.host,
                roomcode: base.roomcode
            };
        
            const roominfo = me.db.rooms[info.roomcode];
        
            if (roominfo) {
        
                return res.json({ status: -300, result: { reason: 'Room already\'t exists!' } });
        
            };
        
            log(`{p}Create room requested!\n{c}roomcode : ${info.roomcode}`);
        
            me.db['rooms'][info.roomcode] = {
                hostIp: info.ip
            };
        
            res.json({ status: 0, result: { entered: 'true' } });
        
        });

        this.router.get('/getrooms', async function (req, res) {

            if (!req.params.pub || req.params.pub == 'true' ? false : true) {

                return res.json({ status: 100, result: { reason: 'Current data is not allowed!' } });

            };

            const rooms = [];

            for (const room of me.db['publicRooms']) {

                rooms.push({
                    roomname: room.room_name,
                    roomcode: room.room_code,
                    headcount: room.clients.size
                });

            };
        
            res.json({ status: 0, result: rooms });
        
        });
        
        this.router.get('/:roomcode', async function (req, res) {
        
            if (!me.db['rooms'][req.params.roomcode]) {
        
                return res.redirect('/error?code=301');
        
            };
        
            res.send(await accessWebFile('html', 'room.html'));
        
        });

    };

};

module.exports.ApiRoom = ApiRoom;