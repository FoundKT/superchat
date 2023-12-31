const config = require("../config.json");
const WebSocket = require("ws");
const { getIp, log } = require("./kit");
const { VirtualUser } = require("./user");
const { newCipher } = require('./crypto');
const { packetConstruct, packetCrypto } = require('./packet');
const newcrypto = new newCipher();
const packetCipher = new packetCrypto(config, newcrypto, new packetConstruct());


class ChatForServer {

    constructor() {

        this.operation = {
            raw_clients_map: new Map(),
            rooms: {},
            publicRooms: new Set(),
            allowed_keys: new Set()
        };

    };

    setMiddelWare(middelware) {
      
        this.middelware = middelware;
        
    };

    createSessionKey(hostinfo) {

        const user = hostinfo;
        const base = `${Date.now()}|${newcrypto.randomChars(3)}|${user.ip}`;
        const sessionkey = newcrypto.encrypt(base);

        return sessionkey;

    };

    createRoomCode() {

        return newcrypto.randomChars(8);

    };

    kickUser(ws, kickInfo) {
        
        if (this.operation['rooms'][kickInfo.roomcode].host_client == ws) {

            const clients = this.operation['rooms'][kickInfo.roomcode].clients;

            for (const infos of clients) {

                if (infos[0].nickname == kickInfo.nickname) {

                    // infos[1].close();

                    this.wsSendData(infos[1], {
                        method: 'ERROR',
                        data: {
                            type: 'USERKICKED',
                            error: 'You\'re kicked by host!',
                            code: '303'
                        }
                    });

                    return this.wsSendData(ws, {
                        method: 'MSG',
                        data: {
                            type: 'COMMANDTEXT',
                            text: `User '${kickInfo.nickname}' kicked!`
                        }
                    });

                };

            };

            this.wsSendData(ws, {
                method: 'MSG',
                data: {
                    type: 'COMMANDTEXT',
                    text: `Victim's nickname is incorrect!`
                }
            });

        } else {

            this.wsSendData(ws, {
                method: 'MSG',
                data: {
                    type: 'COMMANDTEXT',
                    text: `You're not the host!`
                }
            });

        };

    };

    mode_Public(roomInfo) {

        const room = this.operation['rooms'][roomInfo.roomcode];

        room.public = true;

        if (!this.operation['publicRooms'].has(room)) {

            this.operation['publicRooms'].delete(room);

        };

        this.operation['publicRooms'].add(room);

        this.middelware('add_public_room_to_api', room);

    };

    mode_Public_msg(ws, roomInfo) {

        const room = this.operation['rooms'][roomInfo.roomcode];

        if (room.host_client == ws) {

            this.mode_Public(roomInfo);

            this.wsSendData(ws, {
                method: 'MSG',
                data: {
                    type: 'COMMANDTEXT',
                    text: `Your room turned on to public!`
                }
            });

        } else {

            this.wsSendData(ws, {
                method: 'MSG',
                data: {
                    type: 'COMMANDTEXT',
                    text: `You're not the host!`
                }
            });

        };

    };

    wsTableSendDatas(roomcode, data, sendConfig) {

        this.operation['rooms'][roomcode].clients.forEach((client, vuser) => {

            if (!sendConfig['withoutSender']) {

                client.send(packetCipher.encryptKakao(data));

            } else if (client != sendConfig['sender'] && client.readyState == WebSocket.OPEN) {

                client.send(packetCipher.encryptKakao(data));

            };

        });

    };

    wsSendData(ws, data) {

        ws.send(packetCipher.encryptKakao(data));

    };

