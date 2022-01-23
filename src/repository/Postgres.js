const getData = require('../getData');
const { Pool, Client } = require('pg');
const decodeUriComponent = require('decode-uri-component');
const logError = require('../logError');
const DebugHelper = require('../DebugHelper');

module.exports = class Postgres {
    constructor() {
        this.type = {
            TRIBES: 'tribes',
            PLAYERS: 'players',
            VILLAGES: 'villages',
        }

        this.tables = {};

        this.pool = new Pool({
            user: process.env.user,
            password: process.env.password,
        });
    }

    // używanie zmiennej server jest bezpieczne bo jest walidowana wcześniej i spełnia regex /p?[1-9]\d*/
    async updateServerData(server) {
        if (!this.tables[server]) {
            await this.updateTribes(server);
            await this.updatePlayers(server);
            await this.updateVillages(server);
            this.tables[server] = true;
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

        // todo: DELETE *
        await this.pool.query(`
            ALTER TABLE IF EXISTS server_${server}_players
            DROP CONSTRAINT IF EXISTS fk_constraint;
        `)
        .catch(logError);
        
        await this.pool.query(`
            DROP TABLE IF EXISTS ${tableName};
        `)
        .catch(logError);

        switch (type) {
            case this.type.TRIBES:
                await this.pool.query(`CREATE TABLE ${tableName} (
                    id INTEGER PRIMARY KEY,
                    full_name VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(15) UNIQUE NOT NULL,
                    members_cnt INTEGER NOT NULL,
                    villages_cnt INTEGER NOT NULL,
                    top_40_points INTEGER NOT NULL,
                    points INTEGER NOT NULL,
                    rank INTEGER UNIQUE NOT NULL
                );`)
                .catch(logError);

                const query = {
                    text: `INSERT INTO ${tableName} (id, full_name, name, members_cnt, villages_cnt, top_40_points, points, rank)
                        VALUES ${makeValueString()};`,
                    values: data.array,
                }

                DebugHelper.logQuery(query);

                const res = await this.pool.query(query)
                .catch(logError);

                DebugHelper.logRes(res);

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

        const array = rawTribes.split(/\n(?=.)|,/gm).map(el => this.decodeRawText(el));
        const arity = 8; // id, fullName, name, membersCnt, villagesCnt, top40points, points, rank
        const rows = array.length / arity;
        
        await this.updateQuery(server, this.type.TRIBES, {array, arity, rows});
    }

    async updatePlayers(server) {
        const rawPlayers = await getData(`https://pl${server}.plemiona.pl/map/player.txt`);
        
        const array = rawPlayers.split(/\n(?=.)|,/gm).map(el => this.decodeRawText(el));
        const arity = 6; // id, name, tribeId, villagesCnt, points, rank
        const rows = array.length / arity;
        
        await this.updateQuery(server, this.type.PLAYERS, {array, arity, rows});
    }

    async updateVillages(server) {
        const rawVillages = await getData(`https://pl${server}.plemiona.pl/map/village.txt`);
        
        const array = rawVillages.split(/\n(?=.)|,/gm).map(el => this.decodeRawText(el));
        const arity = 7; // id, name, x, y, playerId, points, bonus
        const rows = array.length / arity;
        
        await this.updateQuery(server, this.type.VILLAGES, {array, arity, rows});
    }

    //todo: zrobić z tego dataToArray
    decodeRawText(text) {
        return decodeUriComponent(text);
    }
}