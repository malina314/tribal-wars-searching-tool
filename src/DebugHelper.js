module.exports = {
    logQuery: ({text, values}) => {
        const short = true;
        if (short) {
            console.log(text.slice(0, 300));
            // console.log(values.slice(0, 20));
        } else {
            console.log(text);
            // console.log(values);
        }
    },

    logRes: (res) => {
        switch (res.command) {
            case 'INSERT':
                console.log(`INSERTED ${res.rowCount} rows.`);
                break;
            default:
                console.log(res);
        }
    }
}