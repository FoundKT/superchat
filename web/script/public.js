function toParams(beforeparam) {

    return new URLSearchParams(beforeparam).toString();

};

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

            fetchUrl = `${fetchUrl}?${toParams(config['body'] ? config['body'] : config['data'])}`;

        } else {

            fetchconfig['body'] = config['body'] ? config['body'] : config['data'];

            fetchconfig['body'] = JSON.stringify(fetchconfig['body']);

        };

    };

    return (await fetch(fetchUrl, fetchconfig)).json();

};

window.addEventListener('DOMContentLoaded', async function () {

    this.document.getElementById('gotomain').addEventListener('click', function () {

        // document.getElementById('page.titlescreen').classList.toggle('hided');
        // document.getElementById('page.middlescreen').classList.toggle('hided');

        window.location.href = `/`;

    });

    const table = document.getElementById("page.middlescreen.rooms");
    const rooms = (await request({ method: 'get', url: '/room/getrooms', data: { pub: true } }))['result'];

    for (const roomNumb in rooms) {

        const room = rooms[roomNumb];

        const row = table.insertRow(-1);
        const nameCell = row.insertCell(0);
        nameCell.innerHTML = decodeURIComponent(room.roomname);
        nameCell.className = 'noBorder banselect';
        const headCell = row.insertCell(1);
        headCell.innerHTML = `${room.headcount}/100`;
        headCell.className = 'noBorder banselect';
        const buttonCell = row.insertCell(2);
        buttonCell.innerHTML = 'Join';
        buttonCell.className = 'noBorder banselect';
        buttonCell.style.cursor = 'pointer';

        buttonCell.addEventListener('click', async function () {

            const enterRes = await request({
                method: 'post',
                url: '/api/accessroom/enterroom',
                data: {
                    roomcode: room.roomcode 
                },
                header: {
                    'Content-Type': 'application/json'
                }
            });

            if (enterRes.status != 0) {

                return alert(`${enterRes.status}\n${enterRes.result}`);

            };

            window.location.href = `/room/${room.roomcode}`;

        });

    };

});