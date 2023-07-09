var crypto = require("crypto");
var bson = require("bson");

global.window.nodemodules = {
    crypto,
    bson,
    buffer: Buffer
};