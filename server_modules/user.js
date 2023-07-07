const crypto = require("crypto");

class VirtualUser {

    constructor() {

    };

    genNick() {

        this.nickname = crypto.randomBytes(7).toString('hex');

    };

    setGlobalKey(key, value) {

        this[key] = value;

    };

};

exports.VirtualUser = VirtualUser;