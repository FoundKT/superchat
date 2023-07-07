class packetConstruct {

    constructor(config) {

        this.config = config;

        this.packetId = 1;

    };

    bsonEncode(data) {

        return [0, this.config['bson'].serialize(data)];

    };

    header(method, status) {

        return {
            packetId: this.packetId++ % 100000,
            status,
            method
        };

    };

    body(data) {

        return this.bsonEncode(data);

    };

    constructPacket(data, method, status) {

        return {
            header: this.header(method, status),
            body: this.body(data)
        };

    };

    constructPacketArray(packet) {

        const packetBuffer = new ArrayBuffer(22 + packet.body[1].byteLength);
        const packetArray = new Uint8Array(packetBuffer);
        const view = new DataView(packetBuffer);

        view.setUint32(0, packet.header.packetId, true);
        view.setUint16(4, packet.header.status & 0xffff, true);

        for (let i = 0; i < 11; i++) {
            const code = packet.header.method.charCodeAt(i) || 0;

            if (code > 0xff) throw new Error('Invalid ASCII code at method string');

            packetArray[6 + i] = code;

        };

        view.setUint8(17, packet.body[0] & 0xff);
        view.setUint32(18, packet.body[1].byteLength, true);

        packetArray.set(packet.body[1], 22);

        return packetArray;

    };

};

class packetCrypto {

    constructor(config, packetBuilder, newcrypto) {

        this.config = config;

        this.packetBuilder = packetBuilder;

        this.newcrypto = newcrypto;

    };

    encryptKakao(data) {

        const rawdata = JSON.stringify(data);
        const timestamp = Date.now().toString();
        const clientkey = btoa(`${timestamp}|${this.config['last_session_key']}`);
        const newdata = this.newcrypto.encrypt(rawdata, clientkey, this.config['crypt_algorithm']);

        const packet = this.packetBuilder.constructPacket({
            encrypted_data: newdata,
            key_from_client: clientkey,
            algorithm: this.config['crypt_algorithm']
        }, data.method, data.status);

        return this.packetBuilder.constructPacketArray(packet);

    };

    decryptKakao(uint8Data) {

        const arrBuffer = new Uint8Array(uint8Data).buffer;
        const view = new DataView(arrBuffer);

        const packetId = view.getUint32(0, true);
        const status = view.getUint16(4, true);

        let method = '';

        for (var i = 0; i < 11; i++) {

            const newChar = String.fromCharCode(view.getUint8(6 + i));

            if (newChar != '\x00') {

                method = `${method}${newChar}`

            };

        };

        const bodyOffer = view.getUint8(17);
        const bodyLength = view.getUint32(18);

        const bodyBufferInts = [];

        for (var i = 0; i < view.buffer.byteLength - 22; i++) {

            bodyBufferInts.push(view.getUint8(22 + i));

        };

        const deseredBody = this.config['bson'].deserialize(new Uint8Array(bodyBufferInts));

        const cleanBody = JSON.parse(this.newcrypto.decrypt(deseredBody['encrypted_data'], deseredBody['key_from_server'], deseredBody['algorithm']));

        return {
            header: {
                packetId,
                status,
                method,
                bodyInfo: {
                    bodyOffer,
                    bodyLength
                }
            },
            body: {
                ...cleanBody
            }
        };

    };

};

class newCipher {

    constructor(config) {

        this.config = config;

    };

