const crypto = require("crypto");
const config = require("../config.json");

class newCipher {

    constructor() {

    };

    encrypt(text, cryptokey = config['master_key'], algorithm = config['defualt_algorithm']) {

        try {

            const iv = crypto.randomBytes(12);
            const salt = crypto.randomBytes(64);
            const key = crypto.pbkdf2Sync(cryptokey, salt, 2145, 32, 'sha512');
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
            const tag = cipher.getAuthTag();

            return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');

        } catch (e) {

            throw new Error(e);

        };

    };

    decrypt(data, cryptokey = config['master_key'], algorithm = config['defualt_algorithm']) {

        try {

            var bData = Buffer.from(data, 'base64');
            var salt = bData.slice(0, 64);
            var iv = bData.slice(64, 76);
            var tag = bData.slice(76, 92);
            var text = bData.slice(92);
            var key = crypto.pbkdf2Sync(cryptokey, salt, 2145, 32, 'sha512');

            var decipher = crypto.createDecipheriv(algorithm, key, iv);
            decipher.setAuthTag(tag);

            var decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

            return decrypted;

        } catch (e) {

            throw new Error(e);

        };

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

exports.newCipher = newCipher;