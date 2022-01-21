const getData = require('../getData');
const { Pool, Client } = require('pg');
const decodeUriComponent = require('decode-uri-component');
const errorLog = require('../errorLog');

module.exports = class Postgres {
    constructor() {
        this.type = {
            TRIBES: 'tribes',
            PLAYERS: 'players',
            VILLAGES: 'villages',
        }

        this.tables = {}; // tu będziemy trzymać ściągnięte tabele żeby nie pobierać każdorazowo

        // console.log(process.env.password);

        this.pool = new Pool({
            user: process.env.user,
            password: process.env.password,
        });

        // this.pool.query('SELECT NOW()', (err, res) => {
        //     console.log(err, res)
        //     this.pool.end()
        // });

        // this.pool.query('SELECT * FROM server_172_tribes')
        // .then(res => {
        //     console.log(res.rows);
        // })
        // .catch(err => {
        //     errorLog(err);
        // })
    }

    // używanie zmiennej server jest bezpieczne bo jest walidowana wcześniej i spełnia regex /p?[1-9]\d*/
    async updateServerData(server) {
        // const lastUpdate = Date.now();
        if (!this.tables[server]) {
            await this.updateTribes(server);
            this.tables[server] = true;
            // {
            //     tribes: await updateTribes(server),
            //     players: await updatePlayers(server),
            //     villages: await updateVillages(server),
            // };
        }
    }
    
    async getTribes(server) {
        await this.updateServerData(server);
        return this.tables[server];
    }
    
    async getPlayers(server) {
        await this.updateServerData(server);
        return this.tables[server].players;
    }
    
    async getVillages(server) {
        await this.updateServerData(server);
        return this.tables[server].villages;
    }

    async updateQuery(server, type, data) {
        const tableName = `server_${server}_${type}`;

        function makeValueString() {
            let result = [];

            for (let i = 0; i < data.rows; i++) {
                const line = [];
                for (let j = 1; j <= data.arity; j++) {
                    line.push(`$${i * data.arity + j}`);
                }
                result.push(`(${line.join(',')})`);
            }

            return result.join(',');
        }

        // console.log(tableName);

        await this.pool.query(`DROP TABLE IF EXISTS ${tableName};`)
        .catch(err => {
            errorLog(err);
        });

        switch (type) {
            case this.type.TRIBES:
                this.pool.query(`CREATE TABLE ${tableName} (
                    id INTEGER PRIMARY KEY,
                    full_name VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(15) UNIQUE NOT NULL,
                    members_cnt INTEGER NOT NULL,
                    villages_cnt INTEGER NOT NULL,
                    top_40_points INTEGER NOT NULL,
                    points INTEGER NOT NULL,
                    rank INTEGER UNIQUE NOT NULL
                );`)
                .then(() => {
                    const query = {
                        text: `INSERT INTO ${tableName} (id, full_name, name, members_cnt, villages_cnt, top_40_points, points, rank)
                            VALUES ${makeValueString()};`,
                        values: data.array,
                    }

                    console.log(query);

                    this.pool.query(query)
                    .then(res => {
                        console.log(res.rows);
                    })
                    .catch(err => {
                        errorLog(err);
                    });
                })
                .catch(err => {
                    errorLog(err);
                });
                break;
            case this.type.PLAYERS:
                // todo
                break;
                case this.type.VILLAGES:
                // todo
                break;
        }
    }

    async updateTribes(server) {
        const rawTribes = await getData(`https://pl${server}.plemiona.pl/map/ally.txt`);
        // ! prawdopodbnie txt kończy się \n więc po splicie ostatnia linia jest pusta
        // id, fullName, name, membersCnt, villagesCnt, top40points, points, rank
        // return rawTribes.split(/\n/gm).map(line => {
        //     const arr = line.split(/,/gm)
        //     return {
        //         id: arr[0],
        //         fullName: arr[1],
        //         name: arr[2],
        //         membersCnt: arr[3],
        //         villagesCnt: arr[4],
        //         top40points: arr[5],
        //         points: arr[6],
        //         rank: arr[7],
        //     }
        // });
        const arity = 8;
        // const array = this.decodeRawText(rawTribes).split(/\n|,/gm);
        const array = rawTribes.split(/\n(?=.)|,/gm).map(el => this.decodeRawText(el));

        
        // fs = require('fs');
        // fs.writeFile('array.txt', array.join('\n'), (err) => {
        //     if (err)
        //     console.log(err);
        // });
        
        const rows = array.length / arity;

        // console.log(array.length, rows);
        
        await this.updateQuery(server, this.type.TRIBES, {arity, rows, array});
    }

    async updatePlayers(server) {
        const rawPlayers = await getData(`https://pl${server}.plemiona.pl/map/player.txt`);
        // id, name, tribeId, villagesCnt, points, rank
        return rawPlayers.split(/\n/gm).map(line => {
            const arr = line.split(/,/gm)
            return {
                id: arr[0],
                name: arr[1],
                tribeId: arr[2],
                villagesCnt: arr[3],
                points: arr[4],
                rank: arr[5],
            }
        });
    }

    async updateVillages(server) {
        const rawVillages = await getData(`https://pl${server}.plemiona.pl/map/village.txt`);
        // id, name, x, y, playerId, points, bonus
        return villages = rawVillages.split(/\n/gm).map(line => {
            const arr = line.split(/,/gm)
            return {
                id: arr[0],
                name: arr[1],
                x: arr[2],
                y: arr[3],
                playerId: arr[4],
                points: arr[5],
                bonus: arr[6],
            }
        });
    }

    decodeRawText(text) {
        return decodeUriComponent(text);
    }
}