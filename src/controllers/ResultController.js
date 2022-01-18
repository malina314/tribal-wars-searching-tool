const express = require('express');
fs = require('fs');
const qs = require('querystring');

module.exports = class ResultController {
    constructor() {
        this.path = '/result';
        this.router = express.Router();

        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.route(this.path).post(this.renderResultpage);
    }

    

    async renderResultpage(req, res) {
        // console.log(req);
        // console.log("body");
        console.log(req.method);

        // var body = '';

        // req.on('data', function (data) {
        //     body += data;
        // });

        // req.on('end', function () {
        //     var post = qs.parse(body);
        //     // use post['blah'], etc.
        //     console.log(post);
        // });

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {
            console.log(body);
            res.render('result');
            // res.end('ok');
        });


        // function censor(censor) {
        //     var i = 0;
            
        //     return function(key, value) {
        //       if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
        //         return '[Circular]'; 
              
        //       if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
        //         return '[Unknown]';
              
        //       ++i; // so we know we aren't using the original object anymore
              
        //       return value;  
        //     }
        //   }

        // await fs.writeFile("./reqLog.txt", JSON.stringify(req, censor(req)), () => {});

        // res.render('result');
    }
};
