// const dotenv = require("dotenv").config();

// if (dotenv.error) {
//   console.log(dotenv.error);
// }

const express = require('express');
const getData = require('./getData');

const handlebars = require('express-handlebars');

class App {
    constructor(repo, controllers) {
        this.app = express();
        // this.repository = repo;

        this.initializeControllers(controllers);
        this.app.engine('handlebars', handlebars.engine());
        this.app.set('view engine', 'handlebars');
        this.app.set('views', './views');

        this.listen(5000);
    }

    async run() {
        console.log('działa');
        const data = await getData('https://plp8.plemiona.pl/map/ally.txt');
        console.log(data.length);
    }

  initializeControllers(controllers) {
    controllers.forEach((controller) => {
        this.app.use("/", controller.router);
        // controller.setRepository(this.repository);
    });
  }

    listen(port) {
        this.app.listen(port, () => {
            console.log(`app listening via http on the port ${port}`);
        });
    }
}

module.exports = App;
