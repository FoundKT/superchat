const bson = require("bson");

function constructPacketArray(packet) {

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

const arrayed = constructPacketArray({
    header: {
        packetId: 98765,
        method: 'MSG'
    },
    body: [0, bson.serialize({
        a: 'b',
        c: 'test',
        d: 322
    })]
});

console.log(arrayed);

const view = new DataView(arrayed.buffer);

const decodeds = [];

for (var i = 0; i < arrayed.length - 22; i++) {

    decodeds.push(view.getUint8(22 + i));

};

const bodyd = new Uint8Array(decodeds);

console.log(bson.deserialize(bodyd));