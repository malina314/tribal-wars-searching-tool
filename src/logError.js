module.exports = function logError(err) {
    const stack = new Error().stack;
    console.log(err);
    console.log(stack);
};