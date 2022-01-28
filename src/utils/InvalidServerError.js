module.exports = class InvalidServerError extends Error {
    constructor() {
        super('Error: Invalid server name.');
    }
}