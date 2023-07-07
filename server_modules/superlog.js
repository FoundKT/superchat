const fs = require("fs");
const path = require("path");
const config = require("../config.json");

class superlog {

    constructor () {

        this.time_started = `${Date.now()}`;
        this.file_name = `${config['log_name_base']}_${this.time_started}.txt`;
        this.save_data = '';
        this.log_id = 0;

    };

    async saveLog() {

        await fs.writeFileSync(path.join(__dirname, '../', config['log_path_folder'], this.file_name), this.save_data);

        this.save_data = '';
        this.time_started = `${Date.now()}`;
        this.file_name = `${config['log_name_base']}_${this.time_started}.txt`;

        return;

    };

    buildForm(rawdata) {

        if (!rawdata) {

            return ' [!] Empty content';
    
        } else if (typeof rawdata == 'string') {
    
            const chars = rawdata.split('\n');

            let toPrint = '';
    
            for (var splctn of chars) {
    
                if (splctn.startsWith('{p}')) {

                    toPrint = ` [+] ${splctn.substring(3)}`;
    
                } else if (splctn.startsWith('{c}')) {

                    toPrint = `${toPrint}\n   - ${splctn.substring(3)}`;
    
                } else {

                    toPrint = `${toPrint}\n${splctn}`;
    
                };
    
            };

            return toPrint;
    
        } else if (typeof content == 'object') {
    
            return ' [!] Object detected' + '\n' + ` [+] ${JSON.stringify(content)}`;
    
        } else {

            return ` [!] ${typeof content} detected` + '\n' + ` [+] ${content}`;
    
        };

    };

    log(rawdata) {

        const new_data = "\n" +
            "\n--------------------------------" +
            `\n[${Date.now()}] [${new Date()}] [Num.${++this.log_id}]` +
            "\n" +
            `\n${this.buildForm(rawdata)}` +
            "\n" +
            "\n--------------------------------";

        console.log(new_data);

        this.save_data = this.save_data + new_data;

    };

};

exports.superlog = superlog;