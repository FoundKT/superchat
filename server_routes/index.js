const express = require('express');
const router = express.Router();

const { accessWebFile, antiDDos } = require("../server_modules/kit");

router.get('/', async (req, res) => {
    
    res.send(await accessWebFile('html', 'index.html'));
    
});

router.get('/error', async (req, res) => {
    
    res.send(await accessWebFile('html', 'error.html'));
    
});

router.post('/media', antiDDos, async (req, res) => {

    console.log(req.body);
    
    res.json({});
    
});

module.exports = router;