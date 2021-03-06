const express = require('express');

module.exports = class MainpageController {
    constructor() {
        this.path = '/';
        this.router = express.Router();

        this.initializeRoutes();
    }

    setRepository(repo) {
        this.repository = repo;
    }

    initializeRoutes() {
        this.router.route(this.path).get(this.renderHomepage);
    }

    async renderHomepage(req, res) {
        res.render('home', {
            target: 'query'
        });
    }
};
