module.exports = function errorLog(err) {
    const stack = new Error().stack;
    console.log(err);
    console.log(stack);
};