    wsControl(ws, user) {

        const vuser = new VirtualUser();

        vuser.setGlobalKey('ip', user.ip);
        vuser.setGlobalKey('packetId', 0);
        vuser.genNick();

        this.operation['raw_clients_map'].set(ws, vuser);

        this.wsSendData(ws, {
            method: 'USERINFO',
            data: {
                nickname: vuser.nickname
            }
        });

        ws.on('message', async (raw_data) => {

            const packet_data = packetCipher.decryptKakao(raw_data);
            const packetHeader = packet_data.header;
            const packetBody = packet_data.body;

            log(`{p}Socket data detected!\n{c}ip : ${vuser.ip}\n{c}data : ${JSON.stringify(packet_data, null, 2)}`);

            if (packetHeader.packetId != ++vuser.packetId) {

                return this.wsSendData(ws, {
                    method: 'ERROR',
                    data: {
                        type: 'BADPACKET',
                        error: 'Packet is contructed by wrong method!',
                        code: '302'
                    }
                });

            };
            
            if (packetBody.method == 'CLIENTINFO') {

                const roomcode = packetBody.data.roomcode;
                const sessionkey = packetBody.data.sessionkey;
                const roomname = packetBody.data.roomname;

                vuser.setGlobalKey('roomcode', roomcode);
                vuser.setGlobalKey('sessionkey', sessionkey);
                vuser.setGlobalKey('roomname', roomname);

                this.operation['allowed_keys'].add(sessionkey);

                if (!this.operation['rooms'][roomcode]) {

                    this.operation['rooms'][roomcode] = {
                        host_nick: vuser.nickname,
                        host_client: ws,
                        clients: new Map(),
                        user_count: 0,
                        activate: true,
                        room_name: roomname,
                        room_code: roomcode,
                        public: false
                    };

                };

                this.operation['rooms'][roomcode].clients.set(vuser, ws);

                this.wsTableSendDatas(roomcode, {
                    method: 'MSG',
                    data: {
                        type: 'INFOTEXT',
                        text: `[+] ${vuser.nickname} | User Count: ${++this.operation['rooms'][roomcode].user_count}`
                    }
                }, { withoutSender: false });

                this.wsSendData(ws, {
                    method: 'MSG',
                    data: {
                        type: 'COMMANDTEXT',
                        text: `You can check commands by message '${config['prefix']}help'`
                    }
                });

            } else if (packetBody.method == 'GETROOMS') {

            } else if (packetBody.method == 'MSG') {

                try {
                    delete require.cache[require.resolve("./command")];
                } catch { };

                const sendConfig = await require("./command").processCommandMSG({
                    cmdfor: config['prefix'],
                    vuser,
                    msgContent: packetBody.data,
                    roomInfo: {
                        host_nick: this.operation['rooms'][vuser.roomcode].host_nick,
                        user_count: this.operation['rooms'][vuser.roomcode].user_count
                    }
                });

                if (sendConfig['cmd']) {

                    if (sendConfig['cmd'].type == 'runfunction') {

                        return this.runFunction(ws, sendConfig['cmd'].funcode, sendConfig['cmd'].content);

                    } else {

                        throw new Error(`Unknown command type on chat.js`);

                    };

                };

                if (sendConfig['sendform'].toAll) {
                    
                    this.wsTableSendDatas(vuser.roomcode, {
                        method: sendConfig['method'],
                        data: sendConfig['dataform']
                    }, { withoutSender: sendConfig['sendform'].exceptMe, sender: ws });

                } else {

                    this.wsSendData(ws, {
                        method: sendConfig['method'],
                        data: sendConfig['dataform']
                    });

                };

            };

        });

        ws.on('close', async () => {

            log(`{p}Socket disconnected!\n{c}ip : ${vuser.ip}`);

            const room = this.operation['rooms'][vuser.roomcode];

            this.operation['allowed_keys'].delete(vuser.sessionkey);
            // this.operation['publicRooms'].delete(this.operation['rooms'][vuser.roomcode]);

            this.operation['raw_clients_map'].delete(ws);

            room.clients.delete(vuser);

            // if (this.operation['rooms'][vuser.roomcode].clients.size == 0) {

            //     log(`{p}Chat closed!\n{c}roomcode : ${vuser.roomcode}`);

            //     return this.operation['rooms'][vuser.roomcode].activate = false;

            // };

            this.wsTableSendDatas(vuser.roomcode, {
                method: 'MSG',
                data: {
                    type: 'INFOTEXT',
                    text: `[-] ${vuser.nickname} | User Count:${--room.user_count}`
                }
            }, { withoutSender: false });

            if (room.public) {



            };

        });

    };

    runFunction(ws, funcode, content) {

        if (funcode == 'room.accesspermission.usermanage.kickuser') {

            this.kickUser(ws, content);

        } else if (funcode == 'room.accesspermission.roommanage.publicmode') {

            this.mode_Public_msg(ws, content);

        };

    };

    openSocket(server_config) {

        const wss = new WebSocket.Server(server_config);

        wss.on('connection', async (ws, req) => {

            this.operation['raw_clients_map'].set(ws, {});

            const user = {
                ip: getIp(req)
            };

            log(`{p}Socket access detected!\n{c}ip : ${user.ip}`);

            this.wsControl(ws, user);

        });

        wss.once('listening', async () => {

            log(`{p}WebSocket listening!\n{c}config : ${JSON.stringify(server_config)}`);

        });

        wss.on('error', async (err) => {

            throw new Error(err);

        });

    };

    createRoom(hostinfo) {

        return {
            sessionkey: this.createSessionKey(hostinfo),
            roomcode: this.createRoomCode()
        };

    };

};

exports.ChatForServer = ChatForServer;