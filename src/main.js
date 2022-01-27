const dotenv = require("dotenv").config();

if (dotenv.error) {
    console.log(dotenv.error);
}

const App = require('./App');
const MainpageController = require('./controllers/MainpageController');
const QueryController = require('./controllers/QueryController');
const ResultController = require('./controllers/ResultController');
const Posgres = require('./repository/Postgres');

const controllers = [
    new MainpageController(),
    new QueryController(),
    new ResultController(),
];

const repository = new Posgres();

const app = new App(repository, controllers);

app.start();