    encrypt(text, masterkey, algorithm) {

        const iv = this.config['crypto'].randomBytes(12);
        const salt = this.config['crypto'].randomBytes(64);
        const key = this.config['crypto'].pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');
        const cipher = this.config['crypto'].createCipheriv(algorithm, key, iv);
        const encrypted = this.config['buffer'].concat([cipher.update(text, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return this.config['buffer'].concat([salt, iv, tag, encrypted]).toString('base64');

    };

    decrypt(data, masterkey, algorithm) {

        var bData = this.config['buffer'].from(data, 'base64');
        var salt = bData.slice(0, 64);
        var iv = bData.slice(64, 76);
        var tag = bData.slice(76, 92);
        var text = bData.slice(92);
        var key = this.config['crypto'].pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');

        var decipher = this.config['crypto'].createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(tag);

        var decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

        return decrypted;

    };

    randomChars(length = 12) {

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';

        for (let i = 0; i < length; i++) {

            str += chars.charAt(Math.floor(Math.random() * chars.length));

        };

        return str;

    };

};

window.addEventListener('DOMContentLoaded', async function () {

    async function request(config) {

        if (!config['method'] || !config['url']) {

            return { success: -1, result: 'method or url isn\'t detected!' }

        };

        let fetchUrl = config['url'];

        const fetchconfig = {
            method: config['method']
        };

        if (config['header'] || config['headers']) {

            fetchconfig['headers'] = config['header'] ? config['header'] : config['headers'];

        };

        if (config['body'] || config['data']) {

            if (config['method'].toUpperCase() == 'GET' || config['method'].toUpperCase() == 'HEAD') {

                fetchUrl = `${fetchUrl}?${toParams(config['data'])}`;

            } else {

                fetchconfig['body'] = config['body'] ? config['body'] : config['data'];

                fetchconfig['body'] = JSON.stringify(fetchconfig['body']);

            };

        };

        return (await fetch(fetchUrl, fetchconfig)).json();

    };

    function getCookie(key) {

        let result = null;
        const cookie = document.cookie.split(';');

        cookie.some(function (item) {

            item = item.replace(' ', '');

            var dic = item.split('=');

            if (key === dic[0]) {

                result = dic[1];

                return true;

            };

        });

        return result;

    };

    const config = {
        last_room_code: getCookie('last_room_code'),
        last_room_name: getCookie('last_room_name'),
        last_session_key: getCookie('last_session_key'),
        user_host: getCookie('user_host'),
        html: {
            title_roomname: this.document.getElementById('main.room.roomname'),
            textbox_typechat: this.document.getElementById('main.accesschat.text'),
            button_sendchat: this.document.getElementById('main.accesschat.send'),
            list_chatlist: this.document.getElementById('main.showchat.chatlist')
        },
        socket_info: (await request({ method: 'get', url: '/config/socketaddress' }))['result'],
        user: {

        },
        crypto: window.nodemodules.crypto,
        bson: window.nodemodules.bson,
        buffer: window.nodemodules.buffer,
        crypt_algorithm: (await request({ method: 'get', url: '/config/packetalgorithm' }))['result'].algorithm
    };

    const packetCipher = new packetCrypto(config, new packetConstruct(config), new newCipher(config));

    async function socketSendData(socket, data) {

        socket.send(await packetCipher.encryptKakao(data));

    };

    function addChat(chattypecss, data) {

        const div = document.createElement('div');

        div.classList.add('chat_textdiv');
        div.classList.add(chattypecss);

        if (data.texts) {

            for (const index in data.texts) {

                const p = document.createElement('p');
                p.classList.add('chat_textp');

                if (index == 0) {

                    p.textContent = `${data.author ? `${data.author}: ` : ''}${data.texts[index]}`;

                    div.appendChild(p);

                } else {

                    p.textContent = `${data.texts[index]}`;

                    div.appendChild(p);

                    // if (index != data.texts.length - 1) div.appendChild(document.createElement('br'));

                };

            };

        } else {

            const p = document.createElement('p');
            p.classList.add('chat_textp');
            p.textContent = `${data.author ? `${data.author}: ` : ''}${data.text}`;

            div.appendChild(p);

        };

        config.html['list_chatlist'].appendChild(div);

        chatListScrollDown();

    };

    function socketAddEvent(socket) {

        socket.onopen = () => {

            socketSendData(socket, {
                method: 'CLIENTINFO',
                data: {
                    roomcode: config['last_room_code']
                },
                status: 0
            });

            // if (config['user_host']) {

            //     socketSendData(socket, {
            //         method: 'SETHOST',
            //         data: {},
            //         status: 0
            //     });

            // };

        };

        socket.onmessage = (event) => {

            const packet_data = packetCipher.decryptKakao(event.data);
            const packetHeader = packet_data.header;
            const packetBody = packet_data.body;

            // console.log(data);

            if (packetBody.method == 'ERROR') {

                if (packetBody.data.type == 'ERROR') {

                    alert(packetBody.data.error);

                    window.location.href = `/error?code=302`;

                };

            } else if (packetBody.method == 'USERINFO') {

                config.user['nickname'] = packetBody.data['nickname'];

            } else if (packetBody.method == 'MSG') {

                if (packetBody.data.type == 'TEXT') {

                    let chattype = 'config_bgcolor_white';

                    if (packetBody.data.author ? packetBody.data.author == config.user['nickname'] : true) {

                        chattype = 'config_bgcolor_yellow';

                    };

                    addChat(chattype, packetBody.data);

                } else if (packetBody.data.type == 'INFOTEXT') {

                    addChat('config_bgcolor_purple', packetBody.data);

                } else if (packetBody.data.type == 'COMMANDTEXT') {

                    addChat('config_bgcolor_skyblue', packetBody.data);

                };

                chatListScrollDown();

            } else if (packetBody.method == 'COMMAND') {

                if (packetBody.data.type == 'CLEARCONSOLE') {

                    config.html['list_chatlist'].innerHTML = '';

                };

            };

        };

        socket.onclose = () => {

            // console.log('Socket disconnected');

            window.location.href = `/error?code=303`;

        };

    };

    if (window.location.pathname != `/room/${config.last_room_code}`) {

        alert('Error');

        window.location.href = `/`;

    };

    config.html['title_roomname'].innerText = `Welcome to chat "${decodeURIComponent(config['last_room_name'])}" !`;

    const socket = new WebSocket(`ws://${config['socket_info'].host}:${config['socket_info'].port}`);
    socket.binaryType = "arraybuffer";

    socketAddEvent(socket);

    config.html['button_sendchat'].addEventListener('click', function () {

        const chat_text = config.html['textbox_typechat'].value;

        if (chat_text == '') {

            return;

        };

        config.html['textbox_typechat'].value = '';

        socketSendData(socket, {
            method: 'MSG',
            data: {
                type: 'TEXT',
                text: chat_text
            },
            status: 0
        });

    });

    config.html['textbox_typechat'].addEventListener("keyup", function (event) {

        if (event.keyCode === 13) {

            event.preventDefault();

            config.html['button_sendchat'].click();

        };

    });

});