const express = require('express');

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

    validateServer(server) {
        if (!/^p?[1-9]\d*$/.test(server)) {
            throw new Error('Invalid server name.');
        }
    }

    renderResultpage = async (req, res) => {
        let data = '';

        req.on('data', chunk => {
            data += chunk.toString();
        });

        req.on('end', async () => {
            data = JSON.parse(data);
            console.log('query type:', data.formQueryType);
            let result = '';

            try {
                switch (data.formQueryType) {
                    case '1':
                        this.validateServer(data.form1Server);
                        result = await this.repository.getVillagesOfPlayersOrTribes(data.form1Server, data.form1Tribes.split(/\s+/gm), data.form1Players.split(/\s*\n/gm));
                        result = result?.map(e => e.x + '|' + e.y)?.join(' ');
                        break;
                    case '2':
                        this.validateServer(data.form2Server);
                        result = await this.repository.getPlayersInTribes(data.form2Server, data.form2Tribes.split(/\s+/gm));
                        result = result?.map(e => e.name)?.join('\n');
                        break;
                    case '3':
                        this.validateServer(data.form3Server);
                        result = await this.repository.getVillagesInRange(
                            data.form3Server,
                            { tribes: data.form3Tribes1.split(/\s+/gm), players: data.form3Players1.split(/\s*\n/gm), },
                            { tribes: data.form3Tribes2.split(/\s+/gm), players: data.form3Players2.split(/\s*\n/gm), },
                            data.form3Range
                        );
                        result = result?.map(e => e.x + '|' + e.y)?.join(' ');
                        break;
                    case '4':
                        const servers4 = data.form4Servers.split(/\s+/gm);
                        servers4.forEach(server => this.validateServer(server));
                        result = await this.repository.getPlayersFromDifferentServers(servers4);
                        result = result?.map(e => e.name)?.join('\n');
                        break;
                    case '5':
                        const servers5 = data.form5Servers.split(/\s+/gm);
                        servers5.forEach(server => this.validateServer(server));
                        result = await this.repository.updateMultipleServersData(servers5);
                        break;
                    default:
                        result = 'Invalid query type.';
                }
            // todo: hierarchia errorów bo getData musi jeszcze rzucać + jakieś default msg dla innego błędu
            } catch (err) {
                result = err.message;
            }

            console.log('result:', result?.toString()?.slice(0, 100));

            res.render('result', {
                result,
                layout: 'partialLayout.hbs'
            });
        });
    }
};
