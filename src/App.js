const express = require('express');
const handlebars = require('express-handlebars');

class App {
    constructor(repo, controllers) {
        this.app = express();
        this.repository = repo;

        this.initializeControllers(controllers);

        this.app.engine('hbs', handlebars.engine({ 
            extname: 'hbs', 
            defaultLayout: 'main', 
            layoutsDir: './views/layouts',
            partialsDir: './views/partials',
        }));
        this.app.set('view engine', 'hbs');
        this.app.set('views', './views');

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    async start() {
        await this.repository.init();
        this.listen(5000);
    }

    initializeControllers(controllers) {
        controllers.forEach((controller) => {
            this.app.use("/", controller.router);
            controller.setRepository(this.repository);
        });
    }

    listen(port) {
        this.app.listen(port, () => {
            console.log(`app listening via http on the port ${port}`);
        });
    }
}

module.exports = App;
