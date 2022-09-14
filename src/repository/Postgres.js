const { Pool } = require('pg');
const decodeUriComponent = require('decode-uri-component');
const getData = require('../utils/getData');
const logError = require('../utils/logError');
const DebugHelper = require('../utils/DebugHelper');

module.exports = class Postgres {
    constructor() {
        this.servers = {};

        this.pool = new Pool({
            user: process.env.user,
            password: process.env.password,
        });
    }

    async init() {
        const res = await this.pool.query(`SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public';`)
            .catch(logError);

        res.rows.forEach(row => this.servers[row.table_name.split(/_/g)[1]] = true);

        console.log(this.servers);
        console.log('Postgres controller ready.');
    }
    
    async getPlayersInTribes(server, tribes) {
        await this.updateServerData(server);
        return this.getPlayersFromTribesQuery(server, tribes);
    }
    
    async getVillagesOfPlayersOrTribes(server, tribes, players) {
        await this.updateServerData(server);
        return this.getVillagesOfPlayersOrTribesQuery(server, tribes, players);
    }

    async getVillagesInRange(server, group1, group2, range) {
        await this.updateServerData(server);
        return this.getVillagesInRangeQuery(server, group1, group2, range);
    }

    async getPlayersFromDifferentServers(servers) {
        await this.updateMultipleServersData(servers);
        return this.getPlayersFromDifferentServersQuery(servers);
    }

    async updateMultipleServersData(servers) {
        await Promise.all(servers.map(server => (this.servers[server] = false, this.updateServerData(server))));
        return 'OK';
    }

    async getPlayersInLimit(server, points, limit) {
        await this.updateServerData(server);
        return this.getPlayersInLimitQuery(server, points, limit);
    }

    async updateServerData(server) { // używanie zmiennej server jest bezpieczne bo jest walidowana wcześniej i spełnia regex /p?[1-9]\d*/
        if (!this.servers[server]) {
            await this.updateTribes(server);
            await this.updatePlayers(server);
            await this.updateVillages(server);
            this.servers[server] = true;
        }
    }

    async getPlayersFromTribesQuery(server, tribes) {
        const query = {
            text: `SELECT P.name FROM server_${server}_players P
                JOIN server_${server}_tribes T ON P.tribe_id = T.id
                WHERE T.name IN (${this.makeParametersSet(tribes.length, 1)})`,
            values: tribes,
        }

        DebugHelper.logQuery(query);

        const res = await this.pool.query(query)
        .catch(logError);

        DebugHelper.logRes(res);

        return res.rows;
    }

    async getVillagesOfPlayersOrTribesQuery(server, tribes, players) {
        const query = {
            text: `SELECT x, y FROM server_${server}_villages V
                    JOIN server_${server}_players P ON P.id = V.player_id
                    JOIN server_${server}_tribes T ON T.id = P.tribe_id
                    WHERE T.name IN (${this.makeParametersSet(tribes.length, 1)})
                UNION
                SELECT x, y FROM server_${server}_villages V
                    JOIN server_${server}_players P ON P.id = V.player_id
                    WHERE P.name IN (${this.makeParametersSet(players.length, tribes.length + 1)});`,
            values: tribes.concat(players),
        }

        DebugHelper.logQuery(query);

        const res = await this.pool.query(query)
        .catch(logError);

        DebugHelper.logRes(res);

        return res.rows;
    }

    async getVillagesInRangeQuery(server, group1, group2, range) {
        range = parseFloat(range);
        if (isNaN(range)) {
            throw new Error('Invalid range.');
        }

        const query = {
            text: `WITH
                A AS (
                    SELECT x, y FROM server_${server}_villages V
                        JOIN server_${server}_players P ON P.id = V.player_id
                        JOIN server_${server}_tribes T ON T.id = P.tribe_id
                        WHERE T.name IN (${this.makeParametersSet(group1.tribes.length, 1)})
                    UNION
                    SELECT x, y FROM server_${server}_villages V
                        JOIN server_${server}_players P ON P.id = V.player_id
                        WHERE P.name IN (${this.makeParametersSet(group1.players.length, 1 + group1.tribes.length)})),
                B AS (
                    SELECT x, y FROM server_${server}_villages V
                        JOIN server_${server}_players P ON P.id = V.player_id
                        JOIN server_${server}_tribes T ON T.id = P.tribe_id
                        WHERE T.name IN (${this.makeParametersSet(group2.tribes.length, 1 + group1.tribes.length + group1.players.length)})
                    UNION
                    SELECT x, y FROM server_${server}_villages V
                        JOIN server_${server}_players P ON P.id = V.player_id
                        WHERE P.name IN (${this.makeParametersSet(group2.players.length, 1 + group1.tribes.length + group1.players.length + group2.tribes.length)}))
                SELECT DISTINCT A.x, A.y FROM A
                    JOIN B ON (A.x - B.x) * (A.x - B.x) + (A.y - B.y) * (A.y - B.y) <= ${range * range};`,
            values: group1.tribes.concat(group1.players).concat(group2.tribes).concat(group2.players),
        }

        DebugHelper.logQuery(query);

        const res = await this.pool.query(query)
        .catch(logError);

        DebugHelper.logRes(res);

        return res.rows;
    }

    async getPlayersFromDifferentServersQuery(servers) {
        const res = await this.pool.query(servers.map(server => `SELECT name FROM server_${server}_players`).join(' INTERSECT '))
        .catch(logError);

        DebugHelper.logRes(res);

        return res.rows;
    }

    async getPlayersInLimitQuery(server, points, limit) {
        const lowerBound = Math.round(points / limit);
        const upperBound = Math.round(points * limit);

        const query = {
            text: `SELECT P.name, P.points FROM server_${server}_players P
                WHERE $1 <= P.points AND P.points <= $2
                ORDER BY P.points DESC;`,
            values: [lowerBound, upperBound],
        }

        DebugHelper.logQuery(query);

        const res = await this.pool.query(query)
        .catch(logError);

        DebugHelper.logRes(res);

        return res.rows;
    }

    makeParametersSet(count, begin) {
        if (count === 0) {
            return 'NULL';
        }
        return Array(count).fill(0).map((_, i) => `$${i + begin}`).join(',');
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

        console.log('players: ', data.array.length, data.arity, chunkSize);
        
        for (let i = 0; i < data.array.length; i += chunkSize) {
            const query = {
                text: `INSERT INTO ${tableName} (id, name, tribe_id, villages_cnt, points, rank)
                    VALUES ${this.makeValueString(Math.min(chunkSize, data.array.length - i) / data.arity, data.arity)};`,
                values: data.array.slice(i, i + chunkSize),
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

        console.log(`${tableName}:`, data.array.length / data.arity);

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