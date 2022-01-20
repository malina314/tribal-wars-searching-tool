const express = require('express');
fs = require('fs');
const qs = require('querystring');

module.exports = class ResultController {
    constructor() {
        this.path = '/result';
        this.router = express.Router();

        this.initializeRoutes();
    }

    setRepository(repo) {
        this.repository = repo;
    }

    initializeRoutes() {
        this.router.route(this.path).post(this.renderResultpage);
    }

    
    renderResultpage = async (req, res) => {
        let data = '';

        req.on('data', chunk => {
            data += chunk.toString();
        });

        req.on('end', async () => {
            data = JSON.parse(data);
            console.log(data.formQueryType);
            let result = '';

            switch (data.formQueryType) {
                case '1':
                    // ** used attributes:
                    //  - data.form1Server
                    //  - data.form1Tribes
                    //  - data.form1Players
                    // ** select villages form V join P join T where P.name == or ... and tribe == or...
                    result = await this.repository.getVillages(data.form1Server);
                    result = result.map(line => line.x + '|' + line.y).join(' ');
                    break;
            }

            console.log(result.length);

            res.render('result', {
                result,
                layout: 'partial.hbs'
            });
        });
    }
};
