class packetConstruct {

    constructor() {

        this.packetId = 1;

        this.bson = require("bson");

    };

    bsonEncode(data) {

        return [0, this.bson.serialize(data)];

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

exports.packetConstruct = packetConstruct;

class packetCrypto {

    constructor(config, newcrypto, packetBuilder) {

        this.config = config;

        this.newcrypto = newcrypto;

        this.packetBuilder = packetBuilder;

        this.bson = require("bson");

    };
    
    encryptKakao(data) {

        const rawdata = JSON.stringify({ ...data });
        const timestamp = Date.now().toString();
        const serverkey = btoa(`${timestamp}|${this.newcrypto.randomChars(32)}`);
        const newdata = this.newcrypto.encrypt(rawdata, serverkey);

        const packet = this.packetBuilder.constructPacket({
            encrypted_data: newdata,
            key_from_server: serverkey,
            algorithm: this.config['defualt_algorithm']
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

        const deseredBody = this.bson.deserialize(new Uint8Array(bodyBufferInts));

        const cleanBody = JSON.parse(this.newcrypto.decrypt(deseredBody['encrypted_data'], deseredBody['key_from_client'], deseredBody['algorithm']));

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

exports.packetCrypto = packetCrypto;