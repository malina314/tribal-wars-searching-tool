const App = require('./App');
const MainpageController = require('./controllers/MainpageController');
const QueryController = require('./controllers/QueryController');
const ResultController = require('./controllers/ResultController');
const DbMock = require('./repository/DbMock');
const Posgres = require('./repository/Postgres');

const controllers = [
    new MainpageController(),
    new QueryController(),
    new ResultController(),
];

const repository = new Posgres();

const app = new App(repository, controllers);

app.start();
