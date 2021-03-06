const logError = require("./logError");

const short = true;

module.exports = {
    logQuery: ({text, values}) => {
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
            if (short) {
                console.log('result is undefined');
            } else {
                logError('result is undefined');
            }
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