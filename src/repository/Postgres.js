const getData = require('../getData');
const { Pool } = require('pg');
const decodeUriComponent = require('decode-uri-component');
const logError = require('../logError');
const DebugHelper = require('../DebugHelper');

module.exports = class Postgres {
    constructor() {
        this.servers = {};

        this.pool = new Pool({
            user: process.env.user,
            password: process.env.password,
        });
    }

    // używanie zmiennej server jest bezpieczne bo jest walidowana wcześniej i spełnia regex /p?[1-9]\d*/
    async updateServerData(server) {
        if (!this.servers[server]) {
            await this.updateTribes(server);
            await this.updatePlayers(server);
            await this.updateVillages(server);
            this.servers[server] = true;
        }
    }
    
    async getTribes(server) {
        await this.updateServerData(server);
        return this.servers[server];
    }
    
    async getPlayers(server) {
        await this.updateServerData(server);
        return this.servers[server].players;
    }
    
    async getVillages(server) {
        await this.updateServerData(server);
        return this.servers[server].villages;
    }

    makeValueString(rows, arity) {
        let result = [];

        for (let i = 0; i < rows; i++) {
            const line = [];
            for (let j = 1; j <= arity; j++) {
                line.push(`$${i * arity + j}`);
            }
            result.push(`(${line.join(',')})`);
        }

        return result.join(',');
    }

    dataToArray(data) {
        return data.split(/\n(?=.)|,/gm).map(el => decodeUriComponent(el));
    }

    async updateTribes(server) {
        await this.updateTribesQuery(server, {
            array: this.dataToArray(await getData(`https://pl${server}.plemiona.pl/map/ally.txt`)), 
            arity: 8, // id, full_name, name, members_cnt, villages_cnt, top_40_points, points, rank
        });
    }

    async updatePlayers(server) {
        const array = this.dataToArray(await getData(`https://pl${server}.plemiona.pl/map/player.txt`));
        const arity = 6; // id, name, tribe_id, villages_cnt, points, rank

        for (let i = 2; i < array.length; i += arity) {
            if (array[i] == 0) {
                array[i] = null;
            }
        }

        await this.updatePlayersQuery(server, {array, arity});
    }

    async updateVillages(server) {
        const array = this.dataToArray(await getData(`https://pl${server}.plemiona.pl/map/village.txt`));
        const arity = 7; // id, name, x, y, player_id, points, bonus

        for (let i = 4; i < array.length; i += arity) {
            if (array[i] == 0) {
                array[i] = null;
            }
        }

        await this.updateVillagesQuery(server, {array, arity});
    }

    async updateTribesQuery(server, data) {
        const tableName = `server_${server}_tribes`;
        
        await this.pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (
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

        await this.pool.query(`TRUNCATE TABLE ${tableName} CASCADE;`)
        .catch(logError);

        const query = {
            text: `INSERT INTO ${tableName} (id, full_name, name, members_cnt, villages_cnt, top_40_points, points, rank)
                VALUES ${this.makeValueString(data.array.length / data.arity, data.arity)};`,
            values: data.array,
        }

        DebugHelper.logQuery(query);

        const res = await this.pool.query(query)
        .catch(logError);

        DebugHelper.logRes(res);
    }

    async updatePlayersQuery(server, data) {
        const tableName = `server_${server}_players`;
        
        await this.pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            tribe_id INTEGER,
            CONSTRAINT fk_constraint
                FOREIGN KEY (tribe_id)
                    REFERENCES server_${server}_tribes(id),
            villages_cnt INTEGER NOT NULL,
            points INTEGER NOT NULL,
            rank INTEGER UNIQUE NOT NULL
        );`)
        .catch(logError);

        await this.pool.query(`TRUNCATE TABLE ${tableName} CASCADE;`)
        .catch(logError);

        const chunkSize = Math.floor(65535 / data.arity) * data.arity;
        
        for (let i = 0; i < data.array.length; i += chunkSize) {
            const query = {
                text: `INSERT INTO ${tableName} (id, name, tribe_id, villages_cnt, points, rank)
                    VALUES ${this.makeValueString(data.array.length / data.arity, data.arity)};`,
                values: data.array,
            }

            DebugHelper.logQuery(query);

            const res = await this.pool.query(query)
            .catch(logError);

            DebugHelper.logRes(res);
        }
    }

    async updateVillagesQuery(server, data) {
        const tableName = `server_${server}_villages`;
        
        await this.pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            x INTEGER NOT NULL,
            y INTEGER NOT NULL,
            player_id INTEGER,
            CONSTRAINT fk_constraint
                FOREIGN KEY (player_id)
                    REFERENCES server_${server}_players(id),
            points INTEGER NOT NULL,
            bonus INTEGER NOT NULL
        );`)
        .catch(logError);

        console.log(tableName);

        await this.pool.query(`TRUNCATE TABLE ${tableName} CASCADE;`)
        .catch(logError);

        const chunkSize = Math.floor(65535 / data.arity) * data.arity;
        
        for (let i = 0; i < data.array.length; i += chunkSize) {
            const query = {
                text: `INSERT INTO ${tableName} (id, name, x, y, player_id, points, bonus)
                    VALUES ${this.makeValueString(Math.min(chunkSize, data.array.length - i) / data.arity, data.arity)};`,
                values: data.array.slice(i, i + chunkSize),
            }
    
            DebugHelper.logQuery(query);
    
            const res = await this.pool.query(query)
            .catch(logError);
    
            DebugHelper.logRes(res);
        }
    }
}