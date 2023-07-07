window.addEventListener('DOMContentLoaded', async function () {

    function toParams(data) {

        return Object.keys(data).map(function(k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
        }).join('&');

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

                fetchUrl = `${fetchUrl}?${toParams(config['data'])}`;

            } else {

                fetchconfig['body'] = config['body'] ? config['body'] : config['data'];

                fetchconfig['body'] = JSON.stringify(fetchconfig['body']);

            };
    
        };
    
        return (await fetch(fetchUrl, fetchconfig)).json();
    
    };

    const url = new URL(window.location.href);
    const params = url.searchParams;

    var lang = 'en';

    if (navigator.appName == 'Netscape') {

        var rawlang = navigator.language || navigator.userLanguage;
        var cleanlang = rawlang.substr(0, 2);

        if (cleanlang == 'ko') {

            lang = 'ko';

        };

    };

    const errorDB = (await request({ method: 'get', url: '/config/errordb', data: { code: params.get('code') } }))['result'];

    document.getElementById('errortext').innerText = errorDB['errortext'][lang];
    document.getElementById('maintext').innerText = errorDB['maintext'][lang];

});