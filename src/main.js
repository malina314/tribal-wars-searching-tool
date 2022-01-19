const App = require('./App');
const MainpageController = require('./controllers/MainpageController');
const QueryController = require('./controllers/QueryController');
const ResultController = require('./controllers/ResultController');

const controllers = [
    new MainpageController(),
    new QueryController(),
    new ResultController(),
];

const repository = null;

new App(repository, controllers);
