const express = require('express');
fs = require('fs');
const qs = require('querystring');

module.exports = class ResultController {
    constructor() {
        this.path = '/result';
        this.router = express.Router();

        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.route(this.path).post(this.renderResultpage);
    }

    
    async renderResultpage(req, res) {
        console.log(req.method);

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {
            console.log(body);
            res.render('result');
        });
    }
};
