exports.processCommandMSG = function (content) {

    return new Promise((resolve, reject) => {

        try {

            var sender = content['vuser'];
            var packetBodyData = content['msgContent'];
            var text = packetBodyData.text.toString();
            var type = packetBodyData.type.toString();
            var prefix = content['cmdfor'].toString();
            var room = content['roomInfo'];

            var method = 'MSG';

            var dataform = {
                type,
                text
            };

            var sendform = {
                toAll: false,
                exceptMe: false
            };

            if (!text.startsWith(prefix)) {

                dataform.author = sender.nickname;
                sendform.toAll = true;

                return resolve({
                    dataform,
                    sendform,
                    method
                });

            };

            dataform.type = 'COMMANDTEXT';

            if (text == `${prefix}help`) {

                delete dataform.text;
                dataform.texts =
                    [`${prefix}help - Check help for using commands`,
                    `${prefix}cls - Clear chat list`,
                    `${prefix}ccu - Check concurrent users`,
                    `${prefix}mn - Check my nickname`,
                    `*${prefix}kick <nick> - Kick user`
                    ];

            } else if (text == `${prefix}cls`) {

                method = 'COMMAND';
                dataform.type = 'CLEARCONSOLE';
                delete dataform.text;

            } else if (text == `${prefix}ccu`) {

                dataform.text = `${room['user_count']} users are chating on current room`;

            } else if (text == `${prefix}mn`) {

                dataform.text = `Your nickname is '${sender.nickname}'`;

            } else if (text.startsWith(`${prefix}kick`)) {

                if (text.startsWith(`${prefix}kick `)) {

                    if (sender.nickname != text.split(' ')[1]) {

                        return resolve({
                            cmd: {
                                type: 'runfunction',
                                funcode: 'room.accesspermission.usermanage.kickuser',
                                content: {
                                    nickname: text.split(' ')[1],
                                    roomcode: sender.roomcode
                                }
                            }
                        });

                    } else {

                        dataform.text = `You can't kick yourself!`;

                    };

                } else {

                    dataform.text = `Please use on correct form! '${prefix}kick <nick>'`;

                };

            } else {

                dataform.text = `Unknown command! You can check commands by message '${prefix}help'`;

            };

            return resolve({
                method,
                dataform,
                sendform
            });

        } catch (e) {

            throw new Error(e);

        };

    });

};