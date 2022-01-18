const getData = require('../getData');

module.exports = class DbMock {
    constructor() {
        this.tables = {}
        /* 
            180: {
                lastUpdate: 566846156461894,
                tribes: [...],
                players: [...],
                villages: [...],
            }
        */
    }

    async updateServerData(server) {
        // todo: zweryfikować czy plik jest realtme czy raz na jakiś czas
        // todo: zrobić żeby updatować tylko jak się faktycznie coś zmieniło
        if (!this.tables[server]) {
            const rawTribes = await getData(`https://pl${server}.plemiona.pl/map/ally.txt`); // to jest bezpieczne bo server jest walidowany wcześniej
            // todo: fix pl chars (hint: w urlach tak to jest parsowane)
            // id, fullName, name, membersCnt, villagesCnt, top40points, points, rank
            const tribes = rawTribes.split(/\n/gm).map(line => {
                const arr = line.split(/,/gm)
                return {
                    id: arr[0],
                    fullName: arr[1],
                    name: arr[2],
                    membersCnt: arr[3],
                    villagesCnt: arr[4],
                    top40points: arr[5],
                    points: arr[6],
                    rank: arr[7],
                }
            });

            const rawPlayers = await getData(`https://pl${server}.plemiona.pl/map/player.txt`); // to jest bezpieczne bo server jest walidowany wcześniej
            // todo: fix pl chars (hint: w urlach tak to jest parsowane)
            // id, name, tribeId, villagesCnt, points, rank
            const players = rawPlayers.split(/\n/gm).map(line => {
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

            const rawVillages = await getData(`https://pl${server}.plemiona.pl/map/village.txt`); // to jest bezpieczne bo server jest walidowany wcześniej
            // todo: fix pl chars (hint: w urlach tak to jest parsowane)
            // id, name, x, y, playerId, points, bonus
            const villages = rawVillages.split(/\n/gm).map(line => {
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

            const lastUpdate = Date.now();

            this.tables[server] = {lastUpdate, tribes, players, villages};

            // console.log(this.tables[server]);
        }
    }
    
    async getTribes(server) {
        if (!this.tables[server]) {
            await this.updateServerData(server);
        }
        return this.tables[server].tribes;
    }
    
    async getPlayers(server) {
        if (!this.tables[server]) {
            await this.updateServerData(server);
        }
        return this.tables[server].players;
    }
    
    async getVillages(server) {
        if (!this.tables[server]) {
            await this.updateServerData(server);
        }
        return this.tables[server].villages;
    }
}