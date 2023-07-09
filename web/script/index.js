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

    async function create_room(roomname) {

        const createRes = await request({
            method: 'post',
            url: '/api/accessroom/createroom',
            data: {
                roomname
            },
            header: {
                'Content-Type': 'application/json'
            }
        });

        if (createRes.status != 0) {

            return alert(`${createRes.status}\n${createRes.result}`);

        };

        const createRes2 = await request({
            method: 'post',
            url: '/room/accessroom/makeroom',
            data: {
                roomcode: createRes.result.roomcode
            },
            header: {
                'Content-Type': 'application/json'
            }
        });

        if (createRes2.status != 0) {

            return alert(`${createRes2.status}\n${createRes2.result}`);

        };

        window.location.href = `/room/${createRes.result.roomcode}`;

    };

    async function enter_room(roomcode) {

        const enterRes = await request({
            method: 'post',
            url: '/api/accessroom/enterroom',
            data: {
                roomcode
            },
            header: {
                'Content-Type': 'application/json'
            }
        });

        if (enterRes.status != 0) {

            return alert(`${enterRes.status}\n${enterRes.result}`);

        };

        window.location.href = `/room/${roomcode}`;

    };

    // const frontendPath = (await request({ method: 'get', url: '/api/useinfo/frontendpath' }))['result'];

    this.document.getElementById('main.accessroom.createroom').addEventListener('click', function () {

        const roomname = document.getElementById('main.accessroom.textdata').value;

        create_room(roomname);

    });

    this.document.getElementById('main.accessroom.enterroom').addEventListener('click', function () {

        const roomcode = document.getElementById('main.accessroom.textdata').value;

        enter_room(roomcode);

    });

    this.document.getElementById('gotopublic').addEventListener('click', function () {

        // document.getElementById('page.titlescreen').classList.toggle('hided');
        // document.getElementById('page.middlescreen').classList.toggle('hided');

        window.location.href = `/public`;

    });

});