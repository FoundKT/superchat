const packetBuffer = new ArrayBuffer(20);
const packetArray = new Uint8Array(packetBuffer);
const view = new DataView(packetBuffer);

const packetId = 98765;

view.setUint32(0, packetId, true);
view.setUint16(4, 3 & 0xffff, true);
// packetArray[6 + i] = code;

console.log({
    packetBuffer,
    packetArray,
    view,
    and: 3 & 0xffff
});