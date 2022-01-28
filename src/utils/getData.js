const axios = require('axios');
const InvalidServerError = require('./InvalidServerError');

module.exports = async (url) => {
    const res = await axios.get(url);
    if (!url.match(res.request.path)) {
        throw new InvalidServerError();
    }
    return res.data;
};