module.exports = function logError(err) {
    const stack = new Error().stack;
    console.log(`----- ERROR MESSAGE: ${err} -----`);
    console.log(stack);
};