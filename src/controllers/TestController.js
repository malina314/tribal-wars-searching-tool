const express = require('express');
const getData = require('../getData');

module.exports = class TestController {
    constructor() {
        // super('elements', 'element', { id: 'elementId' });

        this.path = '/data';
        this.router = express.Router();

        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.route(this.path).get(this.getAll);
        this.router.route('/test').get(this.btn);
    }

    async getAll(req, res) {
        const ddata = await getData('https://plp8.plemiona.pl/map/ally.txt');
        res.render('data', {
            data: ddata
        });
    }

    btn(req, res) {
        res.render('test');
    }
};
