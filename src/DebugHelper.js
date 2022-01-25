const logError = require("./logError");

module.exports = {
    logQuery: ({text, values}) => {
        const short = true;
        if (short) {
            console.log(text.slice(0, 160));
            // console.log(values.slice(0, 20));
        } else {
            console.log(text);
            // console.log(values);
        }
    },

    logRes: (res) => {
        if (typeof res === 'undefined') {
            logError('res is undefined');
            return;
        }

        switch (res.command) {
            case 'INSERT':
                console.log(`INSERTED ${res.rowCount} rows.`);
                break;
            case 'SELECT':
                console.log(`SELECTED ${res.rowCount} rows.`);
                break;
            default:
                console.log(res);
        }
    }
}