const express = require('express');

module.exports = class QueryController {
    constructor() {
        this.path = '/query';
        this.router = express.Router();

        this.initializeRoutes();
    }

    setRepository(repo) {
        this.repository = repo;
    }

    initializeRoutes() {
        this.router.route(this.path).get(this.renderQuerypage);
    }

    async renderQuerypage(req, res) {
        res.render('query');
    }
};
